import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty } from 'class-validator';

export class RegisterDto {
  @ApiProperty({ example: 'user123', description: 'The user ID of the user' })
  @IsString()
  @IsNotEmpty()
  userId: string;

  @ApiProperty({ example: 'test', description: 'The password of the user' })
  @IsString()
  @IsNotEmpty()
  password: string;
}
