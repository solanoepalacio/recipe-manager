# Phase 3: Backend Auth - Research

**Researched:** 2026-03-16
**Domain:** NestJS session auth, API key auth, guard architecture, password hashing
**Confidence:** HIGH

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| AUTH-01 | User can sign in with email or username + password | express-session + bcrypt/argon2 login flow; covered in Standard Stack and Code Examples |
| AUTH-02 | User session persists across browser refresh (persistent by default) | connect-pg-simple PostgreSQL session store with no maxAge limit; covered in Architecture Patterns |
| AUTH-03 | User can sign out | session.destroy() + cookie clear; covered in Code Examples |
| AUTH-04 | Admin can complete first-time setup wizard (creates single Admin record; wizard inaccessible after) | SetupGuard checking Admin table count; covered in Architecture Patterns |
| AUTH-05 | Admin can generate a one-time password reset URL for any user | crypto.randomBytes token → SHA-256 hash stored on User row; covered in Architecture Patterns |
| API-02 | Agent authenticates via Bearer token (API key tied to a user account) | ApiKeyAuthGuard hashing incoming token and querying ApiToken table; covered in Architecture Patterns |

</phase_requirements>

---

## Summary

Phase 3 builds a custom NestJS session-based auth system without Passport. The stack is `express-session` as middleware (applied in `main.ts`), `connect-pg-simple` as the PostgreSQL session store, and `bcrypt` (or `argon2`) for password hashing. Guards are plain `CanActivate` classes — no `@nestjs/passport` dependency — which is the right choice for a project that stores user IDs directly in session data rather than using Passport's serialization model.

The design calls for two independent session namespaces: one for regular users (`connect.sid`) and one for admins (a separate cookie name). Both use the same PostgreSQL `session` table but are kept isolated by using different `express-session` instances in `main.ts`, each with a different cookie name. The `AnyAuthGuard` is registered globally via `APP_GUARD`; routes that skip auth use `@Public()` built on `@SetMetadata`.

API key auth requires no session: on each request the guard hashes the incoming bearer token with SHA-256, queries `ApiToken.tokenHash`, loads the associated `User`, and sets `req.user`. Password reset tokens also use SHA-256 (generated raw, stored hashed, returned raw in URL).

**Primary recommendation:** Use `express-session` + `connect-pg-simple` + `bcrypt`. Implement all guards as plain `CanActivate` classes without Passport. Register `AnyAuthGuard` as `APP_GUARD` globally; `@Public()` decorator opts out.

---

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `express-session` | ^1.19.0 | Server-side session middleware | Official NestJS docs recommended approach for cookie sessions |
| `connect-pg-simple` | ^10.0.0 | PostgreSQL session store for express-session | Decided in auth design (mvp_plans/02_auth_design.md); no extra infra |
| `bcrypt` | ^5.1.x | Password hashing for User and Admin | Widely used, easy to configure, fine for new projects |
| `@types/express-session` | ^1.18.x | TypeScript types for express-session | express-session does not ship its own types |
| `@types/bcrypt` | ^5.0.x | TypeScript types for bcrypt | Required for TS compilation |
| `pg` | ^8.x | pg Pool for connect-pg-simple | connect-pg-simple requires a `pg.Pool` |
| `@types/pg` | ^8.x | TypeScript types for pg | Required for TS compilation |

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `argon2` | ^0.31.x | Alternative password hasher | Only if switching from bcrypt — bcrypt is fine for this project |
| `crypto` (Node built-in) | built-in | SHA-256 for API token and reset token hashing | Already available; no install required |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| `bcrypt` | `argon2` | argon2id is the 2025 OWASP recommendation and more GPU-resistant, but bcrypt is simpler to install (no native build complications) and is adequate for this workload. Either is acceptable. |
| Custom guards | `@nestjs/passport` | Passport adds significant conceptual overhead for a session-only app; custom `CanActivate` is simpler and fully sufficient |
| `connect-pg-simple` | Redis | Redis requires additional infra; PostgreSQL already present; design decision locks this choice |

**Installation:**
```bash
yarn workspace @recipe-manager/api add express-session connect-pg-simple bcrypt pg
yarn workspace @recipe-manager/api add -D @types/express-session @types/bcrypt @types/pg
```

---

## Architecture Patterns

### Recommended Project Structure

