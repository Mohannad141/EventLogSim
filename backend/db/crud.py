import json
from datetime import datetime
from typing import Any, Dict, List, Optional
from sqlalchemy import text, bindparam
from sqlalchemy.ext.asyncio import AsyncSession

# Helper to serialize JSON attributes if they are not already strings/dicts
def _serialize_json(data: Any) -> Any:
    if data is None:
        return None
    if isinstance(data, (dict, list)):
        return data
    try:
        return json.loads(data)
    except Exception:
        return data

async def get_runs(db: AsyncSession) -> List[Dict[str, Any]]:
    """Fetch all runs from the database sorted by creation time (newest first)"""
    query = text("""
        SELECT id, status, created_at, config_name, duration, error, config, stats 
        FROM runs 
        ORDER BY created_at DESC
    """)
    result = await db.execute(query)
    runs = []
    for row in result.mappings():
        runs.append({
            "id": row["id"],
            "status": row["status"],
            "createdAt": row["created_at"].isoformat() if row["created_at"] else None,
            "configName": row["config_name"],
            "duration": row["duration"],
            "error": row["error"],
            "config": _serialize_json(row["config"]),
            "stats": _serialize_json(row["stats"])
        })
    return runs

async def get_run_by_id(db: AsyncSession, run_id: str) -> Optional[Dict[str, Any]]:
    """Fetch a single run by its ID, including all its associated simulation events"""
    # 1. Fetch run details
    run_query = text("""
        SELECT id, status, created_at, config_name, duration, error, config, stats 
        FROM runs 
        WHERE id = :run_id
    """)
    run_result = await db.execute(run_query, {"run_id": run_id})
    run_row = run_result.mappings().first()
    
    if not run_row:
        return None

    run_data = {
        "id": run_row["id"],
        "status": run_row["status"],
        "createdAt": run_row["created_at"].isoformat() if run_row["created_at"] else None,
        "configName": run_row["config_name"],
        "duration": run_row["duration"],
        "error": run_row["error"],
        "config": _serialize_json(run_row["config"]),
        "stats": _serialize_json(run_row["stats"]),
        "events": []
    }

    # 2. Fetch associated events
    events_query = text("""
        SELECT case_id, activity, timestamp, attributes, is_terminal, resource, role 
        FROM events 
        WHERE run_id = :run_id 
        ORDER BY id ASC
    """)
    events_result = await db.execute(events_query, {"run_id": run_id})
    
    for row in events_result.mappings():
        run_data["events"].append({
            "caseId": row["case_id"],
            "activity": row["activity"],
            "timestamp": row["timestamp"].isoformat() if isinstance(row["timestamp"], datetime) else row["timestamp"],
            "is_terminal": row["is_terminal"],
            "resource": row["resource"],
            "role": row["role"],
            "attributes": _serialize_json(row["attributes"])
        })

        
    return run_data

async def create_run(
    db: AsyncSession, 
    run_id: str, 
    config: Dict[str, Any], 
    config_name: str
) -> Dict[str, Any]:
    """Insert a new pending simulation run into the database"""
    created_at = datetime.now()
    
    query = text("""
        INSERT INTO runs (id, status, created_at, config_name, config) 
        VALUES (:id, :status, :created_at, :config_name, :config)
    """)
    
    # We pass the dictionary configuration as JSON structure
    await db.execute(query, {
        "id": run_id,
        "status": "pending",
        "created_at": created_at,
        "config_name": config_name,
        "config": json.dumps(config)
    })
    
    await db.commit()
    
    return {
        "id": run_id,
        "status": "pending",
        "createdAt": created_at.isoformat(),
        "configName": config_name,
        "config": config,
        "events": [],
        "stats": None
    }

async def save_failed_run(
    db: AsyncSession, 
    run_id: str, 
    error_message: str, 
    stats: Dict[str, Any]
):
    """Update a run's status to 'failed' and record the error message and stats"""
    query = text("""
        UPDATE runs 
        SET status = 'failed', error = :error, stats = :stats, duration = 0 
        WHERE id = :run_id
    """)
    await db.execute(query, {
        "run_id": run_id,
        "error": error_message,
        "stats": json.dumps(stats)
    })
    await db.commit()

