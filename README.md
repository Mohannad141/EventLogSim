# EventLogSim

<div align="center">

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Python](https://img.shields.io/badge/Python-3.12%2B-blue?logo=python&logoColor=white)](https://www.python.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.136%2B-009688?logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com/)
[![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=black)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-6-646CFF?logo=vite&logoColor=white)](https://vite.dev/)
[![TailwindCSS](https://img.shields.io/badge/Tailwind_CSS-v4-38B2AC?logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-336791?logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![LangChain](https://img.shields.io/badge/LangChain%20%2F%20LangGraph-Integrated-1C3C3C?logo=langchain&logoColor=white)](https://www.langchain.com/)

**An LLM-powered platform for generating synthetic event logs for process mining and business process simulation.**

*Developed as part of the Practical Course (Praktikum) at the University of Bayreuth.*

</div>

---

## 📌 Academic Context & Overview

Modern process mining research and benchmark evaluation frequently face data scarcity and privacy constraints with real-world event logs. **EventLogSim** bridges this gap by leveraging Large Language Models (LLMs) and multi-agent coordination to simulate realistic business processes. 

By modeling individual agents (actors) with distinct personas, domain knowledge, and behavioral attributes, EventLogSim executes business process workflows (including BPMN models) to produce rich, context-aware synthetic event logs.

> 🎓 **Academic Project**: This project was conceived and implemented as part of the **Practical Course (Master's / Practical Project)** at the **University of Bayreuth (Universität Bayreuth)**.

---

## ✨ Key Features

- **🤖 Multi-Agent LLM Simulation**:
  - Configure agents with distinct roles, expertise, and behavioral guidelines.
  - Multi-provider support (OpenAI, Google Gemini, DeepSeek) powered by LangChain & LangGraph.
- **🔄 BPMN 2.0 & Workflow Parsing**:
  - Direct ingestion and execution of BPMN process definitions (`userTask`, `exclusiveGateway`, `parallelGateway`, end branches).
  - Dynamic branching and decision-making driven by agent context.
- **📊 Dynamic Attribute & State Modeling**:
  - Define custom case-level and event-level attributes that evolve dynamically across simulation steps.
  - Flexible data validation and state persistence.
- **📈 Interactive Analytics & Visualizations**:
  - **Trace Variant Analysis**: Explore frequent and rare execution paths.
  - **Distribution Charts**: Analyze event frequencies, duration metrics, and attribute values via interactive Recharts.
  - **Comprehensive Log Inspector**: Search, filter, and inspect granular simulation logs.
- **💾 Export & Interoperability**:
  - Generate standard event logs formatted for process mining tools (e.g., Disco, ProM, Celonis).
- **⚡ Modern Full-Stack Architecture**:
  - Responsive, dark-mode-ready UI built with React 19 and Tailwind CSS 4.
  - High-performance asynchronous backend powered by FastAPI, SQLAlchemy, and async PostgreSQL connection pooling.

---

<!--
## 📸 Screenshots & Demo
> *Add your application screenshots or demo GIFs here*
>
> | Simulation Configuration | Analytics Dashboard |
> | :---: | :---: |
> | ![Configuration Wizard](docs/images/config_wizard.png) | ![Analytics](docs/images/analytics.png) |
-->

---

## 🛠️ Tech Stack

### Frontend
- **Framework**: [React 19](https://react.dev/) + [Vite 6](https://vite.dev/)
- **Styling**: [Tailwind CSS 4](https://tailwindcss.com/)
- **Routing**: [React Router 7](https://reactrouter.com/)
- **Charts & Visualization**: [Recharts](https://recharts.org/)
- **Icons**: [Lucide React](https://lucide.dev/)

### Backend & Simulation
- **API Framework**: [FastAPI](https://fastapi.tiangolo.com/) (Python)
- **Agent & LLM Framework**: [LangChain](https://www.langchain.com/) & [LangGraph](https://langchain-ai.github.io/langgraph/)
- **Data & XML Processing**: [Pandas](https://pandas.pydata.org/), [lxml](https://lxml.de/) (BPMN parsing), [Pydantic](https://docs.pydantic.dev/)
- **Database & ORM**: [PostgreSQL](https://www.postgresql.org/) with [SQLAlchemy 2.0](https://www.sqlalchemy.org/) & `asyncpg`
- **Package Management**: [uv](https://github.com/astral-sh/uv)

---

## 📁 Repository Structure

```text
.
├── backend/
│   ├── db/                   # Database models, migrations, & session management
│   ├── evaluation/           # Evaluation metrics & benchmark scripts
│   ├── examples/             # Example BPMN models & simulation configurations
│   ├── routers/              # FastAPI endpoints (runs, chat, simulation)
│   ├── schema/               # Pydantic schemas for requests/responses
│   ├── simulation_engine/    # Multi-agent orchestrator, BPMN parser, LLM factory
│   ├── main.py               # FastAPI application entrypoint
│   └── pyproject.toml        # Backend dependencies (managed with uv)
├── frontend/
│   ├── src/
│   │   ├── components/       # UI components (wizard, layout, analytics, primitives)
│   │   ├── hooks/            # Custom React hooks & context providers
│   │   ├── pages/            # Page-level route views
│   │   ├── lib/ & utils/     # API clients, helpers, & validators
│   │   └── App.jsx           # Root application component
│   ├── package.json          # Frontend dependencies & scripts
│   └── vite.config.js        # Vite configuration
├── docker-compose.yml        # PostgreSQL database service container
├── Makefile                  # Helper commands for quick setup and execution
└── README.md
```

---

## 🚀 Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (v18 or higher recommended) & [npm](https://www.npmjs.com/)
- [Docker & Docker Compose](https://www.docker.com/) (for PostgreSQL database)
- [uv](https://github.com/astral-sh/uv) (recommended Python package manager) or Python 3.12+

---

### Installation & Setup

1. **Clone the repository**:
   ```bash
   git clone https://github.com/Mohannad141/EventLogSim.git
   cd EventLogSim
   ```

2. **Start the database (PostgreSQL)**:
   In the root directory, start the database container:
   ```bash
   docker compose up -d
   ```

3. **Install dependencies**:
   Using the root Makefile:
   ```bash
   make install
   ```
   *(Or manually run `npm install` inside `frontend/` and `uv sync` inside `backend/`)*.

4. **Configure environment variables**:
   Create a `.env` file inside the `backend/` directory:
   ```bash
   cd backend
   cp .env.example .env
   ```
   Configure your `.env` file with your credentials:
   ```env
   # Database connection
   DATABASE_URL=postgresql+asyncpg://db_user:db_password@localhost:5432/eventlogsim

   # LLM Provider API Keys (add at least one)
   OPENAI_API_KEY=your_openai_api_key_here
   # GOOGLE_API_KEY=your_google_api_key_here
   # DS_API_KEY=your_deepseek_api_key_here
   ```

---

### Running the Application

1. **Start Frontend and Backend together**:
   From the project root:
   ```bash
   make dev
   ```
   - **Frontend**: [http://localhost:5173](http://localhost:5173)
   - **Backend API Docs**: [http://localhost:8000/docs](http://localhost:8000/docs)

2. **Or start services individually**:
   - **Backend**:
     ```bash
     cd backend
     uv run uvicorn main:app --reload
     ```
   - **Frontend**:
     ```bash
     cd frontend
     npm run dev
     ```

---

## 👥 Contributors & Acknowledgments

This project was developed by team members as part of the **Practical Course** at the **University of Bayreuth**:

- **Mohannad** ([@Mohannad141](https://github.com/Mohannad141))
- **Fevzi Tekinalp**
- **Flavia M.**

Special thanks to the course instructors and supervisors at the University of Bayreuth for their guidance throughout the project.

---

## 📄 License

This project is licensed under the [MIT License](LICENSE).
