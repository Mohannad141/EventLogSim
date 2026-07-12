import json
from pathlib import Path
from typing import Any, Dict, List

from langchain_core.prompts import PromptTemplate
from langchain_core.output_parsers import JsonOutputParser
from pydantic import BaseModel, Field


PROMPT_PATH = Path(__file__).parent / "prompts" / "judge_prompt.txt"


class JudgeOutput(BaseModel):
    overall_score: float = Field(..., description="Overall quality score 0–10", ge=0, le=10)
    attribute_scores: Dict[str, float] = Field(
        default_factory=dict,
        description="Score 0–10 per custom attribute for realism/plausibility",
    )
    justification: str = Field(..., description="2–3 sentence explanation")


def _load_template() -> str:
    if PROMPT_PATH.exists():
        return PROMPT_PATH.read_text(encoding="utf-8")
    # Inline fallback so the module works even without the file
    return (
        "You are a process mining judge.\n\n"
        "Process: {process_summary}\nAgents: {agents_summary}\n"
        "Events: {events_json}\nAttributes: {attribute_names}\n\n"
        "Return JSON: overall_score (0-10), attribute_scores dict, justification string.\n"
        "{format_instructions}"
    )


def judge_case(
    llm: Any,
    process_summary: str,
    agents: List[Dict[str, Any]],
    case_events: List[Dict[str, Any]],
    attribute_names: List[str],
) -> JudgeOutput:
    """Single LLM call to judge a case. Uses temperature=0 for determinism."""
    parser = JsonOutputParser(pydantic_object=JudgeOutput)

    prompt_template = PromptTemplate(
        template=_load_template(),
        input_variables=["process_summary", "agents_summary", "events_json", "attribute_names"],
        partial_variables={"format_instructions": parser.get_format_instructions()},
    )

    agents_summary = json.dumps(
        [{"id": a.get("id"), "role": a.get("role"), "actions": a.get("actions", [])} for a in agents],
        indent=2,
    )

    events_serializable = [
        {
            "activity": ev.get("activity"),
            "timestamp": str(ev.get("timestamp", "")),
            "resource": ev.get("resource"),
            "role": ev.get("role"),
            "attributes": ev.get("attributes") or {},
        }
        for ev in case_events
    ]

    prompt = prompt_template.format(
        process_summary=process_summary,
        agents_summary=agents_summary,
        events_json=json.dumps(events_serializable, indent=2),
        attribute_names=", ".join(attribute_names) if attribute_names else "none",
    )

    # temperature=0 for reproducible judging
    judge_llm = llm.bind(temperature=0) if hasattr(llm, "bind") else llm
    response = judge_llm.invoke(prompt)

    try:
        parsed = parser.parse(response.content)
        return JudgeOutput(**parsed)
    except Exception as e:
        return JudgeOutput(
            overall_score=5.0,
            attribute_scores={name: 5.0 for name in attribute_names},
            justification=f"Judge output could not be parsed: {e}",
        )
