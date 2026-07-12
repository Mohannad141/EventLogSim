"""Unit tests for agent and attribute aggregation math (no LLM calls)."""
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from evaluation.evaluator import aggregate_agent_scores, aggregate_attribute_scores


# ── fixtures ─────────────────────────────────────────────────────────────────

EVALUATIONS = [
    {
        "case_id": "CASE-0001",
        "final_score": 8.0,
        "llm_attribute_scores": {"amount": 9.0, "reason": 7.0},
    },
    {
        "case_id": "CASE-0002",
        "final_score": 4.0,
        "llm_attribute_scores": {"amount": 3.0, "reason": 5.0},
    },
    {
        "case_id": "CASE-0003",
        "final_score": 6.0,
        "llm_attribute_scores": {"amount": 6.0, "reason": 6.0},
    },
]

EVENTS = [
    {"caseId": "CASE-0001", "resource": "agent_a"},
    {"caseId": "CASE-0001", "resource": "agent_a"},
    {"caseId": "CASE-0001", "resource": "agent_b"},
    {"caseId": "CASE-0002", "resource": "agent_a"},
    {"caseId": "CASE-0002", "resource": "agent_b"},
    {"caseId": "CASE-0003", "resource": "agent_b"},
]


# ── aggregate_agent_scores ────────────────────────────────────────────────────

def test_agent_scores_average():
    result = aggregate_agent_scores(EVALUATIONS, EVENTS)
    by_id = {r["agent_id"]: r for r in result}

    # agent_a participated in CASE-0001 (8.0) and CASE-0002 (4.0) → avg 6.0
    assert by_id["agent_a"]["avg_score"] == 6.0
    assert by_id["agent_a"]["case_count"] == 2

    # agent_b participated in CASE-0001 (8.0), CASE-0002 (4.0), CASE-0003 (6.0) → avg 6.0
    assert by_id["agent_b"]["avg_score"] == 6.0
    assert by_id["agent_b"]["case_count"] == 3


def test_agent_scores_attribute_breakdown():
    result = aggregate_agent_scores(EVALUATIONS, EVENTS)
    by_id = {r["agent_id"]: r for r in result}

    # agent_a: amount from CASE-0001(9.0) and CASE-0002(3.0) → avg 6.0
    assert by_id["agent_a"]["attribute_scores"]["amount"] == 6.0
    # agent_a: reason from CASE-0001(7.0) and CASE-0002(5.0) → avg 6.0
    assert by_id["agent_a"]["attribute_scores"]["reason"] == 6.0


def test_agent_scores_sorted_descending():
    result = aggregate_agent_scores(EVALUATIONS, EVENTS)
    scores = [r["avg_score"] for r in result]
    assert scores == sorted(scores, reverse=True)


def test_agent_scores_no_evaluations():
    result = aggregate_agent_scores([], EVENTS)
    assert result == []


def test_agent_scores_no_events():
    result = aggregate_agent_scores(EVALUATIONS, [])
    assert result == []


def test_agent_scores_each_case_counted_once():
    """A case with 3 events from the same agent must count only once."""
    evals = [{"case_id": "CASE-0001", "final_score": 10.0, "llm_attribute_scores": {}}]
    events = [
        {"caseId": "CASE-0001", "resource": "agent_a"},
        {"caseId": "CASE-0001", "resource": "agent_a"},
        {"caseId": "CASE-0001", "resource": "agent_a"},
    ]
    result = aggregate_agent_scores(evals, events)
    assert len(result) == 1
    assert result[0]["case_count"] == 1
    assert result[0]["avg_score"] == 10.0


# ── aggregate_attribute_scores ────────────────────────────────────────────────

def test_attribute_scores_average():
    result = aggregate_attribute_scores(EVALUATIONS)
    by_attr = {r["attribute"]: r for r in result}

    # amount: (9+3+6)/3 = 6.0
    assert by_attr["amount"]["avg_score"] == 6.0
    assert by_attr["amount"]["case_count"] == 3

    # reason: (7+5+6)/3 = 6.0
    assert by_attr["reason"]["avg_score"] == 6.0
    assert by_attr["reason"]["case_count"] == 3


def test_attribute_scores_sorted_descending():
    evals = [
        {"case_id": "C1", "final_score": 5.0, "llm_attribute_scores": {"amount": 8.0, "reason": 3.0}},
    ]
    result = aggregate_attribute_scores(evals)
    scores = [r["avg_score"] for r in result]
    assert scores == sorted(scores, reverse=True)


def test_attribute_scores_missing_attribute_ignored():
    """If a case has no attribute score for a key, that case is simply excluded from avg."""
    evals = [
        {"case_id": "C1", "final_score": 5.0, "llm_attribute_scores": {"amount": 8.0}},
        {"case_id": "C2", "final_score": 6.0, "llm_attribute_scores": {"reason": 4.0}},
    ]
    result = aggregate_attribute_scores(evals)
    by_attr = {r["attribute"]: r for r in result}
    assert by_attr["amount"]["case_count"] == 1
    assert by_attr["reason"]["case_count"] == 1


def test_attribute_scores_no_evaluations():
    assert aggregate_attribute_scores([]) == []


def test_attribute_scores_empty_llm_scores():
    evals = [{"case_id": "C1", "final_score": 5.0, "llm_attribute_scores": {}}]
    assert aggregate_attribute_scores(evals) == []
