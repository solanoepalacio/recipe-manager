"""Tests for error taxonomy — CLI-02: JSON stderr, CLI-03: exit codes."""

import json

from rmapi.errors import (
    ApiError,
    AuthError,
    NotFoundError,
    RmapiError,
    ValidationError,
    raise_for_status,
)


class FakeResponse:
    """Minimal mock for requests.Response."""

    def __init__(self, status_code: int, body: dict | None = None, text: str = ""):
        self.status_code = status_code
        self._body = body
        self.text = text

    def json(self):
        if self._body is None:
            raise ValueError("No JSON")
        return self._body


# --- CLI-03: Exit code mapping ---


def test_auth_error_exit_code_2():
    err = AuthError("bad token")
    assert err.exit_code == 2
    assert err.code == "auth_failed"
    assert err.status == 401


def test_not_found_error_exit_code_3():
    err = NotFoundError("gone")
    assert err.exit_code == 3
    assert err.code == "not_found"
    assert err.status == 404


def test_validation_error_exit_code_4():
    err = ValidationError("invalid")
    assert err.exit_code == 4
    assert err.code == "validation_error"
    assert err.status == 422


def test_api_error_exit_code_1():
    err = ApiError("server error", 500)
    assert err.exit_code == 1
    assert err.code == "api_error"
    assert err.status == 500


# --- CLI-02: JSON stderr output ---


def test_rmapi_error_show_writes_json_to_stderr(runner, capsys):
    """RmapiError.show() writes valid JSON with code, message, status."""
    import click

    err = AuthError("Token expired")
    # Use click.echo capture via CliRunner
    from rmapi.cli import cli

    @cli.command("_test_error")
    def _test_error():
        raise AuthError("Token expired")

    result = runner.invoke(cli, ["_test_error"])
    assert result.exit_code == 2
    error = json.loads(result.stderr)
    assert error == {
        "code": "auth_failed",
        "message": "Token expired",
        "status": 401,
    }
    # Cleanup: remove the temporary test command
    cli.commands.pop("_test_error", None)


# --- raise_for_status mapping ---


def test_raise_for_status_401_raises_auth_error():
    resp = FakeResponse(401, {"message": "Unauthorized"})
    try:
        raise_for_status(resp)
        assert False, "Should have raised"
    except AuthError as e:
        assert e.exit_code == 2
        assert "Unauthorized" in e.message


def test_raise_for_status_403_raises_auth_error():
    resp = FakeResponse(403, {"message": "Forbidden"})
    try:
        raise_for_status(resp)
        assert False, "Should have raised"
    except AuthError as e:
        assert e.exit_code == 2


def test_raise_for_status_404_raises_not_found():
    resp = FakeResponse(404, {"message": "Not found"})
    try:
        raise_for_status(resp)
        assert False, "Should have raised"
    except NotFoundError as e:
        assert e.exit_code == 3


def test_raise_for_status_422_raises_validation():
    resp = FakeResponse(422, {"message": "Invalid input"})
    try:
        raise_for_status(resp)
        assert False, "Should have raised"
    except ValidationError as e:
        assert e.exit_code == 4


def test_raise_for_status_400_raises_validation():
    resp = FakeResponse(400, {"message": "Bad request"})
    try:
        raise_for_status(resp)
        assert False, "Should have raised"
    except ValidationError as e:
        assert e.exit_code == 4


def test_raise_for_status_500_raises_api_error():
    resp = FakeResponse(500, {"message": "Internal error"})
    try:
        raise_for_status(resp)
        assert False, "Should have raised"
    except ApiError as e:
        assert e.exit_code == 1
        assert e.status == 500


def test_raise_for_status_200_no_error():
    resp = FakeResponse(200)
    raise_for_status(resp)  # Should not raise


def test_raise_for_status_no_json_body():
    """Non-JSON response body falls back to response.text."""
    resp = FakeResponse(500, None, "Server Error")
    try:
        raise_for_status(resp)
        assert False, "Should have raised"
    except ApiError as e:
        assert "Server Error" in e.message
