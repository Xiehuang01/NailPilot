import { Router } from 'express';
import { createBooking } from '../services/bookingService.js';

const router = Router();

router.post('/', async (req, res, next) => {
  try {
    res.status(201).json(await createBooking(req.body));
  } catch (error) {
    next(error);
  }
});

export default router;
