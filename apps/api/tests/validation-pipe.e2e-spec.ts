// apps/api/tests/validation-pipe.e2e-spec.ts
//
// Proves the global ValidationPipe returns ALL validation errors from a single
// request (top-level AND nested arrays), not just the first. Uses approach (a)
// from the plan: authenticate via the existing email/password login flow, then
// send invalid payloads to POST /api/recipes (which uses CreateRecipeDto, a DTO
// with both top-level constraints and a @ValidateNested({ each: true }) array).
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { NestExpressApplication } from '@nestjs/platform-express';
import request from 'supertest';
import session from 'express-session';
import ConnectPgSimple from 'connect-pg-simple';
import { Pool } from 'pg';
import * as bcrypt from 'bcrypt';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';

const DB_AVAILABLE = !!process.env.DATABASE_URL && process.env.DATABASE_URL !== '';

describe('ValidationPipe e2e (VALIDATION-ALL-ERRORS)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let sessionCookie: string;
  const testEmail = `vp-test-${Date.now()}@example.com`;
  const testPassword = 'password123';
  let createdUserId: string | undefined;
  let createdHouseholdId: string | undefined;

  beforeAll(async () => {
    if (!DB_AVAILABLE) return;

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication<NestExpressApplication>();
    app.setGlobalPrefix('api');

    // Mirror production ValidationPipe options EXACTLY (see apps/api/src/main.ts).
    // Diverging here would invalidate the proof of production behavior.
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
        stopAtFirstError: false,
      }),
    );

    // Register session middleware (mirrors main.ts) so that the login endpoint
    // can persist req.session.userId and subsequent requests are authenticated.
    const pgPool = new Pool({ connectionString: process.env.DATABASE_URL });
    const PgStore = ConnectPgSimple(session);
    app.use(
      session({
        name: 'connect.sid',
        store: new PgStore({ pool: pgPool, createTableIfMissing: true }),
        secret: process.env.SESSION_SECRET ?? 'test-secret',
        resave: false,
        saveUninitialized: false,
        cookie: { httpOnly: true, secure: false },
      }),
    );

    await app.init();

    prisma = app.get(PrismaService);

    // Seed a household and a user we can log in as.
    const household = await prisma.household.create({ data: { name: 'VP Test HH' } });
    createdHouseholdId = household.id;

    const user = await prisma.user.create({
      data: {
        email: testEmail,
        passwordHash: await bcrypt.hash(testPassword, 10),
        name: 'VP Test User',
        householdId: household.id,
        gender: 'other',
        dateOfBirth: new Date('1990-01-01'),
      },
    });
    createdUserId = user.id;

    // Login to obtain a session cookie.
    const loginRes = await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({ email: testEmail, password: testPassword })
      .expect(200);

    const rawCookie = loginRes.headers['set-cookie'];
    const cookies = Array.isArray(rawCookie) ? rawCookie : rawCookie ? [rawCookie] : [];
    const connectSid = cookies.find((c: string) => c.startsWith('connect.sid='));
    if (!connectSid) {
      throw new Error('Login did not return a connect.sid cookie; cannot authenticate test requests');
    }
    sessionCookie = connectSid.split(';')[0];
  });

  afterAll(async () => {
    if (!DB_AVAILABLE) return;
    try {
      if (createdUserId) await prisma.user.deleteMany({ where: { id: createdUserId } });
      if (createdHouseholdId) await prisma.household.deleteMany({ where: { id: createdHouseholdId } });
    } catch {
      // best-effort cleanup
    }
    if (app) await app.close();
  });

  it('top-level: returns all errors for multiple invalid top-level fields', async () => {
    if (!DB_AVAILABLE) return;

    const res = await request(app.getHttpServer())
      .post('/api/recipes')
      .set('Cookie', sessionCookie)
      .send({ name: 123, servingsQty: -5, prepTime: 'fast', sourceUrl: 'not-a-url' })
      .expect(400);

    expect(res.body.statusCode).toBe(400);
    expect(res.body.error).toBe('Bad Request');
    expect(Array.isArray(res.body.message)).toBe(true);

    const messages: string[] = res.body.message;
    expect(messages.length).toBeGreaterThanOrEqual(4);

    expect(messages.some((m) => /\bname\b/.test(m))).toBe(true);
    expect(messages.some((m) => /\bservingsQty\b/.test(m))).toBe(true);
    expect(messages.some((m) => /\bprepTime\b/.test(m))).toBe(true);
    expect(messages.some((m) => /\bsourceUrl\b/.test(m))).toBe(true);
  });

  it('nested array: returns all errors across multiple invalid ingredients[]', async () => {
    if (!DB_AVAILABLE) return;

    const res = await request(app.getHttpServer())
      .post('/api/recipes')
      .set('Cookie', sessionCookie)
      .send({
        name: 'Valid Name',
        ingredients: [
          { foodId: 42, quantity: -1 },
          { foodId: 'ok', quantity: 'lots' },
        ],
      })
      .expect(400);

    expect(res.body.statusCode).toBe(400);
    expect(res.body.error).toBe('Bad Request');
    expect(Array.isArray(res.body.message)).toBe(true);

    const messages: string[] = res.body.message;
    expect(messages.length).toBeGreaterThanOrEqual(3);

    // class-validator nested-path formatting can be either dot-style ("ingredients.0.foodId")
    // or bracket-style ("ingredients[0].foodId") — accept either.
    expect(messages.some((m) => /ingredients\W*0\W*foodId/.test(m))).toBe(true);
    expect(messages.some((m) => /ingredients\W*0\W*quantity/.test(m))).toBe(true);
    expect(messages.some((m) => /ingredients\W*1\W*quantity/.test(m))).toBe(true);
  });
});
