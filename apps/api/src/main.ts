import { VersioningType } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ENV, type Env } from './config/config.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.setGlobalPrefix('/api/');
  app.enableVersioning({
    type: VersioningType.URI,
    defaultVersion: '1',
  });
  const env = app.get<Env>(ENV);
  await app.listen(env.API_PORT);
}
bootstrap();
