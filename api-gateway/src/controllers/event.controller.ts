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
  Put,
} from '@nestjs/common';
import { ClientGrpc } from '@nestjs/microservices';
import { lastValueFrom, from } from 'rxjs';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { RolesGuard } from '../guards/roles.guard';
import { Roles } from '../decorators/roles.decorator';
import { Role } from '../enums/role.enum';
import {
  EventService,
  Event,
  CreateAttendanceEventResponse,
} from '../proto/event';
import { CreateEventDto } from '../dto/create-event.dto';
import { CreateAttendanceEventDto } from '../dto/create-attendance-event.dto';

@Controller('events')
@ApiTags('Events')
@ApiBearerAuth('access-token')
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
  @ApiOperation({ summary: '이벤트 생성' })
  @ApiResponse({ status: 201, description: '이벤트가 성공적으로 생성됨' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden. Only OPERATOR or ADMIN can create events.',
  })
  async createEvent(@Body() createEventDto: CreateEventDto): Promise<Event> {
    try {
      return await lastValueFrom(
        from(this.eventService.CreateEvent(createEventDto)),
      );
    } catch (error) {
      this.logger.error(`Failed to create event: ${error.message}`);
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
  @ApiOperation({ summary: '이벤트 상세 조회' })
  @ApiResponse({ status: 200, description: '이벤트 상세 정보 조회 성공' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden. Only OPERATOR or ADMIN can view event details.',
  })
  async getEventDetail(@Param('eventId') eventId: string) {
    try {
      return await lastValueFrom(
        from(this.eventService.GetEventDetail({ eventId })),
      );
    } catch (error) {
      this.logger.error(`Failed to get event detail: ${error.message}`);
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
    @Body() createAttendanceEventDto: CreateAttendanceEventDto,
  ): Promise<CreateAttendanceEventResponse> {
    try {
      return await lastValueFrom(
        from(this.eventService.CreateAttendanceEvent(createAttendanceEventDto)),
      );
    } catch (error) {
      this.logger.error(`Attendance event creation failed: ${error.message}`);
      throw new HttpException(
        error.message || 'Internal server error',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: '이벤트 수정' })
  @ApiResponse({ status: 200, description: '이벤트가 성공적으로 수정됨' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden. Only ADMIN can update events.',
  })
  async updateEvent(@Param('id') id: string, @Body() updateEventDto: any) {
    try {
      return await lastValueFrom(
        from(this.eventService.UpdateEvent({ eventId: id, ...updateEventDto })),
      );
    } catch (error) {
      this.logger.error(`Failed to update event: ${error.message}`);
      throw new HttpException(
        error.message || 'Internal server error',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
