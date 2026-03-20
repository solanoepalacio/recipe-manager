"""Ingredient commands."""

import json

import click

from .. import http
from ..utils import require_yes


@click.group()
def ingredients() -> None:
    """Ingredient commands."""
    pass


@ingredients.command("add")
@click.argument("recipe_id")
@click.argument("section_id")
@click.option("--food-id", required=True, help="Food ID (use 'rmapi foods lookup' to find)")
@click.option("--quantity", default=None, type=float, help="Quantity amount")
@click.option("--unit-id", default=None, help="Unit ID (use 'rmapi units list' to find)")
@click.option("--note", default=None, help="Optional note (e.g. chopped, diced)")
def ingredients_add(recipe_id, section_id, food_id, quantity, unit_id, note):
    """Add an ingredient to a section."""
    body = {k: v for k, v in {
        "foodId": food_id,
        "quantity": quantity,
        "unitId": unit_id,
        "note": note,
    }.items() if v is not None}
    data = http.post(
        f"/api/recipes/{recipe_id}/sections/{section_id}/ingredients", body
    )
    click.echo(json.dumps(data))


@ingredients.command("update")
@click.argument("recipe_id")
@click.argument("section_id")
@click.argument("ingredient_id")
@click.option("--food-id", default=None, help="New food ID")
@click.option("--quantity", default=None, type=float, help="New quantity")
@click.option("--unit-id", default=None, help="New unit ID")
@click.option("--note", default=None, help="New note")
def ingredients_update(recipe_id, section_id, ingredient_id, food_id, quantity, unit_id, note):
    """Update an ingredient (only supplied fields are changed)."""
    body = {k: v for k, v in {
        "foodId": food_id,
        "quantity": quantity,
        "unitId": unit_id,
        "note": note,
    }.items() if v is not None}
    data = http.patch(
        f"/api/recipes/{recipe_id}/sections/{section_id}/ingredients/{ingredient_id}",
        body,
    )
    click.echo(json.dumps(data))


@ingredients.command("delete")
@click.argument("recipe_id")
@click.argument("section_id")
@click.argument("ingredient_id")
@click.option("--yes", is_flag=True, default=False, help="Skip confirmation prompt")
def ingredients_delete(recipe_id, section_id, ingredient_id, yes):
    """Delete an ingredient."""
    require_yes(yes)
    result = http.delete(
        f"/api/recipes/{recipe_id}/sections/{section_id}/ingredients/{ingredient_id}"
    )
    click.echo(json.dumps(result))


@ingredients.command("reorder")
@click.argument("recipe_id")
@click.argument("section_id")
@click.option("--ids", required=True, help="Comma-separated ingredient IDs in desired order")
def ingredients_reorder(recipe_id, section_id, ids):
    """Reorder ingredients within a section by specifying all IDs in desired order."""
    ids_list = [i.strip() for i in ids.split(",") if i.strip()]
    http.put(
        f"/api/recipes/{recipe_id}/sections/{section_id}/ingredients/reorder",
        {"ids": ids_list},
    )
    click.echo(json.dumps({"ok": True}))
