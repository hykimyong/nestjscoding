import { Injectable } from '@nestjs/common';
import { GrpcMethod } from '@nestjs/microservices';

@Injectable()
export class AuthService {
  @GrpcMethod('AuthService', 'ValidateUser')
  validateUser(data: { token: string }) {
    // 실제 구현에서는 토큰 검증 로직이 들어갑니다
    return {
      isValid: true,
      userId: '123',
    };
  }
}
