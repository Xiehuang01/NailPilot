import { Router } from 'express';
import { chatWithConsumerAgent } from '../services/consumerAgent/consumerAgentService.js';

const router = Router();

router.post('/chat', async (req, res, next) => {
  const abortController = new AbortController();
  let completed = false;
  const abortRequest = () => {
    if (!completed && !res.writableEnded && !abortController.signal.aborted) {
      abortController.abort();
    }
  };

  req.on('aborted', abortRequest);
  res.on('close', abortRequest);

  try {
    const result = await chatWithConsumerAgent({
      ...req.body,
      signal: abortController.signal,
    });

    completed = true;
    if (!abortController.signal.aborted) {
      res.json(result);
    }
  } catch (error) {
    completed = true;
    if (abortController.signal.aborted) {
      return;
    }

    next(error);
  }
});

export default router;
