"""Units commands."""

import json
import click
from .. import http
from ..utils import apply_fields


@click.group()
def units() -> None:
    """Unit commands."""
    pass


@units.command("list")
@click.option("--fields", default=None, help="Comma-separated top-level fields to include")
def units_list(fields: str | None) -> None:
    """List all units."""
    data = http.get("/api/units")
    result = apply_fields(data, fields)
    click.echo(json.dumps(result))
