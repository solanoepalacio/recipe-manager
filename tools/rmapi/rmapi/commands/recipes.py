"""Recipe commands — list and get."""

import json

import click

from .. import http
from ..utils import apply_fields


@click.group()
def recipes() -> None:
    """Recipe commands."""
    pass


@recipes.command("list")
@click.option("--search", default=None, help="Case-insensitive name substring search")
@click.option("--food-id", default=None, help="Filter by food ID")
@click.option("--sort", default=None, type=click.Choice(["name", "createdAt", "updatedAt", "random"]))
@click.option("--order", default=None, type=click.Choice(["asc", "desc"]))
@click.option("--page", default=None, type=int, help="Page number (1-based)")
@click.option("--per-page", default=None, type=int, help="Items per page")
@click.option("--fields", default=None, help="Comma-separated fields to include on each item")
def recipes_list(search, food_id, sort, order, page, per_page, fields):
    """List recipes with optional search, filter, sort, and pagination."""
    params = {k: v for k, v in {
        "search": search,
        "foodId": food_id,
        "sort": sort,
        "order": order,
        "page": page,
        "pageSize": per_page,
    }.items() if v is not None}
    data = http.get("/api/recipes", params=params)
    if fields:
        data = {**data, "items": apply_fields(data["items"], fields)}
    click.echo(json.dumps(data))


@recipes.command("get")
@click.argument("id")
@click.option("--fields", default=None, help="Comma-separated top-level fields to include")
def recipes_get(id: str, fields: str | None) -> None:
    """Get full recipe detail by ID."""
    data = http.get(f"/api/recipes/{id}")
    result = apply_fields(data, fields)
    click.echo(json.dumps(result))
