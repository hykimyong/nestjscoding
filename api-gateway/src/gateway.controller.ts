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
  Request,
  OnModuleInit,
  Query,
  Param,
} from '@nestjs/common';
import { ClientGrpc } from '@nestjs/microservices';
import { lastValueFrom, from } from 'rxjs';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { LoginDto } from './dto/login.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { RolesGuard } from './guards/roles.guard';
import { Roles } from './decorators/roles.decorator';
import { Role } from './enums/role.enum';
import { AuthService, RegisterResponse } from './proto/auth';
import {
  EventService,
  Event,
  CreateAttendanceEventResponse,
} from './proto/event';

@ApiTags('auth')
@Controller()
export class GatewayController implements OnModuleInit {
  private readonly logger = new Logger(GatewayController.name);
  private authService: AuthService;
  private eventService: EventService;

  constructor(
    @Inject('AUTH_PACKAGE') private authClient: ClientGrpc,
    @Inject('EVENT_PACKAGE') private readonly eventClient: ClientGrpc,
  ) {}

  onModuleInit() {
    this.authService = this.authClient.getService<AuthService>('AuthService');
    this.eventService =
      this.eventClient.getService<EventService>('EventService');
  }

  @Post('auth/register')
  @ApiOperation({ summary: 'Register a new user' })
  @ApiResponse({ status: 201, description: 'User successfully registered.' })
  @ApiResponse({ status: 400, description: 'Bad request.' })
  async register(@Body() registerDto: LoginDto): Promise<RegisterResponse> {
    try {
      console.log('Attempting to register user:', registerDto.username);
      const response = await lastValueFrom(
        from(this.authService.Register(registerDto)),
      );
      console.log('Auth service response:', response);

      if (!response || !response.success) {
        console.error('Invalid response from auth service:', response);
        throw new Error('Registration failed');
      }

      return {
        success: response.success,
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
        from(this.authService.Login(loginDto)),
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

  @Post('rewards/request')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.USER)
  @ApiOperation({ summary: 'Request a reward' })
  @ApiResponse({ status: 201, description: 'Reward request successful.' })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  async requestReward(@Body() data: { eventId: string }, @Request() req) {
    try {
      this.logger.debug(
        `User ${req.user.userId} requesting reward for event ${data.eventId}`,
      );
      // TODO: Implement reward request logic
      return { message: 'Reward request submitted successfully' };
    } catch (error) {
      this.logger.error(`Reward request failed: ${error.message}`);
      throw new HttpException(
        error.message || 'Internal server error',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post('events')
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

  @Get('rewards/history')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.AUDITOR, Role.ADMIN)
  @ApiOperation({ summary: 'Get reward history' })
  @ApiResponse({
    status: 200,
    description: 'Reward history retrieved successfully.',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  async getRewardHistory(@Request() req) {
    try {
      this.logger.debug(`User ${req.user.userId} requesting reward history`);
      // TODO: Implement reward history retrieval logic
      return { message: 'Reward history retrieved successfully' };
    } catch (error) {
      this.logger.error(`Failed to get reward history: ${error.message}`);
      throw new HttpException(
        error.message || 'Internal server error',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post('events/attendance')
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
      const response = await lastValueFrom(
        from(this.eventService.CreateAttendanceEvent(body)),
      );

      return response;
    } catch (error) {
      this.logger.error(`Attendance event creation failed: ${error.message}`);
      throw new HttpException(
        error.message || 'Internal server error',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('events')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.OPERATOR, Role.ADMIN)
  @ApiOperation({ summary: 'List all events with pagination' })
  @ApiResponse({ status: 200, description: 'Events retrieved successfully.' })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  async listEvents(
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
    @Query('search') searchKeyword?: string,
  ) {
    try {
      this.logger.debug(`Listing events, page: ${page}, limit: ${limit}`);
      return await lastValueFrom(
        from(this.eventService.ListEvents({ page, limit, searchKeyword })),
      );
    } catch (error) {
      this.logger.error(`Failed to list events: ${error.message}`);
      throw new HttpException(
        error.message || 'Internal server error',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('events/:eventId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.OPERATOR, Role.ADMIN)
  @ApiOperation({ summary: 'Get event details' })
  @ApiResponse({
    status: 200,
    description: 'Event details retrieved successfully.',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  @ApiResponse({ status: 404, description: 'Event not found.' })
  async getEventDetail(@Param('eventId') eventId: string) {
    try {
      this.logger.debug(`Getting event detail for: ${eventId}`);
      const response = await lastValueFrom(
        from(this.eventService.GetEventDetail({ eventId })),
      );

      if (!response.success) {
        throw new HttpException(
          response.message || 'Event not found',
          HttpStatus.NOT_FOUND,
        );
      }

      return response;
    } catch (error) {
      this.logger.error(`Failed to get event detail: ${error.message}`);
      throw new HttpException(
        error.message || 'Internal server error',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
