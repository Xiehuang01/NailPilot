import cors from 'cors';
import express from 'express';
import type { CorsOptions } from 'cors';
import { env } from './config/env.js';
import { errorHandler, notFoundHandler } from './middleware/error.js';
import healthRouter from './routes/health.js';
import bookingRouter from './routes/bookings.js';
import consumerAgentRouter from './routes/consumerAgent.js';
import handRouter from './routes/hand.js';
import merchantRouter from './routes/merchant.js';
import recommendationRouter from './routes/recommendations.js';
import styleSelectionRouter from './routes/styleSelections.js';
import styleRouter from './routes/styles.js';
import tryOnRouter from './routes/tryOn.js';

const app = express();
const allowedOrigins = env.CORS_ORIGIN.split(',').map((item) => item.trim()).filter(Boolean);
const isLocalDevOrigin = (origin: string) => /^http:\/\/(localhost|127\.0\.0\.1):\d+$/.test(origin);

const corsOptions: CorsOptions = {
  origin(origin, callback) {
    if (!origin || env.CORS_ORIGIN === '*' || allowedOrigins.includes(origin) || isLocalDevOrigin(origin)) {
      callback(null, true);
      return;
    }

    callback(null, false);
  },
  credentials: true,
};

app.use(cors(corsOptions));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

app.get('/', (_req, res) => {
  res.json({
    name: 'NailPilot API',
    status: 'ok',
    baseUrl: '/api',
  });
});

app.use('/api/health', healthRouter);
app.use('/api/consumer-agent', consumerAgentRouter);
app.use('/api/styles', styleRouter);
app.use('/api/style-selections', styleSelectionRouter);
app.use('/api/hand', handRouter);
app.use('/api/try-on', tryOnRouter);
app.use('/api/recommendations', recommendationRouter);
app.use('/api/bookings', bookingRouter);
app.use('/api/merchant', merchantRouter);

app.use(notFoundHandler);
app.use(errorHandler);

export default app;
