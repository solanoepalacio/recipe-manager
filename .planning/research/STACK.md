# Stack Research

**Domain:** Thin CLI wrapper (`rmapi`) over a REST API, invoked by an AI agent via shell execution; plus LLM agent skill files (.md)
**Researched:** 2026-03-20
**Confidence:** HIGH (core choices), MEDIUM (skill file format)

---

## Recommended Stack

### Core Technologies

| Technology | Version | Purpose | Why Recommended |
|------------|---------|---------|-----------------|
| Python | 3.9+ (use system 3.13) | CLI implementation language | Zero-dependency install path, batteries-included stdlib (argparse, json, os), first-class httpx support, reads cleanly by agents in error traces. Node adds npm install overhead; bash lacks structured error handling and JSON manipulation. |
| httpx | 0.28.x | HTTP client for REST API calls | Modern sync API that mirrors requests but with strict timeouts, connection pooling, and full type annotations. Sync-only is appropriate — agent invocations are one-shot CLI calls, not concurrent servers. Replaces requests for new code. |
| argparse (stdlib) | bundled | Subcommand routing and argument parsing | Zero-dependency, proven, ships with every Python installation. Subparsers map cleanly to API resource groups (recipes, meal-plan, etc.). Exit code semantics (0/1/2) are built in. |
| json (stdlib) | bundled | JSON output to stdout | All agent-visible output is `json.dumps()` to stdout. Errors always go to stderr so agents can distinguish data from failure. |

### Supporting Libraries

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| python-dotenv | 1.x | Load `~/.rmapi` or `.env` config (base URL, API key) | Use to avoid requiring `--base-url` and `--token` on every invocation. Agents configure once, call repeatedly. |
| pytest | 8.x | Test suite | Unit-test argument parsing, error normalization, JSON output shape without a live server. |
| pytest-httpx | 0.35.x | Mock httpx responses in tests | Intercepts httpx calls; lets you assert on request headers (Authorization), body, and simulate error HTTP codes. |

### Development Tools

| Tool | Purpose | Notes |
|------|---------|-------|
| `pip install -e .` (editable install) | Makes `rmapi` available as a shell command during development | Use `pyproject.toml` with `[project.scripts] rmapi = "rmapi.cli:main"` entry point. No separate activation step needed after editable install. |
| pyproject.toml | Package metadata and entry point declaration | Prefer over setup.py; modern standard, supported by pip 21.3+. |

---

## Skill File Standard

**Use SKILL.md format (agentskills.io open standard, published December 2025).**

The SKILL.md format is adopted by Claude Code, OpenAI Codex, and OpenClaw. It is the correct target for this project because our agent will run inside Claude Code.

### Skill Directory Structure

```
.claude/skills/
  recipe-management/
    SKILL.md           # frontmatter + task instructions
    references/
      api-reference.md # endpoint listing (loaded on demand)
  meal-plan-management/
    SKILL.md
    references/
      api-reference.md
  recipe-discovery/
    SKILL.md
```

### SKILL.md Frontmatter Fields

| Field | Required | Notes |
|-------|----------|-------|
| `name` | Yes | Lowercase, hyphens only, must match directory name. E.g. `recipe-management`. |
| `description` | Yes | Max 1024 chars. Describe both what the skill does AND when to activate it. Include task keywords. |
| `compatibility` | No | Include: `Requires rmapi CLI installed and RMAPI_TOKEN env var set.` |
| `allowed-tools` | No | Can pre-approve `Bash(rmapi:*)` to reduce confirmation prompts (experimental). |
| `metadata` | No | Include `version` and `author` for traceability. |

### SKILL.md Body Conventions

- Write step-by-step task instructions, not feature descriptions.
- Sequence matters: state the order explicitly.
- Include a "Constraints" section listing unsupported actions and failure modes.
- Keep main SKILL.md under 500 lines. Move endpoint reference tables to `references/api-reference.md`.
- Examples: show exact `rmapi` invocations with expected JSON output shape.
- Progressive disclosure: metadata (~100 tokens) loads at startup; body (<5000 tokens) loads on activation; references load only when needed.

---

## Installation

```bash
# Create CLI package directory
mkdir -p tools/rmapi/src/rmapi

# Install runtime dependencies
pip install httpx==0.28.* python-dotenv

# Install dev/test dependencies
pip install -D pytest pytest-httpx

# Editable install (makes `rmapi` available on PATH)
pip install -e tools/rmapi/
```

---

## Alternatives Considered

| Recommended | Alternative | When to Use Alternative |
|-------------|-------------|-------------------------|
| Python + httpx | Bash + curl | Only if zero-install environment with no Python. Bash has no structured error normalization or testability — not appropriate here. |
| Python + httpx | Node.js + fetch | Only if CLI already lives in the monorepo's JS workspace and you want shared types. In this project, the CLI is a standalone tool for the agent, not a frontend consumer of `@recipe-manager/shared`. Node adds `node_modules` to a tool that should be self-contained. |
| argparse (stdlib) | Click / Typer | Use Click or Typer only if you need shell completion, rich help formatting, or callback-based validation. rmapi is a thin wrapper — argparse is sufficient and adds no dependency. |
| SKILL.md (agentskills.io) | Custom .md convention | Custom format is fine for internal-only tools that will never be shared. Since this project already uses Claude Code and SKILL.md is natively supported, use the standard. |
| python-dotenv config | Environment variables only | If the deployment environment already injects `RMAPI_TOKEN` and `RMAPI_BASE_URL`, dotenv can be dropped. Keep dotenv for local dev ergonomics. |

