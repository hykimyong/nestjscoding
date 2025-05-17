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
import {
  RewardService,
  CreateRewardResponse,
  GetEventRewardsResponse,
  GetUserRewardStatusResponse,
  RequestRewardResponse,
} from './proto/reward';

@ApiTags('auth')
@Controller()
export class GatewayController implements OnModuleInit {
  private readonly logger = new Logger(GatewayController.name);
  private authService: AuthService;
  private eventService: EventService;
  private rewardService: RewardService;

  constructor(
    @Inject('AUTH_PACKAGE') private authClient: ClientGrpc,
    @Inject('EVENT_PACKAGE') private readonly eventClient: ClientGrpc,
    @Inject('REWARD_PACKAGE') private readonly rewardClient: ClientGrpc,
  ) {}

  onModuleInit() {
    this.authService = this.authClient.getService<AuthService>('AuthService');
    this.eventService =
      this.eventClient.getService<EventService>('EventService');
    this.rewardService =
      this.rewardClient.getService<RewardService>('RewardService');
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
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: '보상 요청' })
  @ApiResponse({ status: 200, description: '보상 요청 성공' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async requestReward(
    @Request() req,
    @Body() body: { eventId: string; rewardId: string },
  ) {
    try {
      this.logger.debug(
        'Request user info:',
        JSON.stringify(req.user, null, 2),
      );
      const userId = req.user.userId;
      this.logger.debug(`Requesting reward for user: ${userId}`);
      return await lastValueFrom(
        from(
          this.rewardService.RequestReward({
            userId,
            eventId: body.eventId,
            rewardId: body.rewardId,
          }),
        ),
      );
    } catch (error) {
      this.logger.error(`Failed to request reward: ${error.message}`);
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

  @Post('rewards')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.OPERATOR, Role.ADMIN)
  @ApiOperation({ summary: '이벤트 보상 생성' })
  @ApiResponse({
    status: 201,
    description: '보상이 성공적으로 생성되었습니다.',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  async createReward(
    @Body()
    body: {
      eventId: string;
      title: string;
      description: string;
      requiredAttendance: number;
      rewardType: string;
      rewardValue: string;
      isActive: boolean;
    },
  ): Promise<CreateRewardResponse> {
    try {
      this.logger.debug(`Creating reward for event: ${body.eventId}`);
      return await lastValueFrom(from(this.rewardService.CreateReward(body)));
    } catch (error) {
      this.logger.error(`Failed to create reward: ${error.message}`);
      throw new HttpException(
        error.message || 'Internal server error',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('rewards/event/:eventId')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: '이벤트의 보상 목록 조회' })
  @ApiResponse({ status: 200, description: '보상 목록 조회 성공' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getEventRewards(@Param('eventId') eventId: string) {
    try {
      return await lastValueFrom(
        from(this.rewardService.GetEventRewards({ eventId })),
      );
    } catch (error) {
      this.logger.error(`Failed to get event rewards: ${error.message}`);
      throw new HttpException(
        error.message || 'Internal server error',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('rewards/status')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: '사용자의 보상 상태 조회' })
  @ApiResponse({ status: 200, description: '보상 상태 조회 성공' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getUserRewardStatus(
    @Query('userId') userId: string,
    @Query('eventId') eventId: string,
  ) {
    try {
      return await lastValueFrom(
        from(this.rewardService.GetUserRewardStatus({ userId, eventId })),
      );
    } catch (error) {
      this.logger.error(`Failed to get user reward status: ${error.message}`);
      throw new HttpException(
        error.message || 'Internal server error',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
