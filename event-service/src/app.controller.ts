import { Controller, Get } from '@nestjs/common';
import { GrpcMethod } from '@nestjs/microservices';
import { AppService } from './app.service';

@Controller()
export class AppController {
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
    return this.appService.createEvent(data);
  }
}
