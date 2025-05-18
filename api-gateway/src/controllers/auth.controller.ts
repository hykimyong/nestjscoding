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
  @ApiOperation({ summary: 'Register a new user' })
  @ApiResponse({ status: 201, description: 'User successfully registered.' })
  @ApiResponse({ status: 400, description: 'Bad request.' })
  async register(@Body() registerDto: RegisterDto): Promise<RegisterResponse> {
    try {
      this.logger.debug('Attempting to register user:', registerDto.userId);
      const response = await lastValueFrom(
        from(this.authService.Register(registerDto)),
      );
      this.logger.debug('Auth service response:', response);

      if (!response || !response.success) {
        this.logger.error('Invalid response from auth service:', response);
        throw new Error('Registration failed');
      }

      return {
        success: response.success,
        message: response.message,
        user: response.user,
      };
    } catch (error) {
      this.logger.error(
        'Registration failed for user',
        registerDto.userId + ':',
        error.message,
      );
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
    schema: {
      type: 'object',
      properties: {
        access_token: {
          type: 'string',
          description: 'JWT 토큰',
        },
        user: {
          type: 'object',
          properties: {
            userId: {
              type: 'string',
              description: '사용자 ID',
            },
          },
        },
      },
    },
  })
  @ApiResponse({ status: 401, description: '인증 실패' })
  async login(@Body() loginDto: LoginDto) {
    try {
      this.logger.debug(`Login attempt for user: ${loginDto.userId}`);
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
