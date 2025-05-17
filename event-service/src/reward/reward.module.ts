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

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Reward.name, schema: RewardSchema },
      { name: UserRewardStatus.name, schema: UserRewardStatusSchema },
    ]),
  ],
  controllers: [RewardController],
  providers: [RewardService],
})
export class RewardModule {}
