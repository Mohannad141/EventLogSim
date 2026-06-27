import os
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
from simulation_engine.bpmn_parser import parse_bpmn
from simulation_engine.coordinator import Coordinator
from simulation_engine.process import (
    get_current_process,
    get_process_context,
    get_unfinished_process_states,
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
# coordinator iterations in a single run. Each iteration is ~2 LLM calls,
# so 50 iterations ≈ 100 LLM calls — a sane upper bound for accidental
# 5000-case inputs that would otherwise burn through API credit.
MAX_TOTAL_ITERATIONS_HARD_CAP = 50


def generate_event_log(
    config: Any, # SimulationRunConfig
    max_events_per_case: int = 5,
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
        finally:
            if tmp_path and os.path.exists(tmp_path):
                os.unlink(tmp_path)

    process_ids = [case["process_id"] for case in events_by_case]
    
    # Create a process context compatible with process.py expectations
    sim_context = {
        "process": {
            "summary": config.process.description,
            "action_data_mapping": "No specific mapping provided.", 
            "event_data_attributes": ", ".join([attr.name for attr in config.attributes if not attr.locked])
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
            break

        # Call coordinator
        try:
            assignment = coordinator.assign_agent_project(
                llm=llm,
                process_states=unfinished_process_states,
                agents=[agent.model_dump() for agent in agents],
            )
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

        # Call actor
        agent = agents_by_id[assignment.agent_id]
        try:
            generated_event: GeneratedEvent = agent.generate_single_event(
                process_context=get_process_context(sim_context),
                current_process=current_process,
                llm=llm,
            )

            # Add to our internal tracking for the loop
            ev_data = generated_event.model_dump()
            ev_data["agent_id"] = agent.id
            ev_data["timestamp"] = (datetime.now() + timedelta(minutes=step_index * 15)).isoformat()
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
            
            final_events.append({
                "caseId": p_id,
                "activity": ev["action"],
                "timestamp": ev.get("timestamp", datetime.now().isoformat()),
                "is_terminal": ev.get("is_terminal", False),
                "resource": agent_obj.id if agent_obj else "Unknown",
                "role": agent_obj.role if agent_obj else "Unknown",
                "attributes": {attr["attribute"]: attr["value"] for attr in (ev.get("event_data") or [])}
            })

    return final_events

