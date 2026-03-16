// apps/api/tests/admin-auth.e2e-spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';

const DB_AVAILABLE = !!process.env.DATABASE_URL && process.env.DATABASE_URL !== '';

describe('Admin Auth e2e', () => {
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

  it('POST /api/admin/auth/login returns 401 with invalid credentials', async () => {
    if (!DB_AVAILABLE) return;
    await request(app.getHttpServer())
      .post('/api/admin/auth/login')
      .send({ email: 'notadmin@example.com', password: 'wrong' })
      .expect(401);
  });
});
