import json
import uuid
import random
from datetime import datetime, timedelta
from typing import Optional
from fastapi import APIRouter, Form, UploadFile, File, HTTPException
from schema.config import SimulationRunConfig
from database import (
    create_run_in_db,
    get_all_runs,
    get_run_by_id,
    update_run_stats_events
)
router = APIRouter()


def generate_simulation_data(config):
    """
    Implements the Event Log Generation logic from Lecture 04 (Slide 27).
    Uses the provided agents, attributes, and case count to create a realistic log.
    """
    case_count = config["simulation"].get("caseCount", 10)
    seed = config["simulation"].get("seed")
    rng = random.Random(seed)
    
    agents = config.get("agents", [])
    attributes = config.get("attributes", [])
    custom_attrs = [a for a in attributes if not a.get("locked")]
    
    # Generic activities to choose from
    base_activities = ["Registration", "Data Validation", "Security Check", "Processing", "Approval", "Notification"]
    
    events = []
    variants = {}

    for i in range(case_count):
        case_id = f"CASE-{i+1:04d}"
        
        # Determine a random sequence length for this case
        num_events = rng.randint(3, 7)
        # Sequence: Start -> Middle -> End
        case_activities = ["Registration"] + [rng.choice(base_activities[1:-1]) for _ in range(num_events - 2)] + ["Notification"]
        
        # Track the trace variant
        trace = tuple(case_activities)
        variants[trace] = variants.get(trace, 0) + 1

        # Start time for this case
        timestamp = datetime.now() - timedelta(days=rng.randint(0, 3), hours=rng.randint(0, 23))

        for activity in case_activities:
            # Pick a RANDOM agent from the user's list (Lecture pattern)
            if agents:
                agent = rng.choice(agents)
            else:
                agent = {"name": "System", "role": "Automated"}
            
            # Populate custom attributes with randomized data
            attr_values = {}
            for attr in custom_attrs:
                name = attr["name"]
                a_type = attr["type"]
                if a_type == "number":
                    attr_values[name] = rng.randint(1, 100)
                elif a_type == "string":
                    attr_values[name] = rng.choice(["Standard", "Priority", "Express", "Internal"])
                elif a_type == "datetime":
                    attr_values[name] = (timestamp + timedelta(minutes=rng.randint(1, 30))).isoformat()
                else:
                    attr_values[name] = "N/A"

            events.append({
                "caseId": case_id,
                "activity": activity,
                "timestamp": timestamp.isoformat(),
                "resource": agent.get("name", "N/A"),
                "role": agent.get("role", "N/A"),
                "attributes": attr_values
            })
            
            # Advance time for the next step
            timestamp += timedelta(hours=rng.randint(1, 4))

    # Calculate distributions
    event_distribution = {}
    for ev in events:
        act = ev["activity"]
        event_distribution[act] = event_distribution.get(act, 0) + 1

    sorted_variants = sorted(variants.items(), key=lambda x: x[1], reverse=True)
    top_variants = [{
        "activities": list(v[0]),
        "count": v[1],
        "percentage": round((v[1] / case_count) * 100, 1)
    } for v in sorted_variants[:5]]

    stats = {
        "caseCount": case_count,
        "eventCount": len(events),
        "variantCount": len(variants),
        "eventDistribution": [{"activity": k, "count": v} for k, v in event_distribution.items()],
        "attributeDistribution": [], 
        "topVariants": top_variants
    }
    
    return stats, events

@router.post("/runs")
async def create_run(
    config: str = Form(...),
    bpmn: Optional[UploadFile] = File(None)
):
    try:
        config_dict = json.loads(config)
    except json.JSONDecodeError:
        raise HTTPException(status_code=400, detail="Invalid JSON format for config")

    try:
        valid_config = SimulationRunConfig(**config_dict)
    except Exception as e:
        raise HTTPException(status_code=422, detail=f"Configuration validation failed: {str(e)}")

    run_id = str(uuid.uuid4())
    current_time = datetime.now().isoformat()

    run = {
    "id": run_id,
    "status": "completed",
    "createdAt": current_time,
    "config": valid_config.dict(),
    "configName": valid_config.process.description[:30]
        + "..."
        if len(valid_config.process.description) > 30
        else valid_config.process.description,
    }

    create_run_in_db(run)
    return run


@router.get("/runs")
def list_runs():
    return {"runs": get_all_runs()}


@router.get("/runs/{run_id}")
def get_run_detail(run_id: str):
    
    run = get_run_by_id(run_id)

    if not run:
        raise HTTPException(status_code=404, detail="Run not found")

    if not run.get("stats"):
        stats, events = generate_simulation_data(run["config"])
        run["stats"] = stats
        run["events"] = events
        update_run_stats_events(run_id, stats, events)

    return run
