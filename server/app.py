import uvicorn
import os
from openenv.core.env_server import HTTPEnvServer
from assignment_deadline_env.env import AssignmentDeadlineEnv

# Initialize the standard OpenEnv HTTP Server
server = HTTPEnvServer(env_cls=AssignmentDeadlineEnv)
app = server.app

def main():
    """Starts the server on Port 7860 for Hugging Face Spaces."""
    port = int(os.environ.get("PORT", 7860))
    uvicorn.run(app, host="0.0.0.0", port=port, log_level="info")

if __name__ == "__main__":
    main()
