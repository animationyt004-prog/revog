import { ValidationPipe, Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import cookieParser from 'cookie-parser';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { bufferLogs: false });

  // Parses the httpOnly refresh-token cookie on auth routes.
  app.use(cookieParser());

  // All routes are served under /api (e.g. /api/health).
  app.setGlobalPrefix('api');

  // Strip unknown fields, reject extras, and coerce DTO types.
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  // CORS — only allow the configured frontend origins. Credentials on so the
  // httpOnly refresh-token cookie can flow.
  const origins = (process.env.CORS_ORIGINS ?? 'http://localhost:3000')
    .split(',')
    .map((o) => o.trim())
    .filter(Boolean);
  app.enableCors({ origin: origins, credentials: true });

  const port = Number(process.env.PORT ?? 3001);
  await app.listen(port, '0.0.0.0');
  Logger.log(`NO CURFEW API listening on http://localhost:${port}/api`, 'Bootstrap');
}

void bootstrap();
