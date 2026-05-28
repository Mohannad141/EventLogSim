from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import uvicorn

from routers.runs import router as runs_router

app = FastAPI()

app.include_router(runs_router, prefix="/api", tags=["runs"])

def main():
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)

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


if __name__ == "__main__":
    main()