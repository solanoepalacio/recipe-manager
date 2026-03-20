"""Ingredient section commands."""

import json

import click

from .. import http
from ..utils import require_yes


@click.group()
def sections() -> None:
    """Ingredient section commands."""
    pass


@sections.command("add")
@click.argument("recipe_id")
@click.option("--title", default=None, help="Section title")
def sections_add(recipe_id, title):
    """Add an ingredient section to a recipe."""
    body = {k: v for k, v in {"title": title}.items() if v is not None}
    data = http.post(f"/api/recipes/{recipe_id}/sections", body)
    click.echo(json.dumps(data))


@sections.command("update")
@click.argument("recipe_id")
@click.argument("section_id")
@click.option("--title", default=None, help="New section title")
def sections_update(recipe_id, section_id, title):
    """Update a section title."""
    body = {k: v for k, v in {"title": title}.items() if v is not None}
    data = http.patch(f"/api/recipes/{recipe_id}/sections/{section_id}", body)
    click.echo(json.dumps(data))


@sections.command("delete")
@click.argument("recipe_id")
@click.argument("section_id")
@click.option("--yes", is_flag=True, default=False, help="Skip confirmation prompt")
def sections_delete(recipe_id, section_id, yes):
    """Delete an ingredient section."""
    require_yes(yes)
    result = http.delete(f"/api/recipes/{recipe_id}/sections/{section_id}")
    click.echo(json.dumps(result))


@sections.command("reorder")
@click.argument("recipe_id")
@click.option("--ids", required=True, help="Comma-separated section IDs in desired order")
def sections_reorder(recipe_id, ids):
    """Reorder sections by specifying all IDs in desired order."""
    ids_list = [i.strip() for i in ids.split(",") if i.strip()]
    http.put(f"/api/recipes/{recipe_id}/sections/reorder", {"ids": ids_list})
    click.echo(json.dumps({"ok": True}))
