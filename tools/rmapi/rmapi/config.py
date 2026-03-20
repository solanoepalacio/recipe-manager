"""Environment-based configuration for rmapi."""

import dataclasses
import json
import sys

import click


@dataclasses.dataclass
class Config:
    """API connection configuration read from environment variables."""

    base_url: str
    token: str

    @classmethod
    def from_env(cls) -> "Config":
        """Read RMAPI_BASE_URL and RMAPI_TOKEN from os.environ."""
        import os

        base_url = os.environ.get("RMAPI_BASE_URL")
        token = os.environ.get("RMAPI_TOKEN")
        if not base_url:
            _fail_config("RMAPI_BASE_URL")
        if not token:
            _fail_config("RMAPI_TOKEN")
        return cls(base_url=base_url.rstrip("/"), token=token)


def _fail_config(var: str) -> None:
    """Emit JSON error to stderr and exit 1 for missing env var."""
    click.echo(
        json.dumps(
            {
                "code": "config_error",
                "message": f"{var} environment variable is not set",
                "status": 0,
            }
        ),
        err=True,
    )
    raise SystemExit(1)
