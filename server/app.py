import uvicorn
import os
from typing import Dict, List, Literal
from fastapi import FastAPI
from fastapi import HTTPException
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel, Field
from openenv.core.env_server import HTTPEnvServer
from assignment_deadline_env.env import AssignmentDeadlineEnv
from assignment_deadline_env.models import Action, Observation
from assignment_deadline_env.models import Task
from assignment_deadline_env.grader import AssignmentGrader, compute_reward

# Create FastAPI app
app = FastAPI(title="Student Assignment Manager", version="1.0.0")

# Initialize the OpenEnv HTTP Server and register routes
server = HTTPEnvServer(
    env=AssignmentDeadlineEnv,
    action_cls=Action,
    observation_cls=Observation
)

# Register the server routes on the app
server.register_routes(app)

STATIC_DIR = os.path.join(os.path.dirname(__file__), "static")
app.mount("/static", StaticFiles(directory=STATIC_DIR), name="static")

# Add a health check endpoint
@app.get("/")
def health_check():
    return FileResponse(os.path.join(STATIC_DIR, "index.html"))


class CustomContext(BaseModel):
    available_hours: int = Field(gt=0, le=24)
    energy_level: Literal["low", "medium", "high"]
    time_of_day: Literal["morning", "afternoon", "night"]
    exam_week: bool


class CustomAction(BaseModel):
    selected_task_ids: List[int]
    time_allocation: Dict[str, int]


class CustomSimulationRequest(BaseModel):
    context: CustomContext
    tasks: List[Task]
    action: CustomAction


@app.post("/simulate/custom")
def simulate_custom(payload: CustomSimulationRequest):
    if not payload.tasks:
        raise HTTPException(status_code=400, detail="At least one task is required.")

    task_ids = [task.id for task in payload.tasks]
    if len(task_ids) != len(set(task_ids)):
        raise HTTPException(status_code=400, detail="Task IDs must be unique.")

    unknown_selected = [tid for tid in payload.action.selected_task_ids if tid not in set(task_ids)]
    if unknown_selected:
        raise HTTPException(
            status_code=400,
            detail=f"Selected task IDs not found in task list: {unknown_selected}",
        )

    normalized_alloc: Dict[int, int] = {}
    for task_id_raw, hours in payload.action.time_allocation.items():
        try:
            task_id_int = int(task_id_raw)
        except ValueError:
            raise HTTPException(status_code=400, detail=f"Invalid task ID key: {task_id_raw}")

        if hours <= 0:
            raise HTTPException(status_code=400, detail="Allocated hours must be > 0.")
        normalized_alloc[task_id_int] = int(hours)

    grader = AssignmentGrader(
        available_hours=payload.context.available_hours,
        tasks=payload.tasks,
    )

    score = grader.compute_score(
        selected_task_ids=payload.action.selected_task_ids,
        time_allocation=normalized_alloc,
    )
    reward_obj = compute_reward(score, is_done=True)

    return {
        "tasks": [task.model_dump() for task in payload.tasks],
        "available_hours": payload.context.available_hours,
        "energy_level": payload.context.energy_level,
        "time_of_day": payload.context.time_of_day,
        "exam_week": payload.context.exam_week,
        "done": True,
        "reward": reward_obj.reward,
        "metadata": {
            "score": score,
            "mode": "custom",
            "selected_task_ids": payload.action.selected_task_ids,
            "time_allocation": normalized_alloc,
        },
    }

def main():
    """Starts the server on Port 7860 for Hugging Face Spaces."""
    port = int(os.environ.get("PORT", 7860))
    uvicorn.run(app, host="0.0.0.0", port=port, log_level="info")

if __name__ == "__main__":
    main()
