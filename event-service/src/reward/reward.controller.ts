import { Controller } from '@nestjs/common';
import { GrpcMethod } from '@nestjs/microservices';
import { RewardService } from './reward.service';

@Controller()
export class RewardController {
  constructor(private readonly rewardService: RewardService) {}

  @GrpcMethod('RewardService', 'CreateReward')
  async createReward(data: {
    eventId: string;
    title: string;
    description: string;
    requiredAttendance: number;
    rewardType: string;
    rewardValue: string;
    isActive: boolean;
  }) {
    return this.rewardService.createReward(data);
  }

  @GrpcMethod('RewardService', 'GetEventRewards')
  async getEventRewards(data: { eventId: string }) {
    return this.rewardService.getEventRewards(data.eventId);
  }

  @GrpcMethod('RewardService', 'GetUserRewardStatus')
  async getUserRewardStatus(data: { userId: string; eventId: string }) {
    return this.rewardService.getUserRewardStatus(data.userId, data.eventId);
  }

  @GrpcMethod('RewardService', 'RequestReward')
  async requestReward(data: {
    userId: string;
    eventId: string;
    rewardId: string;
  }) {
    return this.rewardService.requestReward(
      data.userId,
      data.eventId,
      data.rewardId,
    );
  }
}
