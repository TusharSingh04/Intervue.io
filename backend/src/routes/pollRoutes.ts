import { Router } from 'express';
import { pollController } from '../controllers/PollController';

const router = Router();

// Get active poll
router.get('/active', (req, res) => pollController.getActivePoll(req, res));

// Get poll history
router.get('/history', (req, res) => pollController.getPollHistory(req, res));

// Get poll by ID
router.get('/:id', (req, res) => pollController.getPollById(req, res));

// Check vote status
router.get('/:pollId/vote/:participantId', (req, res) => pollController.checkVoteStatus(req, res));

export default router;
