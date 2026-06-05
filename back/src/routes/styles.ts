import { Router } from 'express';
import { getStyles } from '../services/styleService.js';

const router = Router();

router.get('/', async (_req, res, next) => {
  try {
    res.json(await getStyles());
  } catch (error) {
    next(error);
  }
});

export default router;
