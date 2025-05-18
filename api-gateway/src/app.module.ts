import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { join } from 'path';
import { JwtStrategy } from './strategies/jwt.strategy';
import { AuthController } from './controllers/auth.controller';
import { EventController } from './controllers/event.controller';
import { RewardController } from './controllers/reward.controller';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    ClientsModule.registerAsync([
      {
        name: 'AUTH_PACKAGE',
        useFactory: () => ({
          transport: Transport.GRPC,
          options: {
            package: 'auth',
            protoPath: join(__dirname, 'proto/auth.proto'),
            url: 'localhost:50151',
          },
        }),
      },
      {
        name: 'EVENT_PACKAGE',
        useFactory: () => ({
          transport: Transport.GRPC,
          options: {
            package: 'event',
            protoPath: join(__dirname, 'proto/event.proto'),
            url: 'localhost:50152',
          },
        }),
      },
      {
        name: 'REWARD_PACKAGE',
        useFactory: () => ({
          transport: Transport.GRPC,
          options: {
            package: 'reward',
            protoPath: join(__dirname, 'proto/reward.proto'),
            url: 'localhost:50152',
          },
        }),
      },
    ]),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET'),
        signOptions: { expiresIn: '1h' },
      }),
      inject: [ConfigService],
    }),
    PassportModule,
  ],
  controllers: [AuthController, EventController, RewardController],
  providers: [JwtStrategy],
})
export class AppModule {}
