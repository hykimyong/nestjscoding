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
import { lastValueFrom } from 'rxjs';
import { from } from 'rxjs';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';

interface AuthService {
  validateUser(data: {
    token: string;
  }): Promise<{ valid: boolean; userId: string }>;
  login(data: {
    username: string;
    password: string;
  }): Promise<{ access_token: string }>;
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
export class AppController {
  private readonly logger = new Logger(AppController.name);
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
  async login(@Body() data: { username: string; password: string }) {
    try {
      this.logger.debug(`Login attempt for user: ${data.username}`);
      this.logger.debug('Calling auth service login method...');
      const result = await lastValueFrom(
        from(
          this.authService.login({
            username: data.username,
            password: data.password,
          }),
        ),
      );
      this.logger.debug(
        `Login response from auth service: ${JSON.stringify(result)}`,
      );
      if (!result || !result.access_token) {
        throw new Error('Invalid response from auth service');
      }
      return { access_token: result.access_token };
    } catch (error) {
      this.logger.error(
        `Login failed for user ${data.username}: ${error.message}`,
        error.stack,
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
