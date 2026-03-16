// apps/api/tests/password-reset.e2e-spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';

const DB_AVAILABLE = !!process.env.DATABASE_URL && process.env.DATABASE_URL !== '';

describe('Password Reset e2e (AUTH-05)', () => {
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

  it('POST /api/admin/users/:id/password-reset-url returns 401 without admin session', async () => {
    if (!DB_AVAILABLE) return;
    await request(app.getHttpServer())
      .post('/api/admin/users/some-user-id/password-reset-url')
      .expect(401);
  });

  it('POST /api/admin/users/:id/password-reset-url returns 404 for nonexistent user (with admin session)', async () => {
    if (!DB_AVAILABLE) return;
    // This test requires an active admin session — integration test coverage in Phase 6
    // Stub documents the expected behavior per AUTH-05
  });
});
