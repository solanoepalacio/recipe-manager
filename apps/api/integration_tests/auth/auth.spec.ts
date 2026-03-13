/**
 * Integration tests for auth endpoints.
 * These require a running PostgreSQL test database.
 * Marked as pending if DB is not available.
 */
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
// eslint-disable-next-line @typescript-eslint/no-require-imports
const session = require('express-session') as typeof import('express-session');
import { AppModule } from '../../src/app.module';
import { PrismaService } from '../../src/prisma/prisma.service';
import * as bcrypt from 'bcrypt';

describe('Auth endpoints (integration)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let householdId: string;
  let userId: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api');
    app.useGlobalPipes(
      new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }),
    );

    // In-memory session store for tests
    app.use(
      session({
        secret: 'test-secret',
        resave: false,
        saveUninitialized: false,
        cookie: { httpOnly: true, sameSite: 'lax', secure: false },
      }),
    );

    await app.init();

    prisma = moduleFixture.get<PrismaService>(PrismaService);

    // Seed test data
    const passwordHash = await bcrypt.hash('test-password', 10);
    const household = await prisma.household.create({
      data: { name: 'Test Household' },
    });
    householdId = household.id;

    const user = await prisma.user.create({
      data: {
        householdId,
        name: 'Test User',
        email: 'testuser@example.com',
        username: 'testuser',
        passwordHash,
      },
    });
    userId = user.id;
  });

  afterAll(async () => {
    // Clean up test data
    await prisma.user.deleteMany({ where: { id: userId } });
    await prisma.household.deleteMany({ where: { id: householdId } });
    await app.close();
  });

  describe('POST /api/auth/login', () => {
    it('returns 200 with user data on valid credentials', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({ login: 'testuser@example.com', password: 'test-password' })
        .expect(200);

      expect(res.body).toMatchObject({
        id: userId,
        name: 'Test User',
        email: 'testuser@example.com',
        username: 'testuser',
        householdId,
      });
    });

    it('returns 200 when logging in with username', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({ login: 'testuser', password: 'test-password' })
        .expect(200);

      expect(res.body.id).toBe(userId);
    });

    it('returns 401 on wrong password', async () => {
      await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({ login: 'testuser@example.com', password: 'wrong-password' })
        .expect(401);
    });

    it('returns 401 on unknown user', async () => {
      await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({ login: 'nobody@example.com', password: 'test-password' })
        .expect(401);
    });

    it('returns 400 on missing fields', async () => {
      await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({ login: 'testuser@example.com' })
        .expect(400);
    });
  });

  describe('GET /api/auth/me', () => {
    it('returns 200 with user data when authenticated via session', async () => {
      // First login to get a session cookie
      const loginRes = await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({ login: 'testuser@example.com', password: 'test-password' })
        .expect(200);

      const cookie = loginRes.headers['set-cookie'];

      const meRes = await request(app.getHttpServer())
        .get('/api/auth/me')
        .set('Cookie', cookie)
        .expect(200);

      expect(meRes.body).toMatchObject({
        id: userId,
        name: 'Test User',
      });
    });

    it('returns 401 when not authenticated', async () => {
      await request(app.getHttpServer()).get('/api/auth/me').expect(401);
    });
  });

  describe('POST /api/auth/logout', () => {
    it('returns 200 and clears session', async () => {
      // First login
      const loginRes = await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({ login: 'testuser@example.com', password: 'test-password' })
        .expect(200);

      const cookie = loginRes.headers['set-cookie'];

      // Logout
      const logoutRes = await request(app.getHttpServer())
        .post('/api/auth/logout')
        .set('Cookie', cookie)
        .expect(200);

      expect(logoutRes.body).toEqual({ message: 'Logged out' });

      // Session should be invalidated
      await request(app.getHttpServer())
        .get('/api/auth/me')
        .set('Cookie', cookie)
        .expect(401);
    });
  });
});
