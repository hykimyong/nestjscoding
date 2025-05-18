import { Controller, Logger } from '@nestjs/common';
import { GrpcMethod } from '@nestjs/microservices';
import { EventService } from './event/event.service';
import { CreateEventDto } from './event/dto/create-event.dto';
import { Event } from './event/entities/event.entity';
import { RewardService } from './reward/reward.service';

@Controller()
export class EventController {
  private readonly logger = new Logger(EventController.name);

  constructor(
    private readonly eventService: EventService,
    private readonly rewardService: RewardService,
  ) {}

  @GrpcMethod('EventService')
  async CreateEvent(data: CreateEventDto): Promise<Event> {
    try {
      return await this.eventService.createEvent(data);
    } catch (error) {
      this.logger.error(`Failed to create event: ${error.message}`);
      throw error;
    }
  }

  @GrpcMethod('EventService', 'CreateAttendanceEvent')
  async createAttendanceEvent(data: {
    title: string;
    description: string;
    startDate: string;
    endDate: string;
    userId: string;
    isActive: boolean;
    requiredDays: number;
  }) {
    return this.eventService.createAttendanceEvent(data);
  }

  @GrpcMethod('EventService', 'ListEvents')
  async listEvents(data: {
    page: number;
    limit: number;
    searchKeyword?: string;
  }) {
    try {
      return await this.eventService.listEvents(data);
    } catch (error) {
      this.logger.error(`Failed to list events: ${error.message}`);
      return {
        success: false,
        message: error.message,
        events: [],
        total: 0,
        currentPage: data.page,
        totalPages: 0,
      };
    }
  }

  @GrpcMethod('EventService', 'GetEventDetail')
  async getEventDetail(data: { eventId: string }) {
    try {
      return await this.eventService.getEventDetail(data);
    } catch (error) {
      this.logger.error(`Failed to get event detail: ${error.message}`);
      return {
        success: false,
        message: error.message,
        event: null,
      };
    }
  }

  @GrpcMethod('EventService', 'UpdateEvent')
  async updateEvent(data: {
    eventId: string;
    title?: string;
    description?: string;
    startDate?: string;
    endDate?: string;
    isActive?: boolean;
    requiredDays?: number;
  }) {
    return this.eventService.updateEvent(data);
  }

  @GrpcMethod('RewardService', 'GetRewardHistory')
  async getRewardHistory(data: { userId: string }) {
    try {
      return await this.rewardService.getRewardHistory(data.userId);
    } catch (error) {
      this.logger.error(`Failed to get reward history: ${error.message}`);
      return {
        success: false,
        message: error.message,
        history: [],
      };
    }
  }
}
