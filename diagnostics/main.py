"""Entry point for RepoReady Python diagnostics engine.

Called by TypeScript bridge:
  python3 diagnostics/main.py --config '<json-string>'

Outputs a JSON array of CheckResult objects to stdout.
All logging goes to stderr to keep stdout clean.
Always outputs valid JSON, even on exception.
"""
import argparse
import json
import sys

try:
    from .checks.ports import check_ports
    from .checks.docker import check_docker
    from .checks.database import check_database
except ImportError:
    from checks.ports import check_ports
    from checks.docker import check_docker
    from checks.database import check_database


def main() -> None:
    parser = argparse.ArgumentParser(description="RepoReady diagnostics engine")
    parser.add_argument("--config", required=True, help="JSON-encoded config")
    args = parser.parse_args()

    try:
        config = json.loads(args.config)
    except json.JSONDecodeError as e:
        result = [{
            "name": "Python diagnostics",
            "category": "services",
            "status": "failed",
            "message": f"Invalid config JSON passed to Python engine: {e}",
        }]
        print(json.dumps(result))
        sys.exit(0)

    results = []

    try:
        ports_config = config.get("ports", {})
        if ports_config.get("required"):
            results.extend(check_ports(ports_config["required"]))
    except Exception as e:
        print(f"[repoready] port checks error: {e}", file=sys.stderr)
        results.append({
            "name": "Port checks",
            "category": "ports",
            "status": "failed",
            "message": f"Port check error: {e}",
        })

    try:
        services_config = config.get("services", {})
        docker_config = services_config.get("docker", {})
        if docker_config.get("required"):
            results.append(check_docker())
    except Exception as e:
        print(f"[repoready] docker check error: {e}", file=sys.stderr)
        results.append({
            "name": "Docker",
            "category": "services",
            "status": "failed",
            "message": f"Docker check error: {e}",
        })

    try:
        db_config = config.get("database", {})
        if db_config.get("urlEnv") and db_config.get("type"):
            results.append(check_database(db_config["urlEnv"], db_config["type"]))
    except Exception as e:
        print(f"[repoready] database check error: {e}", file=sys.stderr)
        results.append({
            "name": "Database URL",
            "category": "database",
            "status": "failed",
            "message": f"Database check error: {e}",
        })

    print(json.dumps(results))


if __name__ == "__main__":
    main()
