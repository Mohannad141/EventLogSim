install:
	cd frontend && npm install
	cd backend && uv sync

dev:
	make -j2 dev-frontend dev-backend

dev-frontend:
	cd frontend && npm run dev

dev-backend:
	cd backend && uv run uvicorn main:app --reload
