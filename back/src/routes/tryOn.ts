import { Router } from 'express';
import { createTryOn } from '../services/tryOnService.js';

const router = Router();

router.post('/', async (req, res, next) => {
  try {
    res.json(await createTryOn(req.body));
  } catch (error) {
    next(error);
  }
});

export default router;
