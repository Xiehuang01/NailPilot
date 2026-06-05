import { Router } from 'express';
import { getRecommendations } from '../services/recommendationService.js';

const router = Router();

router.get('/', async (_req, res, next) => {
  try {
    res.json(await getRecommendations());
  } catch (error) {
    next(error);
  }
});

export default router;
