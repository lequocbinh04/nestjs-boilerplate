import { HttpExceptionFilter } from '@common/filters/http-exception.filter';
import { EnvConfig } from '@config/env.config';
import { setupSwagger } from '@config/swagger.config';
import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const logger = new Logger('Bootstrap');

  const app = await NestFactory.create(AppModule, {
    logger: ['error', 'warn', 'log', 'debug', 'verbose'],
  });

  const configService = app.get(ConfigService<EnvConfig>);

  // CORS
  app.enableCors({
    origin: configService.get('CORS_ORIGIN'),
    credentials: true,
  });

  // Global prefix
  app.setGlobalPrefix('api/v1');

  // Swagger documentation
  setupSwagger(app);

  const port = configService.get('PORT');
  const appName = configService.get('APP_NAME');

  await app.listen(port);

  logger.log(`🚀 ${appName} is running on: http://localhost:${port}/api/v1`);
  logger.log(`📚 API Documentation: http://localhost:${port}/api/docs`);
}

bootstrap();
