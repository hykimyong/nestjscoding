import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type AttendanceDocument = Attendance & Document;

@Schema()
export class Attendance {
  @Prop({ required: true })
  id: string;

  @Prop({ required: true })
  title: string;

  @Prop()
  description: string;

  @Prop({ required: true })
  startDate: string;

  @Prop({ required: true })
  endDate: string;

  @Prop({ required: true })
  userId: string;

  @Prop({ default: 'ATTENDANCE' })
  type: string;

  @Prop({ default: true })
  isActive: boolean;

  @Prop({ required: true })
  requiredDays: number;

  @Prop({ default: Date.now })
  createdAt: string;
}

export const AttendanceSchema = SchemaFactory.createForClass(Attendance);
