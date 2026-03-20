#!/usr/bin/env python3
"""Runs the extractor on a slice of a URL file and prints all ingredient lines."""
import sys
import json
import subprocess
from pathlib import Path

def main():
    extractor = sys.argv[1]   # path to extractor script
    urls_file = sys.argv[2]   # path to urls file
    start = int(sys.argv[3])  # 1-based start line
    end = int(sys.argv[4])    # 1-based end line (inclusive)
    python = sys.argv[5]      # python interpreter path

    urls = Path(urls_file).read_text().splitlines()
    urls = [u.strip() for u in urls if u.strip()]
    batch = urls[start-1:end]

    all_ingredients = []
    for i, url in enumerate(batch, start=start):
        try:
            result = subprocess.run(
                [python, extractor, url],
                capture_output=True, text=True, timeout=30
            )
            if result.returncode == 0:
                data = json.loads(result.stdout)
                lines = data.get("ingredients", [])
                all_ingredients.extend(lines)
                print(f"[{i}] OK  {url} ({len(lines)} ingredients)", file=sys.stderr)
            else:
                print(f"[{i}] ERR {url}: {result.stdout[:80]}", file=sys.stderr)
        except Exception as e:
            print(f"[{i}] EXC {url}: {e}", file=sys.stderr)

    print(json.dumps(all_ingredients, ensure_ascii=False))

if __name__ == "__main__":
    main()
