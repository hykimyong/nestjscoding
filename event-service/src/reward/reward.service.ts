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
      let query = {};

      // userId가 있는 경우 해당 사용자의 보상 상태만 조회
      if (userId) {
        const userObjectId = this.toObjectId(userId, 'userId');
        query['userId'] = userObjectId;
      }

      // eventId가 있는 경우 해당 이벤트의 보상 상태만 조회
      if (eventId) {
        const eventObjectId = this.toObjectId(eventId, 'eventId');

        // 이벤트 존재 여부 확인
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

      // 보상 상태 조회
      const statuses = await this.userRewardStatusModel
        .find(query)
        .populate('rewardId')
        .exec();

      // 조회된 결과가 없는 경우
      if (statuses.length === 0 && userId && eventId) {
        // 특정 사용자와 이벤트에 대한 조회인 경우, 해당 이벤트의 모든 보상에 대한 상태 생성
        const eventObjectId = this.toObjectId(eventId, 'eventId');
        const userObjectId = this.toObjectId(userId, 'userId');

        const rewards = await this.rewardModel
          .find({ eventId: eventObjectId })
          .exec();

        const newStatuses = await Promise.all(
          rewards.map(async (reward) => {
            const status = new this.userRewardStatusModel({
              userId: userObjectId,
              eventId: eventObjectId,
              rewardId: reward._id,
              currentAttendance: 0,
              isEligible: false,
              isClaimed: false,
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

    // userId는 ObjectId가 아닌 일반 문자열이므로 검증하지 않음
    if (fieldName === 'userId') {
      return id as any;
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
