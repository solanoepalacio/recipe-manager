"""Root CLI entry point for rmapi."""

import click

from .commands.recipes import recipes
from .commands.foods import foods
from .commands.units import units
from .commands.sections import sections
from .commands.ingredients import ingredients
from .commands.steps import steps


@click.group()
def cli() -> None:
    """rmapi -- Recipe Manager API CLI."""
    pass


cli.add_command(recipes)
cli.add_command(foods)
cli.add_command(units)
cli.add_command(sections)
cli.add_command(ingredients)
cli.add_command(steps)
