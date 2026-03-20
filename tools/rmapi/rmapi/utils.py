"""Shared utilities: field projection and destructive-command guard."""

import json
import sys

import click


def apply_fields(data, fields: str | None):
    """Project data to named top-level fields only. Returns data unchanged if fields is None."""
    if fields is None:
        return data
    field_set = {f.strip() for f in fields.split(",") if f.strip()}
    if isinstance(data, list):
        return [{k: v for k, v in item.items() if k in field_set} for item in data]
    if isinstance(data, dict):
        return {k: v for k, v in data.items() if k in field_set}
    return data


def require_yes(yes: bool) -> None:
    """Guard destructive commands: --yes flag OR interactive TTY required."""
    if yes:
        return
    if not sys.stdin.isatty():
        click.echo(
            json.dumps(
                {
                    "code": "confirmation_required",
                    "message": "Use --yes to confirm destructive operation in non-interactive context",
                    "status": 400,
                }
            ),
            err=True,
        )
        raise SystemExit(4)
    click.confirm("Are you sure?", abort=True)
