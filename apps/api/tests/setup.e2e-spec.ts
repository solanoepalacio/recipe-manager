// apps/api/tests/setup.e2e-spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';

const DB_AVAILABLE = !!process.env.DATABASE_URL && process.env.DATABASE_URL !== '';

describe('Setup e2e (AUTH-04)', () => {
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

  it('GET /api/setup is publicly accessible (no session required)', async () => {
    if (!DB_AVAILABLE) return;
    const res = await request(app.getHttpServer())
      .get('/api/setup')
      .expect(200);
    expect(res.body).toHaveProperty('required');
    expect(typeof res.body.required).toBe('boolean');
  });

  it('POST /api/setup with invalid body returns 400', async () => {
    if (!DB_AVAILABLE) return;
    await request(app.getHttpServer())
      .post('/api/setup')
      .send({ name: '', email: 'not-an-email', password: 'short' })
      .expect(400);
  });
});
