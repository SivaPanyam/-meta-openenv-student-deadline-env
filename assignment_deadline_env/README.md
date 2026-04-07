# Assignment Deadline Environment (OpenEnv)

A standardized OpenEnv environment for training and evaluating agents in time-sensitive academic task management.

## Environment Overview
In this environment, an agent must complete various assignments before their respective deadlines. Each action takes an hour of environment time, and the agent must strategically prioritize tasks based on deadlines and difficulty (reward).

### Features
- **Time Dynamics:** Real-time simulation where each step advances the clock.
- **Dynamic Task Load:** Various tasks with different deadlines and difficulty levels.
- **Agent Evaluation:** Specialized grader to measure both task completion and time efficiency.

## File Structure
- `env.py`: Core logic for `AssignmentDeadlineEnv` (subclass of `openenv.Environment`).
- `models.py`: Pydantic models for actions, observations, and environment state.
- `tasks.py`: Helper functions to generate or retrieve task definitions.
- `grader.py`: Evaluator to grade agent performance at the end of an episode.
- `inference.py`: A greedy agent implementation demonstrating basic interaction.
- `openenv.yaml`: Metadata manifest for the environment.
- `Dockerfile`: Standardized container for serving the environment via FastAPI.
- `requirements.txt`: Project dependencies.

## Getting Started
1. **Installation:**
   ```bash
   pip install -r requirements.txt
   ```
2. **Run Demo Agent:**
   ```bash
   python inference.py
   ```
3. **Serve Locally:**
   ```bash
   uvicorn openenv.server.app:app --host 0.0.0.0 --port 8000
   ```
