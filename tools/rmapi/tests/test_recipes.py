"""Tests for recipes list and get — RCP-01, RCP-02."""

import json
from unittest.mock import MagicMock, patch

from rmapi.cli import cli

ENV = {"RMAPI_BASE_URL": "http://localhost:3001", "RMAPI_TOKEN": "test-token"}

FAKE_LIST_RESPONSE = {
    "items": [
        {"id": "r1", "name": "Pasta Bolognese", "slug": "pasta-bolognese",
         "description": None, "servingsQty": 4, "servingsUnit": "portions",
         "shareToken": None, "createdAt": "2026-03-20T00:00:00.000Z",
         "updatedAt": "2026-03-20T00:00:00.000Z", "imageCount": 0, "coverImageUrl": None},
    ],
    "total": 1,
    "page": 1,
    "perPage": 20,
}

FAKE_DETAIL_RESPONSE = {
    "id": "r1",
    "householdId": "h1",
    "createdById": "u1",
    "name": "Pasta Bolognese",
    "slug": "pasta-bolognese",
    "description": None,
    "servingsQty": 4,
    "servingsUnit": "portions",
    "prepTime": 15,
    "cookTime": 30,
    "totalTime": 45,
    "performTime": None,
    "sourceUrl": None,
    "isLocked": False,
    "shareToken": None,
    "createdAt": "2026-03-20T00:00:00.000Z",
    "updatedAt": "2026-03-20T00:00:00.000Z",
    "sections": [
        {"id": "s1", "title": None, "order": 0,
         "ingredients": [
             {"id": "i1", "foodId": "f1", "foodName": "tomato", "unitId": "u1",
              "unitName": "gram", "quantity": 200.0, "note": None, "order": 0}
         ]}
    ],
    "steps": [
        {"id": "st1", "title": None, "body": "Boil water", "order": 0}
    ],
    "images": [],
}


def _mock_get(payload):
    mock_resp = MagicMock()
    mock_resp.status_code = 200
    mock_resp.json.return_value = payload
    return mock_resp


def _mock_get_404():
    mock_resp = MagicMock()
    mock_resp.status_code = 404
    mock_resp.json.return_value = {"message": "Recipe not found"}
    return mock_resp


def test_recipes_list_returns_paginated_response(runner):
    with patch("requests.get", return_value=_mock_get(FAKE_LIST_RESPONSE)):
        result = runner.invoke(cli, ["recipes", "list"], env=ENV)
    assert result.exit_code == 0
    data = json.loads(result.stdout)
    assert "items" in data
    assert "total" in data
    assert "page" in data
    assert "perPage" in data


def test_recipes_list_search_flag(runner):
    with patch("requests.get", return_value=_mock_get(FAKE_LIST_RESPONSE)) as mock_req:
        result = runner.invoke(cli, ["recipes", "list", "--search", "pasta"], env=ENV)
    assert result.exit_code == 0
    params = mock_req.call_args.kwargs["params"]
    assert params.get("search") == "pasta"


def test_recipes_list_food_id_flag(runner):
    with patch("requests.get", return_value=_mock_get(FAKE_LIST_RESPONSE)) as mock_req:
        result = runner.invoke(cli, ["recipes", "list", "--food-id", "f1"], env=ENV)
    assert result.exit_code == 0
    params = mock_req.call_args.kwargs["params"]
    assert params.get("foodId") == "f1"


def test_recipes_list_sort_order_flags(runner):
    with patch("requests.get", return_value=_mock_get(FAKE_LIST_RESPONSE)) as mock_req:
        result = runner.invoke(cli, ["recipes", "list", "--sort", "name", "--order", "asc"], env=ENV)
    assert result.exit_code == 0
    params = mock_req.call_args.kwargs["params"]
    assert params.get("sort") == "name"
    assert params.get("order") == "asc"


def test_recipes_list_pagination_flags(runner):
    with patch("requests.get", return_value=_mock_get(FAKE_LIST_RESPONSE)) as mock_req:
        result = runner.invoke(cli, ["recipes", "list", "--page", "2", "--per-page", "5"], env=ENV)
    assert result.exit_code == 0
    params = mock_req.call_args.kwargs["params"]
    assert params.get("page") == 2
    assert params.get("pageSize") == 5


def test_recipes_list_fields_projection(runner):
    with patch("requests.get", return_value=_mock_get(FAKE_LIST_RESPONSE)):
        result = runner.invoke(cli, ["recipes", "list", "--fields", "id,name"], env=ENV)
    assert result.exit_code == 0
    data = json.loads(result.stdout)
    assert "total" in data
    assert "page" in data
    assert "perPage" in data
    for item in data["items"]:
        assert set(item.keys()) == {"id", "name"}


def test_recipes_get_returns_detail(runner):
    with patch("requests.get", return_value=_mock_get(FAKE_DETAIL_RESPONSE)):
        result = runner.invoke(cli, ["recipes", "get", "r1"], env=ENV)
    assert result.exit_code == 0
    data = json.loads(result.stdout)
    assert "id" in data
    assert "sections" in data
    assert "steps" in data


def test_recipes_get_fields_projection(runner):
    with patch("requests.get", return_value=_mock_get(FAKE_DETAIL_RESPONSE)):
        result = runner.invoke(cli, ["recipes", "get", "r1", "--fields", "id,name"], env=ENV)
    assert result.exit_code == 0
    data = json.loads(result.stdout)
    assert set(data.keys()) == {"id", "name"}


def test_recipes_get_not_found(runner):
    with patch("requests.get", return_value=_mock_get_404()):
        result = runner.invoke(cli, ["recipes", "get", "nonexistent"], env=ENV)
    assert result.exit_code == 3
    assert "not_found" in result.stderr
