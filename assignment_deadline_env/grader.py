from typing import List, Dict, Any, Set
from .models import Task, Reward

class AssignmentGrader:
    def __init__(self, available_hours: int, tasks: List[Task]):
        self.available_hours = available_hours
        self.tasks_dict = {task.id: task for task in tasks}
        self.total_importance = sum(task.importance for task in tasks)

    def compute_score(self, selected_task_ids: List[int], time_allocation: Dict[int, int]) -> float:
        if not selected_task_ids: return 0.0
        selected_set = set(selected_task_ids)
        
        # 1. Binary Completion Check
        completed_importance = 0
        total_difficult_tasks = 0
        for tid in selected_set:
            if tid in self.tasks_dict:
                task = self.tasks_dict[tid]
                allocated = time_allocation.get(tid, 0)
                if allocated >= task.estimated_time:
                    completed_importance += task.importance
                    if task.difficulty >= 4: total_difficult_tasks += 1

        # 2. Importance Score
        importance_score = (completed_importance / self.total_importance) if self.total_importance > 0 else 0.0
        
        # 3. Urgency Penalty
        urgency_penalty = 0.0
        for tid, task in self.tasks_dict.items():
            if task.deadline_hours <= 12 and task.importance >= 4 and tid not in selected_set:
                urgency_penalty += 0.15

        # 4. Efficiency & Overage
        total_time = sum(time_allocation.values())
        if total_time > self.available_hours:
            overage_penalty = (total_time - self.available_hours) / self.available_hours
            efficiency_score = max(0.0, 1.0 - (overage_penalty * 2))
        else:
            efficiency_score = 1.0

        # 5. Cognitive Load
        switching_cost = max(0.0, (len(selected_set) - 3) * 0.1)
        fatigue_cost = max(0.0, (total_difficult_tasks - 2) * 0.1)

        # Final Scoring
        final = (importance_score * 0.7) + (efficiency_score * 0.3)
        final = final - urgency_penalty - switching_cost - fatigue_cost
        
        return round(max(0.0, min(1.0, final)), 2)

def compute_reward(score: float, is_done: bool) -> Reward:
    return Reward(reward=score if is_done else 0.0)