```
src/
├── auth/
│   ├── auth.module.ts
│   ├── auth.controller.ts         # POST /auth/login, POST /auth/logout, GET /auth/me
│   ├── auth.service.ts
│   ├── guards/
│   │   ├── any-auth.guard.ts      # AnyAuthGuard (session OR api-key; global APP_GUARD)
│   │   ├── session-auth.guard.ts  # SessionAuthGuard (checks req.session.userId)
│   │   ├── api-key.guard.ts       # ApiKeyAuthGuard (checks Bearer token → ApiToken hash)
│   │   └── admin-auth.guard.ts    # AdminAuthGuard (checks req.session.adminId)
│   └── decorators/
│       ├── public.decorator.ts    # @Public() → @SetMetadata(IS_PUBLIC_KEY, true)
│       └── current-user.decorator.ts  # @CurrentUser() → createParamDecorator
├── setup/
│   ├── setup.module.ts
│   ├── setup.controller.ts        # GET /setup, POST /setup
│   ├── setup.service.ts
│   └── guards/
│       └── setup.guard.ts         # SetupGuard (passes if Admin count === 0)
├── admin/
│   └── auth/
│       ├── admin-auth.controller.ts  # POST /admin/auth/login, POST /admin/auth/logout
│       └── admin-auth.service.ts
├── prisma/                         # already exists from Phase 1
└── common/
    └── types/
        └── session.d.ts           # express-session module augmentation
```

### Pattern 1: Global Guard with @Public() Opt-Out

**What:** Register `AnyAuthGuard` as `APP_GUARD` in `AppModule`. Mark public endpoints with `@Public()`. The guard checks `IS_PUBLIC_KEY` metadata first; if set, returns `true` immediately.

**When to use:** Every endpoint is protected by default. Login, logout, setup wizard GET, and public share endpoints use `@Public()`.

```typescript
// src/auth/decorators/public.decorator.ts
import { SetMetadata } from '@nestjs/common';
export const IS_PUBLIC_KEY = 'isPublic';
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);
```

```typescript
// src/auth/guards/any-auth.guard.ts
import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';
import { SessionAuthGuard } from './session-auth.guard';
import { ApiKeyAuthGuard } from './api-key.guard';

@Injectable()
export class AnyAuthGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly sessionGuard: SessionAuthGuard,
    private readonly apiKeyGuard: ApiKeyAuthGuard,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) return true;
    // Try session first, then API key
    const sessionOk = await this.sessionGuard.canActivate(context);
    if (sessionOk) return true;
    return this.apiKeyGuard.canActivate(context);
  }
}
```

```typescript
// app.module.ts — register globally
import { APP_GUARD } from '@nestjs/core';
@Module({
  providers: [
    { provide: APP_GUARD, useClass: AnyAuthGuard },
  ],
})
export class AppModule {}
```

### Pattern 2: Session Middleware in main.ts (Two Independent Sessions)

**What:** Apply two `express-session` middleware instances with different `name` values — one for users, one for admins. Both share the same PostgreSQL `session` table via `connect-pg-simple`. The `createTableIfMissing: true` option avoids a manual migration for the sessions table.

```typescript
// apps/api/src/main.ts — session setup (add to existing bootstrap)
import session from 'express-session';
import ConnectPgSimple from 'connect-pg-simple';
import { Pool } from 'pg';

const pgPool = new Pool({ connectionString: process.env.DATABASE_URL });
const PgStore = ConnectPgSimple(session);
const sharedStoreOptions = {
  pool: pgPool,
  createTableIfMissing: true,
};

// User session
app.use(
  session({
    name: 'connect.sid',
    store: new PgStore(sharedStoreOptions),
    secret: process.env.SESSION_SECRET!,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      // No maxAge — sessions persist until explicit logout
    },
  }),
);

// Admin session (separate cookie name)
app.use(
  session({
    name: 'admin.sid',
    store: new PgStore(sharedStoreOptions),
    secret: process.env.ADMIN_SESSION_SECRET!,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
    },
  }),
);
```

**Important note on TypeScript import:** express-session ships as CommonJS. Use `import session from 'express-session'` with `"esModuleInterop": true` in tsconfig (already set in NestJS projects). Similarly `import ConnectPgSimple from 'connect-pg-simple'`.

### Pattern 3: Session TypeScript Augmentation

**What:** Declare `express-session` module augmentation so `req.session.userId` / `req.session.adminId` are typed.

```typescript
// src/common/types/session.d.ts
import 'express-session';

declare module 'express-session' {
  interface SessionData {
    userId?: string;    // set after user login
    adminId?: string;   // set after admin login (in admin.sid cookie)
  }
}
```

