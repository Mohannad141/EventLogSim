from datetime import datetime
from typing import Any, Dict, List, Optional


def check_timestamp_monotonicity(events: List[Dict[str, Any]]) -> float:
    """Timestamps must increase within a case. Returns 0–10."""
    if len(events) < 2:
        return 10.0
    valid = 0
    total = len(events) - 1
    for i in range(total):
        try:
            t1 = datetime.fromisoformat(str(events[i]["timestamp"]))
            t2 = datetime.fromisoformat(str(events[i + 1]["timestamp"]))
            if t2 >= t1:
                valid += 1
        except (ValueError, KeyError, TypeError):
            pass
    return round(valid / total * 10.0, 2)


def check_activity_conformance(
    events: List[Dict[str, Any]],
    transitions: Optional[Dict[str, List[str]]],
) -> float:
    """Check that each consecutive activity pair is allowed by the process model."""
    if not transitions or len(events) < 2:
        return 10.0
    valid = 0
    total = len(events) - 1
    for i in range(total):
        current = (events[i].get("activity") or "").strip()
        nxt = (events[i + 1].get("activity") or "").strip()
        allowed = []
        for key, nexts in transitions.items():
            if key.lower() == current.lower():
                allowed = nexts
                break
        if not allowed:
            valid += 1
            continue
        for a in allowed:
            if a.lower() == nxt.lower() or a.upper() == "END":
                valid += 1
                break
    return round(valid / total * 10.0, 2)


def check_role_action_consistency(
    events: List[Dict[str, Any]],
    agents: List[Dict[str, Any]],
) -> float:
    """Each agent should only perform actions in its allowed actions list."""
    if not events or not agents:
        return 10.0
    agent_actions: Dict[str, List[str]] = {}
    for agent in agents:
        aid = (agent.get("id") or "").lower()
        actions = [a.lower() for a in (agent.get("actions") or [])]
        agent_actions[aid] = actions
    valid = 0
    total = 0
    for ev in events:
        resource = (ev.get("resource") or "").lower()
        activity = (ev.get("activity") or "").lower()
        if not resource or not activity:
            continue
        total += 1
        allowed = agent_actions.get(resource)
        if allowed is None or activity in allowed:
            valid += 1
    return 10.0 if total == 0 else round(valid / total * 10.0, 2)


def check_attribute_completeness(
    events: List[Dict[str, Any]],
    required_attributes: List[str],
) -> float:
    """Fraction of events that have all required custom attributes, scaled to 0–10."""
    if not events or not required_attributes:
        return 10.0
    scores = []
    for ev in events:
        attrs = ev.get("attributes") or {}
        present = sum(
            1 for attr in required_attributes
            if attr in attrs and attrs[attr] is not None and str(attrs[attr]).strip() != ""
        )
        scores.append(present / len(required_attributes))
    return round(sum(scores) / len(scores) * 10.0, 2)


def compute_rule_scores(
    events: List[Dict[str, Any]],
    agents: List[Dict[str, Any]],
    transitions: Optional[Dict[str, List[str]]],
    required_attributes: List[str],
) -> Dict[str, float]:
    return {
        "timestamp_monotonicity": check_timestamp_monotonicity(events),
        "activity_conformance": check_activity_conformance(events, transitions),
        "role_action_consistency": check_role_action_consistency(events, agents),
        "attribute_completeness": check_attribute_completeness(events, required_attributes),
    }


def aggregate_rule_score(rule_scores: Dict[str, float]) -> float:
    if not rule_scores:
        return 0.0
    return round(sum(rule_scores.values()) / len(rule_scores), 2)
