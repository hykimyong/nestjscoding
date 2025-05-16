import { Controller, Get, Logger } from '@nestjs/common';
import { GrpcMethod } from '@nestjs/microservices';
import { AppService } from './app.service';

@Controller()
export class EventController {
  private readonly logger = new Logger(EventController.name);

  constructor(private readonly appService: AppService) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  @GrpcMethod('EventService', 'CreateEvent')
  async createEvent(data: {
    title: string;
    description: string;
    userId: string;
  }): Promise<any> {
    this.logger.debug(`Creating event: ${data.title}`);
    return this.appService.createEvent(data);
  }
}
