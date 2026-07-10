import asyncio
import json
import time
import uuid
from collections import Counter, defaultdict
from datetime import datetime
from typing import Any, Dict, List, Optional

from fastapi import APIRouter, Form, UploadFile, File, HTTPException, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from schema.config import SimulationRunConfig
from db.session import get_db
from db import crud

router = APIRouter()

ESSENTIAL_ATTRIBUTE_NAMES = {"caseId", "activity", "timestamp"}

# Per-run lock to prevent concurrent LLM generation for the same run id
# (React strict mode and double-clicks would otherwise trigger generation
# twice and double the cost).
_generation_locks: Dict[str, asyncio.Lock] = {}
_locks_guard = asyncio.Lock()


async def _get_run_lock(run_id: str) -> asyncio.Lock:
    async with _locks_guard:
        if run_id not in _generation_locks:
            _generation_locks[run_id] = asyncio.Lock()
        return _generation_locks[run_id]



def compute_stats(
    events: List[Dict[str, Any]],
    config_snapshot: Optional[Dict[str, Any]],
) -> Dict[str, Any]:
    """Aggregate generated events into the stats shape the frontend renders."""
    case_to_seq: Dict[str, List[str]] = defaultdict(list)
    activity_counter: Counter = Counter()

    for ev in events:
        case_id = ev.get("caseId")
        activity = ev.get("activity")
        if case_id and activity:
            case_to_seq[case_id].append(activity)
            activity_counter[activity] += 1

    variant_counter: Counter = Counter()
    for seq in case_to_seq.values():
        variant_counter[tuple(seq)] += 1

    case_count = len(case_to_seq)
    denom = case_count if case_count > 0 else 1

    top_variants = [
        {
            "sequence": list(seq),
            "count": count,
            "percentage": round(100 * count / denom, 1),
        }
        for seq, count in variant_counter.most_common(5)
    ]

    custom_attr_names: List[str] = []
    if config_snapshot:
        for attr in config_snapshot.get("attributes") or []:
            name = attr.get("name")
            if (
                name
                and not attr.get("locked")
                and name not in ESSENTIAL_ATTRIBUTE_NAMES
            ):
                custom_attr_names.append(name)

    attribute_distribution: List[Dict[str, Any]] = []
    for name in custom_attr_names:
        value_counter: Counter = Counter()
        for ev in events:
            attrs = ev.get("attributes") or {}
            if name in attrs:
                value_counter[str(attrs[name])] += 1
        if value_counter:
            attribute_distribution.append({
                "name": name,
                "values": [
                    {"value": value, "count": count}
                    for value, count in value_counter.most_common(20)
                ],
            })

    return {
        "caseCount": case_count,
        "eventCount": len(events),
        "variantCount": len(variant_counter),
        "eventDistribution": [
            {"activity": activity, "count": count}
            for activity, count in activity_counter.most_common()
        ],
        "attributeDistribution": attribute_distribution,
        "topVariants": top_variants,
    }


def attach_bpmn_content(
    config_dict: Dict[str, Any],
    bpmn_file: Optional[UploadFile],
    raw_bytes: Optional[bytes],
) -> None:
    """Inline the uploaded BPMN text into config.process.bpmnFile.content."""
    if not bpmn_file or raw_bytes is None:
        return
    process = config_dict.setdefault("process", {})
    meta = process.get("bpmnFile") or {}
    try:
        content = raw_bytes.decode("utf-8")
    except UnicodeDecodeError:
        content = raw_bytes.decode("utf-8", errors="replace")
    process["bpmnFile"] = {
        "name": meta.get("name") or bpmn_file.filename or "process.bpmn",
        "size": meta.get("size") or len(raw_bytes),
        "content": content,
    }


def with_snapshot_alias(run: Dict[str, Any]) -> Dict[str, Any]:
    """Expose the stored `config` as `configSnapshot` for the frontend."""
    response = dict(run)
    response.setdefault("configSnapshot", run.get("config") or {})
    return response


