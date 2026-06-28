import sqlite3
import json

DB_FILE = "runs.db"

def get_connection():
    conn = sqlite3.connect(DB_FILE)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    conn = get_connection()
    conn.execute("""
        CREATE TABLE IF NOT EXISTS runs (
            id TEXT PRIMARY KEY,
            status TEXT NOT NULL,
            createdAt TEXT NOT NULL,
            config TEXT NOT NULL,
            configName TEXT NOT NULL,
            stats TEXT,
            events TEXT
        )
    """)
    conn.commit()
    conn.close()

def create_run_in_db(run):
    conn = get_connection()
    conn.execute("""
        INSERT INTO runs (id, status, createdAt, config, configName, stats, events)
        VALUES (?, ?, ?, ?, ?, ?, ?)
    """, (
        run["id"],
        run["status"],
        run["createdAt"],
        json.dumps(run["config"]),
        run["configName"],
        json.dumps(run.get("stats")) if run.get("stats") else None,
        json.dumps(run.get("events")) if run.get("events") else None
    ))
    conn.commit()
    conn.close()

def get_all_runs():
    conn = get_connection()
    rows = conn.execute("SELECT * FROM runs ORDER BY createdAt DESC").fetchall()
    conn.close()

    runs = []
    for row in rows:
        runs.append({
            "id": row["id"],
            "status": row["status"],
            "createdAt": row["createdAt"],
            "config": json.loads(row["config"]),
            "configName": row["configName"],
            "stats": json.loads(row["stats"]) if row["stats"] else None,
            "events": json.loads(row["events"]) if row["events"] else None,
        })
    return runs

def get_run_by_id(run_id):
    conn = get_connection()
    row = conn.execute("SELECT * FROM runs WHERE id = ?", (run_id,)).fetchone()
    conn.close()

    if not row:
        return None

    return {
        "id": row["id"],
        "status": row["status"],
        "createdAt": row["createdAt"],
        "config": json.loads(row["config"]),
        "configName": row["configName"],
        "stats": json.loads(row["stats"]) if row["stats"] else None,
        "events": json.loads(row["events"]) if row["events"] else None,
    }

def update_run_stats_events(run_id, stats, events):
    conn = get_connection()
    conn.execute("""
        UPDATE runs
        SET stats = ?, events = ?
        WHERE id = ?
    """, (json.dumps(stats), json.dumps(events), run_id))
    conn.commit()
    conn.close()