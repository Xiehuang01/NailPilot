import { Router } from 'express';
import { getDb } from '../config/db.js';

const router = Router();

router.get('/', async (_req, res, next) => {
  try {
    const db = getDb();
    await db.query('SELECT 1');

    res.json({
      status: 'ok',
      database: 'connected',
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    next(error);
  }
});

export default router;
