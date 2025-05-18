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
  Put,
  Param,
} from '@nestjs/common';
import { ClientGrpc } from '@nestjs/microservices';
import { lastValueFrom, from } from 'rxjs';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { RolesGuard } from '../guards/roles.guard';
import { Roles } from '../decorators/roles.decorator';
import { Role } from '../enums/role.enum';
import { RewardService, CreateRewardResponse } from '../proto/reward';
import { CreateRewardDto } from '../dto/create-reward.dto';
import { RequestRewardDto } from '../dto/request-reward.dto';
import { UpdateRewardDto } from '../dto/update-reward.dto';

@Controller('rewards')
@ApiTags('Rewards')
@ApiBearerAuth('access-token')
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
    @Body() requestRewardDto: RequestRewardDto,
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
            eventId: requestRewardDto.eventId,
            rewardId: requestRewardDto.rewardId,
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
    @Body() createRewardDto: CreateRewardDto,
  ): Promise<CreateRewardResponse> {
    try {
      this.logger.debug(
        `Creating reward for event ${createRewardDto.eventId}: ${createRewardDto.title}`,
      );
      return await lastValueFrom(
        from(this.rewardService.CreateReward(createRewardDto)),
      );
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
  @ApiQuery({
    name: 'eventId',
    required: false,
    description: '특정 이벤트의 보상 상태만 조회',
  })
  @ApiQuery({
    name: 'userId',
    required: false,
    description: '관리자가 특정 사용자의 보상 상태 조회 시 사용',
  })
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

  @Put(':rewardId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: '보상 정보 수정' })
  @ApiResponse({ status: 200, description: '보상이 성공적으로 수정됨' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden. Only OPERATOR or ADMIN can update rewards.',
  })
  @ApiResponse({ status: 404, description: '보상을 찾을 수 없음' })
  async updateReward(
    @Param('rewardId') rewardId: string,
    @Body() updateRewardDto: UpdateRewardDto,
  ) {
    try {
      this.logger.debug(
        `Updating reward ${rewardId}: ${JSON.stringify(updateRewardDto)}`,
      );
      return await lastValueFrom(
        from(
          this.rewardService.UpdateReward({
            rewardId,
            ...updateRewardDto,
          }),
        ),
      );
    } catch (error) {
      this.logger.error(`Failed to update reward: ${error.message}`);
      throw new HttpException(
        error.message || 'Internal server error',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
