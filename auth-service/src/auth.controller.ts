import { Controller, Get, Logger } from '@nestjs/common';
import { GrpcMethod } from '@nestjs/microservices';
import { AppService } from './app.service';

@Controller()
export class AuthController {
  private readonly logger = new Logger(AuthController.name);

  constructor(private readonly appService: AppService) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  @GrpcMethod('AuthService', 'Login')
  async login(data: { username: string; password: string }) {
    return this.appService.login(data);
  }

  @GrpcMethod('AuthService', 'ValidateUser')
  async validateUser(data: { token: string }) {
    return this.appService.validateUser(data);
  }

  @GrpcMethod('AuthService', 'Register')
  async register(data: { username: string; password: string }) {
    return this.appService.register(data);
  }
}
