import mongoose, { Schema, Document } from 'mongoose';
import { IVote } from '../types';

export interface IVoteDocument extends Omit<IVote, '_id'>, Document {}

const VoteSchema = new Schema<IVoteDocument>({
  pollId: { type: String, required: true, index: true },
  optionId: { type: String, required: true },
  participantId: { type: String, required: true },
  participantName: { type: String, required: true },
  votedAt: { type: Date, default: Date.now }
});

// Compound unique index to prevent duplicate votes
VoteSchema.index({ pollId: 1, participantId: 1 }, { unique: true });

export const Vote = mongoose.model<IVoteDocument>('Vote', VoteSchema);
