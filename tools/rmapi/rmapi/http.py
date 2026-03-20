"""HTTP client wrapper: reads Config, sets auth header, raises typed errors."""

import requests

from .config import Config
from .errors import raise_for_status


def _headers(config: Config) -> dict:
    return {
        "Authorization": f"Bearer {config.token}",
        "Accept": "application/json",
    }


def get(path: str, params: dict | None = None) -> dict | list:
    """GET request to the API. Path should start with /api/."""
    config = Config.from_env()
    url = f"{config.base_url}{path}"
    response = requests.get(url, headers=_headers(config), params=params)
    raise_for_status(response)
    return response.json()


def post(path: str, json_body: dict | None = None) -> dict | list:
    """POST request to the API."""
    config = Config.from_env()
    url = f"{config.base_url}{path}"
    response = requests.post(url, headers=_headers(config), json=json_body)
    raise_for_status(response)
    return response.json()


def patch(path: str, json_body: dict | None = None) -> dict | list:
    """PATCH request to the API."""
    config = Config.from_env()
    url = f"{config.base_url}{path}"
    response = requests.patch(url, headers=_headers(config), json=json_body)
    raise_for_status(response)
    return response.json()


def delete(path: str) -> dict | None:
    """DELETE request to the API. Returns None on 204."""
    config = Config.from_env()
    url = f"{config.base_url}{path}"
    response = requests.delete(url, headers=_headers(config))
    raise_for_status(response)
    if response.status_code == 204:
        return None
    return response.json()


def put(path: str, json_body: dict | None = None) -> dict | list:
    """PUT request to the API."""
    config = Config.from_env()
    url = f"{config.base_url}{path}"
    response = requests.put(url, headers=_headers(config), json=json_body)
    raise_for_status(response)
    return response.json()
