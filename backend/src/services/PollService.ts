import { v4 as uuidv4 } from 'uuid';
import { Poll, Vote } from '../models';
import { IPoll, IPollOption, CreatePollPayload, VotePayload } from '../types';
import { isDBConnected } from '../config/database';

// In-memory store for when DB is unavailable
let inMemoryPoll: IPoll | null = null;
let inMemoryVotes: Map<string, { optionId: string; participantId: string; participantName: string }> = new Map();

class PollService {
  private pollEndTimer: NodeJS.Timeout | null = null;
  private onPollEnd: ((poll: IPoll) => void) | null = null;

  setOnPollEnd(callback: (poll: IPoll) => void): void {
    this.onPollEnd = callback;
  }

  async createPoll(payload: CreatePollPayload, createdBy: string): Promise<IPoll> {
    const { question, options, duration } = payload;
    
    const pollId = uuidv4();
    const now = new Date();
    const endTime = new Date(now.getTime() + duration * 1000);

    const pollOptions: IPollOption[] = options.map((opt) => {
      // Handle both string[] and Array<{ text: string; isCorrect: boolean }> formats
      if (typeof opt === 'string') {
        return {
          id: uuidv4(),
          text: opt,
          votes: 0,
          isCorrect: false
        };
      }
      return {
        id: uuidv4(),
        text: opt.text,
        votes: 0,
        isCorrect: opt.isCorrect || false
      };
    });

    const pollData: IPoll = {
      id: pollId,
      question,
      options: pollOptions,
      duration,
      startTime: now,
      endTime,
      isActive: true,
      createdBy,
      createdAt: now,
      updatedAt: now
    };

    if (isDBConnected()) {
      try {
        // Deactivate any existing active polls
        await Poll.updateMany({ isActive: true }, { isActive: false });
        
        const poll = new Poll(pollData);
        await poll.save();
        
        // Clear any existing votes for this session
        inMemoryVotes.clear();
      } catch (error) {
        console.error('Error saving poll to DB:', error);
        // Fall back to in-memory
        inMemoryPoll = pollData;
        inMemoryVotes.clear();
      }
    } else {
      inMemoryPoll = pollData;
      inMemoryVotes.clear();
    }

    // Set timer for poll end
    this.startPollTimer(pollData);

    return pollData;
  }

  private startPollTimer(poll: IPoll): void {
    // Clear any existing timer
    if (this.pollEndTimer) {
      clearTimeout(this.pollEndTimer);
    }

    const remainingTime = this.getRemainingTime(poll);
    
    if (remainingTime > 0) {
      this.pollEndTimer = setTimeout(async () => {
        await this.endPoll(poll.id);
      }, remainingTime * 1000);
    }
  }

  async endPoll(pollId: string): Promise<IPoll | null> {
    if (this.pollEndTimer) {
      clearTimeout(this.pollEndTimer);
      this.pollEndTimer = null;
    }

    let poll: IPoll | null = null;

    if (isDBConnected()) {
      try {
        const dbPoll = await Poll.findOneAndUpdate(
          { id: pollId },
          { isActive: false, endTime: new Date() },
          { new: true }
        );
        
        if (dbPoll) {
          poll = dbPoll.toObject() as unknown as IPoll;
        }
      } catch (error) {
        console.error('Error ending poll in DB:', error);
      }
    }

    if (!poll && inMemoryPoll && inMemoryPoll.id === pollId) {
      inMemoryPoll.isActive = false;
      inMemoryPoll.endTime = new Date();
      poll = inMemoryPoll;
    }

    if (poll && this.onPollEnd) {
      this.onPollEnd(poll);
    }

    return poll;
  }

  async getActivePoll(): Promise<IPoll | null> {
    if (isDBConnected()) {
      try {
        const poll = await Poll.findOne({ isActive: true }).sort({ createdAt: -1 });
        if (poll) {
          const pollObj = poll.toObject() as unknown as IPoll;
          
          // Check if poll has expired
          if (pollObj.endTime && new Date() > new Date(pollObj.endTime)) {
            await this.endPoll(pollObj.id);
            return null;
          }
          
          // Restart timer if needed (for server restart recovery)
          if (pollObj.isActive && !this.pollEndTimer) {
            this.startPollTimer(pollObj);
          }
          
          return pollObj;
        }
      } catch (error) {
        console.error('Error getting active poll from DB:', error);
      }
    }

    if (inMemoryPoll && inMemoryPoll.isActive) {
      if (inMemoryPoll.endTime && new Date() > new Date(inMemoryPoll.endTime)) {
        await this.endPoll(inMemoryPoll.id);
        return null;
      }
      return inMemoryPoll;
    }

    return null;
  }

