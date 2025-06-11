import { NestFactory } from '@nestjs/core';
import { FastifyAdapter, NestFastifyApplication } from '@nestjs/platform-fastify';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { patchNestJsSwagger, ZodValidationPipe } from 'nestjs-zod';
import { enableCorsFromHosts } from './shared/utilites/cors';
import { ConfigService } from '@nestjs/config';
import { HttpExceptionFilter } from './shared/filters/http-exception.filter';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create<NestFastifyApplication>(AppModule, new FastifyAdapter());

  const configService = app.get(ConfigService);
  const appPort = configService.getOrThrow<number>('ENV__APP_PORT');
  const appHost = configService.getOrThrow<string>('ENV__APP_HOST');

  app.enableShutdownHooks();
  app.useGlobalPipes(new ZodValidationPipe());
  app.useGlobalFilters(new HttpExceptionFilter());
  enableCorsFromHosts(app, configService.getOrThrow<string>('ENV__CORS_HOSTS'));

  const swaggerConfigRaw = new DocumentBuilder()
    .setTitle('Track Pulse API')
    .setDescription('API for Track Pulse')
    .setVersion('1.0.0')
    .addApiKey({ type: 'apiKey', name: 'x-api-key', in: 'header' })
    .addBearerAuth()
    .addServer(`http://localhost:${appPort}`);

  const domainHost = configService.get<string>('ENV__DOMAIN_HOST');
  if (domainHost) {
    swaggerConfigRaw.addServer(domainHost);
  }

  const swaggerConfig = swaggerConfigRaw.build();
  patchNestJsSwagger();
  const swaggerDocument = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('docs', app, swaggerDocument);

  await app.listen(appPort, appHost);
}

void bootstrap();
