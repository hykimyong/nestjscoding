import { Controller, Logger } from '@nestjs/common';
import { GrpcMethod } from '@nestjs/microservices';
import { EventService } from './event/event.service';

@Controller()
export class EventController {
  private readonly logger = new Logger(EventController.name);

  constructor(private readonly eventService: EventService) {}

  @GrpcMethod('EventService', 'CreateEvent')
  async createEvent(data: {
    title: string;
    description: string;
    userId: string;
  }) {
    return this.eventService.createEvent(data);
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
}
