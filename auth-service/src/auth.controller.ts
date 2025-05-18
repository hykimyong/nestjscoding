import { Controller, Get, Logger } from '@nestjs/common';
import { GrpcMethod } from '@nestjs/microservices';
import { AuthService } from './auth.service';

@Controller()
export class AuthController {
  private readonly logger = new Logger(AuthController.name);

  constructor(private readonly authService: AuthService) {}

  @Get()
  getHello(): string {
    return this.authService.getHello();
  }

  @GrpcMethod('AuthService', 'Login')
  async login(data: { userId: string; password: string }) {
    return this.authService.login(data);
  }

  @GrpcMethod('AuthService', 'Register')
  async register(data: { userId: string; password: string }) {
    return this.authService.register(data);
  }
}
