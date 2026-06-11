import json
import uuid
import os
import random
from datetime import datetime, timedelta
from typing import Optional
from fastapi import APIRouter, Form, UploadFile, File, HTTPException
from schema.config import SimulationRunConfig
from simulation_engine.event_log_generation import generate_event_log

# 1. Create the router object
router = APIRouter()

# Path to our simple JSON "database"
DB_FILE = "database.json"

def load_db():
    if os.path.exists(DB_FILE):
        with open(DB_FILE, "r") as f:
            try:
                return json.load(f)
            except:
                return {}
    return {}

def save_db(data):
    with open(DB_FILE, "w") as f:
        json.dump(data, f, indent=4)

# Load the database into memory when the server starts
fake_database = load_db()

def cleanup_old_runs():
    cutoff = datetime.now() - timedelta(days=30)  # test with 1 day first
    runs_to_delete = []

    for run_id, run in fake_database.items():
        created_at = run.get("createdAt")

        if not created_at:
            continue

        try:
            created_time = datetime.fromisoformat(created_at)

            if created_time < cutoff:
                runs_to_delete.append(run_id)

        except ValueError:
            continue

    for run_id in runs_to_delete:
        del fake_database[run_id]

    if runs_to_delete:
        save_db(fake_database)


cleanup_old_runs()
def build_attribute_distribution(events, config):
    attribute_names = ["role"]

    for attr in config.get("attributes", []):
        name = attr.get("name")
        if name and name not in attribute_names:
            attribute_names.append(name)

    distributions = []

    for attr_name in attribute_names:
        counts = {}

        for event in events:
            value = event.get(attr_name)

            if value is None:
                value = event.get("attributes", {}).get(attr_name)

            if value is None or value == "":
                continue

            counts[str(value)] = counts.get(str(value), 0) + 1

        distributions.append({
            "name": attr_name,
            "values": [
                {"value": value, "count": count}
                for value, count in counts.items()
            ]
        })

    return distributions

def generate_simulation_data(config):
    """
    Implements the Event Log Generation logic.
    Supports both RANDOM (baseline) and LLM-BASED simulation.
    """
    process_mode = config["process"].get("mode", "RANDOM")
    
    if process_mode in ["PURE_LLM", "LLM_BASED"]:
        # Use the LLM Engine
        try:
            # We need to pass a SimulationRunConfig object
            config_obj = SimulationRunConfig(**config)
            events = generate_event_log(config_obj)
        except Exception as e:
            print(f"LLM Simulation failed: {e}")
            # Fallback to random if LLM fails
            return generate_random_simulation_data(config)
    else:
        return generate_random_simulation_data(config)

    # Calculate distributions and stats for LLM events
    variants = {}
    event_distribution = {}
    
    # Process the events list which is already flat from generate_event_log
    case_activities = {}
    for ev in events:
        c_id = ev["caseId"]
        act = ev["activity"]
        case_activities.setdefault(c_id, []).append(act)
        event_distribution[act] = event_distribution.get(act, 0) + 1

    for c_id, activities in case_activities.items():
        trace = tuple(activities)
        variants[trace] = variants.get(trace, 0) + 1

    sorted_variants = sorted(variants.items(), key=lambda x: x[1], reverse=True)
    top_variants = [{
        "activities": list(v[0]),
        "count": v[1],
        "percentage": round((v[1] / len(case_activities)) * 100, 1) if case_activities else 0
    } for v in sorted_variants[:5]]

    stats = {
        "caseCount": len(case_activities),
        "eventCount": len(events),
        "variantCount": len(variants),
        "eventDistribution": [{"activity": k, "count": v} for k, v in event_distribution.items()],
        "attributeDistribution": build_attribute_distribution(events, config),
        "topVariants": top_variants
    }
    
    return stats, events

def generate_random_simulation_data(config):
    case_count = config["simulation"].get("caseCount", 10)
    rng = random.Random()
    
    agents = config.get("agents", [])
    attributes = config.get("attributes", [])
    custom_attrs = [a for a in attributes if not a.get("locked")]
    
    # Generic activities to choose from
    base_activities = ["Registration", "Data Validation", "Security Check", "Processing", "Approval", "Notification"]
    
    events = []
    variants = {}

    for i in range(case_count):
        case_id = f"CASE-{i+1:04d}"
        
        num_events = rng.randint(3, 7)
        case_activities = ["Registration"] + [rng.choice(base_activities[1:-1]) for _ in range(num_events - 2)] + ["Notification"]
        
        trace = tuple(case_activities)
        variants[trace] = variants.get(trace, 0) + 1

        timestamp = datetime.now() - timedelta(days=rng.randint(0, 3), hours=rng.randint(0, 23))

        for activity in case_activities:
            if agents:
                agent = rng.choice(agents)
            else:
                agent = {"name": "System", "role": "Automated"}
            
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
        "attributeDistribution": build_attribute_distribution(events, config),
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

    fake_database[run_id] = {
        "id": run_id,
        "status": "completed",
        "createdAt": current_time,
        "config": valid_config.dict(),
        "configName": valid_config.process.description[:30] + "..." if len(valid_config.process.description) > 30 else valid_config.process.description,
    }

    save_db(fake_database)
    return fake_database[run_id]


@router.get("/runs")
def list_runs():
    return {"runs": list(fake_database.values())}

@router.delete("/runs")
def delete_runs(run_ids: list[str]):
    deleted = 0

    for run_id in run_ids:
        if run_id in fake_database:
            del fake_database[run_id]
            deleted += 1

    save_db(fake_database)

    return {"deleted": deleted}

@router.get("/runs/{run_id}")
def get_run_detail(run_id: str):
    if run_id not in fake_database:
        raise HTTPException(status_code=404, detail="Run not found")
    
    run = fake_database[run_id]

    # Only generate if events don't exist yet
    if not run.get("events") or not run.get("stats"):
        print(f"Generating simulation data for run {run_id}...")
        result = generate_simulation_data(run["config"])
        
        stats, events = result
        run["stats"] = stats
        run["events"] = events
        # Update the global fake_database and save immediately
        fake_database[run_id] = run
        save_db(fake_database)

    return run
