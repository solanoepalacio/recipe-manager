"""Tests for require_yes() — CLI-05: --yes guard for destructive commands."""

import json

import click
import pytest

from rmapi.utils import require_yes


def test_yes_true_returns_immediately():
    """With --yes flag, require_yes returns without error."""
    require_yes(True)  # Should not raise


def test_no_yes_non_tty_exits_4():
    """Without --yes on non-TTY stdin, exits 4 with JSON stderr."""
    with pytest.raises(SystemExit) as exc_info:
        require_yes(False)
    assert exc_info.value.code == 4


def test_no_yes_non_tty_json_stderr(runner):
    """Without --yes, the JSON error message goes to stderr."""
    from rmapi.cli import cli

    @cli.command("_test_yes")
    @click.option("--yes", is_flag=True, default=False)
    def _test_yes(yes):
        require_yes(yes)
        click.echo("OK")

    result = runner.invoke(cli, ["_test_yes"])
    assert result.exit_code == 4
    error = json.loads(result.stderr)
    assert error["code"] == "confirmation_required"
    assert error["status"] == 400
    assert result.stdout.strip() == ""  # Nothing on stdout

    # With --yes, succeeds
    result2 = runner.invoke(cli, ["_test_yes", "--yes"])
    assert result2.exit_code == 0
    assert result2.output.strip() == "OK"

    # Cleanup
    cli.commands.pop("_test_yes", None)
