"""Port availability checks using socket.bind."""
import socket
import errno
from typing import Any


def check_ports(required: list[int]) -> list[dict[str, Any]]:
    results = []
    for port in required:
        results.append(_check_port(port))
    return results


def _check_port(port: int) -> dict[str, Any]:
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as sock:
        try:
            sock.bind(("", port))
            return {
                "name": f"Port {port}",
                "category": "ports",
                "status": "passed",
                "message": f"Port {port} is free",
            }
        except OSError as error:
            if error.errno != errno.EADDRINUSE:
                return {
                    "name": f"Port {port}",
                    "category": "ports",
                    "status": "failed",
                    "message": f"Could not test port {port}: {error}",
                    "suggestion": "Check local networking permissions and try again",
                }
            return {
                "name": f"Port {port}",
                "category": "ports",
                "status": "failed",
                "message": f"Port {port} is already in use",
                "suggestion": f"Stop the process using port {port} before starting this project",
            }
