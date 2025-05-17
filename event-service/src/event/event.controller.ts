import { Controller } from '@nestjs/common';
import { GrpcMethod } from '@nestjs/microservices';
import { EventService } from './event.service';

@Controller()
export class EventController {
  constructor(private readonly eventService: EventService) {}

  @GrpcMethod('EventService', 'CreateEvent')
  async createEvent(data: {
    title: string;
    description: string;
    userId: string;
  }) {
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
    return this.eventService.createAttendanceEvent(data);
  }

  @GrpcMethod('EventService', 'ListEvents')
  async listEvents(data: {
    page: number;
    limit: number;
    searchKeyword?: string;
  }) {
    return this.eventService.listEvents(data);
  }

  @GrpcMethod('EventService', 'GetEventDetail')
  async getEventDetail(data: { eventId: string }) {
    return this.eventService.getEventDetail({ eventId: data.eventId });
  }
}
