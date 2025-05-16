import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class AppService {
  private readonly logger = new Logger(AppService.name);

  getHello(): string {
    return 'Hello World!';
  }

  async validateUser(data: {
    token: string;
  }): Promise<{ isValid: boolean; userId: string }> {
    this.logger.debug(`Validating token: ${data.token}`);
    // TODO: 실제 토큰 검증 로직 구현
    // 현재는 테스트를 위해 'test-token'만 유효하다고 가정
    if (data.token === 'test-token') {
      this.logger.debug('Token is valid');
      return {
        isValid: true,
        userId: 'test-user-id',
      };
    }
    this.logger.debug('Token is invalid');
    return {
      isValid: false,
      userId: '',
    };
  }
}
