# Pitfalls Research

**Domain:** Agent-facing CLI tool (`rmapi`) + skill file system added to an existing REST API
**Researched:** 2026-03-20
**Confidence:** HIGH (multiple authoritative sources corroborate each pitfall)

---

## Critical Pitfalls

### Pitfall 1: Response Verbosity Creep

**What goes wrong:**
The CLI returns full API payloads — nested ingredient sections, step lists, image arrays, household metadata — for every command. Token costs balloon. Over a multi-step task the agent's context window fills with data it didn't need, displacing earlier instructions. The agent starts making worse decisions mid-task ("getting dumber") because its working memory is crowded with unused fields.

**Why it happens:**
Developers mirror the REST response directly in CLI output because it's the path of least resistance. "More data = safer" feels true for human users. Nobody measures token cost of stdout because it has no visible dollar price during development.

**How to avoid:**
- Build `--fields` projection into `rmapi` from day one. Callers specify exactly which top-level fields they want: `rmapi recipes get <id> --fields id,name,slug,ingredients`.
- Default output for list commands must be a minimal summary shape (id, name, slug, updatedAt). Full detail is opt-in.
- Route all progress messages, warnings, and debug info to stderr. Stdout is the data contract; agents read only stdout.
- Enforce a hard response size budget in the CLI (e.g., 64 KB limit with a truncation notice) so a single malformed list call cannot fill the context window.

**Warning signs:**
- `rmapi recipes list` returns more than 10 fields per item by default.
- Any command returns nested arrays more than two levels deep without a `--fields` flag.
- Skill files instruct the agent to call `| head -c` to truncate output — this is a sign the CLI itself is too verbose.

**Phase to address:** CLI scaffold phase (before any endpoint is wired).

---

### Pitfall 2: Shell Injection via Agent-Constructed Arguments

**What goes wrong:**
The agent builds a command string containing user-supplied recipe names, descriptions, or search queries, then passes it to the shell. A recipe named `Arroz con Pollo; rm -rf /tmp/data` executes the destructive side-effect. Even without malicious intent, special characters (`!`, `$`, backticks) break command interpretation.

CVE-2025-54795 (Claude Code) and GHSA-534m-3w6r-8pqr (Cursor) both trace to argument injection through agent-constructed shell strings.

**Why it happens:**
- Skill files show examples using string interpolation: `rmapi recipes create --name "$RECIPE_NAME"`. The agent follows the pattern and the shell expands the value.
- `subprocess` calls with `shell=True` (or Node `exec()` with template strings) treat the full command as a shell string rather than an argument vector.

