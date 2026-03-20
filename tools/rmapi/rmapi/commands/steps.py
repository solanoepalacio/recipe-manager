"""Instruction step commands."""

import json

import click

from .. import http
from ..utils import require_yes


@click.group()
def steps() -> None:
    """Instruction step commands."""
    pass


@steps.command("add")
@click.argument("recipe_id")
@click.option("--body", "step_body", required=True, help="Step instruction text")
@click.option("--title", default=None, help="Optional step title")
def steps_add(recipe_id, step_body, title):
    """Add an instruction step to a recipe."""
    body = {k: v for k, v in {"body": step_body, "title": title}.items() if v is not None}
    data = http.post(f"/api/recipes/{recipe_id}/steps", body)
    click.echo(json.dumps(data))


@steps.command("update")
@click.argument("recipe_id")
@click.argument("step_id")
@click.option("--body", "step_body", default=None, help="New step instruction text")
@click.option("--title", default=None, help="New step title")
def steps_update(recipe_id, step_id, step_body, title):
    """Update an instruction step (only supplied fields are changed)."""
    body = {k: v for k, v in {"body": step_body, "title": title}.items() if v is not None}
    data = http.patch(f"/api/recipes/{recipe_id}/steps/{step_id}", body)
    click.echo(json.dumps(data))


@steps.command("delete")
@click.argument("recipe_id")
@click.argument("step_id")
@click.option("--yes", is_flag=True, default=False, help="Skip confirmation prompt")
def steps_delete(recipe_id, step_id, yes):
    """Delete an instruction step."""
    require_yes(yes)
    result = http.delete(f"/api/recipes/{recipe_id}/steps/{step_id}")
    click.echo(json.dumps(result))


@steps.command("reorder")
@click.argument("recipe_id")
@click.option("--ids", required=True, help="Comma-separated step IDs in desired order")
def steps_reorder(recipe_id, ids):
    """Reorder steps by specifying all IDs in desired order."""
    ids_list = [i.strip() for i in ids.split(",") if i.strip()]
    http.put(f"/api/recipes/{recipe_id}/steps/reorder", {"ids": ids_list})
    click.echo(json.dumps({"ok": True}))