### Pattern 4: SessionAuthGuard

**What:** Checks `req.session.userId`, loads user from DB, sets `req.user`.

```typescript
// src/auth/guards/session-auth.guard.ts
@Injectable()
export class SessionAuthGuard implements CanActivate {
  constructor(private readonly prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest();
    const userId = req.session?.userId;
    if (!userId) return false;
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) return false;
    req.user = user;
    return true;
  }
}
```

### Pattern 5: ApiKeyAuthGuard

**What:** Extracts `Authorization: Bearer <token>`, SHA-256 hashes it, looks up `ApiToken.tokenHash`, loads associated `User`, sets `req.user`, and updates `ApiToken.lastUsedAt`.

```typescript
// src/auth/guards/api-key.guard.ts
import { createHash } from 'crypto';

@Injectable()
export class ApiKeyAuthGuard implements CanActivate {
  constructor(private readonly prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest();
    const authHeader: string = req.headers['authorization'] ?? '';
    if (!authHeader.startsWith('Bearer ')) return false;
    const rawToken = authHeader.slice(7);
    const tokenHash = createHash('sha256').update(rawToken).digest('hex');
    const apiToken = await this.prisma.apiToken.findFirst({
      where: { tokenHash },
      include: { user: true },
    });
    if (!apiToken) return false;
    req.user = apiToken.user;
    // fire-and-forget lastUsedAt update
    void this.prisma.apiToken.update({
      where: { id: apiToken.id },
      data: { lastUsedAt: new Date() },
    });
    return true;
  }
}
```

### Pattern 6: AdminAuthGuard

**What:** Checks `req.session.adminId` (from the `admin.sid` cookie). Does NOT compose into `AnyAuthGuard` — applied directly on admin routes.

```typescript
// src/auth/guards/admin-auth.guard.ts
@Injectable()
export class AdminAuthGuard implements CanActivate {
  constructor(private readonly prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest();
    const adminId = req.session?.adminId;
    if (!adminId) return false;
    const admin = await this.prisma.admin.findUnique({ where: { id: adminId } });
    if (!admin) return false;
    req.admin = admin;
    return true;
  }
}
```

### Pattern 7: SetupGuard

**What:** Returns 404 (or blocks) if an `Admin` row already exists. Applied to both `GET /setup` and `POST /setup`. The guard itself does not block `GET /setup` — the controller returns `{ required: false }` based on admin count. The guard blocks `POST /setup` only.

**Design clarification:** Looking at the API design, `GET /setup` is `@Public()` and returns `{ required: boolean }`. `POST /setup` uses `SetupGuard` which throws `NotFoundException` if `Admin` count > 0.

```typescript
// src/setup/guards/setup.guard.ts
@Injectable()
export class SetupGuard implements CanActivate {
  constructor(private readonly prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const count = await this.prisma.admin.count();
    if (count > 0) throw new NotFoundException('Setup already complete');
    return true;
  }
}
```

### Pattern 8: @CurrentUser() Decorator

```typescript
// src/auth/decorators/current-user.decorator.ts
import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    return request.user;
  },
);
```

### Pattern 9: Password Reset Token

**What:** Admin-facing. Generate raw token, store SHA-256 hash on User, return raw token in URL. The Prisma schema uses `resetToken` (hashed) and `resetTokenExpiry` field names — note this differs from the auth design doc which used `passwordResetToken`/`passwordResetExpiresAt`. Use the actual schema field names.

```typescript
// In admin password-reset service
import { randomBytes, createHash } from 'crypto';

const rawToken = randomBytes(32).toString('hex');  // 64-char hex
const tokenHash = createHash('sha256').update(rawToken).digest('hex');
const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24h

await this.prisma.user.update({
  where: { id: userId },
  data: { resetToken: tokenHash, resetTokenExpiry: expiresAt },
});

const resetUrl = `${process.env.APP_URL}/reset-password?token=${rawToken}`;
// Return resetUrl — admin shares out-of-band
```

**Consuming the reset token (when user submits the reset form):**
```typescript
const tokenHash = createHash('sha256').update(rawToken).digest('hex');
const user = await this.prisma.user.findFirst({
  where: { resetToken: tokenHash, resetTokenExpiry: { gt: new Date() } },
});
if (!user) throw new UnauthorizedException('Invalid or expired token');
const passwordHash = await bcrypt.hash(newPassword, 12);
await this.prisma.user.update({
  where: { id: user.id },
  data: { passwordHash, resetToken: null, resetTokenExpiry: null },
});
```

