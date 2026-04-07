from assignment_deadline_env.env import AssignmentDeadlineEnv
from assignment_deadline_env.models import Action
from assignment_deadline_env.tasks import get_scenarios

def test_all_scenarios():
    scenarios = get_scenarios()
    scenario_names = ["easy", "medium", "hard"]
    
    # 1. Validate all 3 scenarios exist in the data
    print(f"--- 1. Validating Scenario Existence ---")
    for name in scenario_names:
        assert name in scenarios, f"Scenario '{name}' missing from tasks.py!"
    print(f"Found all {len(scenario_names)} required scenarios: {scenario_names}")

    # 2. Loop through and test each environment
    print("\n--- 2. Testing Environment Scenarios ---")
    env = AssignmentDeadlineEnv()
    
    for name in scenario_names:
        print(f"\nTesting Scenario: {name.upper()}")
        
        # Reset environment for this specific scenario
        obs = env.reset(scenario_name=name)
        print(f"  - Reset successful. Available hours: {obs.available_hours}")
        
        # Simulate a valid action using the optimal IDs provided in the scenario
        optimal_ids = scenarios[name]["optimal_task_ids"]
        # Create a mock time_allocation using the estimated_time for each optimal task
        time_allocation = {task.id: task.estimated_time for task in obs.tasks if task.id in optimal_ids}
        
        action = Action(selected_task_ids=optimal_ids, time_allocation=time_allocation)
        print(f"  - Action taken: selected_task_ids={optimal_ids}, time_allocation={time_allocation}")
        
        # Call step()
        result = env.step(action)
        
        # Validate and print reward
        reward = result.reward if result.reward is not None else 0.0
        print(f"  - Reward received: {reward:.2f}")
        print(f"  - Done flag: {result.done}")
        
        assert 0.0 <= reward <= 1.0, f"Error: Reward {reward} for scenario '{name}' is out of range (0.0 - 1.0)!"
        assert result.done is True, f"Error: Environment for scenario '{name}' should be 'done' after one step."

    print("\nAll tasks in tasks.py validated successfully: No crashes, rewards in range.")

if __name__ == "__main__":
    try:
        test_all_scenarios()
    except Exception as e:
        print(f"\nValidation Failed: {e}")
        import traceback
        traceback.print_exc()
