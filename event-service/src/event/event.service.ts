import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Attendance, AttendanceDocument } from '../schemas/attendance.schema';

@Injectable()
export class EventService {
  private readonly logger = new Logger(EventService.name);
  private events: any[] = [];

  constructor(
    @InjectModel(Attendance.name)
    private attendanceModel: Model<AttendanceDocument>,
  ) {}

  async createEvent(data: {
    title: string;
    description: string;
    userId: string;
  }) {
    const event = {
      id: `event-${Date.now()}`,
      title: data.title,
      description: data.description,
      userId: data.userId,
      createdAt: new Date().toISOString(),
    };
    this.events.push(event);
    return event;
  }

  async createAttendanceEvent(data: {
    title: string;
    description: string;
    startDate: string;
    endDate: string;
    userId: string;
    isActive?: boolean;
    requiredDays: number;
  }) {
    const event = new this.attendanceModel({
      id: `attendance-${Date.now()}`,
      title: data.title,
      description: data.description,
      startDate: data.startDate,
      endDate: data.endDate,
      userId: data.userId,
      type: 'ATTENDANCE',
      isActive: data.isActive ?? true,
      requiredDays: data.requiredDays,
      createdAt: new Date().toISOString(),
    });

    const savedEvent = await event.save();

    return {
      success: true,
      message: '출석 이벤트가 생성되었습니다.',
      data: {
        id: savedEvent.id,
        title: savedEvent.title,
        description: savedEvent.description,
        startDate: savedEvent.startDate,
        endDate: savedEvent.endDate,
        type: savedEvent.type,
        isActive: savedEvent.isActive,
        requiredDays: savedEvent.requiredDays,
        createdAt: savedEvent.createdAt,
      },
    };
  }

  async listEvents(data: {
    page: number;
    limit: number;
    searchKeyword?: string;
  }) {
    const page = data.page || 1;
    const limit = data.limit || 10;
    const skip = (page - 1) * limit;

    const query: any = {};
    if (data.searchKeyword) {
      query.$or = [
        { title: { $regex: data.searchKeyword, $options: 'i' } },
        { description: { $regex: data.searchKeyword, $options: 'i' } },
      ];
    }

    const [events, total] = await Promise.all([
      this.attendanceModel
        .find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean()
        .exec(),
      this.attendanceModel.countDocuments(query),
    ]);

    const totalPages = Math.ceil(total / limit);

    return {
      success: true,
      message: '이벤트 목록 조회 성공',
      events: events.map((event) => ({
        id: event.id,
        title: event.title,
        description: event.description,
        startDate: event.startDate,
        endDate: event.endDate,
        type: event.type,
        isActive: event.isActive,
        requiredDays: event.requiredDays,
        createdAt: event.createdAt,
      })),
      total,
      currentPage: page,
      totalPages,
    };
  }

  async getEventDetail(data: { eventId: string }) {
    const event = await this.attendanceModel
      .findOne({ id: data.eventId })
      .lean()
      .exec();

    if (!event) {
      throw new NotFoundException('이벤트를 찾을 수 없습니다.');
    }

    return {
      success: true,
      message: '이벤트 상세 조회 성공',
      event: {
        id: event.id,
        title: event.title,
        description: event.description,
        startDate: event.startDate,
        endDate: event.endDate,
        type: event.type,
        isActive: event.isActive,
        requiredDays: event.requiredDays,
        createdAt: event.createdAt,
      },
    };
  }
}
