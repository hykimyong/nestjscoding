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
import { Event, EventDocument } from '../schemas/event.schema';

@Injectable()
export class RewardService {
  private readonly logger = new Logger(RewardService.name);

  constructor(
    @InjectModel(Reward.name)
    private rewardModel: Model<RewardDocument>,
    @InjectModel(UserRewardStatus.name)
    private userRewardStatusModel: Model<UserRewardStatusDocument>,
    @InjectModel(Event.name)
    private eventModel: Model<EventDocument>,
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
      const query: any = {};

      if (userId) {
        query['userId'] = userId;
      }

      if (eventId) {
        const eventObjectId = this.toObjectId(eventId, 'eventId');
        const eventExists = await this.eventModel.exists({
          _id: eventObjectId,
        });
        if (!eventExists) {
          return {
            success: false,
            message: '존재하지 않는 이벤트입니다.',
            statuses: [],
          };
        }
        query['eventId'] = eventObjectId;
      }

      // 최신 요청 시간 기준으로 정렬하여 조회
      const statuses = await this.userRewardStatusModel
        .find(query)
        .sort({ requestedAt: -1 })
        .populate('rewardId')
        .exec();

      if (statuses.length === 0 && userId && eventId) {
        const eventObjectId = this.toObjectId(eventId, 'eventId');
        const rewards = await this.rewardModel
          .find({ eventId: eventObjectId })
          .exec();

        const newStatuses = await Promise.all(
          rewards.map(async (reward) => {
            const status = new this.userRewardStatusModel({
              userId,
              eventId: eventObjectId,
              rewardId: reward._id,
              currentAttendance: 0,
              isEligible: false,
              isClaimed: false,
              requestCount: 0,
              requestedAt: new Date(),
              isSuccess: false,
            });
            await status.save();
            return status;
          }),
        );

        return {
          success: true,
          message: '새로운 보상 상태가 생성되었습니다.',
          statuses: newStatuses,
        };
      }

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

  private toObjectId(id: string, fieldName: string): Types.ObjectId {
    if (!id) {
      throw new BadRequestException(`${fieldName}가 제공되지 않았습니다.`);
    }

    if (!this.isValidObjectId(id)) {
      throw new BadRequestException(`유효하지 않은 ${fieldName} 형식입니다.`);
    }

    return new Types.ObjectId(id);
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
      const eventObjectId = this.toObjectId(eventId, 'eventId');
      const rewardObjectId = this.toObjectId(rewardId, 'rewardId');

      const reward = await this.rewardModel.findById(rewardObjectId).exec();
      if (!reward) {
        throw new NotFoundException('보상을 찾을 수 없습니다.');
      }

      // 이전 요청 기록 조회
      const previousRequests = await this.userRewardStatusModel
        .find({
          userId: userId,
          eventId: eventObjectId,
          rewardId: rewardObjectId,
        })
        .sort({ requestedAt: -1 });

      const now = new Date();
      const requestCount = previousRequests.length + 1;
      const lastRequest = previousRequests[0];

      const requestSuccess = lastRequest
        ? lastRequest.currentAttendance >= reward.requiredAttendance &&
          !lastRequest.isClaimed
        : false;

      // 새로운 요청 생성
      const status = new this.userRewardStatusModel({
        userId: userId,
        eventId: eventObjectId,
        rewardId: rewardObjectId,
        currentAttendance: lastRequest ? lastRequest.currentAttendance : 0,
        isEligible: lastRequest ? lastRequest.isEligible : false,
        isClaimed: lastRequest ? lastRequest.isClaimed : false,
        claimedAt: lastRequest?.claimedAt,
        requestCount: requestCount,
        requestedAt: now,
        isSuccess: requestSuccess,
      });

      if (requestSuccess) {
        status.isEligible = true;
        status.isClaimed = true;
        status.claimedAt = now;
      }

      await status.save();

      // 응답 메시지 생성
      let message = '';
      if (status.isClaimed && !requestSuccess) {
        message = '이미 수령한 보상입니다.';
      } else if (!requestSuccess) {
        message = `출석 횟수가 부족합니다. (현재: ${status.currentAttendance}, 필요: ${reward.requiredAttendance})`;
      } else {
        message = '보상이 성공적으로 지급되었습니다.';
      }

      return {
        success: requestSuccess,
        message,
        status,
      };
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

  async updateReward(data: {
    rewardId: string;
    title?: string;
    description?: string;
    requiredAttendance?: number;
    rewardType?: string;
    rewardValue?: string;
    isActive?: boolean;
  }): Promise<{
    success: boolean;
    message: string;
    reward: Reward;
  }> {
    try {
      const rewardObjectId = this.toObjectId(data.rewardId, 'rewardId');

      // 보상 존재 여부 확인
      const existingReward = await this.rewardModel.findById(rewardObjectId);
      if (!existingReward) {
        throw new NotFoundException('존재하지 않는 보상입니다.');
      }

      // 업데이트할 필드 구성
      const updateData = {};
      if (data.title !== undefined) updateData['title'] = data.title;
      if (data.description !== undefined)
        updateData['description'] = data.description;
      if (data.requiredAttendance !== undefined)
        updateData['requiredAttendance'] = data.requiredAttendance;
      if (data.rewardType !== undefined)
        updateData['rewardType'] = data.rewardType;
      if (data.rewardValue !== undefined)
        updateData['rewardValue'] = data.rewardValue;
      if (data.isActive !== undefined) updateData['isActive'] = data.isActive;

      // 보상 정보 업데이트
      const updatedReward = await this.rewardModel.findByIdAndUpdate(
        rewardObjectId,
        {
          $set: updateData,
          updatedAt: new Date(),
        },
        { new: true },
      );

      return {
        success: true,
        message: '보상이 성공적으로 수정되었습니다.',
        reward: updatedReward,
      };
    } catch (error) {
      if (error instanceof NotFoundException) {
        return {
          success: false,
          message: error.message,
          reward: null,
        };
      }
      if (error instanceof BadRequestException) {
        return {
          success: false,
          message: error.message,
          reward: null,
        };
      }
      this.logger.error(
        `보상 수정 중 오류 발생: ${error.message}`,
        error.stack,
      );
      return {
        success: false,
        message: '보상 수정 중 오류가 발생했습니다.',
        reward: null,
      };
    }
  }
}
