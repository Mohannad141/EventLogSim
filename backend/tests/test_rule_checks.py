"""Unit tests for Layer 1 rule-based evaluation checks."""
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from evaluation.rules import (
    check_timestamp_monotonicity,
    check_activity_conformance,
    check_role_action_consistency,
    check_attribute_completeness,
    compute_rule_scores,
    aggregate_rule_score,
)


# ── helpers ─────────────────────────────────────────────────────────────────

def _ev(activity, timestamp, resource="agent_a", role="Clerk", attributes=None):
    return {
        "activity": activity,
        "timestamp": timestamp,
        "resource": resource,
        "role": role,
        "attributes": attributes or {},
    }


AGENTS = [
    {"id": "agent_a", "role": "Clerk", "actions": ["Submit", "Review"]},
    {"id": "agent_b", "role": "Manager", "actions": ["Approve", "Reject"]},
]

TRANSITIONS = {
    "START": ["Submit"],
    "Submit": ["Review"],
    "Review": ["Approve", "Reject"],
    "Approve": ["END"],
    "Reject": ["END"],
}


# ── timestamp_monotonicity ───────────────────────────────────────────────────

def test_monotonicity_perfect():
    events = [
        _ev("Submit", "2024-01-01T10:00:00"),
        _ev("Review", "2024-01-01T11:00:00"),
        _ev("Approve", "2024-01-01T12:00:00"),
    ]
    assert check_timestamp_monotonicity(events) == 10.0


def test_monotonicity_partial():
    events = [
        _ev("Submit", "2024-01-01T10:00:00"),
        _ev("Review", "2024-01-01T09:00:00"),   # out of order
        _ev("Approve", "2024-01-01T12:00:00"),
    ]
    score = check_timestamp_monotonicity(events)
    assert 0.0 < score < 10.0


def test_monotonicity_all_wrong():
    events = [
        _ev("Submit", "2024-01-01T12:00:00"),
        _ev("Review", "2024-01-01T11:00:00"),
        _ev("Approve", "2024-01-01T10:00:00"),
    ]
    assert check_timestamp_monotonicity(events) == 0.0


def test_monotonicity_single_event():
    events = [_ev("Submit", "2024-01-01T10:00:00")]
    assert check_timestamp_monotonicity(events) == 10.0


def test_monotonicity_equal_timestamps_ok():
    events = [
        _ev("Submit", "2024-01-01T10:00:00"),
        _ev("Review", "2024-01-01T10:00:00"),
    ]
    assert check_timestamp_monotonicity(events) == 10.0


# ── activity_conformance ─────────────────────────────────────────────────────

def test_conformance_valid_sequence():
    events = [
        _ev("Submit", "2024-01-01T10:00:00"),
        _ev("Review", "2024-01-01T11:00:00"),
        _ev("Approve", "2024-01-01T12:00:00"),
    ]
    assert check_activity_conformance(events, TRANSITIONS) == 10.0


def test_conformance_invalid_transition():
    events = [
        _ev("Submit", "2024-01-01T10:00:00"),
        _ev("Approve", "2024-01-01T11:00:00"),   # Submit → Approve is invalid
    ]
    score = check_activity_conformance(events, TRANSITIONS)
    assert score == 0.0


def test_conformance_no_transitions():
    events = [_ev("A", "2024-01-01T10:00:00"), _ev("B", "2024-01-01T11:00:00")]
    assert check_activity_conformance(events, None) == 10.0


def test_conformance_unknown_source_forgiven():
    # "ArbitraryStep" is not a source in TRANSITIONS → we have no rule for it → forgiven
    events = [
        _ev("ArbitraryStep", "2024-01-01T10:00:00"),
        _ev("Review", "2024-01-01T11:00:00"),
    ]
    assert check_activity_conformance(events, TRANSITIONS) == 10.0


# ── role_action_consistency ──────────────────────────────────────────────────

def test_role_consistency_all_valid():
    events = [
        _ev("Submit", "2024-01-01T10:00:00", resource="agent_a"),
        _ev("Review", "2024-01-01T11:00:00", resource="agent_a"),
        _ev("Approve", "2024-01-01T12:00:00", resource="agent_b"),
    ]
    assert check_role_action_consistency(events, AGENTS) == 10.0


def test_role_consistency_violation():
    events = [
        _ev("Submit", "2024-01-01T10:00:00", resource="agent_a"),
        _ev("Approve", "2024-01-01T11:00:00", resource="agent_a"),  # agent_a can't Approve
    ]
    score = check_role_action_consistency(events, AGENTS)
    assert score < 10.0


def test_role_consistency_unknown_agent_forgiven():
    events = [_ev("Submit", "2024-01-01T10:00:00", resource="unknown_agent")]
    assert check_role_action_consistency(events, AGENTS) == 10.0


def test_role_consistency_no_agents():
    events = [_ev("Submit", "2024-01-01T10:00:00")]
    assert check_role_action_consistency(events, []) == 10.0


# ── attribute_completeness ───────────────────────────────────────────────────

def test_completeness_all_present():
    events = [
        _ev("Submit", "2024-01-01T10:00:00", attributes={"amount": "100", "reason": "urgent"}),
        _ev("Review", "2024-01-01T11:00:00", attributes={"amount": "100", "reason": "OK"}),
    ]
    assert check_attribute_completeness(events, ["amount", "reason"]) == 10.0


def test_completeness_partial():
    events = [
        _ev("Submit", "2024-01-01T10:00:00", attributes={"amount": "100"}),  # missing reason
        _ev("Review", "2024-01-01T11:00:00", attributes={"amount": "200", "reason": "fine"}),
    ]
    score = check_attribute_completeness(events, ["amount", "reason"])
    assert 0.0 < score < 10.0


def test_completeness_none_present():
    events = [
        _ev("Submit", "2024-01-01T10:00:00", attributes={}),
        _ev("Review", "2024-01-01T11:00:00", attributes={}),
    ]
    assert check_attribute_completeness(events, ["amount", "reason"]) == 0.0


def test_completeness_no_required():
    events = [_ev("Submit", "2024-01-01T10:00:00")]
    assert check_attribute_completeness(events, []) == 10.0


# ── aggregate ────────────────────────────────────────────────────────────────

def test_aggregate_rule_score_mean():
    scores = {"a": 10.0, "b": 0.0, "c": 5.0, "d": 5.0}
    assert aggregate_rule_score(scores) == 5.0


def test_compute_rule_scores_returns_all_keys():
    events = [
        _ev("Submit", "2024-01-01T10:00:00", resource="agent_a", attributes={"amount": "100"}),
        _ev("Review", "2024-01-01T11:00:00", resource="agent_a", attributes={"amount": "200"}),
    ]
    result = compute_rule_scores(events, AGENTS, TRANSITIONS, ["amount"])
    assert set(result.keys()) == {
        "timestamp_monotonicity",
        "activity_conformance",
        "role_action_consistency",
        "attribute_completeness",
    }
    for v in result.values():
        assert 0.0 <= v <= 10.0
