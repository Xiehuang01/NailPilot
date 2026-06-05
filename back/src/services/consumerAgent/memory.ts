import type { AgentMessage } from './types.js';

const sessions = new Map<string, AgentMessage[]>();
const MAX_TURNS = 12;

export const getConversation = (sessionId: string) => {
  const key = sessionId || 'default';
  if (!sessions.has(key)) {
    sessions.set(key, []);
  }

  return sessions.get(key) as AgentMessage[];
};

export const appendMessage = (sessionId: string, message: AgentMessage) => {
  const conversation = getConversation(sessionId);
  conversation.push(message);

  if (conversation.length > MAX_TURNS * 2) {
    conversation.splice(0, conversation.length - MAX_TURNS * 2);
  }
};

export const resetConversation = (sessionId: string) => {
  sessions.set(sessionId || 'default', []);
};
