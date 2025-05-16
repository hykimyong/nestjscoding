import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { VersioningType } from '@nestjs/common';
import swaggerConfig from './configs/swagger.config';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.enableCors(); // Not for production, just develop environments
  /*
  app.enableCors({
    origin: ['add url'],
    credentials: true,
  });
  */

  app.enableVersioning({
    type: VersioningType.URI,
    prefix: 'v',
    defaultVersion: '1',
  });

  await swaggerConfig(app);

  await app.listen(3000);
}
bootstrap();
