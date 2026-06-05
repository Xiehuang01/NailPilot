import { Router } from 'express';
import { analyzeHand } from '../services/handService.js';

const router = Router();

router.post('/analyze', async (req, res, next) => {
  try {
    res.json(await analyzeHand(req.body));
  } catch (error) {
    next(error);
  }
});

export default router;
