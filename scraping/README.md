# Scraping — Foods & Units Seed Data

Extracts ingredient data from Argentinian recipe sites to populate `apps/api/prisma/seed.ts`.

## Sites

| Site | Listing URL | URL file |
|------|------------|---------|
| Paulina Cocina | https://www.paulinacocina.net/recetas | `scripts/paulina_urls.txt` |
| Cocineros Argentinos | https://cocinerosargentinos.com/recetas | `scripts/cocineros_urls.txt` |

## Prerequisites

The repo `.venv` already has everything needed:

```bash
/home/solanoe/code/recipe-manager/.venv/bin/python3 -c "import requests, bs4; print('ok')"
```

If missing:

```bash
pip install requests beautifulsoup4
```

## How to run

### 1. Refresh the URL lists (optional)

Only needed if you want newer recipes. The existing `.txt` files have 125 (paulina) and 120 (cocineros) URLs already collected.

To recollect, look at the pagination logic inside each extractor script and adapt as needed, or just manually fetch a few listing pages and append URLs.

### 2. Run the extractors on all batches

The `collect_ingredients.py` script takes a URL file and a line range, runs the extractor on each URL, and writes a JSON array of raw ingredient lines.

```bash
PYTHON=/home/solanoe/code/recipe-manager/.venv/bin/python3
cd /home/solanoe/code/recipe-manager

# Paulina Cocina — 5 batches of 20
$PYTHON scraping/scripts/collect_ingredients.py \
    scraping/scripts/paulina_extractor.py \
    scraping/scripts/paulina_urls.txt \
    1 20 $PYTHON > scraping/results/raw_paulina_1.json

# Repeat for lines 21-40, 41-60, 61-80, 81-100 (change last two args)
```

```bash
# Cocineros Argentinos — 5 batches of 20
$PYTHON scraping/scripts/collect_ingredients.py \
    scraping/scripts/cocineros_extractor.py \
    scraping/scripts/cocineros_urls.txt \
    1 20 $PYTHON > scraping/results/raw_cocineros_1.json

# Repeat for 21-40, 41-60, 61-80, 81-100
```

Each `raw_*.json` file is a flat JSON array of ingredient strings like:
```json
["2 tazas de harina de trigo", "1 cebolla grande", "Sal y pimienta", ...]
```

### 3. Extract foods and units

```bash
$PYTHON scraping/scripts/extract_foods_units.py
```

This reads all `raw_*.json` files, applies rule-based normalization (unit variants → canonical form, quantity stripping, food name isolation), and writes per-batch `paulina_N.json` / `cocineros_N.json` files plus a combined `scraping/results/final.json`.

### 4. Clean up noise

```bash
$PYTHON scraping/scripts/cleanup_foods.py
```

Filters out garbled entries (quantity fragments, invisible unicode chars, instruction bleed-through, entries over 40 chars) and overwrites `scraping/results/final.json` with the cleaned list.

### 5. Update seed.ts

```bash
$PYTHON - << 'EOF'
import json, re
from pathlib import Path

data = json.load(open('scraping/results/final.json'))
foods = data['foods']
units = data['units']

unit_abbrevs = {
    'atado': None, 'botella': None, 'cabeza': None,
    'cucharada': 'cda', 'cucharadita': 'cdita',
    'diente': None, 'filete': None, 'gramo': 'g', 'hoja': None,
    'kilogramo': 'kg', 'lata': None, 'litro': 'L', 'manojo': None,
    'mililitro': 'ml', 'pizca': None, 'puñado': None, 'rama': None,
    'rebanada': None, 'rodaja': None, 'sobre': None, 'tallo': None,
    'taza': 'tza', 'trozo': None, 'unidad': None, 'vaso': None,
}

units_ts = ',\n'.join(
    f"    {{ name: '{u}', abbreviation: {json.dumps(unit_abbrevs.get(u))} }}"
    for u in units
)
foods_ts = ',\n'.join(f"    '{f}'" for f in foods)

seed = Path('apps/api/prisma/seed.ts').read_text()
seed = re.sub(
    r'(  // Seed units\n  const units = \[)[^]]*(\];)',
    f'  // Seed units\n  const units = [\n{units_ts},\n  ];',
    seed, flags=re.DOTALL
)
seed = re.sub(
    r'(  // Seed common foods\n  const foods = \[)[^]]*(\];)',
    f'  // Seed common foods\n  const foods = [\n{foods_ts},\n  ];',
    seed, flags=re.DOTALL
)
Path('apps/api/prisma/seed.ts').write_text(seed)
print(f'Done: {len(units)} units, {len(foods)} foods')
EOF
```

## File reference

```
scraping/
├── scripts/
│   ├── paulina_extractor.py      # Fetches a paulinacocina.net URL → JSON {title, ingredients}
│   ├── cocineros_extractor.py    # Fetches a cocinerosargentinos.com URL → JSON {title, ingredients}
│   ├── collect_ingredients.py    # Runs extractor on a batch of URLs → raw ingredient lines
│   ├── extract_foods_units.py    # Rule-based food/unit extraction from raw lines
│   ├── cleanup_foods.py          # Noise filter pass on final.json
│   ├── paulina_urls.txt          # 125 recipe URLs from paulinacocina.net
│   └── cocineros_urls.txt        # 120 recipe URLs from cocinerosargentinos.com
└── results/
    ├── raw_paulina_{1-5}.json    # Raw ingredient lines per paulinacocina batch
    ├── raw_cocineros_{1-4}.json  # Raw ingredient lines per cocineros batch (rule-based)
    ├── paulina_{1-5}.json        # Extracted foods+units per paulinacocina batch
    ├── cocineros_{1-4}.json      # Extracted foods+units per cocineros batch (rule-based)
    ├── cocineros_batch_{1-5}.json # Extracted foods+units per cocineros batch (LLM-extracted)
    └── final.json                # Merged, deduplicated, cleaned — source of truth
```

## Notes

- The extractors use `requests` with a browser User-Agent to avoid blocks. If a site starts returning errors, check whether they've changed their HTML structure and update the BeautifulSoup selectors in the extractor script.
- `paulinacocina.net` puts ingredients in a `<ul>` after an `<h3>Ingredientes</h3>` heading.
- `cocinerosargentinos.com` puts ingredients after an `<h2>Ingredientes</h2>` heading, with optional `<h3>` sub-sections.
- Rule-based extraction (`extract_foods_units.py`) works well for paulinacocina but leaves more noise for cocineros because that site embeds quantities inside the ingredient text (e.g. `"harina 200 g"`). For cocineros, LLM-based extraction (fetching each page directly and asking the model to parse) produces cleaner results.
- All output is lowercase Spanish. When adding new units discovered in a scraping run, also add their abbreviation to the `unit_abbrevs` dict in step 5 above.
