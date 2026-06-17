import json
import subprocess
import sys


def test_main_outputs_check_result_array():
    result = subprocess.run(
        [
            sys.executable,
            "-m",
            "diagnostics.main",
            "--config",
            '{"ports":{"required":[]}}',
        ],
        check=True,
        capture_output=True,
        text=True,
    )
    assert isinstance(json.loads(result.stdout), list)
