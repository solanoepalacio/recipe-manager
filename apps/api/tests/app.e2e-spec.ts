/**
 * Smoke test for API-03: Swagger UI is reachable at /api/docs.
 *
 * NOTE: This test imports AppModule which is created in Plan 03.
 * Until Plan 03 runs, this file exists as a scaffold.
 * The import will resolve once apps/api/src/app.module.ts is created.
 */
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import * as request from 'supertest';
// AppModule is created in Plan 03
// import { AppModule } from '../src/app.module';

describe('API smoke test (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    // Placeholder: will import AppModule after Plan 03 creates it.
    // For now, skip setup to allow the file to parse without errors.
  });

  afterAll(async () => {
    if (app) await app.close();
  });

  it('placeholder — wired to AppModule in Plan 03', () => {
    expect(true).toBe(true);
  });
});
