"""Tests for meal plan commands -- MPL-01, MPL-02, MPL-03, MPL-04."""

import json
from unittest.mock import MagicMock, patch

from rmapi.cli import cli

ENV = {"RMAPI_BASE_URL": "http://localhost:3001", "RMAPI_TOKEN": "test-token"}

FAKE_ENTRY = {
    "id": "mp1",
    "date": "2026-03-21",
    "mealType": "dinner",
    "recipeId": "r1",
    "recipeName": "Pasta",
    "recipeSlug": "pasta",
    "createdAt": "2026-03-20T00:00:00.000Z",
    "updatedAt": "2026-03-20T00:00:00.000Z",
}


def _mock_get(payload, status=200):
    mock_resp = MagicMock()
    mock_resp.status_code = status
    mock_resp.json.return_value = payload
    return mock_resp


def _mock_post(payload, status=201):
    mock_resp = MagicMock()
    mock_resp.status_code = status
    mock_resp.json.return_value = payload
    return mock_resp


def _mock_patch(payload, status=200):
    mock_resp = MagicMock()
    mock_resp.status_code = status
    mock_resp.json.return_value = payload
    return mock_resp


def _mock_delete(payload=None, status=200):
    mock_resp = MagicMock()
    mock_resp.status_code = status
    mock_resp.json.return_value = payload if payload is not None else {"id": "mp1"}
    return mock_resp


# MPL-01
def test_meal_plan_list(runner):
    with patch("requests.get", return_value=_mock_get({"entries": [FAKE_ENTRY]})):
        result = runner.invoke(cli, ["meal-plan", "list"], env=ENV)
    assert result.exit_code == 0
    data = json.loads(result.stdout)
    assert isinstance(data, list)
    assert data[0]["id"] == "mp1"


def test_meal_plan_list_date_filters(runner):
    with patch("requests.get", return_value=_mock_get({"entries": [FAKE_ENTRY]})) as mock_req:
        result = runner.invoke(
            cli,
            ["meal-plan", "list", "--from", "2026-03-20", "--to", "2026-03-27"],
            env=ENV,
        )
    assert result.exit_code == 0
    assert mock_req.call_args.kwargs["params"] == {"from": "2026-03-20", "to": "2026-03-27"}


# MPL-02
def test_meal_plan_add(runner):
    with patch("requests.post", return_value=_mock_post(FAKE_ENTRY)):
        result = runner.invoke(
            cli,
            ["meal-plan", "add", "--recipe-id", "r1", "--date", "2026-03-21", "--type", "dinner"],
            env=ENV,
        )
    assert result.exit_code == 0
    data = json.loads(result.stdout)
    assert data["id"] == "mp1"


def test_meal_plan_add_body(runner):
    with patch("requests.post", return_value=_mock_post(FAKE_ENTRY)) as mock_req:
        result = runner.invoke(
            cli,
            ["meal-plan", "add", "--recipe-id", "r1", "--date", "2026-03-21", "--type", "dinner"],
            env=ENV,
        )
    assert result.exit_code == 0
    assert mock_req.call_args.kwargs["json"] == {
        "recipeId": "r1",
        "date": "2026-03-21",
        "mealType": "dinner",
    }


# MPL-03
def test_meal_plan_move(runner):
    with patch("requests.patch", return_value=_mock_patch(FAKE_ENTRY)) as mock_req:
        result = runner.invoke(
            cli,
            ["meal-plan", "move", "mp1", "--date", "2026-03-22", "--type", "lunch"],
            env=ENV,
        )
    assert result.exit_code == 0
    assert mock_req.call_args.kwargs["json"] == {"date": "2026-03-22", "mealType": "lunch"}


def test_meal_plan_move_sparse_body(runner):
    with patch("requests.patch", return_value=_mock_patch(FAKE_ENTRY)) as mock_req:
        result = runner.invoke(
            cli,
            ["meal-plan", "move", "mp1", "--date", "2026-03-22"],
            env=ENV,
        )
    assert result.exit_code == 0
    body = mock_req.call_args.kwargs["json"]
    assert body == {"date": "2026-03-22"}
    assert "mealType" not in body


# MPL-04
def test_meal_plan_remove_with_yes(runner):
    with patch("requests.delete", return_value=_mock_delete()):
        result = runner.invoke(cli, ["meal-plan", "remove", "mp1", "--yes"], env=ENV)
    assert result.exit_code == 0
    data = json.loads(result.stdout)
    assert data["id"] == "mp1"


def test_meal_plan_remove_requires_yes(runner):
    result = runner.invoke(cli, ["meal-plan", "remove", "mp1"], env=ENV)
    assert result.exit_code == 4
    assert "confirmation_required" in result.output
