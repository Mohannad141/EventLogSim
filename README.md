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
- **Icons**: [Lucide React](https://lucide.dev/)
- **State Management**: React Context & Custom Hooks

##  Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (v18 or higher recommended)
- [npm](https://www.npmjs.com/)

### Installation

1. Clone the repository:
   ```bash
   git clone https://git.inf.uni-bayreuth.de/bt727270/praktikum.git
   cd praktikum
   ```

2. Install dependencies:
   ```bash
   npm install
   cd backend && pip install -e .
   ```

3. Configure environment variables:
   Create a `.env` file in the root directory:
   ```bash
   cp .env.example .env
   ```
   Edit `.env` and add your API keys. EventLogSim supports multiple providers:
   - **DeepSeek**: Set `DS_API_KEY`
   - **OpenAI**: Set `OPENAI_API_KEY`
   - **Google Gemini**: Set `GOOGLE_API_KEY`

   The system will automatically detect and use the available key (prioritizing DeepSeek, then OpenAI, then Gemini).

### Development

1. Start the backend:
   ```bash
   cd backend
   uvicorn main:app --reload
   ```

2. Start the frontend:
   ```bash
   npm run dev
   ```

### Build

Create a production-ready build:
```bash
npm run build
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