**How to avoid:**
- `rmapi` must accept all user-data arguments as explicit flags, never as positional shell-interpolated strings: `rmapi recipes create --name "..." --description "..."`.
- At the invocation layer, always use argument vectors (`subprocess.run(["rmapi", "recipes", "create", "--name", name], shell=False)`), never shell string composition.
- Inside `rmapi` itself, never pass user-supplied values to a shell sub-process. All HTTP calls go through a programmatic HTTP client, not `curl "$URL"`.
- Skill files must show argument-vector invocation patterns, not shell-string patterns.
- Validate and reject argument values containing shell metacharacters (`; | & $ ` ( ) < > \ !`) before they reach any subprocess call.

**Warning signs:**
- Skill file examples use shell variables or command substitution inside argument values.
- `rmapi` shells out to `curl` or `wget` internally.
- Any test constructs a command string with string interpolation rather than an array.

**Phase to address:** CLI scaffold phase (security hardening must be part of initial design, not a retrofit).

---

### Pitfall 3: API Key Exposure in Shell History and Logs

**What goes wrong:**
The agent or developer invokes `rmapi --token sk-abc123 recipes list`. The token appears in `~/.bash_history`, `ps aux` output, process environment dumps, and any logging middleware that records the full command line. This is documented attack technique MITRE ATT&CK T1552.003.

**Why it happens:**
Passing secrets as flags is the most obvious pattern when learning CLI design. Flag-based auth looks clean in documentation examples.

**How to avoid:**
- `rmapi` reads credentials exclusively from environment variables (`RMAPI_TOKEN`, `RMAPI_BASE_URL`) or a config file (`~/.rmapi/config.json`) with 0600 permissions.
- Never accept `--token` as a CLI flag. If it appears as a flag during scaffolding, remove it before any skill file references it.
- Skill files must document the environment-variable pattern as the only supported auth method.
- The `rmapi auth setup` command writes config to the file; it does not print the token to stdout.
- The config file path is excluded from any agent-accessible file listings. Skill files must not instruct the agent to `cat ~/.rmapi/config.json`.
- All internal logging in `rmapi` must redact the Authorization header before writing to any log destination.

**Warning signs:**
- Any skill file example shows `--token` in a command.
- `rmapi --help` lists a `--token` flag.
- Internal logging prints the full request headers object.

**Phase to address:** CLI scaffold phase (auth pattern must be locked before any skill file documents it).

---

### Pitfall 4: Skill File Rot (Docs Diverging from Implementation)

**What goes wrong:**
The skill files document `rmapi recipes create --ingredients "..."` with a specific JSON schema. The API adds a required `sectionTitle` field in a later sprint. The skill file is not updated. The agent follows the stale pattern, omits `sectionTitle`, gets a 400 error, and either halts or keeps retrying with the same wrong input.

**Why it happens:**
Skill files are Markdown documents in a separate directory. They have no compile-time link to the API contract. Developers update `packages/shared` types and the backend DTO but never trigger a review of skill files. The drift is invisible until an agent task fails.

**How to avoid:**
- Treat skill files as first-class deliverables in every sprint that changes an API surface. The definition of done for any API change includes: "skill file reviewed and updated."
- Add a CI check (or pre-commit hook) that parses skill file code blocks and validates command signatures against `rmapi --help` output. This gives a diff signal when they diverge.
- Version the skills index: include a `last-verified` date in each skill file's front matter. A staleness threshold (e.g., 90 days) triggers a review flag.
- Keep skill file examples minimal — only fields that are required or commonly used. Fewer documented fields = fewer places to go stale.
- Do not document optional fields exhaustively in skill files; point to `rmapi <command> --help` for the full schema. The `--help` output is always current; the skill file is just the task pattern.

**Warning signs:**
- A skill file contains a JSON payload with hardcoded field names.
- A sprint closes without a "skill file check" task.
- The skills index has no `last-verified` metadata.
- Skill file examples show fields that no longer exist in the DTO.

**Phase to address:** Skill file authoring phase. Enforcement (CI check) should be added during that same phase, not deferred.

---

### Pitfall 5: Error Messages Designed for Humans, Not Agents

**What goes wrong:**
`rmapi` returns `Error: something went wrong` with exit code 1 for all failure cases. The agent cannot distinguish a 401 (re-authenticate) from a 404 (wrong ID) from a 422 (validation failure) from a 503 (retry). It either gives up after one failure or retries blindly regardless of error type, causing rate-limit cascades or infinite loops.

**Why it happens:**
Human-facing error messages are conversational. Machine-facing error messages need to be a decision tree. Developers default to the human pattern because that's what they test against manually.

**How to avoid:**
- Every error response from `rmapi` must be a JSON object on stdout (when `--json` is active) with a stable schema:
  ```json
  {
    "error": true,
    "code": "VALIDATION_FAILED",
    "http_status": 422,
    "message": "ingredients[0].quantity is required",
    "retriable": false,
    "fields": ["ingredients[0].quantity"]
  }
  ```
- Use a closed set of `code` values documented in the skill files: `AUTH_REQUIRED`, `NOT_FOUND`, `VALIDATION_FAILED`, `CONFLICT`, `RATE_LIMITED`, `SERVER_ERROR`.
- Map `retriable: true` only for `RATE_LIMITED` and `SERVER_ERROR`. All other codes are `retriable: false`.
- Use distinct exit codes per error class (0 = success, 1 = client error non-retriable, 2 = auth error, 3 = not found, 4 = rate limited, 5 = server error). Exit codes are the agent's primary control flow signal when not in `--json` mode.
- Skill files must document the error code taxonomy and the recommended agent response for each code.

**Warning signs:**
- `rmapi` returns exit code 1 for both 401 and 422 responses.
- Error output is plain text prose with no machine-parseable code field.
- Skill files say "if the command fails, try again" without branching on error type.

**Phase to address:** CLI scaffold phase (error taxonomy must be locked before skill files reference it).

---

### Pitfall 6: Interactive Prompts That Deadlock the Agent

**What goes wrong:**
`rmapi recipes delete <id>` prompts "Are you sure? [y/N]" and waits for stdin. The agent subprocess has no stdin attached, or the orchestration framework does not pipe stdin. The command hangs indefinitely. The agent's task execution stalls with no error output.

**Why it happens:**
Developers add confirmation prompts to destructive commands as a safety measure — this is correct for human-facing CLIs. They forget the agent caller has no interactive terminal.

**How to avoid:**
- Every destructive command must support `--yes` / `--force` to skip all confirmation prompts.
- When stdin is not a TTY (detectable with `process.stdin.isTTY === false` in Node or `os.isatty(0)` in Python), automatically enable non-interactive mode — fail fast with a clear error rather than hanging.
- Skill files must always include `--yes` in any destructive command example.
- Never use `readline`, `inquirer`, or equivalent interactive prompt libraries in the agent-facing code path.

**Warning signs:**
- Any `rmapi` command contains the word "confirm" or "sure" in its source.
- Tests for destructive commands don't test the `--yes` flag path.
- Skill file delete examples omit `--yes`.

**Phase to address:** CLI scaffold phase.

---

### Pitfall 7: Inconsistent Pagination Breaking Agent Loops

**What goes wrong:**
`rmapi recipes list` uses cursor-based pagination. `rmapi meal-plan list` uses offset pagination. The agent implements a generic "fetch all pages" loop and it works for recipes but silently truncates meal plan results because the page token field name differs (`nextCursor` vs `next_offset`).

**Why it happens:**
Different endpoints were implemented in different sprints. Each developer used whatever pagination style felt natural. The inconsistency only surfaces when the agent tries to abstract over multiple resource types.

**How to avoid:**
- Establish a single pagination envelope before implementing the first `list` command and enforce it for every resource:
  ```json
  { "data": [...], "pagination": { "page": 1, "pageSize": 20, "total": 143, "hasMore": true } }
  ```
- `rmapi` CLI wraps this consistently: `--page`, `--page-size` flags work identically on every list command.
- A `--all` flag for list commands fetches all pages automatically and returns a flat array, so the agent doesn't need to implement pagination loops for simple use cases.
- Document the pagination contract once in the skills index, not per-resource.

**Warning signs:**
- Two list commands return different field names for the "next page" indicator.
- Skill files show bespoke pagination loops per resource type.
- The `--page` flag behaves differently (1-indexed vs 0-indexed) across commands.

**Phase to address:** CLI scaffold phase (pagination contract before first endpoint).

---

### Pitfall 8: Testing the CLI as a Human Tool, Not an Agent Tool

**What goes wrong:**
The CLI test suite invokes commands and asserts on human-readable stdout strings: `expect(output).toContain("Recipe created successfully")`. A refactor changes the message wording. The string assertion breaks. Or worse: the test suite never tests `--json` mode, so JSON output is broken but tests pass.

**Why it happens:**
Developers test what they can see. Human output is easy to inspect manually; machine output requires deliberate test design.

**How to avoid:**
- All CLI tests must assert on parsed JSON output (`JSON.parse(stdout)`), not string matching.
- Tests must cover: happy path JSON shape, each error code class (401, 404, 422, 5xx), exit code values, `--dry-run` behavior, `--yes` bypasses confirmation, `--fields` projection reduces output fields.
- Tests must simulate non-TTY stdin to verify interactive prompts are skipped.
- Add a contract test that runs `rmapi <command> --help` and verifies the flags listed match the skill file documentation. This catches drift early.
- Integrate CLI tests into the CI pipeline that runs on every API change.

**Warning signs:**
- Test assertions use `toContain()` on a prose string rather than `toEqual()` on a parsed object.
- No tests assert on exit code values.
- `--json` flag is untested.
- Tests pass when run by a human but the agent reports command failures in production.

**Phase to address:** CLI scaffold phase (test harness before first endpoint).

---

## Technical Debt Patterns

| Shortcut | Immediate Benefit | Long-term Cost | When Acceptable |
|----------|-------------------|----------------|-----------------|
| Mirror REST response directly in CLI output | Zero transformation code | Context window bloat, agent confusion from irrelevant fields | Never — field projection must be designed in from the start |
| Plain-text error messages | Faster to write | Agent cannot branch on error type; retries everything or nothing | Never for agent-facing output |
| Hardcode token in environment for dev convenience | Easy local testing | Token appears in shell history, `.env` files, and logs | Never in production patterns; use config file |
| Document all optional fields in skill files | Feels comprehensive | Every API change requires a skill file update | Never — document task patterns, not exhaustive field lists |
| Skip `--yes` flag on destructive commands initially | Ship faster | Agent hangs indefinitely on destructive operations | Never — interactive fallback deadlocks agents |
| Single exit code (1) for all errors | Simple implementation | Agent cannot distinguish retriable from fatal errors | Never for agent-facing CLI |

---

## Integration Gotchas

| Integration | Common Mistake | Correct Approach |
|-------------|----------------|------------------|
| REST API error passthrough | Forwarding raw API error JSON as-is | Normalize to `rmapi` error schema with `code`, `retriable`, `fields` |
| File upload (recipe images) | Passing file path via flag: `--image /tmp/photo.jpg` | Stream from stdin or accept a pre-uploaded URL; never construct a multipart shell command with user path |
| Authentication config | Reading token from `RMAPI_TOKEN` env without fallback to config file | Check env first, then `~/.rmapi/config.json`, then fail with `AUTH_REQUIRED` and setup instructions |
| Pagination with large datasets | Returning all records in a single response when `--all` is used | Stream paginated requests, respect server page size, emit progress to stderr |
| Skills index loading | Agent reads all skill files at startup | Agent reads skills index first, loads individual skill files only when relevant to the current task |

---

## Performance Traps

| Trap | Symptoms | Prevention | When It Breaks |
|------|----------|------------|----------------|
| No field projection on list commands | Agent context fills after 2-3 list calls; task quality degrades mid-session | Default to minimal fields; add `--fields` flag | At 20+ recipes per page with full detail |
| Fetching full recipe to check a single field | Agent issues extra reads just to verify one attribute | Support `--fields id,slug` on get commands | At any scale — this is a token cost, not a server cost |
| No `--all` pagination helper | Agent implements n-request loops burning context on pagination boilerplate | Add `--all` flag that fetches and flattens all pages | Whenever a list has >1 page |
| Verbose error stack traces in `--json` mode | Stack traces bloat error responses with irrelevant detail | Suppress stack traces in production mode; log to file | Any time an error occurs |

---

## Security Mistakes

| Mistake | Risk | Prevention |
|---------|------|------------|
| Accepting `--token` as a CLI flag | Token captured in shell history (`~/.bash_history`), `ps aux`, and process env dumps (MITRE T1552.003) | Credentials only via env var or config file with 0600 permissions |
| Logging request headers without redaction | API key written to log files accessible to other processes | Redact `Authorization` header before any log write |
| Skill file instructs agent to read config file | Agent includes token value in its context window, exposing it in conversation logs | Skill files must never reference config file path or token value |
| Agent constructs shell string with user data | Shell injection via recipe names or descriptions containing metacharacters | Use argument vectors exclusively; validate inputs for shell metacharacters |
| `rmapi` shells out to `curl` internally | User-data values interpolated into a curl command string | All HTTP calls via programmatic HTTP client (axios, node-fetch, httpx) |
| No input length limits on CLI arguments | Oversized inputs passed to API, causing unpredictable server behavior | Validate max lengths client-side before HTTP call; match backend DTO constraints |

---

## UX Pitfalls

> Note: "UX" here means agent usability — the agent is the user of this CLI.

| Pitfall | Agent Impact | Better Approach |
|---------|-------------|-----------------|
| Inconsistent command grammar (`create-recipe` vs `recipe create`) | Agent cannot generalize to undocumented commands; must memorize each | Uniform `noun verb` grammar: `rmapi recipes create`, `rmapi meal-plan add-entry` |
| Different flag names for same concept (`--id` vs `--recipe-id` vs `--recipeId`) | Agent uses wrong flag name; gets usage error; cannot self-correct without re-reading help | One canonical flag name per concept across all commands |
| `--help` text too brief | Agent cannot discover required vs optional flags without trial and error | `--help` must list every flag, whether required, type, default, and one example |
| Success output includes human narrative ("Great! Recipe created.") | Agent tries to parse narrative for the created ID and fails | Success output in `--json` mode is pure data: `{"id": "...", "slug": "..."}` |
| Skill files too long and comprehensive | Agent loads large skill files into context on every call, consuming token budget | Keep each skill file under 200 lines; cover the 3-5 most common task patterns only |

---

## "Looks Done But Isn't" Checklist

- [ ] **`--json` mode:** Often missing structured error output — verify `rmapi <cmd> --json` on 401, 404, 422, 500 all return valid JSON with `code` and `retriable` fields.
- [ ] **Exit codes:** Often all return 1 — verify each error class returns its designated exit code by running `rmapi <failing-cmd>; echo $?`.
- [ ] **Non-TTY detection:** Often untested — verify `rmapi recipes delete <id> < /dev/null` fails fast with a clear error rather than hanging.
- [ ] **Field projection:** Often missing on get commands — verify `rmapi recipes get <id> --fields id,name` returns only those two fields.
- [ ] **Token redaction in logs:** Often overlooked — verify that debug logging does not print the `Authorization` header value.
- [ ] **Skill file `last-verified` date:** Often omitted — verify every skill file has front matter with `last-verified` and the date matches a recent API review.
- [ ] **Skills index accuracy:** Often stale — verify every skill file listed in the index actually exists at the documented path.
- [ ] **`--yes` flag on all destructive commands:** Often added only to delete — verify `rmapi recipes lock`, `rmapi meal-plan clear`, and any other irreversible operation also accept `--yes`.
- [ ] **Pagination consistency:** Often diverges — verify `--page` and `--page-size` flags work identically on every list command.
- [ ] **Error `fields` array on validation failures:** Often missing — verify a 422 response includes which fields failed, not just that validation failed.

---

## Recovery Strategies

| Pitfall | Recovery Cost | Recovery Steps |
|---------|---------------|----------------|
| Response verbosity creep discovered late | MEDIUM | Add `--fields` flag; update all skill file examples to use projection; update tests to assert on projected shape |
| Token exposed in shell history | HIGH | Rotate the API token immediately; audit logs for unauthorized use; update `rmapi` to reject `--token` flag; re-document auth pattern in skill files |
| Skill file rot causes repeated agent failures | MEDIUM | Diff skill file examples against current `--help` output; update examples; add `last-verified` date; add CI check going forward |
| Interactive prompt deadlocks discovered in production | LOW | Add `--yes` flag; add non-TTY detection with fast fail; deploy; update skill file examples |
| Inconsistent pagination causes agent to miss records | MEDIUM | Standardize pagination envelope; update all list commands; update skill files; add pagination contract test |
| Shell injection via agent-constructed command | HIGH | Audit all agent invocation patterns; switch to argument-vector calls; add input sanitization; rotate any potentially compromised credentials |

---

## Pitfall-to-Phase Mapping

| Pitfall | Prevention Phase | Verification |
|---------|------------------|--------------|
| Response verbosity creep | CLI scaffold (Phase 1) | `rmapi recipes list --json` default output has ≤5 fields per item |
| Shell injection | CLI scaffold (Phase 1) | Security review of all subprocess calls; no `shell=True`; fuzz test with metacharacters |
| API key in shell history | CLI scaffold (Phase 1) | `rmapi --help` shows no `--token` flag; config file created with 0600 permissions |
| Skill file rot | Skill file authoring phase | CI check passes; `last-verified` dates present; command signatures match `--help` |
| Error messages for LLM consumption | CLI scaffold (Phase 1) | Every error class returns JSON with `code`, `retriable`; distinct exit codes verified |
| Interactive prompt deadlock | CLI scaffold (Phase 1) | All destructive commands have `--yes`; non-TTY fast-fail tested |
| Inconsistent pagination | CLI scaffold (Phase 1) | Single pagination contract defined; contract test passes for all list commands |
| Human-oriented test suite | CLI scaffold (Phase 1) | All tests assert on `JSON.parse(stdout)`; exit codes asserted; `--json` error paths tested |

---

## Sources

- [OWASP AI Agent Security Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/AI_Agent_Security_Cheat_Sheet.html) — HIGH confidence
- [Prompt Injection to RCE in AI Agents — Trail of Bits (2025)](https://blog.trailofbits.com/2025/10/22/prompt-injection-to-rce-in-ai-agents/) — HIGH confidence
- [Writing CLI Tools That AI Agents Actually Want to Use — DEV Community](https://dev.to/uenyioha/writing-cli-tools-that-ai-agents-actually-want-to-use-39no) — HIGH confidence
- [MCP Context Window Problem — Junia AI](https://www.junia.ai/blog/mcp-context-window-problem) — HIGH confidence
- [API Design Principles for the Agentic Era — Apideck](https://www.apideck.com/blog/api-design-principles-agentic-era) — HIGH confidence
- [Securing CLI Based AI Agent — Medium (2026)](https://medium.com/@visrow/securing-cli-based-ai-agent-c36429e88783) — MEDIUM confidence
- [NVIDIA: Practical Security Guidance for Sandboxing Agentic Workflows](https://developer.nvidia.com/blog/practical-security-guidance-for-sandboxing-agentic-workflows-and-managing-execution-risk/) — HIGH confidence
- [MITRE ATT&CK T1552.003: Unsecured Credentials — Shell History](https://attack.mitre.org/techniques/T1552/003/) — HIGH confidence
- [Handling Tool Errors and Agent Recovery — ApXML](https://apxml.com/courses/langchain-production-llm/chapter-2-sophisticated-agents-tools/agent-error-handling) — MEDIUM confidence
- [Building a 24/7 Claude Code Wrapper: Token Waste in Subprocesses — DEV Community](https://dev.to/jungjaehoon/why-claude-code-subagents-waste-50k-tokens-per-turn-and-how-to-fix-it-41ma) — MEDIUM confidence

---
*Pitfalls research for: agent-facing CLI tool (rmapi) + skill file system on existing REST API*
*Researched: 2026-03-20*