### Anti-Patterns to Avoid

- **Using Passport when not needed:** Passport's session serialization/deserialization is designed for JWT round-trips. For a custom session with userId stored directly, plain `CanActivate` guards are simpler and sufficient.
- **Checking session in both guards independently:** AnyAuthGuard should try session first (cheaper — no DB query for the hash), then fall back to API key. Don't check both unconditionally.
- **Storing full user object in session:** Store only `userId` in the session. Load the user from DB in the guard. This avoids stale session data after profile updates.
- **Using `saveUninitialized: true`:** This creates a session row for every unauthenticated request, polluting the session table. Keep `saveUninitialized: false`.
- **No cookie `httpOnly`:** Session cookies must be `httpOnly: true` to prevent XSS access. This is the default in express-session but worth verifying.
- **Single `express-session` instance for both user and admin:** Two separate instances with different `name` options is the correct approach to prevent cookie collision.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Session store | Custom PostgreSQL session persistence | `connect-pg-simple` | Handles TTL, concurrent cleanup, table schema |
| Password hashing | Custom bcrypt/argon2 equivalent | `bcrypt` or `argon2` npm | Timing-safe comparison, correct salt rounds |
| Session middleware | Custom cookie/session parsing | `express-session` | Handles cookie signing, regeneration, destruction |
| Token hashing | Custom hex encoding | Node.js `crypto.createHash('sha256')` | Built-in, well-tested, no install needed |

**Key insight:** Session management and password hashing both have hard-to-reproduce security properties (timing attacks, salt management, session fixation protection). Use the libraries that implement these correctly.

---

## Common Pitfalls

### Pitfall 1: Two express-session Instances Overwriting Each Other's Cookie

**What goes wrong:** If both session middlewares use the same cookie name (`connect.sid`), the second one overwrites the first on every response — user session is destroyed on admin login.

**Why it happens:** Middleware order matters; both are applied globally, and the same `Set-Cookie` header name causes collision.

**How to avoid:** Set `name: 'connect.sid'` for user sessions and `name: 'admin.sid'` for admin sessions explicitly.

**Warning signs:** User gets logged out when admin logs in from same browser.

### Pitfall 2: connect-pg-simple Missing Session Table

**What goes wrong:** First request fails with `relation "session" does not exist`.

**Why it happens:** connect-pg-simple requires a `session` table and does not auto-create it unless `createTableIfMissing: true` is set.

**How to avoid:** Use `createTableIfMissing: true` in the store options, OR manually run the `table.sql` from the connect-pg-simple package.

**Warning signs:** 500 error on first authenticated request after fresh DB.

### Pitfall 3: TypeScript Import Error with express-session

**What goes wrong:** `import session from 'express-session'` fails to compile (`Module has no default export`).

**Why it happens:** express-session is a CommonJS module; TypeScript needs `esModuleInterop: true` to treat it as a default import.

**How to avoid:** Verify `"esModuleInterop": true` is in `tsconfig.json` (NestJS default is true). Alternative: `import * as session from 'express-session'`.

**Warning signs:** TS2613 or TS1259 errors at compile time.

### Pitfall 4: AnyAuthGuard Ordering — API Key Guard Running on Every Request

**What goes wrong:** `ApiKeyAuthGuard.canActivate()` makes a DB query on every request, even those authenticated by session cookie — unnecessary DB load.

**Why it happens:** AnyAuthGuard calls both guards regardless of session status.

**How to avoid:** Short-circuit — check session guard first, only call API key guard if session fails.

**Warning signs:** Elevated DB query count on session-authenticated requests.

### Pitfall 5: Session Data Stale After User Update

**What goes wrong:** User changes their email; the session still shows old email because the full user object was stored in the session.

**Why it happens:** Storing the full User row in the session bypasses the DB on subsequent requests.

**How to avoid:** Store only `userId` in session. Always reload from DB in `SessionAuthGuard.canActivate()`.

### Pitfall 6: Prisma Schema Field Names Differ from Design Doc

**What goes wrong:** Code references `passwordResetToken` or `passwordResetExpiresAt` (from the auth design doc) but the actual Prisma schema uses `resetToken` and `resetTokenExpiry`.

**Why it happens:** Phase 2 used abbreviated field names. The design doc was written before the schema was finalized.

