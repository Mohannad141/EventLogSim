from typing import Any, Dict, List, Optional

from simulation_engine.bpmn_parser import get_allowed_next_actions


def get_process_context(config_data: Dict[str, Any]) -> Dict[str, Any]:
    process = config_data["process"]

    return {
        "process_summary": process["summary"],
        "action_data_mapping": format_action_data_mapping(process["action_data_mapping"]),
        "event_data_attributes": format_event_data_attributes(process["event_data_attributes"]),
    }


def format_action_data_mapping(action_data_mapping: Any) -> str:
    if not action_data_mapping:
        return "No action-specific data requirements."

    if isinstance(action_data_mapping, dict):
        return "; ".join(
            f"{action} requires {format_attribute_requirement(requirement)}"
            for action, requirement in action_data_mapping.items()
        )

    return str(action_data_mapping)


def format_event_data_attributes(event_data_attributes: Any) -> str:
    if not event_data_attributes:
        return "No event data attributes required."

    if isinstance(event_data_attributes, list):
        items = []
        for attr in event_data_attributes:
            if isinstance(attr, dict):
                name = attr.get("name")
                attr_type = attr.get("type", "string")
                locked = attr.get("locked", False)
                desc = attr.get("description")
            else:
                name = getattr(attr, "name", None)
                attr_type = getattr(attr, "type", "string")
                locked = getattr(attr, "locked", False)
                desc = getattr(attr, "description", None)
            
            if locked or not name:
                continue
            
            # Default instruction to encourage dynamic context-aware diversity
            if not desc or not desc.strip():
                desc = f"Determine a realistic, diverse, and context-dependent value for this '{name}' attribute based on the action you are taking. Do not repeat the same value (like 150) for every event; vary it realistically."

            desc_str = f": {desc}"
            items.append(f"- {name} ({attr_type}){desc_str}")
        return "\n".join(items) if items else "No custom event attributes."

    return str(event_data_attributes)


def format_attribute_requirement(requirement: Any) -> str:
    if isinstance(requirement, dict):
        return ", ".join(
            f"{name}: {value}"
            for name, value in requirement.items()
        )

    if isinstance(requirement, list):
        return ", ".join(str(item) for item in requirement)

    return str(requirement)


def get_event_value(event: Any, key: str, default: Any = None) -> Any:
    if isinstance(event, dict):
        return event.get(key, default)

    return getattr(event, key, default)


def get_events_for_process(process_id: str, events: List[Any]) -> List[Any]:
    for event in events:
        if (
            get_event_value(event, "process_id") == process_id
            and isinstance(get_event_value(event, "events"), list)
        ):
            return get_event_value(event, "events")

    return []


def get_business_events(events: List[Any]) -> List[Any]:
    return [
        event
        for event in events
        if get_event_value(event, "action")
    ]


def get_last_action(events: List[Any]) -> Optional[str]:
    business_events = get_business_events(events)
    if not business_events:
        return None
    return get_event_value(business_events[-1], "action")


def get_current_process(process_id: str, events: List[Any]) -> Dict[str, Any]:
    process_events = get_events_for_process(process_id, events)
    business_events = get_business_events(process_events)
    case_data = collect_case_data(process_events)

    return {
        "process_id": process_id,
        "process_state": describe_process_state(business_events, case_data),
        "case_data": case_data,
        "previous_events": process_events,
    }


def get_unfinished_process_states(
    process_ids: List[str],
    events: List[Any],
    terminal_actions: List[str],
    transitions: Optional[Dict[str, Any]] = None,
    max_events_per_case: Optional[int] = None,
) -> List[Dict[str, Any]]:
    result: List[Dict[str, Any]] = []
    for process_id in process_ids:
        if is_process_finished(process_id, events, terminal_actions, max_events_per_case, transitions):
            continue
        process_events = get_events_for_process(process_id, events)
        business_events = get_business_events(process_events)
        case_data = collect_case_data(process_events)
        allowed_next_actions = (
            get_allowed_next_actions(transitions, get_last_action(process_events))
            if transitions
            else []
        )
        result.append({
            "process_id": process_id,
            "process_state": describe_process_state(business_events, case_data),
            "case_data": case_data,
            "number_of_events": len(business_events),
            "allowed_next_actions": allowed_next_actions,
        })

    return result


def is_process_finished(
    process_id: str,
    events: List[Any],
    terminal_actions: List[str],
    max_events_per_case: Optional[int] = None,
    transitions: Optional[Dict[str, Any]] = None,
) -> bool:
    process_events = get_business_events(get_events_for_process(process_id, events))

    if not process_events:
        return False

    # Safety net: even if the LLM never reaches a terminal action (common when
    # agent.actions doesn't overlap with terminal_actions), force the case to
    # finish after max_events_per_case events. Without this the coordinator
    # can loop forever on the same case, burning tokens.
    if max_events_per_case is not None and len(process_events) >= max_events_per_case:
        return True

    last_event = process_events[-1]
    
    last_action = get_event_value(last_event, "action")
    if not last_action:
        return False

    # If we are in BPMN mode and have a transitions map
    if transitions is not None:
        last_action_lower = last_action.lower()
        
        # Find matching key in transitions (case-insensitive)
        matched_key = None
        for k in transitions.keys():
            if k.lower() == last_action_lower:
                matched_key = k
                break
        
        if matched_key is not None:
            allowed_next = transitions[matched_key]
            # The process is finished if the only next action is "END" or "end" (or it is in allowed_next)
            if "END" in allowed_next or "end" in allowed_next:
                return True
            # If the allowed_next list is empty (e.g. no outgoing flow from this task in BPMN)
            if not allowed_next:
                return True
            # Otherwise, since there are further steps in the BPMN, the process is NOT finished,
            # even if the agent returned is_terminal=True
            return False

    # Fallback/LLM-based mode logic:

    # 1. Check if the LLM agent explicitly marked the last action as terminal
    if get_event_value(last_event, "is_terminal") is True:
        return True

    last_action_lower = last_action.lower()

    # 2. Fallback: Check exact case-insensitive matches with specified terminal actions
    for term in terminal_actions:
        if last_action_lower == term.lower():
            return True

    # 3. Fallback: Check for typical halting keywords in the action text (e.g. "Resolve Ticket", "Close Case")
    halting_keywords = ["finish", "end", "archive", "complete", "close", "resolve", "terminate"]
    for keyword in halting_keywords:
        if keyword in last_action_lower:
            return True

    return False




def describe_process_state(events: List[Any], case_data: Dict[str, str]) -> str:
    if not events:
        return "Process has just started. No actions taken yet."

    history = " -> ".join([get_event_value(e, "action") for e in events])
    
    data_summary = ""
    if case_data:
        data_summary = "\nCurrently collected data: " + ", ".join([f"{k}={v}" for k, v in case_data.items()])

    return f"History: {history}.{data_summary}"


def collect_case_data(events: List[Any]) -> Dict[str, str]:
    case_data: Dict[str, str] = {}

    for event in events:
        for field_name in ["case_data", "event_data"]:
            for item in get_event_value(event, field_name, []) or []:
                if isinstance(item, dict):
                    case_data[item["attribute"]] = item["value"]
                else:
                    case_data[item.attribute] = item.value

    return case_data
