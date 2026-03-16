import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';

/**
 * Smoke test for API-03: Swagger UI is reachable at /api/docs.
 *
 * NOTE: PrismaService.$connect() will fail if no DATABASE_URL is set.
 * We mock PrismaService to avoid needing a real database for this smoke test.
 */
describe('API smoke test (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(PrismaService)
      .useValue({ $connect: jest.fn(), $disconnect: jest.fn() })
      .compile();

    app = moduleFixture.createNestApplication();

    app.setGlobalPrefix('api');
    app.useGlobalPipes(
      new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }),
    );

    const config = new DocumentBuilder()
      .setTitle('Recipe Manager API')
      .setDescription('REST API for the Recipe Manager application')
      .setVersion('1.0')
      .build();
    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('api/docs', app, document);

    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('GET /api/docs returns 200 (Swagger UI — API-03)', async () => {
    const response = await request(app.getHttpServer())
      .get('/api/docs')
      .expect(200);
    expect(response.text).toContain('swagger');
  });

  it('GET /api/docs-json returns 200 (OpenAPI JSON spec)', async () => {
    const response = await request(app.getHttpServer())
      .get('/api/docs-json')
      .expect(200);
    expect(response.body).toHaveProperty('openapi');
    expect(response.body.info.title).toBe('Recipe Manager API');
  });
});
