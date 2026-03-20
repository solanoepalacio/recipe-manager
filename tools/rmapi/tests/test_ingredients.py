"""Tests for ingredients commands -- ING-01, ING-02, ING-03, ING-04."""

import json
from unittest.mock import MagicMock, patch

from rmapi.cli import cli

ENV = {"RMAPI_BASE_URL": "http://localhost:3001", "RMAPI_TOKEN": "test-token"}

FAKE_INGREDIENT_RESPONSE = {
    "id": "ing1",
    "sectionId": "sec1",
    "foodId": "f1",
    "food": {"id": "f1", "name": "tomato"},
    "unitId": "u1",
    "unit": {"id": "u1", "name": "gram", "abbreviation": "g"},
    "quantity": 200.0,
    "note": None,
    "order": 0,
}


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
    mock_resp.json.return_value = payload if payload is not None else {"id": "ing1"}
    return mock_resp


def _mock_put(payload=None, status=200):
    mock_resp = MagicMock()
    mock_resp.status_code = status
    mock_resp.json.return_value = payload or {}
    return mock_resp


# ING-01
def test_ingredients_add(runner):
    with patch("requests.post", return_value=_mock_post(FAKE_INGREDIENT_RESPONSE)):
        result = runner.invoke(
            cli,
            ["ingredients", "add", "r1", "sec1", "--food-id", "f1",
             "--quantity", "200", "--unit-id", "u1"],
            env=ENV,
        )
    assert result.exit_code == 0
    data = json.loads(result.stdout)
    assert data["id"] == "ing1"


def test_ingredients_add_with_note(runner):
    with patch("requests.post", return_value=_mock_post(FAKE_INGREDIENT_RESPONSE)) as mock_req:
        result = runner.invoke(
            cli,
            ["ingredients", "add", "r1", "sec1", "--food-id", "f1",
             "--note", "chopped"],
            env=ENV,
        )
    assert result.exit_code == 0
    body = mock_req.call_args.kwargs["json"]
    assert body["note"] == "chopped"
    assert body["foodId"] == "f1"


def test_ingredients_add_food_id_required(runner):
    """--food-id is required; Click should reject the command without it."""
    result = runner.invoke(cli, ["ingredients", "add", "r1", "sec1"], env=ENV)
    assert result.exit_code != 0


# ING-02
def test_ingredients_update_quantity(runner):
    with patch("requests.patch", return_value=_mock_patch(FAKE_INGREDIENT_RESPONSE)) as mock_req:
        result = runner.invoke(
            cli,
            ["ingredients", "update", "r1", "sec1", "ing1", "--quantity", "100"],
            env=ENV,
        )
    assert result.exit_code == 0
    body = mock_req.call_args.kwargs["json"]
    assert body == {"quantity": 100.0}


def test_ingredients_update_sparse(runner):
    with patch("requests.patch", return_value=_mock_patch(FAKE_INGREDIENT_RESPONSE)) as mock_req:
        result = runner.invoke(
            cli,
            ["ingredients", "update", "r1", "sec1", "ing1", "--note", "diced"],
            env=ENV,
        )
    assert result.exit_code == 0
    body = mock_req.call_args.kwargs["json"]
    assert body == {"note": "diced"}


# ING-03
def test_ingredients_delete_with_yes(runner):
    with patch("requests.delete", return_value=_mock_delete()):
        result = runner.invoke(
            cli, ["ingredients", "delete", "r1", "sec1", "ing1", "--yes"], env=ENV
        )
    assert result.exit_code == 0
    data = json.loads(result.stdout)
    assert data["id"] == "ing1"


def test_ingredients_delete_requires_yes(runner):
    result = runner.invoke(
        cli, ["ingredients", "delete", "r1", "sec1", "ing1"], env=ENV
    )
    assert result.exit_code == 4
    assert "confirmation_required" in result.output


# ING-04
def test_ingredients_reorder(runner):
    with patch("requests.put", return_value=_mock_put()) as mock_req:
        result = runner.invoke(
            cli, ["ingredients", "reorder", "r1", "sec1", "--ids", "ing2,ing1"], env=ENV
        )
    assert result.exit_code == 0
    body = mock_req.call_args.kwargs["json"]
    assert body["ids"] == ["ing2", "ing1"]
    data = json.loads(result.stdout)
    assert data["ok"] is True
