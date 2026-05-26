from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def root():
    return {"message": "Backend works"}

@app.get("/api/runs")
def get_runs():
    return [
        {
            "id": "run_1",
            "status": "completed",
            "created_at": "2026-05-25",
            "result": [
                {"case_id": "case_1", "activity": "A", "timestamp": 1},
                {"case_id": "case_1", "activity": "B", "timestamp": 2},
                {"case_id": "case_1", "activity": "C", "timestamp": 3},
                {"case_id": "case_2", "activity": "A", "timestamp": 1},
                {"case_id": "case_2", "activity": "D", "timestamp": 2},
                {"case_id": "case_3", "activity": "B", "timestamp": 1},
            ],
        }
    ]