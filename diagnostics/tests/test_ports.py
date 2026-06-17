import errno
from unittest.mock import MagicMock, patch

from diagnostics.checks.ports import check_ports


@patch("diagnostics.checks.ports.socket.socket")
def test_available_port_passes(socket_factory):
    sock = MagicMock()
    socket_factory.return_value.__enter__.return_value = sock
    assert check_ports([3000])[0]["status"] == "passed"
    sock.bind.assert_called_once_with(("", 3000))


@patch("diagnostics.checks.ports.socket.socket")
def test_occupied_port_fails(socket_factory):
    sock = MagicMock()
    sock.bind.side_effect = OSError(errno.EADDRINUSE, "Address already in use")
    socket_factory.return_value.__enter__.return_value = sock
    assert check_ports([5432])[0]["status"] == "failed"
