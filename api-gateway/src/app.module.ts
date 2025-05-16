import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { join } from 'path';
import { AppController } from './app.controller';

@Module({
  imports: [
    ConfigModule.forRoot(),
    ClientsModule.register([
      {
        name: 'AUTH_PACKAGE',
        transport: Transport.GRPC,
        options: {
          package: 'auth',
          protoPath: join(__dirname, '../src/proto/auth.proto'),
          url: process.env.AUTH_SERVICE_URL || 'localhost:50151',
        },
      },
      {
        name: 'EVENT_PACKAGE',
        transport: Transport.GRPC,
        options: {
          package: 'event',
          protoPath: join(__dirname, '../src/proto/event.proto'),
          url: process.env.EVENT_SERVICE_URL || 'localhost:50152',
        },
      },
    ]),
  ],
  controllers: [AppController],
  providers: [],
})
export class AppModule {}
