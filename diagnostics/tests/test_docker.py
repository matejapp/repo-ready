from unittest.mock import patch

from diagnostics.checks.docker import check_docker


@patch("diagnostics.checks.docker.subprocess.run")
def test_docker_running(run):
    run.return_value.returncode = 0
    assert check_docker()["status"] == "passed"


@patch("diagnostics.checks.docker.subprocess.run", side_effect=FileNotFoundError)
def test_docker_missing(_run):
    assert check_docker()["status"] == "failed"
