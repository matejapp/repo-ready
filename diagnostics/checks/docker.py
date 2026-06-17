"""Docker availability check."""
import subprocess
import sys
from typing import Any


def check_docker() -> dict[str, Any]:
    try:
        result = subprocess.run(
            ["docker", "info"],
            stdout=subprocess.DEVNULL,
            stderr=subprocess.DEVNULL,
            timeout=10,
        )
        if result.returncode == 0:
            return {
                "name": "Docker",
                "category": "services",
                "status": "passed",
                "message": "Docker is running",
            }
        return {
            "name": "Docker",
            "category": "services",
            "status": "failed",
            "message": "Docker is not running",
            "suggestion": "Start Docker Desktop or run: sudo systemctl start docker",
        }
    except FileNotFoundError:
        return {
            "name": "Docker",
            "category": "services",
            "status": "failed",
            "message": "Docker is not installed",
            "suggestion": "Install Docker from https://docs.docker.com/get-docker/",
        }
    except subprocess.TimeoutExpired:
        return {
            "name": "Docker",
            "category": "services",
            "status": "failed",
            "message": "Docker check timed out",
            "suggestion": "Docker may be unresponsive — try restarting Docker Desktop",
        }
