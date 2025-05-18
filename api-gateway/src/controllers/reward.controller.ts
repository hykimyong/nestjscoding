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
  ForbiddenException,
  BadRequestException,
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
      const userId = req.user.userId;
      return await lastValueFrom(
        from(this.rewardService.RequestReward({ ...requestRewardDto, userId })),
      );
    } catch (error) {
      this.logger.error(`Failed to request reward: ${error.message}`);
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
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.USER, Role.OPERATOR, Role.ADMIN, Role.AUDITOR)
  @ApiOperation({ summary: 'Get user reward status' })
  @ApiResponse({
    status: 200,
    description: 'User reward status retrieved successfully.',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Insufficient role.',
  })
  @ApiQuery({
    name: 'eventId',
    required: false,
    description: '특정 이벤트의 보상 상태만 조회',
  })
  @ApiQuery({
    name: 'userId',
    required: false,
    description:
      '관리자/운영자/감사자가 특정 사용자의 보상 상태 조회 시 사용 (USER 권한은 사용 불가)',
  })
  async getUserRewardStatus(
    @Request() req,
    @Query('userId') userId?: string,
    @Query('eventId') eventId?: string,
  ) {
    try {
      // USER 권한인 경우 무조건 토큰의 userId 사용하고, userId 파라미터는 무시
      if (req.user.roles.includes(Role.USER)) {
        if (userId && userId !== req.user.sub) {
          throw new ForbiddenException(
            'USER 권한으로는 다른 사용자의 보상 상태를 조회할 수 없습니다.',
          );
        }
        userId = req.user.sub;
      } else if (!userId) {
        // ADMIN/OPERATOR/AUDITOR가 userId를 지정하지 않은 경우 전체 조회 불가
        throw new BadRequestException('사용자 ID를 지정해야 합니다.');
      }

      const response = await lastValueFrom(
        from(
          this.rewardService.GetUserRewardStatus({
            userId,
            eventId: eventId || '',
          }),
        ),
      );

      // 응답이 비어있는 경우에도 statuses 배열을 포함하도록 보장
      if (!response.statuses) {
        response.statuses = [];
      }

      return response;
    } catch (error) {
      this.logger.error(`Failed to get user reward status: ${error.message}`);
      if (error instanceof ForbiddenException) {
        throw error;
      }
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
