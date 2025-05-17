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
    this.logger.debug(`Creating event: ${data.title}`);
    return this.eventService.createEvent(data);
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
    this.logger.debug(`Creating attendance event: ${data.title}`);
    return this.eventService.createAttendanceEvent(data);
  }

  @GrpcMethod('EventService', 'ListEvents')
  async listEvents(data: {
    page: number;
    limit: number;
    searchKeyword?: string;
  }) {
    try {
      this.logger.debug(
        `Listing events, page: ${data.page}, limit: ${data.limit}`,
      );
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
      this.logger.debug(`Getting event detail for: ${data.eventId}`);
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
}
