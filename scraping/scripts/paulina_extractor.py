#!/usr/bin/env python3
"""
paulina_extractor.py — Extract recipe title and ingredients from paulinacocina.net

Usage:
    python3 paulina_extractor.py <recipe_url>

Output (stdout):
    {"title": "...", "ingredients": ["...", ...]}

On failure:
    {"error": "..."} and exits with code 1
"""

import sys
import json

import requests
from bs4 import BeautifulSoup

HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 "
        "(KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
    )
}


def extract_recipe(url: str) -> dict:
    try:
        response = requests.get(url, headers=HEADERS, timeout=15)
        response.raise_for_status()
    except requests.RequestException as exc:
        raise RuntimeError(f"Failed to fetch URL: {exc}") from exc

    soup = BeautifulSoup(response.text, "lxml")

    # --- Title ---
    h1 = soup.find("h1")
    if not h1:
        raise RuntimeError("Could not find recipe title (no <h1> element)")
    title = h1.get_text(strip=True)

    # --- Ingredients ---
    # The site places an "Ingredientes" h2/h3/h4 followed by a <ul> of <li> items.
    ingredients = []
    for header in soup.find_all(["h2", "h3", "h4"]):
        header_text = header.get_text(strip=True).lower()
        if "ingrediente" in header_text and "más recetas" not in header_text:
            ul = header.find_next("ul")
            if ul:
                ingredients = [
                    li.get_text(strip=True)
                    for li in ul.find_all("li")
                    if li.get_text(strip=True)
                ]
            break

    if not ingredients:
        raise RuntimeError("Could not find ingredients list on page")

    return {"title": title, "ingredients": ingredients}


def main():
    if len(sys.argv) < 2:
        print(json.dumps({"error": "Usage: paulina_extractor.py <recipe_url>"}))
        sys.exit(1)

    url = sys.argv[1]

    try:
        result = extract_recipe(url)
        print(json.dumps(result, ensure_ascii=False))
    except Exception as exc:
        print(json.dumps({"error": str(exc)}, ensure_ascii=False))
        sys.exit(1)


if __name__ == "__main__":
    main()
