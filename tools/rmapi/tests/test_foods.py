"""Tests for foods lookup — LOOK-01."""

import json
from unittest.mock import MagicMock, patch

from rmapi.cli import cli

FAKE_FOODS = [
    {"id": "f1", "name": "tomato"},
    {"id": "f2", "name": "chicken"},
    {"id": "f3", "name": "onion"},
    {"id": "f4", "name": "garlic"},
    {"id": "f5", "name": "salt"},
]

ENV = {"RMAPI_BASE_URL": "http://localhost:3001", "RMAPI_TOKEN": "test-token"}


def _mock_get(foods=FAKE_FOODS):
    mock_resp = MagicMock()
    mock_resp.status_code = 200
    mock_resp.json.return_value = foods
    return mock_resp


def test_foods_lookup_returns_matched_items(runner):
    with patch("requests.get", return_value=_mock_get()):
        result = runner.invoke(cli, ["foods", "lookup", "--names", "tomato,chicken"], env=ENV)
    assert result.exit_code == 0
    data = json.loads(result.stdout)
    assert len(data) == 2
    names = {item["name"] for item in data}
    assert names == {"tomato", "chicken"}


def test_foods_lookup_unmatched_omitted(runner):
    with patch("requests.get", return_value=_mock_get()):
        result = runner.invoke(cli, ["foods", "lookup", "--names", "nonexistent"], env=ENV)
    assert result.exit_code == 0
    data = json.loads(result.stdout)
    assert data == []


def test_foods_lookup_case_insensitive(runner):
    with patch("requests.get", return_value=_mock_get()):
        result = runner.invoke(cli, ["foods", "lookup", "--names", "Tomato"], env=ENV)
    assert result.exit_code == 0
    data = json.loads(result.stdout)
    assert len(data) == 1
    assert data[0]["name"] == "tomato"


def test_foods_lookup_fields_projection(runner):
    with patch("requests.get", return_value=_mock_get()):
        result = runner.invoke(cli, ["foods", "lookup", "--names", "tomato", "--fields", "id"], env=ENV)
    assert result.exit_code == 0
    data = json.loads(result.stdout)
    assert len(data) == 1
    assert list(data[0].keys()) == ["id"]
