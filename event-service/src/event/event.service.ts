import { Injectable } from '@nestjs/common';
import { GrpcMethod } from '@nestjs/microservices';

@Injectable()
export class EventService {
  @GrpcMethod('EventService', 'CreateEvent')
  createEvent(data: { title: string; description: string; userId: string }) {
    return {
      id: '1',
      title: data.title,
      description: data.description,
      userId: data.userId,
      createdAt: new Date().toISOString(),
    };
  }
}
