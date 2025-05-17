import { NestFactory } from '@nestjs/core';
import { Transport } from '@nestjs/microservices';
import { join } from 'path';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.createMicroservice(AppModule, {
    transport: Transport.GRPC,
    options: {
      package: ['event', 'reward'],
      protoPath: [
        join(__dirname, 'proto/event.proto'),
        join(__dirname, 'proto/reward.proto'),
      ],
      url: process.env.EVENT_SERVICE_URL || 'localhost:50152',
    },
  });

  await app.listen();
}
bootstrap();
