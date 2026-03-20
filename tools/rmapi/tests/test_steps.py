"""Tests for steps commands -- STP-01, STP-02, STP-03, STP-04."""

import json
from unittest.mock import MagicMock, patch

from rmapi.cli import cli

ENV = {"RMAPI_BASE_URL": "http://localhost:3001", "RMAPI_TOKEN": "test-token"}

FAKE_STEP_RESPONSE = {
    "id": "stp1",
    "recipeId": "r1",
    "title": None,
    "body": "Boil water",
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
    mock_resp.json.return_value = payload if payload is not None else {"id": "stp1"}
    return mock_resp


def _mock_put(payload=None, status=200):
    mock_resp = MagicMock()
    mock_resp.status_code = status
    mock_resp.json.return_value = payload or {}
    return mock_resp


# STP-01
def test_steps_add(runner):
    with patch("requests.post", return_value=_mock_post(FAKE_STEP_RESPONSE)):
        result = runner.invoke(cli, ["steps", "add", "r1", "--body", "Boil water"], env=ENV)
    assert result.exit_code == 0
    data = json.loads(result.stdout)
    assert data["id"] == "stp1"


def test_steps_add_with_title(runner):
    with patch("requests.post", return_value=_mock_post(FAKE_STEP_RESPONSE)) as mock_req:
        result = runner.invoke(
            cli, ["steps", "add", "r1", "--body", "Boil", "--title", "Step 1"], env=ENV
        )
    assert result.exit_code == 0
    body = mock_req.call_args.kwargs["json"]
    assert body["body"] == "Boil"
    assert body["title"] == "Step 1"


# STP-02
def test_steps_update_body(runner):
    with patch("requests.patch", return_value=_mock_patch(FAKE_STEP_RESPONSE)) as mock_req:
        result = runner.invoke(
            cli, ["steps", "update", "r1", "stp1", "--body", "Simmer"], env=ENV
        )
    assert result.exit_code == 0
    body = mock_req.call_args.kwargs["json"]
    assert body == {"body": "Simmer"}


def test_steps_update_title(runner):
    with patch("requests.patch", return_value=_mock_patch(FAKE_STEP_RESPONSE)) as mock_req:
        result = runner.invoke(
            cli, ["steps", "update", "r1", "stp1", "--title", "New Title"], env=ENV
        )
    assert result.exit_code == 0
    body = mock_req.call_args.kwargs["json"]
    assert body == {"title": "New Title"}


# STP-03
def test_steps_delete_with_yes(runner):
    with patch("requests.delete", return_value=_mock_delete()):
        result = runner.invoke(cli, ["steps", "delete", "r1", "stp1", "--yes"], env=ENV)
    assert result.exit_code == 0
    data = json.loads(result.stdout)
    assert data["id"] == "stp1"


def test_steps_delete_requires_yes(runner):
    result = runner.invoke(cli, ["steps", "delete", "r1", "stp1"], env=ENV)
    assert result.exit_code == 4
    assert "confirmation_required" in result.output


# STP-04
def test_steps_reorder(runner):
    with patch("requests.put", return_value=_mock_put()) as mock_req:
        result = runner.invoke(
            cli, ["steps", "reorder", "r1", "--ids", "stp2,stp1"], env=ENV
        )
    assert result.exit_code == 0
    body = mock_req.call_args.kwargs["json"]
    assert body["ids"] == ["stp2", "stp1"]
    data = json.loads(result.stdout)
    assert data["ok"] is True