@router.post("/runs")
async def create_run(
    config: str = Form(...),
    bpmn: Optional[UploadFile] = File(None),
    db: AsyncSession = Depends(get_db)
):
    try:
        config_dict = json.loads(config)
    except json.JSONDecodeError:
        raise HTTPException(status_code=400, detail="Invalid JSON format for config")

    bpmn_bytes = await bpmn.read() if bpmn is not None else None
    attach_bpmn_content(config_dict, bpmn, bpmn_bytes)

    try:
        valid_config = SimulationRunConfig(**config_dict)
    except Exception as e:
        raise HTTPException(
            status_code=422,
            detail=f"Configuration validation failed: {e}",
        )

    run_id = str(uuid.uuid4())
    run_name = (valid_config.process.runName or "").strip()
    if run_name:
        config_name = run_name
    else:
        desc = (valid_config.process.description or "").strip()
        if desc:
            config_name = desc[:30] + "..." if len(desc) > 30 else desc
        else:
            config_name = "Untitled run"

    record = await crud.create_run(db, run_id, valid_config.model_dump(), config_name)
    return with_snapshot_alias(record)


@router.get("/runs")
async def list_runs(db: AsyncSession = Depends(get_db)):
    runs = await crud.get_runs(db)
    return {"runs": [with_snapshot_alias(run) for run in runs]}


@router.get("/runs/{run_id}")
async def get_run_detail(run_id: str, db: AsyncSession = Depends(get_db)):
    run = await crud.get_run_by_id(db, run_id)
    if not run:
        raise HTTPException(status_code=404, detail="Run not found")

    if run.get("status") in ("completed", "failed") and run.get("stats") is not None:
        return with_snapshot_alias(run)

    # Serialize concurrent generations for the same run id.
    lock = await _get_run_lock(run_id)
    async with lock:
        # Re-check: another concurrent request may have just finished generating.
        run = await crud.get_run_by_id(db, run_id)
        if run.get("status") in ("completed", "failed") and run.get("stats") is not None:
            return with_snapshot_alias(run)

        config_snapshot = run.get("config") or {}

        # Try to rebuild the Pydantic config first; bail early on bad stored data.
        try:
            valid_config = SimulationRunConfig(**config_snapshot)
        except Exception as e:
            stats = compute_stats([], config_snapshot)
            await crud.save_failed_run(db, run_id, f"Stored config is invalid: {e}", stats)
            updated_run = await crud.get_run_by_id(db, run_id)
            return with_snapshot_alias(updated_run)

        # Lazy import: event_log_generation initializes the LLM at module load.
        try:
            from simulation_engine.event_log_generation import generate_event_log
        except Exception as e:
            stats = compute_stats([], config_snapshot)
            await crud.save_failed_run(db, run_id, f"Simulation engine unavailable: {e}", stats)
            updated_run = await crud.get_run_by_id(db, run_id)
            return with_snapshot_alias(updated_run)

        started = time.time()
        try:
            # generate_event_log is a blocking synchronous LLM generation call.
            # To prevent blocking the async event loop during long LLM calls,
            # we run it in a threadpool.
            from fastapi.concurrency import run_in_threadpool
            events = await run_in_threadpool(generate_event_log, valid_config)
            
            stats = compute_stats(events, config_snapshot)
            duration = int((time.time() - started) * 1000)
            await crud.save_completed_run(db, run_id, events, stats, duration)
        except Exception as e:
            stats = compute_stats([], config_snapshot)
            await crud.save_failed_run(db, run_id, str(e), stats)

        updated_run = await crud.get_run_by_id(db, run_id)
        return with_snapshot_alias(updated_run)


@router.delete("/runs")
async def delete_runs_endpoint(run_ids: List[str], db: AsyncSession = Depends(get_db)):
    try:
        await crud.delete_runs(db, run_ids)
        return {"message": f"Successfully deleted {len(run_ids)} runs."}
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to delete runs: {e}"
        )

