#!/usr/bin/env python3
"""
Extractor for cocinerosargentinos.com recipe pages.

Usage:
    python cocineros_extractor.py <recipe_url>

Output:
    Prints compact JSON to stdout:
        {"title": "...", "ingredients": ["...", ...]}

    On failure, exits with code 1 and prints:
        {"error": "..."}
"""

import sys
import json
import requests
from bs4 import BeautifulSoup


BASE_URL = "https://cocinerosargentinos.com"

HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (X11; Linux x86_64) "
        "AppleWebKit/537.36 (KHTML, like Gecko) "
        "Chrome/122.0.0.0 Safari/537.36"
    ),
    "Accept-Language": "es-AR,es;q=0.9,en;q=0.8",
}


def fail(message: str) -> None:
    print(json.dumps({"error": message}, ensure_ascii=False))
    sys.exit(1)


def extract(url: str) -> dict:
    try:
        response = requests.get(url, headers=HEADERS, timeout=15)
        response.raise_for_status()
    except requests.exceptions.HTTPError as e:
        fail(f"HTTP error fetching {url}: {e}")
    except requests.exceptions.RequestException as e:
        fail(f"Request failed for {url}: {e}")

    soup = BeautifulSoup(response.text, "html.parser")

    # --- Title ---
    title_tag = soup.find("h1")
    if not title_tag:
        fail("Could not find recipe title (no <h1> element)")
    title = title_tag.get_text(strip=True)

    # --- Ingredients ---
    # The site lists ingredients under an <h2> with text "Ingredientes",
    # followed by one or more <ul> blocks (one per sub-section like MASA, SALSA).
    ingredients: list[str] = []

    ingredients_heading = None
    for h2 in soup.find_all("h2"):
        if "ingrediente" in h2.get_text(strip=True).lower():
            ingredients_heading = h2
            break

    if ingredients_heading:
        # Walk siblings after the heading and collect all <li> items until the
        # next major section heading (h2 / h3 at the same level).
        for sibling in ingredients_heading.find_next_siblings():
            tag = sibling.name
            if tag in ("h2",):
                # Hit the next major section — stop
                break
            if tag == "ul":
                for li in sibling.find_all("li"):
                    text = li.get_text(separator=" ", strip=True)
                    if text:
                        ingredients.append(text)
            # Also handle sub-headings (h3) that separate ingredient groups —
            # include them as plain-text markers so the caller knows the grouping.
            elif tag == "h3":
                section_name = sibling.get_text(strip=True)
                if section_name:
                    ingredients.append(f"[{section_name}]")

    if not ingredients:
        # Fallback: grab all <li> items from any <ul> on the page that appears
        # inside/after an element whose text contains "ingrediente".
        # This is a best-effort for pages with non-standard markup.
        for ul in soup.find_all("ul"):
            items = [li.get_text(separator=" ", strip=True) for li in ul.find_all("li") if li.get_text(strip=True)]
            if items:
                ingredients.extend(items)
                break  # take the first non-empty ul as a last resort

    return {"title": title, "ingredients": ingredients}


def main() -> None:
    if len(sys.argv) < 2:
        fail("Usage: cocineros_extractor.py <recipe_url>")

    url = sys.argv[1].strip()
    if not url.startswith("http"):
        url = BASE_URL + url

    result = extract(url)
    print(json.dumps(result, ensure_ascii=False))


if __name__ == "__main__":
    main()
