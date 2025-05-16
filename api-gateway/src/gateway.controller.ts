import {
  Controller,
  Post,
  Body,
  Inject,
  Logger,
  HttpException,
  HttpStatus,
  UseGuards,
  Request,
} from '@nestjs/common';
import { ClientGrpc } from '@nestjs/microservices';
import { lastValueFrom, from } from 'rxjs';

import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { LoginDto } from './dto/login.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { RolesGuard } from './guards/roles.guard';
import { Roles } from './decorators/roles.decorator';

interface AuthService {
  validateUser(data: {
    token: string;
  }): Promise<{ valid: boolean; userId: string }>;
  login(data: {
    username: string;
    password: string;
  }): Promise<{ accessToken: string }>;
  register(data: { username: string; password: string }): Promise<{
    success: boolean;
    message: string;
    user: { id: string; username: string };
  }>;
}

interface EventService {
  createEvent(data: {
    title: string;
    description: string;
    userId: string;
  }): Promise<any>;
}

@ApiTags('auth')
@Controller()
export class GatewayController {
  private readonly logger = new Logger(GatewayController.name);
  private authService: AuthService;
  private eventService: EventService;

  constructor(
    @Inject('AUTH_PACKAGE') private authClient: ClientGrpc,
    @Inject('EVENT_PACKAGE') private eventClient: ClientGrpc,
  ) {
    this.authService = this.authClient.getService<AuthService>('AuthService');
    this.eventService =
      this.eventClient.getService<EventService>('EventService');
  }

  @Post('auth/register')
  @ApiOperation({ summary: 'Register a new user' })
  @ApiResponse({ status: 201, description: 'User successfully registered.' })
  @ApiResponse({ status: 400, description: 'Bad request.' })
  async register(@Body() registerDto: LoginDto) {
    try {
      console.log('Attempting to register user:', registerDto.username);
      const response = await lastValueFrom(
        from(this.authService.register(registerDto)),
      );
      console.log('Auth service response:', response);

      if (!response || !response.success) {
        console.error('Invalid response from auth service:', response);
        throw new Error('Registration failed');
      }

      return {
        message: response.message,
        user: response.user,
      };
    } catch (error) {
      console.error(
        'Registration failed for user',
        registerDto.username + ':',
        error.message,
      );
      throw new HttpException(
        'Registration failed',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post('auth/login')
  @ApiOperation({ summary: 'Login to get JWT token' })
  @ApiResponse({ status: 200, description: 'Login successful.' })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  async login(@Body() loginDto: LoginDto) {
    try {
      console.log('Attempting login for user:', loginDto.username);
      const response = await lastValueFrom(
        from(this.authService.login(loginDto)),
      );
      console.log('Auth service response:', response);

      if (!response || !response.accessToken) {
        console.error('Invalid response from auth service:', response);
        throw new Error('Invalid response from auth service');
      }

      return {
        access_token: response.accessToken,
        user: {
          username: loginDto.username,
        },
      };
    } catch (error) {
      console.error(
        'Login failed for user',
        loginDto.username + ':',
        error.message,
      );
      throw new HttpException(
        'Authentication failed',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post('events')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('user')
  @ApiOperation({ summary: 'Create a new event' })
  @ApiResponse({ status: 201, description: 'Event successfully created.' })
  @ApiResponse({ status: 400, description: 'Bad request.' })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  async createEvent(
    @Body() data: { title: string; description: string },
    @Request() req,
  ) {
    try {
      this.logger.debug(`Creating event with title: ${data.title}`);
      return lastValueFrom(
        from(
          this.eventService.createEvent({
            title: data.title,
            description: data.description,
            userId: req.user.userId,
          }),
        ),
      );
    } catch (error) {
      this.logger.error(`Event creation failed: ${error.message}`);
      throw new HttpException(
        error.message || 'Internal server error',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
