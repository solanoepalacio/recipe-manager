#!/usr/bin/env python3
"""
Parses raw Spanish ingredient lines to extract food names and units.
Writes per-batch JSON files and a final aggregated result.
"""
import json
import re
from pathlib import Path

# ---------------------------------------------------------------------------
# Unit normalization: maps many variants → canonical Spanish singular form
# ---------------------------------------------------------------------------
UNIT_MAP = {
    # taza
    "taza": "taza", "tazas": "taza",
    # cucharada
    "cucharada": "cucharada", "cucharadas": "cucharada",
    "cda": "cucharada", "cdas": "cucharada",
    "cucharada sopera": "cucharada", "cucharadas soperas": "cucharada",
    # cucharadita
    "cucharadita": "cucharadita", "cucharaditas": "cucharadita",
    "cdita": "cucharadita", "cditas": "cucharadita",
    "cdita.": "cucharadita", "cditas.": "cucharadita",
    # gramo
    "gramo": "gramo", "gramos": "gramo",
    "g": "gramo", "gr": "gramo", "gr.": "gramo", "grs": "gramo", "grs.": "gramo",
    # kilogramo
    "kilogramo": "kilogramo", "kilogramos": "kilogramo",
    "kg": "kilogramo", "kg.": "kilogramo", "kilo": "kilogramo", "kilos": "kilogramo",
    # litro
    "litro": "litro", "litros": "litro",
    # mililitro
    "mililitro": "mililitro", "mililitros": "mililitro",
    "ml": "mililitro", "ml.": "mililitro",
    "cc": "mililitro",  # centímetros cúbicos = ml in cooking
    # pizca
    "pizca": "pizca", "pizcas": "pizca",
    # unidad
    "unidad": "unidad", "unidades": "unidad",
    "u": "unidad", "ud": "unidad", "uds": "unidad",
    "unid": "unidad",
    # trozo
    "trozo": "trozo", "trozos": "trozo",
    "pedazo": "trozo", "pedazos": "trozo",
    # rodaja
    "rodaja": "rodaja", "rodajas": "rodaja",
    # rebanada
    "rebanada": "rebanada", "rebanadas": "rebanada",
    "tajada": "rebanada", "tajadas": "rebanada",
    # diente (ajo)
    "diente": "diente", "dientes": "diente",
    # rama
    "rama": "rama", "ramas": "rama",
    "ramita": "rama", "ramitas": "rama",
    # manojo
    "manojo": "manojo", "manojos": "manojo",
    # hoja
    "hoja": "hoja", "hojas": "hoja",
    # filete
    "filete": "filete", "filetes": "filete",
    # tallo
    "tallo": "tallo", "tallos": "tallo",
    # vaso
    "vaso": "vaso", "vasos": "vaso",
    # copa
    "copa": "copa", "copas": "copa",
    # lata
    "lata": "lata", "latas": "lata",
    # sobre
    "sobre": "sobre", "sobres": "sobre",
    # paquete
    "paquete": "paquete", "paquetes": "paquete",
    # cabeza
    "cabeza": "cabeza", "cabezas": "cabeza",
    # puñado
    "puñado": "puñado", "puñados": "puñado",
}

# Common quantity/descriptor words to strip from food names
STRIP_WORDS = {
    "fresco", "fresca", "frescos", "frescas",
    "seco", "seca", "secos", "secas",
    "grande", "grandes", "pequeño", "pequeña", "pequeños", "pequeñas",
    "mediano", "mediana", "medianos", "medianas",
    "entero", "entera", "enteros", "enteras",
    "cocido", "cocida", "cocidos", "cocidas",
    "rallado", "rallada", "rallados", "ralladas",
    "picado", "picada", "picados", "picadas",
    "molido", "molida", "molidos", "molidas",
    "troceado", "troceada", "troceados", "troceadas",
    "cortado", "cortada", "cortados", "cortadas",
    "batido", "batida",
    "derretido", "derretida",
    "tamizado", "tamizada",
    "sin", "con", "a", "al", "a la",
    "c/n", "cn", "cantidad necesaria", "a gusto", "al gusto",
    "aproximadamente", "aprox", "aprox.",
    "opcional", "opcionales",
    "para", "decorar", "servir",
}

# Words that indicate the line is not a real ingredient
SKIP_PATTERNS = [
    r"^[Pp]reparaci[oó]n",
    r"^[Pp]asos?",
    r"^[Ee]laboraci[oó]n",
    r"^[Cc]ocinar",
    r"^\d+\.",           # numbered instruction steps
    r"ver receta",
    r"receta ac[aá]",
]

# ---------------------------------------------------------------------------

def looks_like_instruction(line: str) -> bool:
    for pat in SKIP_PATTERNS:
        if re.search(pat, line):
            return True
    # Long lines are likely instructions, not ingredients
    if len(line) > 120:
        return True
    return False


