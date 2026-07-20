import os
import random
import sys
import tempfile
from pathlib import Path
from typing import List, Optional, Any, Dict
from datetime import datetime, timedelta
from concurrent.futures import ThreadPoolExecutor

from dotenv import load_dotenv
from simulation_engine.llm_factory import get_llm

if __package__ is None or __package__ == "":
    sys.path.append(str(Path(__file__).resolve().parents[1]))

from simulation_engine.actor import Agent, GeneratedEvent
from simulation_engine.bpmn_parser import parse_bpmn, get_allowed_next_actions
from simulation_engine.coordinator import Coordinator
from simulation_engine.process import (
    get_current_process,
    get_process_context,
    get_unfinished_process_states,
    get_last_action,
    get_events_for_process,
    get_business_events,
    collect_case_data,
    describe_process_state,
    is_process_finished,
)

load_dotenv()

# Setup LLM via factory
llm = get_llm()

def build_agents_from_config(agents_data: List[Any]) -> List[Agent]:
    return [
        Agent.from_dict(agent_data if isinstance(agent_data, dict) else agent_data.dict())
        for agent_data in agents_data
    ]


def simulate_single_case(
    case_id: str,
    case_index: int,
    config: Any,
    agents: List[Agent],
    transitions: Optional[Dict[str, Any]],
    terminal_actions: List[str],
    max_events_per_case: int,
    coordinator: Coordinator,
) -> List[dict]:
    case_events = []
    wrapper_events = [{"process_id": case_id, "events": case_events}]
    agents_by_id = {agent.id: agent for agent in agents}
    
    # We stagger the starting time of each case realistically so they interleave nicely
    # E.g. start at some base time + case_index * 20 minutes
    base_time = datetime.now() - timedelta(days=2)
    case_start_time = base_time + timedelta(minutes=case_index * 20 + random.randint(0, 10))
    current_time = case_start_time

    for step in range(max_events_per_case):
        # 1. Check if the case is structurally finished
        if is_process_finished(case_id, wrapper_events, terminal_actions, max_events_per_case, transitions):
            break

        process_events = get_events_for_process(case_id, wrapper_events)
        business_events = get_business_events(process_events)
        case_data = collect_case_data(process_events)
        
        last_action = get_last_action(process_events)
        allowed_next = get_allowed_next_actions(transitions, last_action) if transitions else []

        # If BPMN mode, and there are no allowed next actions (or only END), we stop
        if transitions is not None:
            if not allowed_next or allowed_next == ["END"] or allowed_next == ["end"]:
                break

        assigned_agent_id = None
        assigned_action = None
        coordinator_msg = "Please proceed with the next step."

        # OPTIMIZATION (Bypassing redundant Coordinator LLM calls for linear paths):
        # If we have a transitions map and there is only ONE allowed next action (excluding END),
        # we can route it programmatically in Python, saving a coordinator LLM call!
        if transitions is not None and len(allowed_next) == 1 and allowed_next[0].upper() != "END":
            candidate_action = allowed_next[0]
            # Find the agent configured to perform this action
            for agent in agents:
                if any(act.strip().lower() == candidate_action.strip().lower() for act in agent.actions):
                    assigned_agent_id = agent.id
                    assigned_action = candidate_action
                    break

        # If programmatic routing succeeded, we bypass the coordinator LLM!
        if assigned_agent_id and assigned_action:
            pass
        else:
            # Otherwise (LLM-based mode, or multiple choices/branches at a gateway), call the Coordinator LLM:
            state_info = {
                "process_id": case_id,
                "process_state": describe_process_state(business_events, case_data),
                "case_data": case_data,
                "number_of_events": len(business_events),
                "allowed_next_actions": allowed_next,
            }
            
            try:
                assignment = coordinator.assign_agent_project(
                    llm=llm,
                    process_states=[state_info],
                    agents=[agent.model_dump() for agent in agents],
                    process_summary=config.process.description
                )
                assigned_agent_id = assignment.agent_id
                coordinator_msg = assignment.message or "Please proceed with the next step."
            except Exception as e:
                print(f"Coordinator error in {case_id} step {step}: {e}")
                break

        # Get the assigned agent object
        agent = agents_by_id.get(assigned_agent_id)
        if not agent:
            # Fallback: if coordinator returned a role name instead of an agent ID, try finding by role/name
            for a in agents:
                if a.role.strip().lower() == assigned_agent_id.strip().lower() or a.name.strip().lower() == assigned_agent_id.strip().lower():
                    agent = a
                    break
            if not agent:
                print(f"Agent/Role '{assigned_agent_id}' not found for case {case_id}")
                break

        # Prepare context for the agent actor
        current_process = {
            "process_id": case_id,
            "process_state": describe_process_state(business_events, case_data),
            "case_data": case_data,
            "previous_events": process_events,
            "coordinator_message": coordinator_msg,
            "allowed_next_actions": allowed_next,
        }

        sim_context = {
            "process": {
                "summary": config.process.description,
                "action_data_mapping": "No specific mapping provided.",
                "event_data_attributes": [attr.model_dump() for attr in config.attributes]
            }
        }

        # Call get_process_context to format descriptions correctly
        formatted_context = get_process_context(sim_context)

        # 4. Invoke agent actor LLM to generate the event details (attributes & feedback)
        try:
            generated_event: GeneratedEvent = agent.generate_single_event(
                process_context=formatted_context,
                current_process=current_process,
                llm=llm,
            )
        except Exception as e:
            print(f"Actor error in {case_id} step {step}: {e}")
            break

        ev_data = generated_event.model_dump()
        ev_data["agent_id"] = agent.id
        
        if assigned_action:
            ev_data["action"] = assigned_action
        else:
            # Normalize action name to match allowed actions or agent's own actions case-insensitively
            original_action = ev_data["action"]
            normalized = False
            
            # 1. Match against allowed next actions
            if allowed_next:
                for act in allowed_next:
                    if original_action.strip().lower() == act.strip().lower():
                        ev_data["action"] = act
                        normalized = True
                        break
            
            # 2. Match against agent's own actions
            if not normalized and agent.actions:
                for act in agent.actions:
                    if original_action.strip().lower() == act.strip().lower():
                        ev_data["action"] = act
                        normalized = True
                        break

        # If in BPMN mode, override is_terminal based on the actual BPMN transition
        if transitions is not None:
            next_after_current = get_allowed_next_actions(transitions, ev_data["action"])
            if "END" in next_after_current or "end" in next_after_current or not next_after_current:
                ev_data["is_terminal"] = True
            else:
                ev_data["is_terminal"] = False

        # Calculate event timestamps
        # Each step takes 15-45 minutes
        current_time += timedelta(minutes=random.randint(15, 45))
        ev_data["timestamp"] = current_time.isoformat()

        case_events.append(ev_data)

    return case_events


