"""Tests for apply_fields() — CLI-04: --fields projection."""

from rmapi.utils import apply_fields


def test_fields_none_returns_data_unchanged():
    data = {"id": "1", "name": "Pasta", "description": "Delicious"}
    assert apply_fields(data, None) == data


def test_fields_on_dict_strips_to_named_keys():
    data = {"id": "1", "name": "Pasta", "description": "Delicious", "servings": 4}
    result = apply_fields(data, "id,name")
    assert result == {"id": "1", "name": "Pasta"}


def test_fields_on_list_strips_each_item():
    data = [
        {"id": "1", "name": "Pasta", "description": "A"},
        {"id": "2", "name": "Soup", "description": "B"},
    ]
    result = apply_fields(data, "id,name")
    assert result == [{"id": "1", "name": "Pasta"}, {"id": "2", "name": "Soup"}]


def test_fields_with_spaces_in_comma_list():
    data = {"id": "1", "name": "Pasta", "description": "A"}
    result = apply_fields(data, "id , name")
    assert result == {"id": "1", "name": "Pasta"}


def test_fields_nonexistent_key_ignored():
    data = {"id": "1", "name": "Pasta"}
    result = apply_fields(data, "id,nonexistent")
    assert result == {"id": "1"}


def test_fields_empty_string_returns_empty():
    data = {"id": "1", "name": "Pasta"}
    result = apply_fields(data, "")
    assert result == {}


def test_fields_preserves_nested_value():
    """--fields sections on a recipe includes the full sections array."""
    data = {
        "id": "1",
        "name": "Pasta",
        "sections": [{"id": "s1", "title": "Main"}],
    }
    result = apply_fields(data, "id,sections")
    assert result == {"id": "1", "sections": [{"id": "s1", "title": "Main"}]}


def test_fields_on_non_dict_non_list_returns_unchanged():
    assert apply_fields("plain string", "id") == "plain string"
    assert apply_fields(42, "id") == 42
