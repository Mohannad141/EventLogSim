import os
import random
import sys
import tempfile
from pathlib import Path
from typing import List, Optional, Any, Dict
from datetime import datetime, timedelta

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
)

load_dotenv()

# Setup LLM via factory
llm = get_llm()

def build_agents_from_config(agents_data: List[Any]) -> List[Agent]:
    return [
        Agent.from_dict(agent_data if isinstance(agent_data, dict) else agent_data.dict())
        for agent_data in agents_data
    ]

def append_event_to_process(event_log: List[dict], process_id: str, event: dict) -> None:
    for case in event_log:
        if case.get("process_id") == process_id:
            case.setdefault("events", []).append(event)
            return

    event_log.append({
        "process_id": process_id,
        "events": [event],
    })

# Hard safety cap: regardless of caseCount, never make more than this many
# coordinator iterations in a single run.
# Increased to 200 to allow longer cases and larger runs to finish naturally.
MAX_TOTAL_ITERATIONS_HARD_CAP = 200


def generate_event_log(
    config: Any, # SimulationRunConfig
    max_events_per_case: int = 10,
):


    # Prepare agents
    agents = build_agents_from_config(config.agents)
    agents_by_id = {agent.id: agent for agent in agents}

    # Create empty event log structure
    case_count = config.simulation.caseCount
    events_by_case = [
        {
            "process_id": f"CASE-{i+1:04d}",
            "events": [],
        }
        for i in range(case_count)
    ]

    coordinator = Coordinator()

    # Extract terminal actions or use defaults
    terminal_actions = ["Finish", "End", "Archive", "Complete", "Close Case"]
    transitions: Optional[Dict[str, Any]] = None

    # BPMN mode: parse the uploaded .bpmn content and use its transitions
    # and terminal actions to constrain the simulation.
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
                        description=f"Automated agent simulating the role of {clean_role}.",
                        actions=actions,
                        age=None
                    ))
                agents_by_id = {agent.id: agent for agent in agents}
        finally:
            if tmp_path and os.path.exists(tmp_path):
                os.unlink(tmp_path)

    process_ids = [case["process_id"] for case in events_by_case]
    
    # Create a process context compatible with process.py expectations
    sim_context = {
        "process": {
            "summary": config.process.description,
            "action_data_mapping": "No specific mapping provided.", 
            "event_data_attributes": [attr.model_dump() for attr in config.attributes]
        }
    }

    max_total_events = min(
        len(process_ids) * max_events_per_case,
        MAX_TOTAL_ITERATIONS_HARD_CAP,
    )

    for step_index in range(max_total_events):
        # Get unfinished cases (cases that already reached max_events_per_case
        # events are auto-finished here to prevent the coordinator from
        # looping on the same case forever — the structural fix for the
        # "agents talking in circles" scenario).
        unfinished_process_states = get_unfinished_process_states(
            process_ids=process_ids,
            events=events_by_case,
            terminal_actions=terminal_actions,
            transitions=transitions,
            max_events_per_case=max_events_per_case,
        )

        if not unfinished_process_states:
            print("--- All cases finished naturally ---")
            break

        # Shuffle to prevent "batching" behavior and introduce randomness
        random.shuffle(unfinished_process_states)

        # Limit to max 10 states to prevent prompt bloat and LLM confusion
        coordinator_states = unfinished_process_states[:10]

        # 2. Call coordinator to assign ONE case to ONE agent with fallback
        try:
            assignment = coordinator.assign_agent_project(
                llm=llm,
                process_states=coordinator_states,
                agents=[agent.model_dump() for agent in agents],
                process_summary=config.process.description
            )
            
            # Validate coordinator output
            process_ids_set = {state["process_id"] for state in coordinator_states}
            agent_ids_set = {agent.id for agent in agents}
            
            if assignment.process_id not in process_ids_set or assignment.agent_id not in agent_ids_set:
                raise ValueError("Coordinator returned invalid process_id or agent_id")
                
        except Exception as e:
            # If we never produced an event, the run is a total failure —
            # re-raise so the caller marks status="failed" with a useful
            # message instead of silently returning an empty list.
            has_any_events = any(case["events"] for case in events_by_case)
            if not has_any_events:
                raise RuntimeError(f"Coordinator failed on first step: {e}") from e
            # Partial data already collected — keep it and stop the loop.
            print(f"Coordinator error (stopping early with partial data): {e}")
            break

        # Prepare context for the actor
        current_process = get_current_process(
            process_id=assignment.process_id,
            events=events_by_case,
        )
        current_process["coordinator_message"] = assignment.message or "Please proceed with the next step."
        
        # Calculate allowed next actions to pass to the agent
        allowed_next = (
            get_allowed_next_actions(transitions, get_last_action(current_process.get("previous_events", [])))
            if transitions
            else []
        )
        current_process["allowed_next_actions"] = allowed_next

        agent = agents_by_id[assignment.agent_id]
        try:
            generated_event: GeneratedEvent = agent.generate_single_event(
                process_context=get_process_context(sim_context),
                current_process=current_process,
                llm=llm,
            )

            # Add to our internal tracking
            ev_data = generated_event.model_dump()
            ev_data["agent_id"] = agent.id

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
            
            # Advance timestamp by 15-45 minutes per step for realism
            prev_events = current_process.get("previous_events", [])
            if prev_events:
                last_time = datetime.fromisoformat(prev_events[-1].get("timestamp"))
                new_time = last_time + timedelta(minutes=random.randint(15, 45))
            else:
                # Base starting time for the very first event of a case
                new_time = datetime.now() + timedelta(minutes=step_index * 5)
            
            ev_data["timestamp"] = new_time.isoformat()
            append_event_to_process(events_by_case, assignment.process_id, ev_data)
            
        except Exception as e:
            print(f"Actor error: {e}")
            continue

    # Flatten everything for the final output display format
    final_events = []
    for case in events_by_case:
        p_id = case["process_id"]
        for ev in case["events"]:
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
                "caseId": p_id,
                "activity": ev["action"],
                "timestamp": ev.get("timestamp", datetime.now().isoformat()),
                "is_terminal": ev.get("is_terminal", False),
                "resource": agent_obj.id if agent_obj else "Unknown",
                "role": agent_obj.role if agent_obj else "Unknown",
                "attributes": combined_attributes
            })

    return final_events

