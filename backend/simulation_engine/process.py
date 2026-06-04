from typing import Any, Dict, List


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
        return ", ".join(
            format_attribute_requirement(attribute)
            for attribute in event_data_attributes
        )

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


def get_current_process(process_id: str, events: List[Any]) -> Dict[str, Any]:
    process_events = get_events_for_process(process_id, events)
    business_events = get_business_events(process_events)

    return {
        "process_id": process_id,
        "process_state": describe_process_state(business_events),
        "case_data": collect_case_data(process_events),
        "previous_events": process_events,
    }


def get_unfinished_process_states(
    process_ids: List[str],
    events: List[Any],
    terminal_actions: List[str],
) -> List[Dict[str, Any]]:
    return [
        {
            "process_id": process_id,
            "process_state": describe_process_state(get_business_events(get_events_for_process(process_id, events))),
            "case_data": collect_case_data(get_events_for_process(process_id, events)),
            "number_of_events": len(get_business_events(get_events_for_process(process_id, events))),
        }
        for process_id in process_ids
        if not is_process_finished(process_id, events, terminal_actions)
    ]


def is_process_finished(
    process_id: str,
    events: List[Any],
    terminal_actions: List[str],
) -> bool:
    process_events = get_business_events(get_events_for_process(process_id, events))

    if not process_events:
        return False

    last_event = process_events[-1]
    return get_event_value(last_event, "action") in terminal_actions


def describe_process_state(events: List[Any]) -> str:
    if not events:
        return "No event has happened yet."

    last_event = events[-1]
    return f"Last action: {get_event_value(last_event, 'action')}"


def collect_case_data(events: List[Any]) -> Dict[str, str]:
    case_data: Dict[str, str] = {}

    for event in events:
        for item in get_event_value(event, "case_data", []) or []:
            if isinstance(item, dict):
                case_data[item["attribute"]] = item["value"]
            else:
                case_data[item.attribute] = item.value

    return case_data
