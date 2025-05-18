import { Injectable, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(private readonly jwtService: JwtService) {}

  getHello(): string {
    return 'Hello World!';
  }

  async login(data: { userId: string; password: string }) {
    // 사용자별 역할 설정
    let roles = ['USER'];
    if (data.userId.includes('operator')) {
      roles = ['OPERATOR'];
    } else if (data.userId.includes('auditor')) {
      roles = ['AUDITOR'];
    } else if (data.userId.includes('admin')) {
      roles = ['ADMIN'];
    }

    const payload = {
      userId: data.userId,
      sub: data.userId,
      roles: roles,
    };

    // 실제로는 register 함수에 등록된 db를 조회해서 유효성검사를 거친 이후에 토큰을 발급해줘야함
    // 지금은 테스트를 위해 모두 로그인 되게 처리
    const token = this.jwtService.sign(payload);

    const response = { accessToken: token };
    return response;
  }

  async register(data: { userId: string; password: string }) {
    // TODO: 실제로는 비밀번호를 해시화하고 DB에 저장해야 합니다
    // 지금은 테스트를 위해 간단히 처리
    return {
      success: true,
      message: 'User registered successfully',
      user: {
        id: '123',
        userId: data.userId,
      },
    };
  }
}
