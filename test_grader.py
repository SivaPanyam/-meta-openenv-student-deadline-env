from assignment_deadline_env.grader import AssignmentGrader
from assignment_deadline_env.models import Task

def test_grader():
    # Setup sample tasks
    tasks = [
        Task(id=1, title="Urgent Task", deadline_hours=4, difficulty=3, estimated_time=2, importance=5),
        Task(id=2, title="Important Task", deadline_hours=24, difficulty=4, estimated_time=5, importance=4),
        Task(id=3, title="Optional Task", deadline_hours=48, difficulty=2, estimated_time=3, importance=2),
    ]
    available_hours = 10
    grader = AssignmentGrader(available_hours=available_hours, tasks=tasks)
    
    # In the new advanced grader, total importance is 5 + 4 + 2 = 11.
    # Score has 4 components: Importance(0.5) + Urgency(0.2) + Efficiency(0.2) + Fatigue(0.1)
    print("--- Testing Advanced AssignmentGrader ---")

    # 1. Perfect Action Simulation
    score_optimal = grader.compute_score([1, 2], {1: 2, 2: 5})
    print(f"Optimal Action Score: {score_optimal:.2f}")
    assert score_optimal > 0.8, "Optimal action should score high"

    # 2. Miss Urgent Task
    score_miss_urgent = grader.compute_score([2, 3], {2: 5, 3: 3})
    print(f"Miss Urgent Task Score: {score_miss_urgent:.2f}")
    assert score_miss_urgent < score_optimal, "Missing urgent task should lower score"

    # 3. Overtime Penalty
    score_overtime = grader.compute_score([1, 2, 3], {1: 2, 2: 5, 3: 5})
    print(f"Exceeding Time Score: {score_overtime:.2f}")
    assert score_overtime < score_optimal, "Overtime should lower score"

    # 4. Context Switching Penalty (More than 3 tasks)
    # We only have 3 tasks here, let's test determinism
    score_1 = grader.compute_score([1, 2], {1: 2, 2: 5})
    score_2 = grader.compute_score([1, 2], {1: 2, 2: 5})
    assert score_1 == score_2, "Output must be deterministic"

    print("\nGrader validation successful: All scoring rules and penalties working as expected.")

if __name__ == "__main__":
    try:
        test_grader()
    except Exception as e:
        print(f"\nGrader Validation Failed: {e}")
        import traceback
        traceback.print_exc()