def generate_event_log(
    config: Any, # SimulationRunConfig
    max_events_per_case: int = 10,
) -> List[dict]:
    # Prepare agents
    agents = build_agents_from_config(config.agents)
    coordinator = Coordinator()

    # Extract terminal actions or use defaults
    terminal_actions = ["Finish", "End", "Archive", "Complete", "Close Case"]
    transitions: Optional[Dict[str, Any]] = None

    # BPMN mode: parse the uploaded .bpmn content and use its transitions
    bpmn_file = getattr(config.process, "bpmnFile", None)
    if (
        getattr(config.process, "mode", None) == "BPMN_BASED"
        and isinstance(bpmn_file, dict)
        and bpmn_file.get("content")
    ):
        tmp_path = None
        try:
            with tempfile.NamedTemporaryFile(
                suffix=".bpmn", delete=False, mode="w", encoding="utf-8"
            ) as tmp:
                tmp.write(bpmn_file["content"])
                tmp_path = tmp.name
            bpmn_data = parse_bpmn(tmp_path)
            transitions = bpmn_data.get("transitions") or None
            bpmn_terminals = bpmn_data.get("terminal_actions") or []
            if bpmn_terminals:
                terminal_actions = bpmn_terminals

            # Override agents if roles were extracted from BPMN pools/lanes
            bpmn_roles = bpmn_data.get("roles") or {}
            if bpmn_roles:
                agents = []
                for role_name, actions in bpmn_roles.items():
                    clean_role = role_name.strip()
                    role_id = f"agent_{clean_role.lower().replace(' ', '_')}"
                    agents.append(Agent(
                        id=role_id,
                        role=clean_role,
                        name=clean_role,
                        description=f"Automated agent simulating the role of {clean_role}.",
                        actions=actions,
                        age=None
                    ))
        finally:
            if tmp_path and os.path.exists(tmp_path):
                os.unlink(tmp_path)

    # Initialize case identifiers
    case_count = config.simulation.caseCount
    process_ids = [f"CASE-{i+1:04d}" for i in range(case_count)]

    # Simulate all cases in parallel using ThreadPoolExecutor
    # 15 threads balances concurrent throughput and gateway request limits nicely
    simulated_cases = {}
    with ThreadPoolExecutor(max_workers=15) as executor:
        futures = {
            executor.submit(
                simulate_single_case,
                pid,
                idx,
                config,
                agents,
                transitions,
                terminal_actions,
                max_events_per_case,
                coordinator
            ): pid
            for idx, pid in enumerate(process_ids)
        }
        for future in futures:
            pid = futures[future]
            try:
                simulated_cases[pid] = future.result()
            except Exception as e:
                print(f"Error simulating case {pid}: {e}")
                simulated_cases[pid] = []

    # Flatten everything for the final output display format and collect attributes
    final_events = []
    agents_by_id = {agent.id: agent for agent in agents}

    for pid in process_ids:
        events = simulated_cases.get(pid, [])
        for ev in events:
            agent_obj = agents_by_id.get(ev.get("agent_id"))
            
            # Combine attributes from both event_data and case_data for safety
            combined_attributes = {}
            for field in ["event_data", "case_data"]:
                for attr in ev.get(field) or []:
                    if isinstance(attr, dict):
                        combined_attributes[attr["attribute"]] = attr["value"]
                    else:
                        combined_attributes[attr.attribute] = attr.value
            
            final_events.append({
                "caseId": pid,
                "activity": ev["action"],
                "timestamp": ev.get("timestamp", datetime.now().isoformat()),
                "is_terminal": ev.get("is_terminal", False),
                "resource": agent_obj.name if (agent_obj and agent_obj.name) else (agent_obj.id if agent_obj else "Unknown"),
                "role": agent_obj.role if agent_obj else "Unknown",
                "feedback": ev.get("feedback", ""),
                "attributes": combined_attributes
            })

    # Sort final event log by timestamp to ensure realistic, interleaved event history
    final_events.sort(key=lambda x: x["timestamp"])

    return final_events
