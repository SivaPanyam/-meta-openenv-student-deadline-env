from pydantic import BaseModel, Field
from typing import List, Dict, Any, Literal
from openenv.core import Action as BaseAction, Observation as BaseObservation
from typing_extensions import Annotated

class Task(BaseModel):
    """Represents an individual AI assignment in the environment."""
    id: int
    title: str
    deadline_hours: int
    difficulty: int
    estimated_time: int
    importance: int

class State(BaseModel):
    """Internal state of the environment."""
    scenario_name: str
    available_hours: int
    energy_level: str
    time_of_day: str
    exam_week: bool
    is_done: bool

class Observation(BaseObservation):
    """Data contract representing the current state of the environment."""
    tasks: List[Task]
    available_hours: int
    energy_level: Literal["low", "medium", "high"]
    time_of_day: Literal["morning", "afternoon", "night"]
    exam_week: bool

class Action(BaseAction):
    """The action taken by the agent in a given step, including time allocation."""
    selected_task_ids: List[int]
    time_allocation: Dict[int, Annotated[int, Field(gt=0)]] = Field(
        default_factory=dict,
        description="Hours allocated to each selected task ID"
    )

class Reward(BaseModel):
    """The numerical feedback returned to the agent after taking an action."""
    reward: float
