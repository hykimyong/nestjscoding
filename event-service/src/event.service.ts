import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class EventService {
  private readonly logger = new Logger(EventService.name);
  private events: any[] = [];

  async createEvent(data: {
    title: string;
    description: string;
    userId: string;
  }) {
    const event = {
      id: `event-${Date.now()}`,
      title: data.title,
      description: data.description,
      userId: data.userId,
      createdAt: new Date().toISOString(),
    };
    this.events.push(event);
    return event;
  }

  async createAttendanceEvent(data: {
    title: string;
    description: string;
    startDate: string;
    endDate: string;
    userId: string;
  }) {
    const event = {
      id: `attendance-${Date.now()}`,
      title: data.title,
      description: data.description,
      startDate: data.startDate,
      endDate: data.endDate,
      userId: data.userId,
      type: 'ATTENDANCE',
      createdAt: new Date().toISOString(),
    };
    this.events.push(event);
    return event;
  }

  async getAttendanceEvents(data: { userId: string }) {
    return this.events.filter(
      (event) => event.type === 'ATTENDANCE' && event.userId === data.userId,
    );
  }
}
