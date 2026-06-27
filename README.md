# EventLogSim

**EventLogSim** is a platform designed to generate synthetic event logs using LLM-powered agents. It enables researchers and developers to configure complex simulation scenarios, model agent behaviors, and produce high-quality datasets for process mining and business process analysis.

##  Overview

Modern process mining requires diverse and high-fidelity event logs for testing and evaluation. EventLogSim bridges the gap between static datasets and real-world complexity by using Large Language Models (LLMs) to simulate how different agents interact within a business process.

##  Key Features

- **Agent Configuration**: Define specialized LLM agents with distinct roles, attributes, and behaviors.
- **Dynamic Attribute Modeling**: Configure essential attributes and data fields that agents track and modify during the process.
- **Process Simulation**: Define process steps and execute simulations to generate realistic event traces.
- **Advanced Analytics**:
  - **Trace Variant Analysis**: Explore unique paths taken during the simulation.
  - **Visual Distribution**: View attribute and event distributions through interactive charts.
  - **Comprehensive Event Logs**: Inspect detailed logs with full attribute history and agent metadata.
- **Interactive UI**: A modern, responsive dashboard built with React and Tailwind CSS.

##  Tech Stack

- **Frontend**: [React 19](https://react.dev/) + [Vite 6](https://vite.dev/)
- **Styling**: [Tailwind CSS 4](https://tailwindcss.com/)
- **Routing**: [React Router 7](https://reactrouter.com/)
- **Charts**: [Recharts](https://recharts.org/)
- **Backend**: [FastAPI](https://fastapi.tiangolo.com/) (Python)
- **Database**: [PostgreSQL](https://www.postgresql.org/) (via [SQLAlchemy](https://www.sqlalchemy.org/) & `asyncpg` connection pool)

##  Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (v18 or higher recommended)
- [npm](https://www.npmjs.com/)
- [Docker & Docker Compose](https://www.docker.com/) (to run PostgreSQL)
- [uv](https://github.com/astral-sh/uv) (recommended Python package manager)

### Installation & Setup

1. **Clone the repository**:
   ```bash
   git clone https://git.inf.uni-bayreuth.de/bt727270/praktikum.git
   cd praktikum
   ```

2. **Start the database (PostgreSQL)**:
   In the root directory, run Docker Compose to spin up the database container:
   ```bash
   docker compose up -d
   ```

3. **Install dependencies**:
   Run the installation recipe from the Makefile in the root directory:
   ```bash
   make install
   ```
   *(Or manually run `npm install` in `frontend/` and `uv sync` in `backend/`)*.

4. **Configure environment variables**:
   Create a `.env` file inside the `backend/` directory:
   ```bash
   cd backend
   cp .env.example .env
   ```
   Edit `backend/.env` and add:
   * Your LLM API key (e.g. `DS_API_KEY`, `OPENAI_API_KEY`, or `GOOGLE_API_KEY`).
   * The database connection URL:
     `DATABASE_URL=postgresql+asyncpg://db_user:db_password@localhost:5432/eventlogsim`

### Running the Application

1. **Start the Development Servers**:
   In the root directory, run:
   ```bash
   make dev
   ```
   This starts both the Vite frontend server (http://localhost:5173) and the FastAPI backend server (http://localhost:8000) concurrently.

2. **Starting Manually (Optional)**:
   * **Backend**:
     ```bash
     cd backend
     uv run uvicorn main:app --reload
     ```
   * **Frontend**:
     ```bash
     cd frontend
     npm run dev
     ```


##  Project Structure

```text
src/
├── components/     # Reusable UI components
│   ├── common/     # Modals, Dialogs, Empty states
│   ├── layout/     # Navigation and containers
│   ├── primitives/ # Core UI elements (Button, Card, etc.)
│   ├── configuration/ # Wizard steps for setup
│   └── runs/       # Simulation result visualizations
├── hooks/          # Custom React hooks & Context providers
├── lib/            # Utility libraries & validation logic
├── pages/          # Main route components
├── utils/          # Helper functions (formatting, storage)
└── data/           # Static data and constants
```

---
*Developed as part of the Practical Course at the University of Bayreuth.*