---

## What NOT to Use

| Avoid | Why | Use Instead |
|-------|-----|-------------|
| requests | Actively maintained but no type annotations, no HTTP/2, and no built-in timeout enforcement. httpx is the modern replacement. | httpx 0.28.x |
| Click / Typer | Adds a dependency for features (decorators, rich output) that aren't needed in a thin agent-facing CLI. argparse covers all required functionality. | argparse (stdlib) |
| Colored/rich terminal output | Agents parse stdout as JSON. ANSI color codes corrupt JSON parsing. | Plain `json.dumps()` to stdout only |
| `print()` for errors | Agents cannot distinguish data from errors if both go to stdout. | `sys.stderr.write()` or `print(..., file=sys.stderr)` for all error messages |
| Swagger codegen / openapi-generator | Generated clients are fat and hard to audit. A thin manual wrapper is 200 lines and fully inspectable by the agent. | Hand-written httpx client |
| Interactive prompts | Agents cannot respond to stdin prompts. Any missing argument must be a hard error (exit 1). | Required argparse positional arguments or `--flag required=True` |

---

## Stack Patterns by Variant

**If agent runs on a system with no Python:**
- Compile a single-binary release with PyInstaller or use a bash + curl fallback
- Otherwise the Python assumption holds (Python 3.9+ is on any modern Linux/macOS)

**If agent needs to call multiple endpoints in sequence:**
- Each `rmapi` invocation is independent; the agent assembles pipelines via shell
- Do not build a "workflow" mode into rmapi — keep it one-command-per-call

**If field projection is needed (reduce token cost of large responses):**
- Accept a `--fields id,name,slug` flag and implement in Python with a dict filter before printing JSON
- Do NOT shell out to `jq` — it may not be installed; implement projection natively in Python using a simple key-path filter

---

## API Key Auth Integration

The existing backend uses Bearer token auth for API key clients (`Authorization: Bearer <token>`). The CLI must:

1. Read token from `RMAPI_TOKEN` environment variable (or `~/.rmapi` dotenv file).
2. Inject `Authorization: Bearer {token}` header on every request via an httpx `Client` default header.
3. Never accept token as a CLI positional argument (prevents shell history exposure).
4. On 401 response: print `{"error": "unauthorized", "message": "RMAPI_TOKEN is invalid or expired"}` to stderr and exit 1.
5. On 403 response: print `{"error": "forbidden", "message": "..."}` to stderr and exit 1.

---

## Error Normalization Contract

All errors must output a consistent JSON envelope to stderr:

```json
{"error": "<error_slug>", "message": "<human readable>", "status": <http_status_or_null>}
```

Exit codes:
- `0` — success, JSON response on stdout
- `1` — API error (4xx, 5xx) or connection failure
- `2` — usage error (wrong arguments) — argparse default

---

## Version Compatibility

| Package | Compatible With | Notes |
|---------|-----------------|-------|
| httpx 0.28.x | Python 3.9+ | Drop support for `verify` as string arg (deprecated in 0.28). Use `ssl.create_default_context()` if custom CA needed. |
| pytest-httpx 0.35.x | httpx 0.28.x | Must version-match pytest-httpx to httpx minor version. Check PyPI compatibility matrix before upgrading either. |
| python-dotenv 1.x | Python 3.9+ | Stable API since 1.0. No known compatibility issues. |

---

## Sources

- [agentskills.io/specification](https://agentskills.io/specification) — SKILL.md format spec (HIGH confidence, official standard)
- [github.com/anthropics/skills — spec](https://github.com/anthropics/skills/blob/main/spec/agent-skills-spec.md) — Anthropic's canonical spec repo (HIGH confidence)
- [python-httpx.org](https://www.python-httpx.org/) — httpx official docs, sync client, features (HIGH confidence)
- [pypi.org/project/httpx/](https://pypi.org/project/httpx/) — version 0.28.1 confirmed (HIGH confidence)
- [docs.python.org/3/library/argparse.html](https://docs.python.org/3/library/argparse.html) — argparse subparsers, exit codes (HIGH confidence)
- [setuptools entry points](https://setuptools.pypa.io/en/latest/userguide/entry_point.html) — console_scripts pattern (HIGH confidence)
- [SKILL.md Pattern article (Bibek Poudel, Feb 2026)](https://bibek-poudel.medium.com/the-skill-md-pattern-how-to-write-ai-agent-skills-that-actually-work-72a3169dd7ee) — body conventions (MEDIUM confidence, community source)

---
*Stack research for: rmapi CLI wrapper + agent skill files*
*Researched: 2026-03-20*
