import json
import os
import threading
import time
import uuid
from collections import Counter, defaultdict
from datetime import datetime
from typing import Any, Dict, List, Optional

from fastapi import APIRouter, Form, UploadFile, File, HTTPException

from schema.config import SimulationRunConfig

router = APIRouter()

DB_FILE = "database.json"

ESSENTIAL_ATTRIBUTE_NAMES = {"caseId", "activity", "timestamp"}

# Per-run lock to prevent concurrent LLM generation for the same run id
# (React strict mode and double-clicks would otherwise trigger generation
# twice and double the cost).
_generation_locks: Dict[str, threading.Lock] = {}
_locks_guard = threading.Lock()


def _get_run_lock(run_id: str) -> threading.Lock:
    with _locks_guard:
        if run_id not in _generation_locks:
            _generation_locks[run_id] = threading.Lock()
        return _generation_locks[run_id]


def load_db():
    if os.path.exists(DB_FILE):
        with open(DB_FILE, "r") as f:
            try:
                return json.load(f)
            except Exception:
                return {}
    return {}


def save_db(data):
    with open(DB_FILE, "w") as f:
        json.dump(data, f, indent=4)


fake_database = load_db()


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
    desc = (valid_config.process.description or "").strip()
    if desc:
        config_name = desc[:30] + "..." if len(desc) > 30 else desc
    else:
        config_name = "Untitled run"

    record = {
        "id": run_id,
        "status": "pending",
        "createdAt": datetime.now().isoformat(),
        "config": valid_config.model_dump(),
        "configName": config_name,
    }
    fake_database[run_id] = record
    save_db(fake_database)
    return with_snapshot_alias(record)


@router.get("/runs")
def list_runs():
    return {"runs": [with_snapshot_alias(run) for run in fake_database.values()]}


@router.get("/runs/{run_id}")
def get_run_detail(run_id: str):
    if run_id not in fake_database:
        raise HTTPException(status_code=404, detail="Run not found")

    run = fake_database[run_id]

    if "stats" in run and "events" in run:
        return with_snapshot_alias(run)

    # Serialize concurrent generations for the same run id. Without this,
    # React strict mode (or any double-tab/double-click) triggers two parallel
    # LLM jobs and doubles the token cost.
    lock = _get_run_lock(run_id)
    with lock:
        # Re-check: another concurrent request may have just finished generating.
        run = fake_database[run_id]
        if "stats" in run and "events" in run:
            return with_snapshot_alias(run)

        config_snapshot = run.get("config") or {}

        # Try to rebuild the Pydantic config first; bail early on bad stored data.
        try:
            valid_config = SimulationRunConfig(**config_snapshot)
        except Exception as e:
            run["status"] = "failed"
            run["error"] = f"Stored config is invalid: {e}"
            run["events"] = []
            run["stats"] = compute_stats([], config_snapshot)
            run["duration"] = 0
            save_db(fake_database)
            return with_snapshot_alias(run)

        # Lazy import: event_log_generation initializes the LLM at module load.
        # Importing it eagerly would force every process startup to depend on
        # API keys even when no run is being executed.
        try:
            from simulation_engine.event_log_generation import generate_event_log
        except Exception as e:
            run["status"] = "failed"
            run["error"] = f"Simulation engine unavailable: {e}"
            run["events"] = []
            run["stats"] = compute_stats([], config_snapshot)
            run["duration"] = 0
            save_db(fake_database)
            return with_snapshot_alias(run)

        started = time.time()
        try:
            events = generate_event_log(valid_config)
            run["events"] = events
            run["stats"] = compute_stats(events, config_snapshot)
            run["status"] = "completed"
            run.pop("error", None)
        except Exception as e:
            run["status"] = "failed"
            run["error"] = str(e)
            run["events"] = []
            run["stats"] = compute_stats([], config_snapshot)
        run["duration"] = int((time.time() - started) * 1000)
        save_db(fake_database)

    return with_snapshot_alias(run)
