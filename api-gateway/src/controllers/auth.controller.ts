import {
  Controller,
  Post,
  Body,
  Inject,
  Logger,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { ClientGrpc } from '@nestjs/microservices';
import { lastValueFrom, from } from 'rxjs';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { LoginDto } from '../dto/login.dto';
import { RegisterDto } from '../dto/register.dto';
import { AuthService, RegisterResponse } from '../proto/auth';
import { LoginResponseDto } from '../dtos/auth/login-response.dto';

@Controller('auth')
@ApiTags('Auth')
export class AuthController {
  private readonly logger = new Logger(AuthController.name);
  private authService: AuthService;

  constructor(@Inject('AUTH_PACKAGE') private authClient: ClientGrpc) {}

  onModuleInit() {
    this.authService = this.authClient.getService<AuthService>('AuthService');
  }

  @Post('register')
  @ApiOperation({ summary: '회원 가입' })
  @ApiResponse({ status: 201, description: '회원 가입 성공' })
  @ApiResponse({ status: 400, description: '잘못된 요청' })
  async register(@Body() registerDto: RegisterDto): Promise<RegisterResponse> {
    try {
      const response = await lastValueFrom(
        from(this.authService.Register(registerDto)),
      );

      if (!response || !response.success) {
        throw new Error('Registration failed');
      }

      return {
        success: response.success,
        message: response.message,
        user: response.user,
      };
    } catch (error) {
      this.logger.error('Registration failed:', error.message);
      throw new HttpException(
        'Registration failed',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post('login')
  @ApiOperation({ summary: '로그인' })
  @ApiResponse({
    status: 200,
    description: '로그인 성공',
    type: LoginResponseDto,
  })
  @ApiResponse({ status: 401, description: '인증 실패' })
  async login(@Body() loginDto: LoginDto) {
    try {
      return await lastValueFrom(from(this.authService.Login(loginDto)));
    } catch (error) {
      this.logger.error(`Login failed: ${error.message}`);
      throw new HttpException(
        error.message || 'Internal server error',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
