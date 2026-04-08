import os
import json
import re
from openai import OpenAI
from assignment_deadline_env.env import AssignmentDeadlineEnv
from assignment_deadline_env.models import Action

# Load environment variables
API_BASE_URL = os.getenv("API_BASE_URL", "https://api.openai.com/v1")
MODEL_NAME = os.getenv("MODEL_NAME", "gpt-3.5-turbo")
HF_TOKEN = os.getenv("HF_TOKEN")

client = OpenAI(base_url=API_BASE_URL, api_key=HF_TOKEN)


def normalize_strict_score(value: float) -> float:
    """Clamp scores to strict open interval (0, 1)."""
    try:
        numeric = float(value)
    except (TypeError, ValueError):
        numeric = 0.5
    return max(0.01, min(0.99, numeric))

def clean_json_output(content):
    """Extracts a JSON object from a string if it's wrapped in markers or explanation."""
    match = re.search(r"\{.*\}", content, re.DOTALL)
    if match:
        return match.group(0)
    return content

def evaluate(scenario_name: str):
    env = AssignmentDeadlineEnv(scenario_name=scenario_name)
    obs = env.reset()
    
    task_name = f"assignment_deadline_{scenario_name}"
    env_name = "AssignmentDeadlineManager"
    
    print(f"[START] task={task_name} env={env_name} model={MODEL_NAME}")
    
    step_num = 1
    total_rewards = []
    error_msg = "null"
    
    # Advanced prompt with context
    task_list = "\n".join([f"ID: {t.id}, {t.title}, Deadline: {t.deadline_hours}h, Time: {t.estimated_time}h, Imp: {t.importance}, Diff: {t.difficulty}" for t in obs.tasks])
    
    prompt = (
        f"Context:\n"
        f"- Available Hours: {obs.available_hours}\n"
        f"- Energy Level: {obs.energy_level}\n"
        f"- Time of Day: {obs.time_of_day}\n"
        f"- Exam Week: {obs.exam_week}\n\n"
        f"Tasks:\n{task_list}\n\n"
        "Instructions:\n"
        "You must select the optimal tasks to complete and allocate time to them.\n"
        "Consider importance, urgency, and fatigue. Be careful not to exceed available hours or multitask too heavily.\n"
        "Respond ONLY with a valid JSON object matching this schema:\n"
        '{"selected_task_ids": [id1, id2], "time_allocation": {"id1": hours, "id2": hours}}\n'
    )

    try:
        response = client.chat.completions.create(
            model=MODEL_NAME,
            messages=[{"role": "user", "content": prompt}],
            temperature=0.0
        )
        content = response.choices[0].message.content.strip()
        cleaned_content = clean_json_output(content)
        action_data = json.loads(cleaned_content)
        
        selected_ids = action_data.get("selected_task_ids", [])
        time_allocation = action_data.get("time_allocation", {})
        
        # Convert keys in time_allocation to integers since JSON keys are strings
        time_allocation = {int(k): v for k, v in time_allocation.items()}
        
        action = Action(selected_task_ids=selected_ids, time_allocation=time_allocation)
        result = env.step(action)
        
        reward = normalize_strict_score(result.reward if result.reward is not None else 0.01)
        done = result.done
        
        # Access metadata from observation. If missing, default to 0.0 score
        metadata = getattr(result, "metadata", {}) or {}
        score = normalize_strict_score(metadata.get("score", reward))
        success = score >= 0.8
        total_rewards.append(reward)
        
        print(f"[STEP] step={step_num} action={selected_ids} reward={reward:.2f} done={str(done).lower()} error={error_msg}")
        
        rewards_str = ",".join([f"{r:.2f}" for r in total_rewards])
        print(f"[END] success={str(success).lower()} steps={step_num} score={score:.2f} rewards={rewards_str}")

    except Exception as e:
        error_msg = str(e).replace("\n", " ")
        safe_reward = normalize_strict_score(0.01)
        print(f"[STEP] step={step_num} action=[] reward={safe_reward:.2f} done=true error={error_msg}")
        print(f"[END] success=false steps={step_num} score={safe_reward:.2f} rewards={safe_reward:.2f}")

if __name__ == "__main__":
    for scenario in ["easy", "medium", "hard"]:
        evaluate(scenario)
