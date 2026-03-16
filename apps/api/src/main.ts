import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import session from 'express-session';
import ConnectPgSimple from 'connect-pg-simple';
import { Pool } from 'pg';
import { join } from 'path';
import * as fs from 'fs';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  // Ensure uploads directory exists (created fresh on each deploy)
  const uploadsDir = join(process.cwd(), 'uploads');
  fs.mkdirSync(uploadsDir, { recursive: true });
  // Serve uploaded images at /uploads/* (no new package — NestExpressApplication built-in)
  app.useStaticAssets(uploadsDir, { prefix: '/uploads' });

  app.setGlobalPrefix('api');

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
    }),
  );

  // Session store — shared PostgreSQL pool; createTableIfMissing avoids manual migration
  const pgPool = new Pool({ connectionString: process.env.DATABASE_URL });
  const PgStore = ConnectPgSimple(session);
  const sharedStoreOptions = {
    pool: pgPool,
    createTableIfMissing: true,
  };

  // User session (connect.sid)
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
        // No maxAge — sessions persist until explicit logout (AUTH-02)
      },
    }),
  );

  // Admin session (admin.sid — separate name prevents cookie collision)
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

  const config = new DocumentBuilder()
    .setTitle('Recipe Manager API')
    .setDescription('REST API for the Recipe Manager application')
    .setVersion('1.0')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  await app.listen(process.env.PORT ?? 3001);
}

bootstrap();
