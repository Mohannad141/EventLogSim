import os
import tempfile
from collections import defaultdict
from typing import Any, Dict, List, Optional

from evaluation.rules import compute_rule_scores, aggregate_rule_score
from evaluation.llm_judge import judge_case

DEFAULT_RULE_WEIGHT = 0.5
DEFAULT_LLM_WEIGHT = 0.5


def _get_transitions(config: Dict[str, Any]) -> Optional[Dict[str, List[str]]]:
    bpmn_file = (config.get("process") or {}).get("bpmnFile")
    if not (isinstance(bpmn_file, dict) and bpmn_file.get("content")):
        return None
    tmp_path = None
    try:
        from simulation_engine.bpmn_parser import parse_bpmn
        with tempfile.NamedTemporaryFile(suffix=".bpmn", delete=False, mode="w", encoding="utf-8") as tmp:
            tmp.write(bpmn_file["content"])
            tmp_path = tmp.name
        return parse_bpmn(tmp_path).get("transitions")
    except Exception:
        return None
    finally:
        if tmp_path and os.path.exists(tmp_path):
            os.unlink(tmp_path)


def evaluate_case(
    llm: Any,
    case_id: str,
    case_events: List[Dict[str, Any]],
    process_summary: str,
    agents: List[Dict[str, Any]],
    transitions: Optional[Dict[str, List[str]]],
    attribute_names: List[str],
    rule_weight: float = DEFAULT_RULE_WEIGHT,
    llm_weight: float = DEFAULT_LLM_WEIGHT,
) -> Dict[str, Any]:
    rule_scores = compute_rule_scores(
        events=case_events,
        agents=agents,
        transitions=transitions,
        required_attributes=attribute_names,
    )
    rule_overall = aggregate_rule_score(rule_scores)

    try:
        judge_output = judge_case(
            llm=llm,
            process_summary=process_summary,
            agents=agents,
            case_events=case_events,
            attribute_names=attribute_names,
        )
        llm_score = judge_output.overall_score
        llm_attribute_scores = judge_output.attribute_scores
        justification = judge_output.justification
    except Exception as e:
        llm_score = None
        llm_attribute_scores = {}
        justification = f"LLM evaluation failed: {e}"

    if llm_score is not None:
        final_score = round(rule_weight * rule_overall + llm_weight * llm_score, 2)
    else:
        final_score = rule_overall

    return {
        "case_id": case_id,
        "overall_score": rule_overall,
        "rule_scores": rule_scores,
        "llm_score": llm_score,
        "llm_attribute_scores": llm_attribute_scores,
        "justification": justification,
        "final_score": final_score,
    }


def evaluate_run(
    llm: Any,
    run_data: Dict[str, Any],
    rule_weight: float = DEFAULT_RULE_WEIGHT,
    llm_weight: float = DEFAULT_LLM_WEIGHT,
) -> List[Dict[str, Any]]:
    events: List[Dict[str, Any]] = run_data.get("events") or []
    config: Dict[str, Any] = run_data.get("config") or {}

    process_summary = (config.get("process") or {}).get("description", "A business process.")
    agents = config.get("agents") or []
    attribute_names = [
        attr["name"]
        for attr in (config.get("attributes") or [])
        if not attr.get("locked") and attr.get("name")
    ]
    transitions = _get_transitions(config)

    cases: Dict[str, List[Dict[str, Any]]] = defaultdict(list)
    for ev in events:
        case_id = ev.get("caseId") or ev.get("case_id")
        if case_id:
            cases[case_id].append(ev)

    for case_id in cases:
        cases[case_id].sort(key=lambda e: str(e.get("timestamp", "")))

    results = []
    for case_id, case_events in cases.items():
        result = evaluate_case(
            llm=llm,
            case_id=case_id,
            case_events=case_events,
            process_summary=process_summary,
            agents=agents,
            transitions=transitions,
            attribute_names=attribute_names,
            rule_weight=rule_weight,
            llm_weight=llm_weight,
        )
        results.append(result)

    return results


def aggregate_agent_scores(
    evaluations: List[Dict[str, Any]],
    events: List[Dict[str, Any]],
) -> List[Dict[str, Any]]:
    eval_by_case = {e["case_id"]: e for e in evaluations}

    agent_cases: Dict[str, set] = defaultdict(set)
    for ev in events:
        case_id = ev.get("caseId") or ev.get("case_id")
        agent_id = ev.get("resource") or "unknown"
        if case_id in eval_by_case:
            agent_cases[agent_id].add(case_id)

    result = []
    for agent_id, case_ids in agent_cases.items():
        scores = [
            eval_by_case[cid]["final_score"]
            for cid in case_ids
            if eval_by_case[cid].get("final_score") is not None
        ]
        avg_score = round(sum(scores) / len(scores), 2) if scores else 0.0

        attr_scores: Dict[str, List[float]] = defaultdict(list)
        for cid in case_ids:
            for attr, score in (eval_by_case[cid].get("llm_attribute_scores") or {}).items():
                attr_scores[attr].append(score)
        attr_averages = {
            attr: round(sum(s) / len(s), 2) for attr, s in attr_scores.items()
        }

        result.append({
            "agent_id": agent_id,
            "avg_score": avg_score,
            "case_count": len(case_ids),
            "attribute_scores": attr_averages,
        })

    return sorted(result, key=lambda x: x["avg_score"], reverse=True)


def aggregate_attribute_scores(
    evaluations: List[Dict[str, Any]],
) -> List[Dict[str, Any]]:
    attr_scores: Dict[str, List[float]] = defaultdict(list)
    for evaluation in evaluations:
        for attr, score in (evaluation.get("llm_attribute_scores") or {}).items():
            attr_scores[attr].append(score)

    result = [
        {
            "attribute": attr,
            "avg_score": round(sum(scores) / len(scores), 2),
            "case_count": len(scores),
        }
        for attr, scores in attr_scores.items()
    ]
    return sorted(result, key=lambda x: x["avg_score"], reverse=True)
