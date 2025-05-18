import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty } from 'class-validator';

export class RequestRewardDto {
  @ApiProperty({
    description: '이벤트 ID',
    example: 'event123',
  })
  @IsString()
  @IsNotEmpty()
  eventId: string;

  @ApiProperty({
    description: '보상 ID',
    example: 'reward123',
  })
  @IsString()
  @IsNotEmpty()
  rewardId: string;
}
