import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty } from 'class-validator';

export class CreateEventDto {
  @ApiProperty({
    description: '이벤트 제목',
    example: '신규 회원 이벤트',
  })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiProperty({
    description: '이벤트 설명',
    example: '신규 회원을 위한 특별 이벤트입니다.',
  })
  @IsString()
  @IsNotEmpty()
  description: string;

  @ApiProperty({
    description: '이벤트 생성자 ID',
    example: 'user123',
  })
  @IsString()
  @IsNotEmpty()
  userId: string;
}
