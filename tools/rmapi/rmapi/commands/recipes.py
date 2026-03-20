"""Recipe commands — list and get."""

import io
import json

import click
import requests as req_lib

from .. import http
from ..config import Config
from ..errors import raise_for_status
from ..utils import apply_fields, require_yes


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


@recipes.command("create")
@click.option("--name", required=True, help="Recipe name")
@click.option("--description", default=None, help="Plain text description")
@click.option("--servings-qty", default=None, type=int, help="Serving quantity")
@click.option("--servings-unit", default=None, help='Serving unit label (e.g. "portions")')
@click.option("--prep-time", default=None, type=int, help="Prep time in minutes")
@click.option("--cook-time", default=None, type=int, help="Cook time in minutes")
@click.option("--total-time", default=None, type=int, help="Total time in minutes")
@click.option("--perform-time", default=None, type=int, help="Active perform time in minutes")
@click.option("--source-url", default=None, help="Source URL for the original recipe")
def recipes_create(name, description, servings_qty, servings_unit,
                   prep_time, cook_time, total_time, perform_time, source_url):
    """Create a new recipe."""
    body = {k: v for k, v in {
        "name": name,
        "description": description,
        "servingsQty": servings_qty,
        "servingsUnit": servings_unit,
        "prepTime": prep_time,
        "cookTime": cook_time,
        "totalTime": total_time,
        "performTime": perform_time,
        "sourceUrl": source_url,
    }.items() if v is not None}
    data = http.post("/api/recipes", body)
    click.echo(json.dumps(data))


@recipes.command("update")
@click.argument("id")
@click.option("--name", default=None, help="New recipe name")
@click.option("--description", default=None, help="New description")
@click.option("--servings-qty", default=None, type=int, help="Serving quantity")
@click.option("--servings-unit", default=None, help="Serving unit label")
@click.option("--prep-time", default=None, type=int, help="Prep time in minutes")
@click.option("--cook-time", default=None, type=int, help="Cook time in minutes")
@click.option("--total-time", default=None, type=int, help="Total time in minutes")
@click.option("--perform-time", default=None, type=int, help="Active perform time in minutes")
@click.option("--source-url", default=None, help="Source URL")
def recipes_update(id, name, description, servings_qty, servings_unit,
                   prep_time, cook_time, total_time, perform_time, source_url):
    """Update recipe metadata (only supplied fields are changed)."""
    body = {k: v for k, v in {
        "name": name,
        "description": description,
        "servingsQty": servings_qty,
        "servingsUnit": servings_unit,
        "prepTime": prep_time,
        "cookTime": cook_time,
        "totalTime": total_time,
        "performTime": perform_time,
        "sourceUrl": source_url,
    }.items() if v is not None}
    data = http.patch(f"/api/recipes/{id}", body)
    click.echo(json.dumps(data))


@recipes.command("delete")
@click.argument("id")
@click.option("--yes", is_flag=True, default=False, help="Skip confirmation prompt")
def recipes_delete(id, yes):
    """Delete a recipe by ID."""
    require_yes(yes)
    result = http.delete(f"/api/recipes/{id}")
    click.echo(json.dumps(result))


@recipes.command("duplicate")
@click.argument("id")
def recipes_duplicate(id):
    """Duplicate a recipe (creates an independent copy)."""
    data = http.post(f"/api/recipes/{id}/duplicate")
    click.echo(json.dumps(data))


@recipes.command("add-image")
@click.argument("id")
@click.option("--url", "image_url", required=True, help="URL of the image to download and upload")
def recipes_add_image(id, image_url):
    """Download image from URL and upload to the recipe."""
    config = Config.from_env()
    dl = req_lib.get(image_url, timeout=30)
    dl.raise_for_status()
    content_type = dl.headers.get("Content-Type", "image/jpeg")
    filename = image_url.split("/")[-1].split("?")[0] or "image.jpg"
    response = req_lib.post(
        f"{config.base_url}/api/recipes/{id}/images",
        headers={"Authorization": f"Bearer {config.token}"},
        files={"file": (filename, io.BytesIO(dl.content), content_type)},
    )
    raise_for_status(response)
    click.echo(json.dumps(response.json()))
