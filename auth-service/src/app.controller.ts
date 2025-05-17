import { Controller, Get, Logger } from '@nestjs/common';
import { GrpcMethod } from '@nestjs/microservices';
import { AppService } from './app.service';
import { JwtService } from '@nestjs/jwt';

@Controller()
export class AuthController {
  private readonly logger = new Logger(AuthController.name);

  constructor(
    private readonly appService: AppService,
    private readonly jwtService: JwtService,
  ) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  @GrpcMethod('AuthService', 'Login')
  async login(data: {
    username: string;
    password: string;
  }): Promise<{ access_token: string }> {
    this.logger.debug(`Login attempt for user: ${data.username}`);
    this.logger.debug('Generating JWT token...');

    // 임시로 모든 로그인을 허용하고 JWT 토큰을 발급
    const payload = {
      username: data.username,
      sub: '1',
      roles: ['user'],
    };

    const token = this.jwtService.sign(payload);
    this.logger.debug(`Generated token for user ${data.username}: ${token}`);

    return {
      access_token: token,
    };
  }

  @GrpcMethod('AuthService', 'ValidateUser')
  async validateUser(data: {
    token: string;
  }): Promise<{ valid: boolean; userId: string }> {
    this.logger.debug(`Validating user with token: ${data.token}`);
    return this.appService.validateUser(data.token);
  }
}
