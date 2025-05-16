import { NestFactory } from '@nestjs/core';
import { Transport } from '@nestjs/microservices';
import { join } from 'path';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.createMicroservice(AppModule, {
    transport: Transport.GRPC,
    options: {
      package: 'event',
      protoPath: join(__dirname, '../src/proto/event.proto'),
      url: '0.0.0.0:50152',
    },
  });
  await app.listen();
}
bootstrap();
