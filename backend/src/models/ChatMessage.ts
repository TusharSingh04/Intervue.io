import mongoose, { Schema, Document } from 'mongoose';
import { ChatMessage } from '../types';

export interface IChatMessageDocument extends Omit<ChatMessage, 'id'>, Document {
  id: string;
}

const ChatMessageSchema = new Schema<IChatMessageDocument>({
  id: { type: String, required: true, unique: true },
  senderId: { type: String, required: true },
  senderName: { type: String, required: true },
  senderRole: { type: String, enum: ['teacher', 'student'], required: true },
  message: { type: String, required: true },
  timestamp: { type: Date, default: Date.now }
});

// Index for efficient message retrieval
ChatMessageSchema.index({ timestamp: -1 });

export const ChatMessageModel = mongoose.model<IChatMessageDocument>('ChatMessage', ChatMessageSchema);
