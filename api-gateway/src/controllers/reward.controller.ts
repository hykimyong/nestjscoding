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
  Query,
} from '@nestjs/common';
import { ClientGrpc } from '@nestjs/microservices';
import { lastValueFrom, from } from 'rxjs';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { RolesGuard } from '../guards/roles.guard';
import { Roles } from '../decorators/roles.decorator';
import { Role } from '../enums/role.enum';
import { RewardService, CreateRewardResponse } from '../proto/reward';

@Controller('rewards')
@ApiTags('Rewards')
export class RewardController {
  private readonly logger = new Logger(RewardController.name);
  private rewardService: RewardService;

  constructor(@Inject('REWARD_PACKAGE') private rewardClient: ClientGrpc) {}

  onModuleInit() {
    this.rewardService =
      this.rewardClient.getService<RewardService>('RewardService');
  }

  @Post('request')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.USER)
  @ApiOperation({ summary: '보상 요청' })
  @ApiResponse({ status: 200, description: '보상 요청 성공' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden. Only USER role can request rewards.',
  })
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

  @Get('history')
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

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.OPERATOR, Role.ADMIN)
  @ApiOperation({ summary: 'Create a new reward' })
  @ApiResponse({ status: 201, description: 'Reward successfully created.' })
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
      this.logger.debug(
        `Creating reward for event ${body.eventId}: ${body.title}`,
      );
      return await lastValueFrom(from(this.rewardService.CreateReward(body)));
    } catch (error) {
      this.logger.error(`Reward creation failed: ${error.message}`);
      throw new HttpException(
        error.message || 'Internal server error',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('status')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Get user reward status' })
  @ApiResponse({
    status: 200,
    description: 'User reward status retrieved successfully.',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  async getUserRewardStatus(
    @Request() req,
    @Query('userId') targetUserId?: string,
    @Query('eventId') eventId?: string,
  ) {
    try {
      const userId = targetUserId || req.user.userId;
      this.logger.debug(
        `Getting reward status for user: ${userId}, event: ${eventId || 'all'}`,
      );
      return await lastValueFrom(
        from(
          this.rewardService.GetUserRewardStatus({
            userId,
            eventId: eventId || '',
          }),
        ),
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
