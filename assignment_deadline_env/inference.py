from env import AssignmentDeadlineEnv
from models import Action
import time

def run_agent(env: AssignmentDeadlineEnv):
    """A simple greedy agent that completes the task with the earliest deadline."""
    obs = env.reset()
    print(f"Starting Environment: {obs.message}")
    
    done = False
    while not done:
        # Simple policy: pick the pending task with the nearest deadline
        pending = sorted(obs.pending_tasks, key=lambda x: x.deadline)
        
        if pending:
            target_task = pending[0]
            print(f"[{obs.current_time}] Target Task: {target_task.id} (Deadline: {target_task.deadline})")
            
            action = Action(command="complete_task", args={"task_id": target_task.id})
            result = env.step(action)
            obs = result.observation
            done = result.done
            print(f"Result: {obs.message} | Current Score: {obs.score}")
        else:
            # No tasks, just step to time out
            result = env.step(Action(command="wait"))
            obs = result.observation
            done = result.done
    
    print("Agent Finished.")
    print(f"Final Score: {obs.score}")

if __name__ == "__main__":
    env = AssignmentDeadlineEnv()
    run_agent(env)
