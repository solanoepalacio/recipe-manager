"""Typed error hierarchy mapping HTTP status codes to CLI exit codes."""

import json

import click


class RmapiError(click.ClickException):
    """Base error: emits JSON to stderr, sets exit_code."""

    def __init__(self, code: str, message: str, status: int, exit_code: int) -> None:
        super().__init__(message)
        self.code = code
        self.status = status
        self.exit_code = exit_code

    def show(self) -> None:
        payload = json.dumps(
            {"code": self.code, "message": self.message, "status": self.status}
        )
        click.echo(payload, err=True)


class AuthError(RmapiError):
    def __init__(self, message: str = "Authentication failed") -> None:
        super().__init__("auth_failed", message, 401, 2)


class NotFoundError(RmapiError):
    def __init__(self, message: str = "Resource not found") -> None:
        super().__init__("not_found", message, 404, 3)


class ValidationError(RmapiError):
    def __init__(self, message: str = "Validation failed") -> None:
        super().__init__("validation_error", message, 422, 4)


class ApiError(RmapiError):
    def __init__(self, message: str = "API error", status: int = 500) -> None:
        super().__init__("api_error", message, status, 1)


def raise_for_status(response) -> None:
    """Map requests.Response to typed RmapiError if status >= 400."""
    if response.status_code < 400:
        return
    try:
        body = response.json()
        message = body.get("message", response.text)
    except Exception:
        message = response.text or "Unknown error"

    code = response.status_code
    if code in (401, 403):
        raise AuthError(message)
    elif code == 404:
        raise NotFoundError(message)
    elif code in (400, 422):
        raise ValidationError(message)
    else:
        raise ApiError(message, code)
