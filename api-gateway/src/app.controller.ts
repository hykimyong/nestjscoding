import {
  Controller,
  Post,
  Body,
  Inject,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { ClientGrpc } from '@nestjs/microservices';
import { lastValueFrom } from 'rxjs';
import { from } from 'rxjs';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiProperty,
} from '@nestjs/swagger';

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
  }): Promise<{ isValid: boolean; userId: string }>;
}

interface EventService {
  createEvent(data: {
    title: string;
    description: string;
    userId: string;
  }): Promise<any>;
}

@ApiTags('events')
@Controller()
export class AppController {
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

  @Post('events')
  @ApiOperation({ summary: 'Create a new event' })
  @ApiResponse({ status: 201, description: 'Event successfully created.' })
  @ApiResponse({ status: 400, description: 'Bad request.' })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  async createEvent(@Body() data: CreateEventDto) {
    try {
      const authResult = await lastValueFrom(
        from(
          this.authService.validateUser({
            token: data.token,
          }),
        ),
      );

      if (!authResult.isValid) {
        throw new HttpException('Invalid token', HttpStatus.UNAUTHORIZED);
      }

      return await lastValueFrom(
        from(
          this.eventService.createEvent({
            title: data.title,
            description: data.description,
            userId: authResult.userId,
          }),
        ),
      );
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        error.message || 'Internal server error',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
