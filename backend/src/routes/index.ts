import { Router } from 'express';
import pollRoutes from './pollRoutes';

const router = Router();

router.use('/polls', pollRoutes);

// Health check
router.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

export default router;
