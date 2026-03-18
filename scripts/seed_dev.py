#!/usr/bin/env python3
"""
Dev seed script — creates one admin and one regular user (with household).
Reads DATABASE_URL from apps/api/.env (or .env at repo root).

Usage:
    python scripts/seed_dev.py
    python scripts/seed_dev.py --admin-email admin@test.com --admin-password secret \
                                --user-email user@test.com  --user-password secret
"""

import argparse
import os
import re
import uuid
from datetime import datetime, timezone

import bcrypt
import psycopg2
from psycopg2.extras import RealDictCursor


# ---------------------------------------------------------------------------
# Config
# ---------------------------------------------------------------------------

DEFAULTS = {
    "admin_email":    "admin@test.com",
    "admin_password": "password123",
    "admin_name":     "Admin",
    "user_email":     "user@test.com",
    "user_password":  "password123",
    "user_name":      "Test User",
    "household_name": "Test Household",
}


def load_env(path: str) -> dict[str, str]:
    """Parse key=value pairs from a .env file (ignores comments and blanks)."""
    env = {}
    try:
        with open(path) as f:
            for line in f:
                line = line.strip()
                if not line or line.startswith("#"):
                    continue
                m = re.match(r'^([A-Z_]+)\s*=\s*["\']?([^"\']*)["\']?$', line)
                if m:
                    env[m.group(1)] = m.group(2)
    except FileNotFoundError:
        pass
    return env


def find_database_url() -> str:
    """Look for DATABASE_URL in env vars first, then .env files."""
    if "DATABASE_URL" in os.environ:
        return os.environ["DATABASE_URL"]

    script_dir = os.path.dirname(os.path.abspath(__file__))
    repo_root  = os.path.dirname(script_dir)

    for candidate in [
        os.path.join(repo_root, "apps", "api", ".env"),
        os.path.join(repo_root, ".env"),
    ]:
        env = load_env(candidate)
        if "DATABASE_URL" in env:
            print(f"  Using DATABASE_URL from {candidate}")
            return env["DATABASE_URL"]

    raise RuntimeError("DATABASE_URL not found. Set it in apps/api/.env or as an env var.")


def hash_password(plain: str) -> str:
    return bcrypt.hashpw(plain.encode(), bcrypt.gensalt(rounds=12)).decode()


def now_iso() -> str:
    return datetime.now(timezone.utc)


# ---------------------------------------------------------------------------
# Seed logic
# ---------------------------------------------------------------------------

def seed(args: argparse.Namespace, db_url: str) -> None:
    conn = psycopg2.connect(db_url, cursor_factory=RealDictCursor)
    conn.autocommit = False
    cur = conn.cursor()

    try:
        # ── Admin ──────────────────────────────────────────────────────────
        cur.execute('SELECT id FROM "Admin" WHERE email = %s', (args.admin_email,))
        if cur.fetchone():
            print(f"  Admin {args.admin_email!r} already exists — skipping.")
        else:
            cur.execute(
                'INSERT INTO "Admin" (id, name, email, "passwordHash", "createdAt", "updatedAt") '
                "VALUES (%s, %s, %s, %s, %s, %s)",
                (
                    str(uuid.uuid4()),
                    args.admin_name,
                    args.admin_email,
                    hash_password(args.admin_password),
                    now_iso(),
                    now_iso(),
                ),
            )
            print(f"  Created admin: {args.admin_email}")

        # ── Household ──────────────────────────────────────────────────────
        cur.execute('SELECT id FROM "Household" WHERE name = %s', (args.household_name,))
        row = cur.fetchone()
        if row:
            household_id = row["id"]
            print(f"  Household {args.household_name!r} already exists — reusing.")
        else:
            household_id = str(uuid.uuid4())
            cur.execute(
                'INSERT INTO "Household" (id, name, "createdAt", "updatedAt") '
                "VALUES (%s, %s, %s, %s)",
                (household_id, args.household_name, now_iso(), now_iso()),
            )
            print(f"  Created household: {args.household_name}")

        # ── User ───────────────────────────────────────────────────────────
        cur.execute('SELECT id FROM "User" WHERE email = %s', (args.user_email,))
        if cur.fetchone():
            print(f"  User {args.user_email!r} already exists — skipping.")
        else:
            cur.execute(
                'INSERT INTO "User" (id, "householdId", name, email, "passwordHash", "createdAt", "updatedAt") '
                "VALUES (%s, %s, %s, %s, %s, %s, %s)",
                (
                    str(uuid.uuid4()),
                    household_id,
                    args.user_name,
                    args.user_email,
                    hash_password(args.user_password),
                    now_iso(),
                    now_iso(),
                ),
            )
            print(f"  Created user:  {args.user_email}")

        conn.commit()
        print("\nDone.")
        print(f"  Admin login: {args.admin_email} / {args.admin_password}")
        print(f"  User login:  {args.user_email} / {args.user_password}")

    except Exception:
        conn.rollback()
        raise
    finally:
        cur.close()
        conn.close()


# ---------------------------------------------------------------------------
# CLI
# ---------------------------------------------------------------------------

def main() -> None:
    p = argparse.ArgumentParser(description="Seed dev admin + user")
    p.add_argument("--admin-email",    default=DEFAULTS["admin_email"])
    p.add_argument("--admin-password", default=DEFAULTS["admin_password"])
    p.add_argument("--admin-name",     default=DEFAULTS["admin_name"])
    p.add_argument("--user-email",     default=DEFAULTS["user_email"])
    p.add_argument("--user-password",  default=DEFAULTS["user_password"])
    p.add_argument("--user-name",      default=DEFAULTS["user_name"])
    p.add_argument("--household-name", default=DEFAULTS["household_name"])
    args = p.parse_args()

    print("Seeding dev data...")
    db_url = find_database_url()
    seed(args, db_url)


if __name__ == "__main__":
    main()
