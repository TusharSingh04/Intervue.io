import mongoose, { Schema, Document } from 'mongoose';
import { IParticipant } from '../types';

export interface IParticipantDocument extends Omit<IParticipant, '_id' | 'id'>, Document {
  id: string;
}

const ParticipantSchema = new Schema<IParticipantDocument>({
  id: { type: String, required: true, unique: true, index: true },
  name: { type: String, required: true },
  socketId: { type: String, required: true },
  role: { type: String, enum: ['teacher', 'student'], required: true },
  joinedAt: { type: Date, default: Date.now },
  isActive: { type: Boolean, default: true }
});

// Index for efficient active participant queries
ParticipantSchema.index({ isActive: 1, role: 1 });

export const Participant = mongoose.model<IParticipantDocument>('Participant', ParticipantSchema);
