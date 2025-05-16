import { Injectable, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class AppService {
  private readonly logger = new Logger(AppService.name);

  constructor(private readonly jwtService: JwtService) {}

  getHello(): string {
    return 'Hello World!';
  }

  async login(data: { username: string; password: string }) {
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

    const response = { accessToken: token };
    this.logger.debug(`Returning response: ${JSON.stringify(response)}`);
    return response;
  }

  async validateUser(data: { token: string }) {
    this.logger.debug(`Validating user with token: ${data.token}`);
    if (data.token === 'test-token') {
      return { valid: true, userId: '11111111111111111111111111111111' };
    }
    return { valid: false, userId: '' };
  }

  async register(data: { username: string; password: string }) {
    this.logger.debug(`Register attempt for user: ${data.username}`);
    // TODO: 실제로는 비밀번호를 해시화하고 DB에 저장해야 합니다
    // 지금은 테스트를 위해 간단히 처리
    return {
      success: true,
      message: 'User registered successfully',
      user: {
        id: '1',
        username: data.username,
      },
    };
  }
}
