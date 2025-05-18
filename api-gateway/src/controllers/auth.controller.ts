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
  @ApiOperation({ summary: 'Login user' })
  @ApiResponse({ status: 200, description: 'Login successful' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async login(@Body() loginDto: LoginDto) {
    try {
      this.logger.debug('Attempting login for user:', loginDto.userId);
      const response = await lastValueFrom(
        from(
          this.authService.Login({
            userId: loginDto.userId,
            password: loginDto.password,
          }),
        ),
      );
      this.logger.debug('Auth service response:', response);

      if (!response || !response.accessToken) {
        this.logger.error('Invalid response from auth service:', response);
        throw new Error('Invalid response from auth service');
      }

      return {
        access_token: response.accessToken,
        user: {
          userId: loginDto.userId,
        },
      };
    } catch (error) {
      this.logger.error(
        'Login failed for user',
        loginDto.userId + ':',
        error.message,
      );
      throw new HttpException(
        'Authentication failed',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
