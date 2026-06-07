import { Router } from 'express';
import { recordStyleSelection } from '../services/styleSelectionService.js';

const router = Router();

router.post('/', async (req, res, next) => {
  try {
    res.json(await recordStyleSelection(req.body));
  } catch (error) {
    next(error);
  }
});

export default router;
