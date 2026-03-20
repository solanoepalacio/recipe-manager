"""Root CLI entry point for rmapi."""

import click

from .commands.recipes import recipes


@click.group()
def cli() -> None:
    """rmapi -- Recipe Manager API CLI."""
    pass


cli.add_command(recipes)
