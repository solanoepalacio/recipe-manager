"""Meal plan commands."""

import json

import click

from .. import http
from ..utils import require_yes


@click.group()
def meal_plan() -> None:
    """Meal plan commands."""
    pass


@meal_plan.command("list")
@click.option("--from", "from_date", default=None, help="Start date YYYY-MM-DD")
@click.option("--to", "to_date", default=None, help="End date YYYY-MM-DD")
def meal_plan_list(from_date, to_date):
    """List meal plan entries by date range."""
    params = {k: v for k, v in {"from": from_date, "to": to_date}.items() if v is not None}
    data = http.get("/api/meal-plan", params=params)
    click.echo(json.dumps(data["entries"]))


@meal_plan.command("add")
@click.option("--recipe-id", required=True, help="Recipe ID to assign")
@click.option("--date", "entry_date", required=True, help="Date YYYY-MM-DD")
@click.option(
    "--type",
    "meal_type",
    required=True,
    type=click.Choice(["breakfast", "lunch", "dinner", "snack", "dessert"]),
    help="Meal type",
)
def meal_plan_add(recipe_id, entry_date, meal_type):
    """Add a recipe to the meal plan."""
    body = {"recipeId": recipe_id, "date": entry_date, "mealType": meal_type}
    data = http.post("/api/meal-plan/entries", body)
    click.echo(json.dumps(data))


@meal_plan.command("move")
@click.argument("entry_id")
@click.option("--date", "entry_date", default=None, help="New date YYYY-MM-DD")
@click.option(
    "--type",
    "meal_type",
    default=None,
    type=click.Choice(["breakfast", "lunch", "dinner", "snack", "dessert"]),
    help="New meal type",
)
def meal_plan_move(entry_id, entry_date, meal_type):
    """Move a meal plan entry to a new date or meal type."""
    body = {k: v for k, v in {"date": entry_date, "mealType": meal_type}.items() if v is not None}
    data = http.patch(f"/api/meal-plan/entries/{entry_id}", body)
    click.echo(json.dumps(data))


@meal_plan.command("remove")
@click.argument("entry_id")
@click.option("--yes", is_flag=True, default=False, help="Skip confirmation prompt")
def meal_plan_remove(entry_id, yes):
    """Remove a meal plan entry."""
    require_yes(yes)
    result = http.delete(f"/api/meal-plan/entries/{entry_id}")
    click.echo(json.dumps(result))
