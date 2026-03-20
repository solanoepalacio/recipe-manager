"""Recipe commands — placeholder for Phase 15+."""

import click


@click.group()
def recipes() -> None:
    """Recipe commands."""
    pass


@recipes.command("list")
@click.option("--fields", default=None, help="Comma-separated fields to include")
def recipes_list(fields: str | None) -> None:
    """List recipes. (Placeholder — implemented in Phase 15)"""
    click.echo("[]")
