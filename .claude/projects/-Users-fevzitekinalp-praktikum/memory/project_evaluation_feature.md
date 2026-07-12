---
name: project-evaluation-feature
description: Feedback scoring feature added — architecture, file locations, design decisions
metadata:
  type: project
---

Feedback evaluation feature implemented July 2026.

**Why:** Post-processing quality scoring for simulated event logs (rule-based + LLM judge).

**Architecture:**
- `backend/evaluation/rules.py` — Layer 1 rule checks (timestamp monotonicity, activity conformance, role consistency, attribute completeness), each 0–10
- `backend/evaluation/llm_judge.py` — Layer 2 LLM call (temperature=0), JudgeOutput Pydantic model, prompt in `evaluation/prompts/judge_prompt.txt`
- `backend/evaluation/evaluator.py` — orchestrator; `evaluate_run()`, `aggregate_agent_scores()`, `aggregate_attribute_scores()`
- `backend/routers/evaluations.py` — 4 API endpoints: POST /api/evaluations/run, GET /api/evaluations/cases|agents|attributes
- `backend/db/session.py` — `case_evaluations` table (run_id FK, UNIQUE(run_id, case_id), rule_scores JSONB, llm_attribute_scores JSONB)
- `backend/db/crud.py` — `save_case_evaluation()`, `get_evaluations_by_run()`, `get_events_by_run()`
- `backend/tests/` — 30 unit tests (pytest), all passing; no LLM calls mocked

**Frontend:**
- `src/components/runs/EvaluationPanel.jsx` — main container with tabs (Cases/Agents/Attributes) + Run Evaluation button
- `src/components/runs/CaseEvaluationsTable.jsx` — per-case table with score cells
- `src/components/runs/CaseEvaluationDetail.jsx` — modal showing rule sub-scores + LLM attribute scores + justification
- `src/components/runs/AgentScoresChart.jsx` / `AttributeScoresChart.jsx` — recharts bar charts
- `src/components/runs/FeedbackScoreCell.jsx` — color-coded badge (red<5, yellow 5–7.5, green>7.5)
- `src/hooks/useEvaluation.js` — fetches and triggers evaluation
- EvaluationPanel added to RunDetailPage only for completed runs

**Design decisions:**
- Raw SQL DDL pattern (no ORM, no migration files) — consistent with existing code
- `get_llm(temperature=0)` via modified factory (temperature param added)
- Evaluation is completely separate from simulation — does not modify agent prompts
- JsonOutputParser (not with_structured_output) for Groq compatibility

**How to apply:** When touching evaluation scoring, aggregation, or the judge prompt, these are the relevant files.
