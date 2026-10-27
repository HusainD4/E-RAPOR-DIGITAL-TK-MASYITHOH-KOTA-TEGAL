import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import * as cookieParser from 'cookie-parser';
import { AppModule } from './app.module';
import { GlobalExceptionFilter } from './common/filters/http-exception.filter';
import { TransformInterceptor } from './common/interceptors/transform.interceptor';
import { AuditLogInterceptor } from './common/interceptors/audit-log.interceptor';
import { AuditTrailService } from './modules/audit-trail/audit-trail.service';
import { IpDomainWhitelistGuard } from './common/guards/whitelist.guard';
import { PrismaService } from './modules/prisma/prisma.service';
import { RedisService } from './modules/redis/redis.service';

async function bootstrap() {
  const logger = new Logger('ServerCoreBootstrap');
  const app = await NestFactory.create(AppModule);

  // Parse cookies (required for HttpOnly auth tokens)
  app.use(cookieParser());

  // 1. Enable CORS dengan dukungan Preflight (OPTIONS) secara lengkap
  app.enableCors({
    origin: (origin, callback) => {
      // Allow requests with no origin (mobile apps, curl, server-to-server)
      if (!origin) return callback(null, true);

      // In dev mode, izinkan localhost & 127.0.0.1 (termasuk port Vite/React)
      if (process.env.NODE_ENV !== 'production') {
        return callback(null, true);
      }

      const allowedDomains = [
        'tk-rapor.masyithohkotategal.my.id',
        'tk-rapor-api.masyithohkotategal.my.id',
        'tk-wa.masyithohkotategal.my.id',
        'tk-ai.masyithohkotategal.my.id',
      ];
      const isAllowed = allowedDomains.some((d) => origin.includes(d));
      return callback(null, isAllowed);
    },
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: [
      'Content-Type',
      'Authorization',
      'Accept',
      'X-Requested-With',
      'Origin',
    ],
    credentials: true,
    preflightContinue: false,
    optionsSuccessStatus: 204,
  });

  // Global Validation Pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: false,
    }),
  );

  // Global Exception Filter
  app.useGlobalFilters(new GlobalExceptionFilter());

  // Global Interceptors
  const auditTrailService = app.get(AuditTrailService);
  app.useGlobalInterceptors(
    new TransformInterceptor(),
    new AuditLogInterceptor(auditTrailService),
  );

  // Global Dynamic Whitelist Guard
  const prismaService = app.get(PrismaService);
  const redisService = app.get(RedisService);
  app.useGlobalGuards(new IpDomainWhitelistGuard(prismaService, redisService));

  const port = process.env.PORT || 8000;
  await app.listen(port);

  logger.log(`=======================================================`);
  logger.log(`🚀 E-Rapor Digital TK Masyithoh Core Server Running`);
  logger.log(`🌐 Local URL: http://127.0.0.1:${port}`);
  logger.log(`🛡️ Whitelist Guard: Active (Redis + MySQL DB Fallback)`);
  logger.log(`📦 Environment: ${process.env.NODE_ENV || 'development'}`);
  logger.log(`=======================================================`);
}

bootstrap();