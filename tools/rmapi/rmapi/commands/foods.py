"""Foods commands."""

import json
import click
from .. import http
from ..utils import apply_fields


@click.group()
def foods() -> None:
    """Food lookup commands."""
    pass


@foods.command("lookup")
@click.option("--names", required=True, help="Comma-separated food names to resolve to IDs")
@click.option("--fields", default=None, help="Comma-separated top-level fields to include")
def foods_lookup(names: str, fields: str | None) -> None:
    """Resolve food names to IDs. Non-matching names are omitted (not an error)."""
    all_foods = http.get("/api/foods")
    name_set = {n.strip().lower() for n in names.split(",") if n.strip()}
    matched = [f for f in all_foods if f["name"].lower() in name_set]
    result = apply_fields(matched, fields)
    click.echo(json.dumps(result))
