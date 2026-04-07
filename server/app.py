import uvicorn
from openenv.core.env_server import create_fastapi_app
from assignment_deadline_env.env import AssignmentDeadlineEnv

# Create the app instance for the framework to find
app = create_fastapi_app(AssignmentDeadlineEnv())

def main():
    """Main entry point for starting the environment server."""
    uvicorn.run(app, host="0.0.0.0", port=8000)

if __name__ == "__main__":
    main()
