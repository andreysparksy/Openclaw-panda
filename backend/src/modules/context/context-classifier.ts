import { env } from '../../config/env.js';
import type { ContextSignal, MessageRecord } from '../../types/message.js';

const dependencyPatterns: Array<{ type: string; keywords: string[]; summary: string }> = [
  {
    type: 'waiting_for_owner_reply',
    keywords: ['ждём ответ', 'ждем ответ', 'ответь', 'посмотри', 'когда ответишь'],
    summary: 'Ждут ответа владельца контекста',
  },
  {
    type: 'waiting_for_owner_approval',
    keywords: ['подтверди', 'согласуй', 'одобри', 'добро', 'утверди'],
    summary: 'Ждут согласования или подтверждения владельца контекста',
  },
  {
    type: 'owner_resource_request',
    keywords: ['скинь', 'пришли', 'дай доступ', 'ссылку', 'файл', 'контакт'],
    summary: 'У владельца контекста повторно запрашивают ресурс или материал',
  },
];

export function classifyOwnerContext(message: MessageRecord): ContextSignal {
  const normalized = message.text.toLowerCase();
  const matchedAliases = env.ownerAliases.filter((alias) => normalized.includes(alias.toLowerCase()));
  const matchedPattern = dependencyPatterns.find((pattern) =>
    pattern.keywords.some((keyword) => normalized.includes(keyword)),
  );

  const isOwnerRelated = matchedAliases.length > 0 || Boolean(matchedPattern);

  return {
    messageId: message.id,
    isOwnerRelated,
    dependencyType: matchedPattern?.type ?? null,
    summary: matchedPattern?.summary ?? 'Контекст пока не классифицирован',
    matchedAliases,
  };
}
