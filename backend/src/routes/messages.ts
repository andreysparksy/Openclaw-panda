import { Router } from 'express';
import { z } from 'zod';
import { addMessage, listMessages } from '../modules/messages/message-store.js';
import { classifyOwnerContext } from '../modules/context/context-classifier.js';
import { evaluateAlertCandidates } from '../modules/alerts/alert-rules.js';

const messageSchema = z.object({
  id: z.string(),
  chatId: z.string(),
  topicId: z.string().optional(),
  author: z.string(),
  text: z.string(),
  createdAt: z.string(),
});

export const messagesRouter = Router();

messagesRouter.get('/', (_req, res) => {
  const messages = listMessages();
  const signals = messages.map(classifyOwnerContext);
  const alerts = evaluateAlertCandidates(signals);

  res.json({ messages, signals, alerts });
});

messagesRouter.post('/', (req, res) => {
  const parsed = messageSchema.safeParse(req.body);

  if (!parsed.success) {
    return res.status(400).json({ ok: false, error: parsed.error.flatten() });
  }

  const message = addMessage(parsed.data);
  const signal = classifyOwnerContext(message);
  const alerts = evaluateAlertCandidates(listMessages().map(classifyOwnerContext));

  return res.status(201).json({ ok: true, message, signal, alerts });
});
