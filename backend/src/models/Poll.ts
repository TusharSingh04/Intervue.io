import mongoose, { Schema, Document } from 'mongoose';
import { IPoll, IPollOption } from '../types';

export interface IPollDocument extends Omit<IPoll, '_id' | 'id'>, Document {
  id: string;
}

const PollOptionSchema = new Schema<IPollOption>({
  id: { type: String, required: true },
  text: { type: String, required: true },
  votes: { type: Number, default: 0 },
  isCorrect: { type: Boolean, default: false }
}, { _id: false });

const PollSchema = new Schema<IPollDocument>({
  id: { type: String, required: true, unique: true, index: true },
  question: { type: String, required: true },
  options: { type: [PollOptionSchema], required: true },
  duration: { type: Number, required: true },
  startTime: { type: Date, default: null },
  endTime: { type: Date, default: null },
  isActive: { type: Boolean, default: false },
  createdBy: { type: String, required: true }
}, {
  timestamps: true
});

// Index for efficient queries
PollSchema.index({ isActive: 1 });
PollSchema.index({ createdAt: -1 });

export const Poll = mongoose.model<IPollDocument>('Poll', PollSchema);
