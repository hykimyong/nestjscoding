import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import {
  Reward,
  RewardDocument,
  UserRewardStatus,
  UserRewardStatusDocument,
} from '../schemas/reward.schema';

@Injectable()
export class RewardService {
  private readonly logger = new Logger(RewardService.name);

  constructor(
    @InjectModel(Reward.name)
    private rewardModel: Model<RewardDocument>,
    @InjectModel(UserRewardStatus.name)
    private userRewardStatusModel: Model<UserRewardStatusDocument>,
  ) {}

  async createReward(data: {
    eventId: string;
    title: string;
    description: string;
    requiredAttendance: number;
    rewardType: string;
    rewardValue: string;
    isActive: boolean;
  }): Promise<{
    success: boolean;
    message: string;
    reward: Reward;
  }> {
    try {
      const eventObjectId = this.toObjectId(data.eventId, 'eventId');

      const reward = new this.rewardModel({
        ...data,
        eventId: eventObjectId,
      });
      await reward.save();

      return {
        success: true,
        message: '보상이 성공적으로 생성되었습니다.',
        reward,
      };
    } catch (error) {
      if (error instanceof BadRequestException) {
        return {
          success: false,
          message: error.message,
          reward: null,
        };
      }
      this.logger.error(
        `보상 생성 중 오류 발생: ${error.message}`,
        error.stack,
      );
      return {
        success: false,
        message: '보상 생성 중 오류가 발생했습니다.',
        reward: null,
      };
    }
  }

  async getEventRewards(eventId: string): Promise<{
    success: boolean;
    message: string;
    rewards: Reward[];
  }> {
    try {
      const eventObjectId = this.toObjectId(eventId, 'eventId');

      const rewards = await this.rewardModel
        .find({ eventId: eventObjectId })
        .exec();

      return {
        success: true,
        message: '이벤트의 보상 목록을 성공적으로 조회했습니다.',
        rewards,
      };
    } catch (error) {
      if (error instanceof BadRequestException) {
        return {
          success: false,
          message: error.message,
          rewards: [],
        };
      }
      this.logger.error(
        `보상 목록 조회 중 오류 발생: ${error.message}`,
        error.stack,
      );
      return {
        success: false,
        message: '이벤트의 보상 목록 조회 중 오류가 발생했습니다.',
        rewards: [],
      };
    }
  }

  async getUserRewardStatus(
    userId: string,
    eventId: string,
  ): Promise<{
    success: boolean;
    message: string;
    statuses: UserRewardStatus[];
  }> {
    try {
      const userObjectId = this.toObjectId(userId, 'userId');
      const eventObjectId = this.toObjectId(eventId, 'eventId');

      const rewards = await this.rewardModel
        .find({ eventId: eventObjectId })
        .exec();

      const statuses = await Promise.all(
        rewards.map(async (reward) => {
          let status = await this.userRewardStatusModel.findOne({
            userId: userObjectId,
            eventId: eventObjectId,
            rewardId: reward._id,
          });

          if (!status) {
            status = new this.userRewardStatusModel({
              userId: userObjectId,
              eventId: eventObjectId,
              rewardId: reward._id,
              currentAttendance: 0,
              isEligible: false,
              isClaimed: false,
            });
            await status.save();
          }

          return status;
        }),
      );

      return {
        success: true,
        message: '보상 상태를 성공적으로 조회했습니다.',
        statuses,
      };
    } catch (error) {
      if (error instanceof BadRequestException) {
        return {
          success: false,
          message: error.message,
          statuses: [],
        };
      }
      this.logger.error(
        `보상 상태 조회 중 오류 발생: ${error.message}`,
        error.stack,
      );
      return {
        success: false,
        message: '보상 상태 조회 중 오류가 발생했습니다.',
        statuses: [],
      };
    }
  }

  private isValidObjectId(id: string): boolean {
    return Types.ObjectId.isValid(id);
  }

  private toObjectId(id: string | number, field: string): Types.ObjectId {
    // 숫자형 ID인 경우 문자열로 변환하여 처리
    const stringId = id.toString().padStart(24, '0');
    if (!Types.ObjectId.isValid(stringId)) {
      throw new BadRequestException(`유효하지 않은 ${field} 형식입니다.`);
    }
    return new Types.ObjectId(stringId);
  }

  async requestReward(
    userId: string,
    eventId: string,
    rewardId: string,
  ): Promise<{
    success: boolean;
    message: string;
    status: UserRewardStatus;
  }> {
    try {
      this.logger.debug('Request reward params:', {
        userId,
        eventId,
        rewardId,
      });

      // ID 유효성 검사
      const userObjectId = this.toObjectId(userId, 'userId');
      const eventObjectId = this.toObjectId(eventId, 'eventId');
      const rewardObjectId = this.toObjectId(rewardId, 'rewardId');

      this.logger.debug('Converted ObjectIds:', {
        userObjectId: userObjectId.toString(),
        eventObjectId: eventObjectId.toString(),
        rewardObjectId: rewardObjectId.toString(),
      });

      const reward = await this.rewardModel.findById(rewardObjectId).exec();
      this.logger.debug('Found reward:', reward);

      if (!reward) {
        throw new NotFoundException('보상을 찾을 수 없습니다.');
      }

      let status = await this.userRewardStatusModel.findOne({
        userId: userObjectId,
        eventId: eventObjectId,
        rewardId: rewardObjectId,
      });
      this.logger.debug('Current user reward status:', status);

      if (!status) {
        status = new this.userRewardStatusModel({
          userId: userObjectId,
          eventId: eventObjectId,
          rewardId: rewardObjectId,
          currentAttendance: 0,
          isEligible: false,
          isClaimed: false,
        });
        this.logger.debug('Created new user reward status:', status);
      }

      if (status.isClaimed) {
        return {
          success: false,
          message: '이미 수령한 보상입니다.',
          status,
        };
      }

      if (status.currentAttendance >= reward.requiredAttendance) {
        status.isEligible = true;
        status.isClaimed = true;
        status.claimedAt = new Date();
        await status.save();
        this.logger.debug('Updated user reward status after claim:', status);

        return {
          success: true,
          message: '보상이 성공적으로 지급되었습니다.',
          status,
        };
      } else {
        return {
          success: false,
          message: `출석 횟수가 부족합니다. (현재: ${status.currentAttendance}, 필요: ${reward.requiredAttendance})`,
          status,
        };
      }
    } catch (error) {
      this.logger.error('Error in requestReward:', error.message, error.stack);
      if (error instanceof BadRequestException) {
        return {
          success: false,
          message: error.message,
          status: null,
        };
      }
      this.logger.error(
        `보상 요청 처리 중 오류 발생: ${error.message}`,
        error.stack,
      );
      return {
        success: false,
        message: '보상 요청 처리 중 오류가 발생했습니다.',
        status: null,
      };
    }
  }
}
