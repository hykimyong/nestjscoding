import { Module } from '@nestjs/common';
import { EventController } from './event.controller';
import { EventService } from './event/event.service';
import { MongooseModule } from '@nestjs/mongoose';
import { Event, EventSchema } from './schemas/event.schema';
import { ConfigModule } from '@nestjs/config';
import { RewardModule } from './reward/reward.module';

@Module({
  imports: [
    ConfigModule.forRoot(),
    MongooseModule.forRoot(
      process.env.MONGODB_URI || 'mongodb://localhost:27017/event-service',
    ),
    MongooseModule.forFeature([{ name: Event.name, schema: EventSchema }]),
    RewardModule,
  ],
  controllers: [EventController],
  providers: [EventService],
})
export class AppModule {}
