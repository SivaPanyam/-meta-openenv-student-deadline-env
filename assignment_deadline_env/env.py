from openenv.core.env_server import Environment
from .models import Action, Observation, Reward
from .tasks import get_scenarios
from .grader import AssignmentGrader, compute_reward
from typing import Dict, Any, Optional

class AssignmentDeadlineEnv(Environment):
    """
    Advanced OpenEnv environment for the AI Assignment Deadline Manager.
    Simulates student time-management decisions under realistic constraints.
    """
    def __init__(self, scenario_name: str = "medium"):
        self.scenarios = get_scenarios()
        self.scenario_name = scenario_name
        self.current_scenario: Optional[Dict[str, Any]] = None
        self.grader: Optional[AssignmentGrader] = None
        self.is_done = False

    def reset(self, seed: Optional[int] = None, episode_id: Optional[str] = None, **kwargs: Any) -> Observation:
        """Loads a scenario and returns the initial observation with student context."""
        scenario_name = kwargs.get("scenario_name", self.scenario_name)
        if scenario_name in self.scenarios:
            self.scenario_name = scenario_name
            
        self.current_scenario = self.scenarios[self.scenario_name]
        self.grader = AssignmentGrader(
            available_hours=self.current_scenario["available_hours"],
            tasks=self.current_scenario["tasks"]
        )
        self.is_done = False
        
        return Observation(
            tasks=self.current_scenario["tasks"],
            available_hours=self.current_scenario["available_hours"],
            energy_level=self.current_scenario["energy_level"],
            time_of_day=self.current_scenario["time_of_day"],
            exam_week=self.current_scenario["exam_week"],
            done=False,
            reward=None
        )

    def step(self, action: Action, timeout_s: Optional[float] = None, **kwargs: Any) -> Observation:
        """
        Executes the task selection and time allocation action.
        Evaluates the trade-offs between importance, urgency, and fatigue.
        """
        if self.is_done:
            raise RuntimeError("Environment is already done. Please call reset().")

        # 1. Action Validation
        time_alloc = getattr(action, "time_allocation", {})
        selected_ids = getattr(action, "selected_task_ids", [])

        # 2. Compute Score using advanced grader
        score = self.grader.compute_score(
            selected_task_ids=selected_ids,
            time_allocation=time_alloc
        )
        
        self.is_done = True
        
        # 3. Compute Reward
        reward_obj = compute_reward(score, is_done=True)
        
        # 4. Return Final Observation
        return Observation(
            tasks=self.current_scenario["tasks"],
            available_hours=self.current_scenario["available_hours"],
            energy_level=self.current_scenario["energy_level"],
            time_of_day=self.current_scenario["time_of_day"],
            exam_week=self.current_scenario["exam_week"],
            done=True,
            reward=reward_obj.reward,
            metadata={"score": score}
        )

    def state(self) -> Dict[str, Any]:
        """Returns the full internal state, including scenario context."""
        if not self.current_scenario:
            return {}
        return {
            "scenario_name": self.scenario_name,
            "available_hours": self.current_scenario["available_hours"],
            "energy_level": self.current_scenario["energy_level"],
            "time_of_day": self.current_scenario["time_of_day"],
            "exam_week": self.current_scenario["exam_week"],
            "is_done": self.is_done
        }
