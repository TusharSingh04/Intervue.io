import { Request, Response } from 'express';
import { pollService } from '../services';

export class PollController {
  async getActivePoll(req: Request, res: Response): Promise<void> {
    try {
      const poll = await pollService.getActivePoll();
      
      if (!poll) {
        res.json({ success: true, data: null });
        return;
      }

      const remainingTime = pollService.getRemainingTime(poll);
      
      res.json({
        success: true,
        data: {
          poll,
          remainingTime
        }
      });
    } catch (error) {
      console.error('Error getting active poll:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get active poll'
      });
    }
  }

  async getPollHistory(req: Request, res: Response): Promise<void> {
    try {
      const limit = parseInt(req.query.limit as string) || 20;
      const polls = await pollService.getPollHistory(limit);
      
      res.json({
        success: true,
        data: polls
      });
    } catch (error) {
      console.error('Error getting poll history:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get poll history'
      });
    }
  }

  async getPollById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const poll = await pollService.getPollById(id);
      
      if (!poll) {
        res.status(404).json({
          success: false,
          error: 'Poll not found'
        });
        return;
      }

      res.json({
        success: true,
        data: poll
      });
    } catch (error) {
      console.error('Error getting poll:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get poll'
      });
    }
  }

  async checkVoteStatus(req: Request, res: Response): Promise<void> {
    try {
      const { pollId, participantId } = req.params;
      const result = await pollService.hasUserVoted(pollId, participantId);
      
      res.json({
        success: true,
        data: result
      });
    } catch (error) {
      console.error('Error checking vote status:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to check vote status'
      });
    }
  }
}

export const pollController = new PollController();
