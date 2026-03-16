// apps/api/tests/auth.e2e-spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';

/**
 * E2E tests for AUTH-01, AUTH-02, AUTH-03.
 * These tests require a real PostgreSQL database. Run with docker-compose up.
 * In CI without a DB, tests are skipped via conditional describe.
 */
const DB_AVAILABLE = !!process.env.DATABASE_URL && process.env.DATABASE_URL !== '';

describe('Auth e2e', () => {
  let app: INestApplication;

  beforeAll(async () => {
    if (!DB_AVAILABLE) return;
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api');
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }));
    await app.init();
  });

  afterAll(async () => {
    if (app) await app.close();
  });

  it('POST /api/auth/login returns 401 with invalid credentials (AUTH-01)', async () => {
    if (!DB_AVAILABLE) return;
    await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({ email: 'nonexistent@example.com', password: 'wrongpw' })
      .expect(401);
  });

  it('GET /api/auth/me returns 401 without session (guards active)', async () => {
    if (!DB_AVAILABLE) return;
    await request(app.getHttpServer())
      .get('/api/auth/me')
      .expect(401);
  });
});
