"""Tests for Config.from_env() — CLI-01: env-var auth."""

import json

from rmapi.cli import cli


def test_missing_base_url_exits_1_with_json_stderr(runner):
    """Missing RMAPI_BASE_URL produces JSON error to stderr, exit 1."""
    result = runner.invoke(cli, ["recipes", "list"], env={"RMAPI_TOKEN": "tok"})
    assert result.exit_code == 1
    error = json.loads(result.stderr)
    assert error["code"] == "config_error"
    assert "RMAPI_BASE_URL" in error["message"]


def test_missing_token_exits_1_with_json_stderr(runner):
    """Missing RMAPI_TOKEN produces JSON error to stderr, exit 1."""
    result = runner.invoke(
        cli, ["recipes", "list"], env={"RMAPI_BASE_URL": "http://localhost:3001"}
    )
    assert result.exit_code == 1
    error = json.loads(result.stderr)
    assert error["code"] == "config_error"
    assert "RMAPI_TOKEN" in error["message"]


def test_missing_both_exits_1(runner):
    """Missing both env vars produces error for the first checked var."""
    result = runner.invoke(cli, ["recipes", "list"], env={})
    assert result.exit_code == 1
    error = json.loads(result.stderr)
    assert error["code"] == "config_error"


def test_base_url_trailing_slash_stripped(runner):
    """RMAPI_BASE_URL trailing slash is stripped by Config.from_env()."""
    from rmapi.config import Config
    import os

    env = {"RMAPI_BASE_URL": "http://localhost:3001/", "RMAPI_TOKEN": "tok"}
    original = os.environ.copy()
    try:
        os.environ.update(env)
        config = Config.from_env()
        assert config.base_url == "http://localhost:3001"
    finally:
        os.environ.clear()
        os.environ.update(original)
