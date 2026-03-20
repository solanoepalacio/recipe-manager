"""Tests for units list — LOOK-02."""

import json
from unittest.mock import MagicMock, patch

from rmapi.cli import cli

FAKE_UNITS = [
    {"id": "u1", "name": "gram", "abbreviation": "g"},
    {"id": "u2", "name": "cup", "abbreviation": "cup"},
    {"id": "u3", "name": "tablespoon", "abbreviation": "tbsp"},
]

ENV = {"RMAPI_BASE_URL": "http://localhost:3001", "RMAPI_TOKEN": "test-token"}


def _mock_get(units=FAKE_UNITS):
    mock_resp = MagicMock()
    mock_resp.status_code = 200
    mock_resp.json.return_value = units
    return mock_resp


def test_units_list_returns_all(runner):
    with patch("requests.get", return_value=_mock_get()):
        result = runner.invoke(cli, ["units", "list"], env=ENV)
    assert result.exit_code == 0
    data = json.loads(result.stdout)
    assert len(data) == 3
    assert data[0]["abbreviation"] == "g"


def test_units_list_fields_projection(runner):
    with patch("requests.get", return_value=_mock_get()):
        result = runner.invoke(cli, ["units", "list", "--fields", "id,name"], env=ENV)
    assert result.exit_code == 0
    data = json.loads(result.stdout)
    assert len(data) == 3
    for item in data:
        assert set(item.keys()) == {"id", "name"}
