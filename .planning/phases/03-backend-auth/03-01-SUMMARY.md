---
phase: 03-backend-auth
plan: "01"
subsystem: auth
tags: [nestjs, guards, session, api-key, sha256, prisma, decorators]

# Dependency graph
requires:
  - phase: 02-database-schema-prisma
    provides: PrismaService with User, Admin, ApiToken models; PrismaModule is @Global()
provides:
  - SessionAuthGuard: checks req.session.userId, loads User, sets req.user
  - ApiKeyAuthGuard: SHA-256 hashes Bearer token, looks up ApiToken, sets req.user
  - AnyAuthGuard: global APP_GUARD, respects @Public(), short-circuits on session pass
  - AdminAuthGuard: checks req.session.adminId, loads Admin, sets req.admin
  - IS_PUBLIC_KEY and @Public() decorator for opt-out routes
  - "@CurrentUser() param decorator returning req.user"
  - session.d.ts type augmentation for express-session SessionData
  - AuthModule registered as global APP_GUARD provider
affects:
  - 03-backend-auth (all subsequent plans depend on these guards)
  - 04-auth-endpoints (implements login/logout using SessionAuthGuard flow)
  - all feature modules (protected by AnyAuthGuard globally)

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "APP_GUARD pattern: AnyAuthGuard registered globally via APP_GUARD token in AuthModule"
    - "Short-circuit auth: AnyAuthGuard tries session first, only calls ApiKeyGuard on session miss"
    - "Fire-and-forget update: void prisma.apiToken.update() for lastUsedAt without blocking response"
    - "SHA-256 token hashing: raw Bearer token hashed via Node crypto before DB lookup"
    - "Opt-out public routes: @Public() SetMetadata decorator with IS_PUBLIC_KEY = 'isPublic'"

key-files:
  created:
    - apps/api/src/common/types/session.d.ts
    - apps/api/src/auth/decorators/public.decorator.ts
    - apps/api/src/auth/decorators/current-user.decorator.ts
    - apps/api/src/auth/guards/session-auth.guard.ts
    - apps/api/src/auth/guards/api-key.guard.ts
    - apps/api/src/auth/guards/any-auth.guard.ts
    - apps/api/src/auth/guards/admin-auth.guard.ts
    - apps/api/src/auth/guards/session-auth.guard.spec.ts
    - apps/api/src/auth/guards/api-key.guard.spec.ts
    - apps/api/src/auth/guards/any-auth.guard.spec.ts
    - apps/api/src/auth/guards/admin-auth.guard.spec.ts
    - apps/api/src/auth/auth.module.ts
  modified:
    - apps/api/src/app.module.ts

key-decisions:
  - "AnyAuthGuard registered as APP_GUARD globally — all routes protected by default, @Public() used to opt out"
  - "Short-circuit ordering: session auth checked first, API key only attempted on session miss — avoids redundant DB lookups"
  - "ApiToken lastUsedAt updated fire-and-forget (void) — non-blocking, acceptable if update occasionally lost"
  - "session.d.ts uses ts-ignore on express-session import — express-session installed in Plan 02"

patterns-established:
  - "Guard constructor injection: guards receive PrismaService directly via constructor (no @InjectRepository)"
  - "req.user set by whichever guard authenticates first — downstream handlers use @CurrentUser() decorator"
  - "req.admin set separately from req.user — admin routes check req.admin, not req.user"

requirements-completed: [AUTH-01, AUTH-02, API-02]

# Metrics
duration: 3min
completed: 2026-03-16
---

# Phase 03 Plan 01: Auth Guards Infrastructure Summary

**Four NestJS auth guards (session, API key, any-auth global, admin) with @Public() opt-out and @CurrentUser() decorator — 14 unit tests all passing**

## Performance

- **Duration:** 3 min
- **Started:** 2026-03-16T12:32:11Z
- **Completed:** 2026-03-16T12:34:52Z
- **Tasks:** 3
- **Files modified:** 13

## Accomplishments
- Four CanActivate guards covering all auth strategies (session cookie, Bearer API key, combined any-auth, admin session)
- AnyAuthGuard registered as global APP_GUARD — all routes protected by default with @Public() opt-out
- 14 unit tests passing (3 session + 4 API key + 4 any-auth + 3 admin) using pure constructor injection for easy mocking
- SessionData type augmentation prepared for express-session (installed in Plan 02)

