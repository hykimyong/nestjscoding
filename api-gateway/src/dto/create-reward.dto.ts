import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsBoolean, IsNumber } from 'class-validator';

export class CreateRewardDto {
  @ApiProperty({
    description: '이벤트 ID',
    example: 'event123',
  })
  @IsString()
  @IsNotEmpty()
  eventId: string;

  @ApiProperty({
    description: '보상 제목',
    example: '7일 연속 출석 보상',
  })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiProperty({
    description: '보상 설명',
    example: '7일 연속 출석하신 분들께 드리는 특별 보상입니다.',
  })
  @IsString()
  @IsNotEmpty()
  description: string;

  @ApiProperty({
    description: '필요 출석 일수',
    example: 7,
  })
  @IsNumber()
  requiredAttendance: number;

  @ApiProperty({
    description: '보상 유형',
    example: 'POINT',
    enum: ['POINT', 'ITEM', 'BADGE'],
  })
  @IsString()
  @IsNotEmpty()
  rewardType: string;

  @ApiProperty({
    description: '보상 값',
    example: '1000',
  })
  @IsString()
  @IsNotEmpty()
  rewardValue: string;

  @ApiProperty({
    description: '보상 활성화 여부',
    example: true,
  })
  @IsBoolean()
  isActive: boolean;
}
