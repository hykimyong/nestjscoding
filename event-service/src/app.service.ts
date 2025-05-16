import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getHello(): string {
    return 'Hello World!';
  }

  async createEvent(data: {
    title: string;
    description: string;
    userId: string;
  }): Promise<any> {
    // TODO: 실제 이벤트 생성 로직 구현
    // 현재는 테스트를 위해 입력 데이터를 그대로 반환
    return {
      id: 'test-event-id',
      ...data,
      createdAt: new Date().toISOString(),
    };
  }
}
