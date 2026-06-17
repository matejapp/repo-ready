"""Database URL format check using urllib.parse."""
import os
from urllib.parse import urlparse
from typing import Any

SCHEME_MAP = {
    "postgres": ["postgres", "postgresql"],
    "mysql": ["mysql"],
    "mongodb": ["mongodb", "mongodb+srv"],
    "redis": ["redis", "rediss"],
}


def check_database(url_env: str, db_type: str) -> dict[str, Any]:
    url_value = os.environ.get(url_env)

    if not url_value:
        return {
            "name": f"Database URL ({url_env})",
            "category": "database",
            "status": "skipped",
            "message": f"{url_env} is not set — database URL check skipped",
        }

    try:
        parsed = urlparse(url_value)
    except Exception as e:
        return {
            "name": f"Database URL ({url_env})",
            "category": "database",
            "status": "failed",
            "message": f"Could not parse {url_env}: {e}",
        }

    scheme = parsed.scheme.lower() if parsed.scheme else ""
    expected_schemes = SCHEME_MAP.get(db_type, [])

    if not scheme:
        return {
            "name": f"Database URL ({url_env})",
            "category": "database",
            "status": "failed",
            "message": f"{url_env} has no URL scheme — expected {db_type}://...",
            "suggestion": f"Set {url_env} to a valid {db_type} connection URL",
        }

    if scheme not in expected_schemes:
        return {
            "name": f"Database URL ({url_env})",
            "category": "database",
            "status": "failed",
            "message": f"{url_env} scheme '{scheme}://' does not match type '{db_type}'",
            "suggestion": f"Expected one of: {', '.join(expected_schemes)}://...",
        }

    if not parsed.hostname:
        return {
            "name": f"Database URL ({url_env})",
            "category": "database",
            "status": "failed",
            "message": f"{url_env} is missing a hostname",
            "suggestion": f"Set {url_env} to a complete {db_type} connection URL",
        }

    return {
        "name": f"Database URL ({url_env})",
        "category": "database",
        "status": "passed",
        "message": f"{url_env} has a valid {db_type} URL format",
    }
