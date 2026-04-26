export interface MessageRecord {
  id: string;
  chatId: string;
  topicId?: string;
  author: string;
  text: string;
  createdAt: string;
}

export interface ContextSignal {
  messageId: string;
  isOwnerRelated: boolean;
  dependencyType: string | null;
  summary: string;
  matchedAliases: string[];
}
