from .models import Task
from typing import List, Dict, Any

def get_scenarios() -> Dict[str, Dict[str, Any]]:
    """Returns scenarios designed to differentiate agent reasoning levels."""
    return {
        "easy": {
            "available_hours": 6,
            "energy_level": "high",
            "time_of_day": "morning",
            "exam_week": False,
            "tasks": [
                Task(id=1, title="Critical Quiz", deadline_hours=3, difficulty=2, estimated_time=2, importance=5),
                Task(id=2, title="Short Essay", deadline_hours=48, difficulty=3, estimated_time=3, importance=3)
            ],
            "optimal_task_ids": [1, 2]
        },
        "medium": {
            "available_hours": 10,
            "energy_level": "medium",
            "time_of_day": "afternoon",
            "exam_week": False,
            "tasks": [
                Task(id=1, title="Urgent Distraction", deadline_hours=4, difficulty=1, estimated_time=2, importance=1),
                Task(id=2, title="The 'Trap' Project", deadline_hours=12, difficulty=5, estimated_time=8, importance=5),
                Task(id=3, title="Core Lab A", deadline_hours=24, difficulty=3, estimated_time=4, importance=4),
                Task(id=4, title="Core Lab B", deadline_hours=24, difficulty=3, estimated_time=4, importance=4)
            ],
            "optimal_task_ids": [3, 4]
        },
        "hard": {
            "available_hours": 12,
            "energy_level": "low",
            "time_of_day": "night",
            "exam_week": True,
            "tasks": [
                Task(id=1, title="Main Thesis", deadline_hours=24, difficulty=5, estimated_time=10, importance=5),
                Task(id=2, title="Math Lab", deadline_hours=6, difficulty=4, estimated_time=4, importance=4),
                Task(id=3, title="CS Lab", deadline_hours=12, difficulty=4, estimated_time=4, importance=4),
                Task(id=4, title="Physics Lab", deadline_hours=18, difficulty=4, estimated_time=4, importance=4),
                Task(id=5, title="Quick Post", deadline_hours=4, difficulty=1, estimated_time=1, importance=1)
            ],
            "optimal_task_ids": [2, 3, 4]
        }
    }
