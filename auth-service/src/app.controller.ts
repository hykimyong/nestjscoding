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

  @GrpcMethod('AuthService', 'ValidateUser')
  async validateUser(data: {
    token: string;
  }): Promise<{ isValid: boolean; userId: string }> {
    return this.appService.validateUser(data);
  }
}
