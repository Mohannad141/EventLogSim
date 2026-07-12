from typing import Optional

from fastapi import APIRouter, Depends, HTTPException
from fastapi.concurrency import run_in_threadpool
from pydantic import BaseModel, Field
from sqlalchemy.ext.asyncio import AsyncSession

from db.session import get_db
from db import crud
from evaluation.evaluator import (
    evaluate_run,
    aggregate_agent_scores,
    aggregate_attribute_scores,
)

router = APIRouter()


class EvaluationRunRequest(BaseModel):
    run_id: str
    rule_weight: float = Field(default=0.5, ge=0.0, le=1.0)
    llm_weight: float = Field(default=0.5, ge=0.0, le=1.0)


def _evaluate_sync(run_data, rule_weight: float, llm_weight: float):
    from simulation_engine.llm_factory import get_llm
    llm = get_llm(temperature=0)
    return evaluate_run(llm, run_data, rule_weight, llm_weight)


def _to_api(ev: dict) -> dict:
    return {
        "caseId": ev["case_id"],
        "overallScore": ev["overall_score"],
        "ruleScores": ev["rule_scores"],
        "llmScore": ev["llm_score"],
        "llmAttributeScores": ev["llm_attribute_scores"],
        "justification": ev["justification"],
        "finalScore": ev["final_score"],
        "createdAt": ev.get("created_at"),
    }


@router.post("/evaluations/run")
async def run_evaluation(body: EvaluationRunRequest, db: AsyncSession = Depends(get_db)):
    run = await crud.get_run_by_id(db, body.run_id)
    if not run:
        raise HTTPException(status_code=404, detail="Run not found")
    if run.get("status") != "completed":
        raise HTTPException(status_code=400, detail="Can only evaluate completed runs")

    try:
        results = await run_in_threadpool(_evaluate_sync, run, body.rule_weight, body.llm_weight)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Evaluation failed: {e}")

    for r in results:
        await crud.save_case_evaluation(
            db,
            run_id=body.run_id,
            case_id=r["case_id"],
            overall_score=r["overall_score"],
            rule_scores=r["rule_scores"],
            llm_score=r["llm_score"],
            llm_attribute_scores=r["llm_attribute_scores"],
            justification=r["justification"],
            final_score=r["final_score"],
        )

    return {"evaluations": [_to_api(r) for r in results]}


@router.get("/evaluations/cases")
async def get_case_evaluations(run_id: str, db: AsyncSession = Depends(get_db)):
    evaluations = await crud.get_evaluations_by_run(db, run_id)
    return {"evaluations": [_to_api(e) for e in evaluations]}


@router.get("/evaluations/agents")
async def get_agent_scores(run_id: str, db: AsyncSession = Depends(get_db)):
    evaluations = await crud.get_evaluations_by_run(db, run_id)
    events = await crud.get_events_by_run(db, run_id)
    agent_scores = aggregate_agent_scores(evaluations, events)
    return {"agents": agent_scores}


@router.get("/evaluations/attributes")
async def get_attribute_scores(run_id: str, db: AsyncSession = Depends(get_db)):
    evaluations = await crud.get_evaluations_by_run(db, run_id)
    attr_scores = aggregate_attribute_scores(evaluations)
    return {"attributes": attr_scores}
