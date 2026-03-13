/**
 * Integration tests for setup endpoints.
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
import { PrismaExceptionFilter } from '../../src/common/filters/prisma-exception.filter';

describe('Setup (integration)', () => {
  let app: INestApplication;
  let prisma: PrismaService;

  beforeAll(async () => {
    const moduleRef: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleRef.createNestApplication();
    app.setGlobalPrefix('api');
    app.useGlobalPipes(
      new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }),
    );
    app.useGlobalFilters(new PrismaExceptionFilter());
    app.use(
      session({
        secret: 'test-secret',
        resave: false,
        saveUninitialized: false,
        cookie: { httpOnly: true, sameSite: 'lax', secure: false },
      }),
    );
    await app.init();

    prisma = moduleRef.get<PrismaService>(PrismaService);
    // Clean up any existing admin from previous runs
    await prisma.admin.deleteMany();
  });

  afterAll(async () => {
    await prisma.admin.deleteMany();
    await app.close();
  });

  describe('GET /api/setup', () => {
    it('returns required:true when no admin exists', async () => {
      await request(app.getHttpServer())
        .get('/api/setup')
        .expect(200)
        .expect({ required: true });
    });
  });

  describe('POST /api/setup', () => {
    it('creates admin and returns response without passwordHash', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/setup')
        .send({ name: 'Test Admin', email: 'testadmin@example.com', password: 'password123' })
        .expect(201);

      expect(res.body).toHaveProperty('id');
      expect(res.body.name).toBe('Test Admin');
      expect(res.body.email).toBe('testadmin@example.com');
      expect(res.body).not.toHaveProperty('passwordHash');
    });

    it('returns required:false after admin is created', async () => {
      await request(app.getHttpServer())
        .get('/api/setup')
        .expect(200)
        .expect({ required: false });
    });

    it('returns 404 on second POST (setup already complete)', async () => {
      await request(app.getHttpServer())
        .post('/api/setup')
        .send({ name: 'Another Admin', email: 'another@example.com', password: 'password123' })
        .expect(404);
    });
  });
});
