import {
  Controller,
  Post,
  Body,
  Inject,
  Logger,
  HttpException,
  HttpStatus,
  UseGuards,
  Get,
  Query,
  Param,
} from '@nestjs/common';
import { ClientGrpc } from '@nestjs/microservices';
import { lastValueFrom, from } from 'rxjs';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { RolesGuard } from '../guards/roles.guard';
import { Roles } from '../decorators/roles.decorator';
import { Role } from '../enums/role.enum';
import {
  EventService,
  Event,
  CreateAttendanceEventResponse,
} from '../proto/event';

@Controller('events')
@ApiTags('Events')
export class EventController {
  private readonly logger = new Logger(EventController.name);
  private eventService: EventService;

  constructor(@Inject('EVENT_PACKAGE') private eventClient: ClientGrpc) {}

  onModuleInit() {
    this.eventService =
      this.eventClient.getService<EventService>('EventService');
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.OPERATOR, Role.ADMIN)
  @ApiOperation({ summary: 'Create a new event' })
  @ApiResponse({ status: 201, description: 'Event successfully created.' })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  async createEvent(
    @Body() body: { title: string; description: string; userId: string },
  ): Promise<Event> {
    try {
      this.logger.debug(`Creating event: ${body.title}`);
      return await lastValueFrom(from(this.eventService.CreateEvent(body)));
    } catch (error) {
      this.logger.error(`Event creation failed: ${error.message}`);
      throw new HttpException(
        error.message || 'Internal server error',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.OPERATOR, Role.ADMIN)
  @ApiOperation({ summary: 'List all events with pagination' })
  @ApiResponse({ status: 200, description: 'Events retrieved successfully.' })
  async listEvents(
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
    @Query('search') searchKeyword?: string,
  ) {
    try {
      this.logger.debug(
        `Listing events - page: ${page}, limit: ${limit}, search: ${searchKeyword}`,
      );
      return await lastValueFrom(
        from(
          this.eventService.ListEvents({
            page: page,
            limit: limit,
            searchKeyword: searchKeyword,
          }),
        ),
      );
    } catch (error) {
      this.logger.error(`Failed to list events: ${error.message}`);
      throw new HttpException(
        error.message || 'Internal server error',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get(':eventId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.OPERATOR, Role.ADMIN)
  @ApiOperation({ summary: 'Get event details' })
  @ApiResponse({
    status: 200,
    description: 'Event details retrieved successfully.',
  })
  @ApiResponse({ status: 404, description: 'Event not found.' })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  @ApiResponse({ status: 403, description: 'Forbidden. Insufficient role.' })
  async getEventDetail(@Param('eventId') eventId: string) {
    try {
      this.logger.debug(`Getting event details for ID: ${eventId}`);
      return await lastValueFrom(
        from(this.eventService.GetEventDetail({ eventId })),
      );
    } catch (error) {
      this.logger.error(`Failed to get event details: ${error.message}`);
      throw new HttpException(
        error.message || 'Internal server error',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post('attendance')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.OPERATOR, Role.ADMIN)
  @ApiOperation({ summary: 'Create a new attendance event' })
  @ApiResponse({
    status: 201,
    description: 'Attendance event successfully created.',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  async createAttendanceEvent(
    @Body()
    body: {
      title: string;
      description: string;
      startDate: string;
      endDate: string;
      userId: string;
      isActive: boolean;
      requiredDays: number;
    },
  ): Promise<CreateAttendanceEventResponse> {
    try {
      this.logger.debug(`Creating attendance event: ${body.title}`);
      return await lastValueFrom(
        from(this.eventService.CreateAttendanceEvent(body)),
      );
    } catch (error) {
      this.logger.error(`Attendance event creation failed: ${error.message}`);
      throw new HttpException(
        error.message || 'Internal server error',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
