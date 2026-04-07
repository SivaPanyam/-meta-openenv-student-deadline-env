# Assignment Deadline Environment (OpenEnv) - Project Overview

## Overview
The `assignment-deadline-env` is a standardized OpenEnv environment designed for training and evaluating reinforcement learning (RL) agents in the context of academic time management. It simulates a 48-hour period where an agent must prioritize and complete multiple assignments, each with its own deadline and difficulty level.

## Folder Structure
```text
Meta/
├── assignment-deadline-env/
│   ├── env.py              # Core logic for reset, step, state
│   ├── models.py           # Action, Observation, and State Pydantic models
│   ├── tasks.py            # Task definitions and generators
│   ├── grader.py           # Scoring logic for evaluation
│   ├── inference.py        # Demo agent implementation
│   ├── openenv.yaml        # OpenEnv manifest configuration
│   ├── Dockerfile          # Environment containerization
│   ├── requirements.txt    # Python dependencies
│   ├── README.md           # Documentation and usage guide
│   └── __init__.py         # Package initialization
└── GEMINI.md               # Context for the AI agent
```

## Architecture
This project follows the **OpenEnv standardized framework**, which leverages a Gymnasium-style API (`reset`, `step`, `state`) served via FastAPI and containerized using Docker.

## Getting Started

### Development Environment Setup
To set up the local development environment:
```powershell
# Create a virtual environment
python -m venv venv
.\venv\Scripts\activate

# Install dependencies
pip install -r .\assignment-deadline-env\requirements.txt
```

### Running the Demo
To execute the baseline greedy agent:
```powershell
python .\assignment-deadline-env\inference.py
```

### Deployment & Serving
To serve the environment locally:
```powershell
uvicorn openenv.server.app:app --host 0.0.0.0 --port 8000
```
