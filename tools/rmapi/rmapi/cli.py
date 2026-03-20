"""Root CLI entry point for rmapi."""

import click

from .commands.recipes import recipes
from .commands.foods import foods
from .commands.units import units


@click.group()
def cli() -> None:
    """rmapi -- Recipe Manager API CLI."""
    pass


cli.add_command(recipes)
cli.add_command(foods)
cli.add_command(units)
