import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class AppService {
  private readonly logger = new Logger(AppService.name);

  constructor(private jwtService: JwtService) {}

  getHello(): string {
    return 'Hello World!';
  }

  async generateToken(username: string): Promise<{ access_token: string }> {
    // TODO: 실제 사용자 인증 로직 구현
    // 현재는 테스트를 위해 항상 성공한다고 가정
    const payload = {
      username,
      sub: 'test-user-id',
      roles: ['user'], // 기본 역할
    };

    return {
      access_token: await this.jwtService.signAsync(payload),
    };
  }

  async validateUser(
    token: string,
  ): Promise<{ valid: boolean; userId: string }> {
    try {
      this.logger.debug(`Validating token: ${token}`);
      const payload = await this.jwtService.verifyAsync(token);
      this.logger.debug(`Token payload: ${JSON.stringify(payload)}`);

      return {
        valid: true,
        userId: payload.sub,
      };
    } catch (error) {
      this.logger.error(`Token validation failed: ${error.message}`);
      return {
        valid: false,
        userId: '',
      };
    }
  }
}
