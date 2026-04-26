import type { MessageRecord } from '../../types/message.js';

const messages: MessageRecord[] = [];

export function addMessage(message: MessageRecord): MessageRecord {
  messages.push(message);
  return message;
}

export function listMessages(): MessageRecord[] {
  return messages;
}
