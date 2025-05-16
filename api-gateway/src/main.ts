import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.setGlobalPrefix('v1');

  // Enable CORS for development
  app.enableCors();
  /*
  app.enableCors({
    origin: ['add url'],
    credentials: true,
  });
  */

  const config = new DocumentBuilder()
    .setTitle('Event API')
    .setDescription('The Event API description')
    .setVersion('1.0')
    .addTag('events')
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);

  await app.listen(3000);
}
bootstrap();