def parse_line(line: str):
    """Returns (food: str|None, unit: str|None) from one ingredient line."""
    line = line.strip()
    if not line or looks_like_instruction(line):
        return None, None

    # Lowercase for matching, but we'll reconstruct nicely
    low = line.lower()

    # ---- Detect unit ----
    found_unit = None
    for variant, canonical in sorted(UNIT_MAP.items(), key=lambda x: -len(x[0])):
        # Match unit as a whole word/token
        pattern = r'(?<!\w)' + re.escape(variant) + r'(?!\w)'
        if re.search(pattern, low):
            found_unit = canonical
            break

    # ---- Extract food name ----
    # Strategy: remove leading quantity+unit pattern, strip filler words
    # Pattern: optional number, optional unit, optional "de/del/la/el/los/las", then food
    food_str = line

    # Remove leading numeric quantities (1, 2, 1/2, ½, 1.5, etc.)
    food_str = re.sub(r'^\s*[\d½¼¾⅓⅔]+[\s,./]*', '', food_str)
    food_str = re.sub(r'^\s*\d+\s*/\s*\d+\s*', '', food_str)

    # Remove unit tokens from start
    for variant in sorted(UNIT_MAP.keys(), key=lambda x: -len(x)):
        pattern = r'(?i)^' + re.escape(variant) + r'[\s.,]*'
        food_str = re.sub(pattern, '', food_str.strip())

    # Remove linking prepositions: "de", "del", "de la", "de los", "de las", "el", "la", "los", "las"
    food_str = re.sub(r'(?i)^(del?|de\s+l[aeo]s?|l[aeo]s?)\s+', '', food_str.strip())

    # Remove trailing descriptors in parens
    food_str = re.sub(r'\s*\(.*?\)', '', food_str)

    # Remove trailing filler after comma
    if ',' in food_str:
        food_str = food_str.split(',')[0]

    # Clean up whitespace
    food_str = food_str.strip().rstrip('.,;:').strip()

    # Lowercase and strip trailing descriptor words
    food_words = food_str.lower().split()
    # Remove trailing words from STRIP_WORDS
    while food_words and food_words[-1] in STRIP_WORDS:
        food_words.pop()
    food_str = ' '.join(food_words).strip()

    # Reject if too short or obviously not a food
    if len(food_str) < 2:
        return None, found_unit
    if food_str in STRIP_WORDS:
        return None, found_unit
    # Reject if it's just a number
    if re.match(r'^\d+$', food_str):
        return None, found_unit

    return food_str or None, found_unit


def process_raw_file(path: Path):
    lines = json.loads(path.read_text())
    foods = set()
    units = set()
    for line in lines:
        food, unit = parse_line(line)
        if food:
            foods.add(food)
        if unit:
            units.add(unit)
    return sorted(foods), sorted(units)


def main():
    base = Path("scraping/results")

    batch_files = {
        "paulina_1": base / "raw_paulina_1.json",
        "paulina_2": base / "raw_paulina_2.json",
        "paulina_3": base / "raw_paulina_3.json",
        "paulina_4": base / "raw_paulina_4.json",
        "paulina_5": base / "raw_paulina_5.json",
        "cocineros_1": base / "raw_cocineros_1.json",
        "cocineros_2": base / "raw_cocineros_2.json",
        "cocineros_3": base / "raw_cocineros_3.json",
        "cocineros_4": base / "raw_cocineros_4.json",
    }

    all_foods = set()
    all_units = set()

    for name, path in batch_files.items():
        if not path.exists():
            print(f"WARNING: {path} not found, skipping")
            continue
        foods, units = process_raw_file(path)
        out = {"foods": foods, "units": units}
        out_path = base / f"{name}.json"
        out_path.write_text(json.dumps(out, ensure_ascii=False, indent=2))
        all_foods.update(foods)
        all_units.update(units)
        print(f"{name}: {len(foods)} foods, {len(units)} units → {out_path}")

    # Also load already-done cocineros_5 (scraped by the successful agent)
    cocineros_5_path = base / "cocineros_batch_5.json"
    if cocineros_5_path.exists():
        data = json.loads(cocineros_5_path.read_text())
        all_foods.update(data.get("foods", []))
        all_units.update(data.get("units", []))
        print(f"cocineros_5 (pre-done): {len(data.get('foods',[]))} foods, {len(data.get('units',[]))} units")

    final = {"foods": sorted(all_foods), "units": sorted(all_units)}
    final_path = base / "final.json"
    final_path.write_text(json.dumps(final, ensure_ascii=False, indent=2))
    print(f"\nFINAL: {len(final['foods'])} foods, {len(final['units'])} units → {final_path}")


if __name__ == "__main__":
    main()
