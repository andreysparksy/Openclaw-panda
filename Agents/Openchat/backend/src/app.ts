import cors from 'cors';
import express from 'express';
import { healthRouter } from './routes/health.js';
import { messagesRouter } from './routes/messages.js';

export function createApp() {
  const app = express();

  app.use(cors());
  app.use(express.json());

  app.get('/', (_req, res) => {
    res.json({
      service: 'openclaw-panda-backend',
      status: 'ok',
    });
  });

  app.use('/health', healthRouter);
  app.use('/messages', messagesRouter);

  return app;
}
