import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import {
  Reward,
  RewardSchema,
  UserRewardStatus,
  UserRewardStatusSchema,
} from '../schemas/reward.schema';
import { RewardController } from './reward.controller';
import { RewardService } from './reward.service';
import { Event, EventSchema } from '../schemas/event.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Reward.name, schema: RewardSchema },
      { name: UserRewardStatus.name, schema: UserRewardStatusSchema },
      { name: Event.name, schema: EventSchema },
    ]),
  ],
  controllers: [RewardController],
  providers: [RewardService],
  exports: [RewardService],
})
export class RewardModule {}
