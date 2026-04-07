# Meta OpenEnv Assignment Deadline Manager

[![OpenEnv Compatible](https://img.shields.io/badge/OpenEnv-Compatible-green)](https://github.com/meta-pytorch/OpenEnv)
[![Python 3.10+](https://img.shields.io/badge/python-3.10+-blue.svg)](https://www.python.org/downloads/)
[![Docker Ready](https://img.shields.io/badge/Docker-Ready-blue)](https://www.docker.com/)

A standardized **OpenEnv** execution environment designed to evaluate an AI agent's ability to prioritize, plan, and manage time effectively against academic deadlines.

## Problem Statement
Time management is a critical cognitive skill. Students often struggle to balance high-impact, long-term projects against urgent but lower-value tasks. This environment provides a realistic "Student’s Dilemma" simulator to benchmark how well AI agents can navigate complex resource trade-offs, varying energy levels, and high-stress periods like exam weeks.

## Environment Overview
The **Assignment Deadline Manager** presents an agent with a set of academic tasks. Each task has unique constraints:
- **Available Hours:** A strictly limited pool of study time.
- **Energy Context:** Influences the agent's ability to handle high-difficulty tasks.
- **Cognitive Load:** Penalties for multitasking (context switching) between too many subjects.

The agent must not only select *which* tasks to complete but also decide *how many hours* to allocate to each, ensuring they meet the minimum required effort for a successful submission.

### Observation Space (JSON Example)
The agent receives a rich state context:
```json
{
  "tasks": [
    {
      "id": 1,
      "title": "Final Thesis",
      "deadline_hours": 24,
      "difficulty": 5,
      "estimated_time": 10,
      "importance": 5
    }
  ],
  "available_hours": 12,
  "energy_level": "low",
  "time_of_day": "night",
  "exam_week": true
}
```

### Action Space (JSON Example)
The agent must provide a selection and a specific time allocation:
```json
{
  "selected_task_ids": [2, 3, 4],
  "time_allocation": {
    "2": 4,
    "3": 4,
    "4": 4
  }
}
```

---

## Task Scenarios
The environment includes three curated benchmarks:
1. **Easy:** 2 tasks, 6 hours. One clearly urgent decision.
2. **Medium:** 4 tasks, 10 hours. Includes a "Trap" project (high importance but too long to finish alone).
3. **Hard (Exam Week):** 5-6 tasks, 12 hours. Extreme trade-offs required; agents must sacrifice a major project to save multiple mid-tier labs.

---

## Reward Function: Precision Scoring
The environment uses a non-linear, multi-factor reward system (0.0 to 1.0):
- **Importance (70%):** Sum of importance of completed tasks (allocation must be ≥ estimated time).
- **Efficiency (30%):** Weighted by how well the agent stayed within the available hours.
- **Urgency Penalty:** Heavy hits for missing high-importance tasks with imminent deadlines.
- **Cognitive Penalties:** Deductions for excessive context switching (> 3 tasks) or over-fatigue (> 2 hard tasks).

---

## OpenEnv API Compliance
This project strictly follows the Gymnasium-style interface required by the OpenEnv framework:
- `reset()`: Initializes a new episode with student context and tasks.
- `step(action)`: Evaluates the selection/allocation and returns the final reward.
- `state()`: Returns the full internal environment state.

---

## Setup & Usage

### 1. Installation
```bash
pip install -r assignment_deadline_env/requirements.txt
```

### 2. Configure Credentials
Set your model provider details (OpenAI or Hugging Face):
```bash
export API_BASE_URL="https://router.huggingface.co/v1"
export MODEL_NAME="your-model-id"
export HF_TOKEN="your-api-key"
```

### 3. Run Evaluation
```bash
python inference.py
```

### 4. Docker Deployment
```bash
docker build -t assignment-deadline-manager .
docker run -e HF_TOKEN=$HF_TOKEN assignment-deadline-manager
```

### 5. Validation
To verify the environment structure:
```bash
openenv validate
```

---

## Why this matters for AI Training
This environment is a benchmark for **Resource-Constrained Optimization**. Unlike simple Q&A tasks, it requires agents to understand:
1. **Risk Assessment:** Is it worth starting a task I might not finish?
2. **Prioritization:** Which task yields the highest ROI for my remaining energy?
3. **Planning:** How do I allocate hours to avoid catastrophic failure in exam week?

It is an ideal testbed for evaluating LLM reasoning, agentic planning, and assistant-style tool use.