## Task Commits

Each task was committed atomically:

1. **Task 1: Session type augmentation + @Public() and @CurrentUser() decorators** - `f3c228d` (feat)
2. **Task 2: RED - Failing guard unit tests** - `9c855f8` (test)
3. **Task 2: GREEN - Four auth guard implementations** - `85b4d09` (feat)
4. **Task 3: AuthModule wiring + AppModule import** - `7e463f6` (feat)

_Note: TDD Task 2 has two commits (test RED → feat GREEN)_

## Files Created/Modified
- `apps/api/src/common/types/session.d.ts` - Module augmentation for express-session SessionData (userId, adminId)
- `apps/api/src/auth/decorators/public.decorator.ts` - IS_PUBLIC_KEY constant and @Public() SetMetadata decorator
- `apps/api/src/auth/decorators/current-user.decorator.ts` - @CurrentUser() createParamDecorator returning req.user
- `apps/api/src/auth/guards/session-auth.guard.ts` - Session cookie auth via req.session.userId + Prisma user lookup
- `apps/api/src/auth/guards/api-key.guard.ts` - Bearer token auth via SHA-256 hash + ApiToken lookup + lastUsedAt update
- `apps/api/src/auth/guards/any-auth.guard.ts` - Global guard: @Public() bypass, session-first short-circuit
- `apps/api/src/auth/guards/admin-auth.guard.ts` - Admin session auth via req.session.adminId + Prisma admin lookup
- `apps/api/src/auth/guards/session-auth.guard.spec.ts` - 3 unit tests
- `apps/api/src/auth/guards/api-key.guard.spec.ts` - 4 unit tests
- `apps/api/src/auth/guards/any-auth.guard.spec.ts` - 4 unit tests
- `apps/api/src/auth/guards/admin-auth.guard.spec.ts` - 3 unit tests
- `apps/api/src/auth/auth.module.ts` - AuthModule with APP_GUARD and all guard exports
- `apps/api/src/app.module.ts` - Added AuthModule to imports

## Decisions Made
- AnyAuthGuard registered as APP_GUARD globally — all routes protected by default; @Public() decorator used for opt-out (login, setup routes)
- Session auth checked before API key auth in AnyAuthGuard — most requests are session-based, avoids unnecessary DB lookups
- ApiToken lastUsedAt update is fire-and-forget (void) — non-blocking; occasional loss acceptable for this tracking field
- session.d.ts uses `// @ts-ignore` on express-session import — package not yet installed; reinstated in Plan 02

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed AnyAuthGuard spec ctx mock missing getHandler/getClass methods**
- **Found during:** Task 2 GREEN phase (running tests after implementation)
- **Issue:** The spec used `const ctx = {} as ExecutionContext` — JavaScript evaluates arguments before calling functions, so `context.getHandler()` was called even though `reflector.getAllAndOverride` was mocked. Caused `TypeError: context.getHandler is not a function` on the "both guards fail" test.
- **Fix:** Added `getHandler: () => ({})` and `getClass: () => ({})` to the ctx mock in any-auth.guard.spec.ts
- **Files modified:** apps/api/src/auth/guards/any-auth.guard.spec.ts
- **Verification:** All 14 tests pass after fix
- **Committed in:** `85b4d09` (Task 2 feat commit)

---

**Total deviations:** 1 auto-fixed (Rule 1 - spec bug)
**Impact on plan:** Fix was necessary for test correctness. No scope creep. All planned behavior still tested.

## Issues Encountered
- None beyond the spec mock fix documented above.

## User Setup Required
None - no external service configuration required. express-session is not yet installed; that is Plan 02's job.

## Next Phase Readiness
- All four guards and decorators ready for use in Plan 02 (auth HTTP endpoints)
- AuthModule is importable; AnyAuthGuard active as APP_GUARD globally
- Plan 02 will: install express-session, configure session middleware in main.ts, and implement login/logout endpoints

---
*Phase: 03-backend-auth*
*Completed: 2026-03-16*