async def save_completed_run(
    db: AsyncSession, 
    run_id: str, 
    events: List[Dict[str, Any]], 
    stats: Dict[str, Any], 
    duration_ms: int
):
    """Save the results of a completed simulation: update status/stats, insert events"""
    # 1. Update run record
    run_update_query = text("""
        UPDATE runs 
        SET status = 'completed', stats = :stats, duration = :duration, error = NULL 
        WHERE id = :run_id
    """)
    await db.execute(run_update_query, {
        "run_id": run_id,
        "stats": json.dumps(stats),
        "duration": duration_ms
    })

    # 2. Insert all events using bulk execution
    if events:
        event_insert_query = text("""
            INSERT INTO events (run_id, case_id, activity, timestamp, is_terminal, resource, role, attributes) 
            VALUES (:run_id, :case_id, :activity, :timestamp, :is_terminal, :resource, :role, :attributes)
        """)
        
        event_records = []
        for ev in events:
            # Parse timestamp if it is a string
            ts_val = ev.get("timestamp")
            if isinstance(ts_val, str):
                try:
                    ts_val = datetime.fromisoformat(ts_val)
                except ValueError:
                    ts_val = datetime.now()
            elif not ts_val:
                ts_val = datetime.now()

            event_records.append({
                "run_id": run_id,
                "case_id": ev.get("caseId"),
                "activity": ev.get("activity"),
                "timestamp": ts_val,
                "is_terminal": ev.get("is_terminal", False),
                "resource": ev.get("resource"),
                "role": ev.get("role"),
                "attributes": json.dumps(ev.get("attributes") or {})
            })
            
        await db.execute(event_insert_query, event_records)


    await db.commit()

async def get_events_by_run(db: AsyncSession, run_id: str) -> List[Dict[str, Any]]:
    """Lightweight fetch of events (only fields needed for aggregation)."""
    query = text("""
        SELECT case_id, activity, resource, role
        FROM events
        WHERE run_id = :run_id
        ORDER BY id ASC
    """)
    result = await db.execute(query, {"run_id": run_id})
    return [
        {
            "caseId": row["case_id"],
            "activity": row["activity"],
            "resource": row["resource"],
            "role": row["role"],
        }
        for row in result.mappings()
    ]


async def save_case_evaluation(
    db: AsyncSession,
    run_id: str,
    case_id: str,
    overall_score: float,
    rule_scores: Dict[str, Any],
    llm_score: Optional[float],
    llm_attribute_scores: Dict[str, Any],
    justification: str,
    final_score: float,
) -> None:
    query = text("""
        INSERT INTO case_evaluations
            (run_id, case_id, overall_score, rule_scores, llm_score,
             llm_attribute_scores, justification, final_score, created_at)
        VALUES
            (:run_id, :case_id, :overall_score, :rule_scores, :llm_score,
             :llm_attribute_scores, :justification, :final_score, :created_at)
        ON CONFLICT (run_id, case_id) DO UPDATE SET
            overall_score        = EXCLUDED.overall_score,
            rule_scores          = EXCLUDED.rule_scores,
            llm_score            = EXCLUDED.llm_score,
            llm_attribute_scores = EXCLUDED.llm_attribute_scores,
            justification        = EXCLUDED.justification,
            final_score          = EXCLUDED.final_score,
            created_at           = EXCLUDED.created_at
    """)
    await db.execute(query, {
        "run_id": run_id,
        "case_id": case_id,
        "overall_score": overall_score,
        "rule_scores": json.dumps(rule_scores),
        "llm_score": llm_score,
        "llm_attribute_scores": json.dumps(llm_attribute_scores or {}),
        "justification": justification or "",
        "final_score": final_score,
        "created_at": datetime.now(),
    })
    await db.commit()


async def get_evaluations_by_run(db: AsyncSession, run_id: str) -> List[Dict[str, Any]]:
    query = text("""
        SELECT case_id, overall_score, rule_scores, llm_score,
               llm_attribute_scores, justification, final_score, created_at
        FROM case_evaluations
        WHERE run_id = :run_id
        ORDER BY case_id ASC
    """)
    result = await db.execute(query, {"run_id": run_id})
    return [
        {
            "case_id": row["case_id"],
            "overall_score": row["overall_score"],
            "rule_scores": _serialize_json(row["rule_scores"]),
            "llm_score": row["llm_score"],
            "llm_attribute_scores": _serialize_json(row["llm_attribute_scores"]),
            "justification": row["justification"],
            "final_score": row["final_score"],
            "created_at": row["created_at"].isoformat() if row["created_at"] else None,
        }
        for row in result.mappings()
    ]


async def delete_runs(db: AsyncSession, run_ids: List[str]):
    """Delete multiple runs by their IDs. Cascade will delete associated events."""
    if not run_ids:
        return
    query = text("DELETE FROM runs WHERE id IN :run_ids").bindparams(
        bindparam("run_ids", expanding=True)
    )
    await db.execute(query, {"run_ids": list(run_ids)})
    await db.commit()