**How to avoid:** Always reference the live `schema.prisma`. The correct field names are `resetToken` (String?) and `resetTokenExpiry` (DateTime?).

---

## Code Examples

### Login Handler (no Passport)

```typescript
// src/auth/auth.controller.ts
@Public()
@Post('login')
async login(@Body() dto: LoginDto, @Req() req: Request): Promise<MeResponse> {
  const user = await this.authService.validateUser(dto.email, dto.username, dto.password);
  if (!user) throw new UnauthorizedException('Invalid credentials');
  req.session.userId = user.id;  // store only the ID
  return toMeResponse(user);
}
```

### Logout Handler

```typescript
@Post('logout')
async logout(@Req() req: Request, @Res({ passthrough: true }) res: Response): Promise<LogoutResponse> {
  await new Promise<void>((resolve, reject) =>
    req.session.destroy((err) => (err ? reject(err) : resolve()))
  );
  res.clearCookie('connect.sid');
  return { message: 'Logged out' };
}
```

### Admin Login Handler

```typescript
// POST /admin/auth/login — applied directly, no global guard interference
@Public()
@Post('admin/auth/login')
async adminLogin(@Body() dto: AdminLoginDto, @Req() req: Request): Promise<{ message: string }> {
  const admin = await this.adminAuthService.validateAdmin(dto.email, dto.password);
  if (!admin) throw new UnauthorizedException();
  req.session.adminId = admin.id;
  return { message: 'Admin authenticated' };
}
```

### bcrypt Usage

```typescript
import * as bcrypt from 'bcrypt';
const SALT_ROUNDS = 12;

// Hashing
const hash = await bcrypt.hash(plainPassword, SALT_ROUNDS);

// Verification
const valid = await bcrypt.compare(plainPassword, storedHash);
```

### Guard Unit Test Pattern

```typescript
// src/auth/guards/session-auth.guard.spec.ts
describe('SessionAuthGuard', () => {
  let guard: SessionAuthGuard;
  let prisma: { user: { findUnique: jest.Mock } };

  beforeEach(() => {
    prisma = { user: { findUnique: jest.fn() } };
    guard = new SessionAuthGuard(prisma as any);
  });

  function mockContext(session: Record<string, unknown>) {
    return {
      switchToHttp: () => ({
        getRequest: () => ({ session }),
      }),
    } as ExecutionContext;
  }

  it('returns false when no userId in session', async () => {
    expect(await guard.canActivate(mockContext({}))).toBe(false);
  });

  it('returns true and sets req.user when valid session', async () => {
    const user = { id: 'u1', name: 'Test' };
    prisma.user.findUnique.mockResolvedValue(user);
    const req: any = { session: { userId: 'u1' } };
    const ctx = { switchToHttp: () => ({ getRequest: () => req }) } as ExecutionContext;
    expect(await guard.canActivate(ctx)).toBe(true);
    expect(req.user).toBe(user);
  });
});
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `@nestjs/passport` for all auth | Custom `CanActivate` guards for session auth | 2023+ | Passport adds unnecessary overhead for session-only apps; custom guards are simpler |
| bcrypt as the default password hasher | argon2id recommended by OWASP 2025 | OWASP 2024 update | bcrypt is still acceptable; argon2id is preferred for new projects |
| Manual session table creation | `createTableIfMissing: true` in connect-pg-simple | connect-pg-simple v7+ | Eliminates a one-time manual setup step |

**Deprecated/outdated:**
- `@types/express-session` as a separate package: express-session still needs it (does not yet bundle its own types as of v1.19.0)
- `req.isAuthenticated()`: Passport-only method. Not available without Passport. Use `req.session.userId` directly.

---

## Open Questions

1. **`APP_URL` environment variable for reset URL generation**
   - What we know: The password reset URL needs a base URL (e.g. `https://app.example.com/reset-password?token=...`)
   - What's unclear: Where this is configured — no `.env` convention has been established yet
   - Recommendation: Add `APP_URL` to `.env.example`; use `process.env.APP_URL` in the password reset service

2. **Session secret management**
   - What we know: Two separate secrets are needed (`SESSION_SECRET`, `ADMIN_SESSION_SECRET`)
   - What's unclear: Whether a single secret is acceptable for both sessions
   - Recommendation: Use two separate environment variables for defense-in-depth; add both to `.env.example`

---

## Validation Architecture

### Test Framework

