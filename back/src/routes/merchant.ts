import { Router } from 'express';
import { generateReport, getDashboard } from '../services/merchantService.js';

const router = Router();

router.get('/dashboard', async (_req, res, next) => {
  try {
    res.json(await getDashboard());
  } catch (error) {
    next(error);
  }
});

router.post('/reports', async (req, res, next) => {
  try {
    res.json(await generateReport(req.body.type));
  } catch (error) {
    next(error);
  }
});

export default router;
