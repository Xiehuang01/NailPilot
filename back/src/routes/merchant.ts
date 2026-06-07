import { Router } from 'express';
import {
  generateReport,
  getConversionSuggestions,
  getDashboard,
  getStyleRanking,
  getUserPreferences,
} from '../services/merchantService.js';

const router = Router();

router.get('/dashboard', async (_req, res, next) => {
  try {
    res.json(await getDashboard());
  } catch (error) {
    next(error);
  }
});

router.get('/ranking', async (_req, res, next) => {
  try {
    res.json(await getStyleRanking());
  } catch (error) {
    next(error);
  }
});

router.get('/user-preferences', async (_req, res, next) => {
  try {
    res.json(await getUserPreferences());
  } catch (error) {
    next(error);
  }
});

router.get('/suggestions', async (_req, res, next) => {
  try {
    res.json(await getConversionSuggestions());
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