| Property | Value |
|----------|-------|
| Framework | Jest 29 + ts-jest |
| Config file | `apps/api/jest.config.ts` (unit), `apps/api/test/jest-e2e.json` (e2e) |
| Quick run command | `yarn workspace @recipe-manager/api test` |
| Full suite command | `yarn workspace @recipe-manager/api test && yarn workspace @recipe-manager/api test:e2e` |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| AUTH-01 | Login with email+password returns session cookie | unit + e2e | `yarn workspace @recipe-manager/api test --testPathPattern=auth` | ❌ Wave 0 |
| AUTH-02 | Session persists across requests (connect-pg-simple) | integration | `yarn workspace @recipe-manager/api test:integration` | ❌ Wave 0 |
| AUTH-03 | Logout destroys session | unit + e2e | `yarn workspace @recipe-manager/api test --testPathPattern=auth` | ❌ Wave 0 |
| AUTH-04 | POST /setup creates Admin; 404 after | unit + e2e | `yarn workspace @recipe-manager/api test --testPathPattern=setup` | ❌ Wave 0 |
| AUTH-05 | Password reset URL endpoint returns raw token; using URL clears token fields | unit | `yarn workspace @recipe-manager/api test --testPathPattern=admin` | ❌ Wave 0 |
| API-02 | Bearer token authenticates as associated user | unit | `yarn workspace @recipe-manager/api test --testPathPattern=api-key` | ❌ Wave 0 |

### Sampling Rate

- **Per task commit:** `yarn workspace @recipe-manager/api test` (unit suite only)
- **Per wave merge:** `yarn workspace @recipe-manager/api test && yarn workspace @recipe-manager/api test:e2e`
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps

- [ ] `apps/api/src/auth/guards/session-auth.guard.spec.ts` — covers AUTH-01, AUTH-03
- [ ] `apps/api/src/auth/guards/api-key.guard.spec.ts` — covers API-02
- [ ] `apps/api/src/auth/guards/any-auth.guard.spec.ts` — covers AUTH-01, API-02 (guard composition)
- [ ] `apps/api/src/auth/guards/admin-auth.guard.spec.ts` — covers admin session auth
- [ ] `apps/api/src/setup/guards/setup.guard.spec.ts` — covers AUTH-04
- [ ] `apps/api/src/auth/auth.service.spec.ts` — covers AUTH-01, AUTH-05
- [ ] `apps/api/tests/auth.e2e-spec.ts` — end-to-end: login, logout, /auth/me, Bearer token
- [ ] `apps/api/tests/setup.e2e-spec.ts` — end-to-end: POST /setup, second POST returns 404

---

## Sources

### Primary (HIGH confidence)

- NestJS official docs (docs.nestjs.com/techniques/session) — session middleware setup
- NestJS official docs (docs.nestjs.com/guards) — CanActivate, APP_GUARD, Reflector pattern
- NestJS official docs (docs.nestjs.com/custom-decorators) — createParamDecorator
- connect-pg-simple README (github.com/voxpelli/node-connect-pg-simple) — version 10.0.0, createTableIfMissing option
- Project: `apps/api/prisma/schema.prisma` — actual field names (resetToken, resetTokenExpiry)
- Project: `mvp_plans/02_auth_design.md` — locked auth design decisions
- Project: `mvp_plans/03_api_design.md` — endpoint contract

### Secondary (MEDIUM confidence)

- WebSearch: express-session v1.19.0 current version (cross-referenced with npm page)
- WebSearch: @types/express-session v1.18.x (cross-referenced with npm page)
- WebSearch: bcrypt vs argon2 2025 — OWASP recommends argon2id for new projects; bcrypt acceptable
- WebSearch: session TypeScript augmentation `declare module 'express-session'` pattern — consistent across multiple sources

### Tertiary (LOW confidence)

- Two independent express-session instances for user/admin separation — pattern inferred from express-session `name` option documentation; not tested directly. Needs verification during implementation that both cookies are sent independently.

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — locked by design doc; libraries are established npm packages
- Architecture: HIGH — guard patterns from official NestJS docs; session pattern from official express-session docs
- Pitfalls: MEDIUM-HIGH — most derived from known express-session and session-store behavior; dual-session pitfall is LOW (not independently verified)
- Prisma field names: HIGH — read directly from `schema.prisma`

**Research date:** 2026-03-16
**Valid until:** 2026-04-16 (stable libraries; connect-pg-simple and express-session are mature)
