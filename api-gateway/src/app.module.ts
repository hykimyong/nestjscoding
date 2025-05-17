import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { join } from 'path';
import { GatewayController } from './gateway.controller';
import { AppService } from './app.service';
import { JwtStrategy } from './strategies/jwt.strategy';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    ClientsModule.register([
      {
        name: 'AUTH_PACKAGE',
        transport: Transport.GRPC,
        options: {
          package: 'auth',
          protoPath: join(__dirname, '../dist/proto/auth.proto'),
          url: process.env.AUTH_SERVICE_URL || 'localhost:50151',
        },
      },
      {
        name: 'EVENT_PACKAGE',
        transport: Transport.GRPC,
        options: {
          package: 'event',
          protoPath: join(__dirname, '../dist/proto/event.proto'),
          url: process.env.EVENT_SERVICE_URL || 'localhost:50152',
        },
      },
      {
        name: 'REWARD_PACKAGE',
        transport: Transport.GRPC,
        options: {
          package: 'reward',
          protoPath: join(__dirname, '../dist/proto/reward.proto'),
          url: process.env.REWARD_SERVICE_URL || 'localhost:50152',
        },
      },
    ]),
    JwtModule.register({
      secret: 'your-secret-key',
      signOptions: { expiresIn: '1h' },
    }),
    PassportModule,
  ],
  controllers: [GatewayController],
  providers: [AppService, JwtStrategy],
})
export class AppModule {}