  async vote(payload: VotePayload): Promise<{ success: boolean; message: string; poll?: IPoll }> {
    const { pollId, optionId, participantId, participantName } = payload;

    // Get the poll
    let poll = await this.getActivePoll();
    
    if (!poll || poll.id !== pollId) {
      return { success: false, message: 'Poll not found or has ended' };
    }

    // Check if poll is still active
    if (!poll.isActive || (poll.endTime && new Date() > new Date(poll.endTime))) {
      return { success: false, message: 'Poll has ended' };
    }

    // Validate option exists
    const optionExists = poll.options.some(opt => opt.id === optionId);
    if (!optionExists) {
      return { success: false, message: 'Invalid option' };
    }

    if (isDBConnected()) {
      try {
        // Check if user already voted (race condition prevention)
        const existingVote = await Vote.findOne({ pollId, participantId });
        if (existingVote) {
          return { success: false, message: 'You have already voted' };
        }

        // Create vote with unique constraint
        const vote = new Vote({
          pollId,
          optionId,
          participantId,
          participantName,
          votedAt: new Date()
        });

        await vote.save();

        // Update poll votes count
        await Poll.updateOne(
          { id: pollId, 'options.id': optionId },
          { $inc: { 'options.$.votes': 1 } }
        );

        // Get updated poll
        const updatedPoll = await Poll.findOne({ id: pollId });
        if (updatedPoll) {
          poll = updatedPoll.toObject() as unknown as IPoll;
        }
      } catch (error: any) {
        // Handle duplicate key error (race condition)
        if (error.code === 11000) {
          return { success: false, message: 'You have already voted' };
        }
        console.error('Error saving vote to DB:', error);
        return { success: false, message: 'Error recording vote' };
      }
    } else {
      // In-memory vote handling
      const voteKey = `${pollId}_${participantId}`;
      if (inMemoryVotes.has(voteKey)) {
        return { success: false, message: 'You have already voted' };
      }

      inMemoryVotes.set(voteKey, { optionId, participantId, participantName });
      
      // Update in-memory poll
      if (inMemoryPoll) {
        const option = inMemoryPoll.options.find(opt => opt.id === optionId);
        if (option) {
          option.votes++;
        }
        poll = inMemoryPoll;
      }
    }

    return { success: true, message: 'Vote recorded successfully', poll };
  }

  async hasUserVoted(pollId: string, participantId: string): Promise<{ voted: boolean; optionId?: string }> {
    if (isDBConnected()) {
      try {
        const vote = await Vote.findOne({ pollId, participantId });
        if (vote) {
          return { voted: true, optionId: vote.optionId };
        }
      } catch (error) {
        console.error('Error checking vote in DB:', error);
      }
    }

    // Check in-memory
    const voteKey = `${pollId}_${participantId}`;
    const inMemoryVote = inMemoryVotes.get(voteKey);
    if (inMemoryVote) {
      return { voted: true, optionId: inMemoryVote.optionId };
    }

    return { voted: false };
  }

  getRemainingTime(poll: IPoll): number {
    if (!poll.startTime || !poll.isActive) return 0;
    
    const now = new Date().getTime();
    const endTime = new Date(poll.startTime).getTime() + (poll.duration * 1000);
    const remaining = Math.max(0, Math.ceil((endTime - now) / 1000));
    
    return remaining;
  }

  async getPollHistory(limit: number = 20): Promise<IPoll[]> {
    if (isDBConnected()) {
      try {
        const polls = await Poll.find({ isActive: false })
          .sort({ createdAt: -1 })
          .limit(limit);
        return polls.map(p => p.toObject() as unknown as IPoll);
      } catch (error) {
        console.error('Error getting poll history from DB:', error);
      }
    }

    // Return in-memory poll if it's ended
    if (inMemoryPoll && !inMemoryPoll.isActive) {
      return [inMemoryPoll];
    }

    return [];
  }

  async getPollById(pollId: string): Promise<IPoll | null> {
    if (isDBConnected()) {
      try {
        const poll = await Poll.findOne({ id: pollId });
        if (poll) {
          return poll.toObject() as unknown as IPoll;
        }
      } catch (error) {
        console.error('Error getting poll from DB:', error);
      }
    }

    if (inMemoryPoll && inMemoryPoll.id === pollId) {
      return inMemoryPoll;
    }

    return null;
  }

  async getVotesForPoll(pollId: string): Promise<number> {
    if (isDBConnected()) {
      try {
        return await Vote.countDocuments({ pollId });
      } catch (error) {
        console.error('Error counting votes:', error);
      }
    }

    // Count in-memory votes for this poll
    let count = 0;
    inMemoryVotes.forEach((vote, key) => {
      if (key.startsWith(pollId)) count++;
    });
    return count;
  }

  async canCreateNewPoll(): Promise<{ canCreate: boolean; reason?: string }> {
    const activePoll = await this.getActivePoll();
    
    if (!activePoll) {
      return { canCreate: true };
    }

    // Check if poll has ended
    if (!activePoll.isActive || this.getRemainingTime(activePoll) <= 0) {
      return { canCreate: true };
    }

    return { 
      canCreate: false, 
      reason: 'A poll is currently active. Please wait for it to end.' 
    };
  }
}

export const pollService = new PollService();
