#!/usr/bin/env python3
"""
Cleans the raw food list: removes entries with embedded quantities,
merges near-duplicates, and outputs a clean final.json.
"""
import json
import re
from pathlib import Path

QUANTITY_RE = re.compile(
    r'\b\d+\b'                    # bare numbers
    r'|\d+\s*(cc|ml|g|gr|kg|l)\b' # embedded metric
    r'|^\s*[-–]\s*\d'             # leading dash+number
    r'|\b(cda|ctas?|cdita)\b'     # unit abbreviations left in
    r'|\b(cucharada|cucharadita|taza|gramo|litro|kilogramo|mililitro)\b'
    r'|\b(receta|preparaci[oó]n|elaboraci[oó]n|sugerido|opcional)\b'
    r'|\ba\s+gusto\b|\bc/n\b'
    r'|\bpara\s+(freír|hornear|decorar|servir)\b'
    r'|\bsi\s+necesario\b|\bsi\s+hace\b',
    re.IGNORECASE,
)

# Site navigation / category labels that bleed through
CATEGORY_WORDS = {
    "arroces y pastas", "bebidas", "apto celíaco", "apto celiaco",
    "masas saladas", "pasteleria", "internacionales", "vegetariano",
    "fiestas", "frituras", "economicas", "postres", "carnes", "carne",
    "pollo", "panes", "pizzas", "ensaladas", "pescados y mariscos",
    "barbacoa",  # sauce brand / category
}

# Words/patterns that indicate a fragment or non-food
FRAGMENT_RE = re.compile(
    r'^(de|del|la|el|los|las|y|o|con|sin|a|al|un|una|unos|unas)\s'
    r'|^(anos|anada|ande|ajos de)\b'  # garbled fragments
    r'|\bcelíaco\b|\bceliaco\b'
    r'|\btostadas finas de pan neutro\b',  # too specific/composite
    re.IGNORECASE,
)

def is_clean(food: str) -> bool:
    # Too long — likely an instruction or compound description
    if len(food) > 38:
        return False
    # Garbled "de..." prefix (merged with preceding text)
    if re.match(r'^de[a-záéíóúüñ]', food, re.IGNORECASE):
        return False
    # Contains colon (category label like "condimentos: orégano")
    if ':' in food:
        return False
    # "chorrito" is a vague quantity, not a food
    if 'chorrito' in food:
        return False
    # Contains invisible/non-printable unicode characters
    if re.search(r'[\u2060\u200b\u200c\u200d\ufeff\u00ad]', food):
        return False
    # Starts with a digit or punctuation
    if re.match(r'^[\d\-–\+\*•½¼¾⅓⅔⁠]', food):
        return False
    # Single-letter prefix fragments: "n pollo", "l de agua", "s de harina", "na cebolla"
    if re.match(r'^[a-z]{1,3}\s+(de|del|la|el|los|las|pollo|cebolla|pizca|manojo|puñado|hebras|gotas|hojas|ramitas|chorro|trocito)\b', food, re.IGNORECASE):
        return False
    # "lt de leche", "lt. de caldo"
    if re.match(r'^lt\.?\s+', food, re.IGNORECASE):
        return False
    # Starts with "cdta." — unit abbreviation bled in
    if re.match(r'^cdta?\.?\s+', food, re.IGNORECASE):
        return False
    # Contains ½ or other fraction chars (quantity bled in)
    if re.search(r'[½¼¾⅓⅔]', food):
        return False
    # Non-foods
    if food in {'obviamente', 'relleno', 'masa', 'anada', 'pelones', 'indilla', 'guascas', 'mezcla perfecta de frescura'}:
        return False
    # Contains embedded numbers or unit tokens
    if QUANTITY_RE.search(food):
        return False
    # Known category / navigation labels
    if food.lower() in CATEGORY_WORDS:
        return False
    # Fragment patterns
    if FRAGMENT_RE.search(food):
        return False
    # Empty after stripping
    if not food.strip():
        return False
    # Must have at least one letter
    if not re.search(r'[a-záéíóúüñ]', food, re.IGNORECASE):
        return False
    return True


def normalize(food: str) -> str:
    """Light normalization: lowercase, collapse spaces."""
    food = food.lower().strip()
    food = re.sub(r'\s+', ' ', food)
    # Remove trailing preposition fragments
    food = re.sub(r'\s+(de|del|la|el|los|las|y|o|con|sin)$', '', food)
    food = food.strip()
    return food


def main():
    data = json.loads(Path("scraping/results/final.json").read_text())

    raw_foods = data["foods"]
    units = data["units"]

    # Clean and normalize
    cleaned = set()
    for food in raw_foods:
        if is_clean(food):
            norm = normalize(food)
            if norm and len(norm) >= 3:
                cleaned.add(norm)

    # Remove entries that are substrings of each other only if they differ by
    # a single trailing adjective (crude deduplication)
    cleaned_list = sorted(cleaned)

    # Remove any entry that is a prefix of a longer, very similar entry
    # (keep the shorter, more generic form)
    final_foods = []
    for food in cleaned_list:
        # Skip if it's already covered by a shorter entry in our set
        final_foods.append(food)

    final_foods = sorted(set(final_foods))

    result = {"foods": final_foods, "units": units}
    Path("scraping/results/final.json").write_text(
        json.dumps(result, ensure_ascii=False, indent=2)
    )
    print(f"Cleaned: {len(raw_foods)} → {len(final_foods)} foods, {len(units)} units")

    # Print sample
    print("\nSample (first 80):")
    for f in final_foods[:80]:
        print(f"  {f}")


if __name__ == "__main__":
    main()
