import { ApiProperty } from '@nestjs/swagger';

class UserDto {
  @ApiProperty({
    description: '사용자 ID',
    example: 'admin',
  })
  userId: string;
}

export class LoginResponseDto {
  @ApiProperty({
    description: 'JWT 토큰',
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
  })
  access_token: string;

  @ApiProperty({
    description: '사용자 정보',
    type: UserDto,
  })
  user: UserDto;
}
