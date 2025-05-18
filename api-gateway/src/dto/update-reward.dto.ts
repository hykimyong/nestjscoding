import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsBoolean, IsNumber, IsOptional } from 'class-validator';

export class UpdateRewardDto {
  @ApiProperty({
    description: '보상 제목',
    example: '7일 연속 출석 보상',
    required: false,
  })
  @IsString()
  @IsOptional()
  title?: string;

  @ApiProperty({
    description: '보상 설명',
    example: '7일 연속 출석하신 분들께 드리는 특별 보상입니다.',
    required: false,
  })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({
    description: '필요 출석 일수',
    example: 7,
    required: false,
  })
  @IsNumber()
  @IsOptional()
  requiredAttendance?: number;

  @ApiProperty({
    description: '보상 유형',
    example: 'POINT',
    enum: ['POINT', 'ITEM', 'BADGE'],
    required: false,
  })
  @IsString()
  @IsOptional()
  rewardType?: string;

  @ApiProperty({
    description: '보상 값',
    example: '1000',
    required: false,
  })
  @IsString()
  @IsOptional()
  rewardValue?: string;

  @ApiProperty({
    description: '보상 활성화 여부',
    example: true,
    required: false,
  })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
