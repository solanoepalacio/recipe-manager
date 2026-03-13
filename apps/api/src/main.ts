import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import session from 'express-session';
import connectPgSimple from 'connect-pg-simple';
import { AppModule } from './app.module';
import { PrismaExceptionFilter } from './common/filters/prisma-exception.filter';
import './auth/types/session.types';

const PgSession = connectPgSimple(session);

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.setGlobalPrefix('api');

  // Session middleware
  app.use(
    session({
      store: new PgSession({
        conString: process.env.DATABASE_URL,
        tableName: 'session',
        createTableIfMissing: false,
      }),
      secret: process.env.SESSION_SECRET ?? 'dev-secret-change-in-production',
      resave: false,
      saveUninitialized: false,
      cookie: {
        httpOnly: true,
        sameSite: 'lax',
        secure: process.env.NODE_ENV === 'production',
        maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
      },
    }),
  );

  // Global pipes
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // Global filters
  app.useGlobalFilters(new PrismaExceptionFilter());

  // Swagger/OpenAPI
  const config = new DocumentBuilder()
    .setTitle('Recipe Manager API')
    .setDescription('Recipe manager REST API')
    .setVersion('1.0')
    .addCookieAuth('session')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
