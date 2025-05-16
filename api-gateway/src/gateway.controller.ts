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

import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiProperty,
} from '@nestjs/swagger';
import { LoginDto } from './dto/login.dto';

class CreateEventDto {
  @ApiProperty({
    description: 'Event title',
    example: 'Test Event',
  })
  title: string;

  @ApiProperty({
    description: 'Event description',
    example: 'This is a test event',
  })
  description: string;

  @ApiProperty({
    description: 'Authentication token',
    example: 'test-token',
  })
  token: string;
}

interface AuthService {
  validateUser(data: {
    token: string;
  }): Promise<{ valid: boolean; userId: string }>;
  login(data: {
    username: string;
    password: string;
  }): Promise<{ accessToken: string }>;
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

  @Post('login')
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
  @ApiOperation({ summary: 'Create a new event' })
  @ApiResponse({ status: 201, description: 'Event successfully created.' })
  @ApiResponse({ status: 400, description: 'Bad request.' })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  async createEvent(
    @Body() data: { title: string; description: string; token: string },
  ) {
    try {
      this.logger.debug(`Validating token for event creation`);
      const authResult = await lastValueFrom(
        from(
          this.authService.validateUser({
            token: data.token,
          }),
        ),
      );

      if (!authResult.valid) {
        this.logger.error('Invalid token provided');
        throw new HttpException('Invalid token', HttpStatus.UNAUTHORIZED);
      }

      this.logger.debug(`Creating event with title: ${data.title}`);
      return lastValueFrom(
        from(
          this.eventService.createEvent({
            title: data.title,
            description: data.description,
            userId: authResult.userId,
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
