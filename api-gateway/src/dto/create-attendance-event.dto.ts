import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsBoolean,
  IsNumber,
  IsDateString,
} from 'class-validator';

export class CreateAttendanceEventDto {
  @ApiProperty({
    description: '출석 이벤트 제목',
    example: '7일 연속 출석 이벤트',
  })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiProperty({
    description: '출석 이벤트 설명',
    example: '7일 연속 출석 시 특별 보상을 드립니다.',
  })
  @IsString()
  @IsNotEmpty()
  description: string;

  @ApiProperty({
    description: '이벤트 시작일',
    example: '2024-03-01T00:00:00Z',
  })
  @IsDateString()
  @IsNotEmpty()
  startDate: string;

  @ApiProperty({
    description: '이벤트 종료일',
    example: '2024-03-31T23:59:59Z',
  })
  @IsDateString()
  @IsNotEmpty()
  endDate: string;

  @ApiProperty({
    description: '이벤트 생성자 ID',
    example: 'user123',
  })
  @IsString()
  @IsNotEmpty()
  userId: string;

  @ApiProperty({
    description: '이벤트 활성화 여부',
    example: true,
  })
  @IsBoolean()
  isActive: boolean;

  @ApiProperty({
    description: '필요 출석일수',
    example: 7,
  })
  @IsNumber()
  requiredDays: number;
}
