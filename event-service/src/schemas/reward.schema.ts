import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type RewardDocument = Reward & Document;

@Schema({ timestamps: true })
export class Reward {
  @Prop({ type: Types.ObjectId, required: true })
  eventId: Types.ObjectId;

  @Prop({ required: true })
  title: string;

  @Prop({ required: true })
  description: string;

  @Prop({ required: true })
  requiredAttendance: number;

  @Prop({ required: true })
  rewardType: string;

  @Prop({ required: true })
  rewardValue: string;

  @Prop({ default: true })
  isActive: boolean;
}

export const RewardSchema = SchemaFactory.createForClass(Reward);

@Schema({ timestamps: true })
export class UserRewardStatus extends Document {
  @Prop({ type: Types.ObjectId, required: true })
  userId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, required: true })
  eventId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, required: true })
  rewardId: Types.ObjectId;

  @Prop({ default: 0 })
  currentAttendance: number;

  @Prop({ default: false })
  isEligible: boolean;

  @Prop({ default: false })
  isClaimed: boolean;

  @Prop()
  claimedAt: Date;
}

export type UserRewardStatusDocument = UserRewardStatus & Document;
export const UserRewardStatusSchema =
  SchemaFactory.createForClass(UserRewardStatus);
