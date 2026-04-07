from assignment_deadline_env.env import AssignmentDeadlineEnv
from assignment_deadline_env.models import Action
import json

def test_environment():
    # 1. Initialize and Import
    print("--- 1. Initializing Environment ---")
    env = AssignmentDeadlineEnv(scenario_name="easy")
    
    # 2. Call reset()
    print("\n--- 2. Resetting Environment ---")
    obs = env.reset()
    
    # 3. Print the observation
    print(f"Initial Observation: Available Hours = {obs.available_hours}")
    for task in obs.tasks:
        print(f"  Task ID {task.id}: {task.title} (Deadline: {task.deadline_hours}h, Time: {task.estimated_time}h)")

    # 4. Take a sample valid action (Selecting both tasks in 'easy' scenario)
    print("\n--- 3. Taking Sample Action ---")
    sample_action = Action(selected_task_ids=[1, 2])
    print(f"Action: selected_task_ids={sample_action.selected_task_ids}")
    
    # 5. Call step(action)
    result = env.step(sample_action)
    
    # 6. Print Results
    print("\n--- 4. Step Results ---")
    print(f"New Observation: Available Hours = {result.observation.available_hours} (One-shot environment)")
    print(f"Reward: {result.reward:.2f} (Expected: 0.0 - 1.0)")
    print(f"Done: {result.done} (Type: {type(result.done).__name__})")
    print(f"Info: {json.dumps(result.info)}")

    # Basic Validation
    assert 0.0 <= result.reward <= 1.0, f"Reward {result.reward} out of range!"
    assert isinstance(result.done, bool), "Done flag must be a boolean!"
    print("\nVerification Successful: Environment behaves as expected.")

if __name__ == "__main__":
    try:
        test_environment()
    except Exception as e:
        print(f"\nVerification Failed: {e}")
