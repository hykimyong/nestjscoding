import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Event, EventDocument } from '../schemas/event.schema';
import { RewardService } from '../reward/reward.service';

@Injectable()
export class EventService {
  constructor(
    @InjectModel(Event.name)
    private eventModel: Model<EventDocument>,
    private readonly rewardService: RewardService,
  ) {}

  async createEvent(data: {
    title: string;
    description: string;
    userId: string;
  }): Promise<Event> {
    const event = new this.eventModel({
      ...data,
      startDate: new Date(),
      endDate: new Date(),
      requiredDays: 1,
    });
    return event.save();
  }

  async createAttendanceEvent(data: {
    title: string;
    description: string;
    startDate: string;
    endDate: string;
    userId: string;
    isActive: boolean;
    requiredDays: number;
  }): Promise<{ success: boolean; message: string; event: Event }> {
    try {
      const event = new this.eventModel({
        ...data,
        startDate: new Date(data.startDate),
        endDate: new Date(data.endDate),
      });
      await event.save();
      return {
        success: true,
        message: '출석 이벤트가 성공적으로 생성되었습니다.',
        event,
      };
    } catch (error) {
      return {
        success: false,
        message: '출석 이벤트 생성에 실패했습니다: ' + error.message,
        event: null,
      };
    }
  }

  async listEvents(data: {
    page: number;
    limit: number;
    searchKeyword?: string;
  }): Promise<{
    success: boolean;
    message: string;
    events: Event[];
    total: number;
    page: number;
    limit: number;
  }> {
    try {
      const { page = 1, limit = 10, searchKeyword } = data;
      const skip = (page - 1) * limit;

      let query = {};
      if (searchKeyword) {
        query = {
          $or: [
            { title: { $regex: searchKeyword, $options: 'i' } },
            { description: { $regex: searchKeyword, $options: 'i' } },
          ],
        };
      }

      const [events, total] = await Promise.all([
        this.eventModel
          .find(query)
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limit)
          .exec(),
        this.eventModel.countDocuments(query).exec(),
      ]);

      return {
        success: true,
        message: '이벤트 목록을 성공적으로 조회했습니다.',
        events,
        total,
        page,
        limit,
      };
    } catch (error) {
      return {
        success: false,
        message: '이벤트 목록 조회에 실패했습니다: ' + error.message,
        events: [],
        total: 0,
        page: data.page,
        limit: data.limit,
      };
    }
  }

  async getEventDetail(data: { eventId: string }): Promise<{
    success: boolean;
    message: string;
    event: Event;
    rewards: any[];
  }> {
    try {
      const event = await this.eventModel
        .findById(new Types.ObjectId(data.eventId))
        .exec();

      if (!event) {
        throw new NotFoundException('이벤트를 찾을 수 없습니다.');
      }

      // 이벤트에 연결된 보상 정보 조회
      const rewardsResponse = await this.rewardService.getEventRewards(
        data.eventId,
      );
      const rewards = rewardsResponse.success ? rewardsResponse.rewards : [];

      return {
        success: true,
        message: '이벤트 상세 정보를 성공적으로 조회했습니다.',
        event,
        rewards,
      };
    } catch (error) {
      return {
        success: false,
        message: '이벤트 상세 정보 조회에 실패했습니다: ' + error.message,
        event: null,
        rewards: [],
      };
    }
  }

  async updateEvent(data: {
    eventId: string;
    title?: string;
    description?: string;
    startDate?: string;
    endDate?: string;
    isActive?: boolean;
    requiredDays?: number;
  }): Promise<{
    success: boolean;
    message: string;
    event: Event;
  }> {
    try {
      const { eventId, ...updateData } = data;

      const updateFields: any = { ...updateData };
      if (updateData.startDate) {
        updateFields.startDate = new Date(updateData.startDate);
      }
      if (updateData.endDate) {
        updateFields.endDate = new Date(updateData.endDate);
      }

      const event = await this.eventModel.findById(new Types.ObjectId(eventId));

      if (!event) {
        throw new NotFoundException('이벤트를 찾을 수 없습니다.');
      }

      // Update only the provided fields
      Object.assign(event, updateFields);
      await event.save();

      return {
        success: true,
        message: '이벤트가 성공적으로 업데이트되었습니다.',
        event,
      };
    } catch (error) {
      return {
        success: false,
        message: '이벤트 업데이트에 실패했습니다: ' + error.message,
        event: null,
      };
    }
  }
}
