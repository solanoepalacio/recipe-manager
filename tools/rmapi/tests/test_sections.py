"""Tests for sections commands -- SEC-01, SEC-02, SEC-03, SEC-04."""

import json
from unittest.mock import MagicMock, patch

from rmapi.cli import cli

ENV = {"RMAPI_BASE_URL": "http://localhost:3001", "RMAPI_TOKEN": "test-token"}

FAKE_SECTION_RESPONSE = {
    "id": "sec1",
    "recipeId": "r1",
    "title": "Sauce",
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
    mock_resp.json.return_value = payload if payload is not None else {"id": "sec1"}
    return mock_resp


def _mock_put(payload=None, status=200):
    mock_resp = MagicMock()
    mock_resp.status_code = status
    mock_resp.json.return_value = payload or {}
    return mock_resp


# SEC-01
def test_sections_add(runner):
    with patch("requests.post", return_value=_mock_post(FAKE_SECTION_RESPONSE)):
        result = runner.invoke(cli, ["sections", "add", "r1", "--title", "Sauce"], env=ENV)
    assert result.exit_code == 0
    data = json.loads(result.stdout)
    assert data["id"] == "sec1"


def test_sections_add_no_title(runner):
    with patch("requests.post", return_value=_mock_post(FAKE_SECTION_RESPONSE)) as mock_req:
        result = runner.invoke(cli, ["sections", "add", "r1"], env=ENV)
    assert result.exit_code == 0
    body = mock_req.call_args.kwargs["json"]
    assert body == {}


# SEC-02
def test_sections_update_title(runner):
    with patch("requests.patch", return_value=_mock_patch(FAKE_SECTION_RESPONSE)) as mock_req:
        result = runner.invoke(
            cli, ["sections", "update", "r1", "sec1", "--title", "New"], env=ENV
        )
    assert result.exit_code == 0
    body = mock_req.call_args.kwargs["json"]
    assert body == {"title": "New"}


# SEC-03
def test_sections_delete_with_yes(runner):
    with patch("requests.delete", return_value=_mock_delete()):
        result = runner.invoke(cli, ["sections", "delete", "r1", "sec1", "--yes"], env=ENV)
    assert result.exit_code == 0
    data = json.loads(result.stdout)
    assert data["id"] == "sec1"


def test_sections_delete_requires_yes(runner):
    result = runner.invoke(cli, ["sections", "delete", "r1", "sec1"], env=ENV)
    assert result.exit_code == 4
    assert "confirmation_required" in result.output


# SEC-04
def test_sections_reorder(runner):
    with patch("requests.put", return_value=_mock_put()) as mock_req:
        result = runner.invoke(
            cli, ["sections", "reorder", "r1", "--ids", "sec2,sec1"], env=ENV
        )
    assert result.exit_code == 0
    body = mock_req.call_args.kwargs["json"]
    assert body["ids"] == ["sec2", "sec1"]
    data = json.loads(result.stdout)
    assert data["ok"] is True
