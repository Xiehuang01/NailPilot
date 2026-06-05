import { env } from '../../config/env.js';
import { createAppError } from '../../types/http.js';
import type { AgentMessage, QwenChatCompletion, QwenToolDefinition } from './types.js';

type CallQwenChatInput = {
  messages: AgentMessage[];
  signal?: AbortSignal;
  tools: QwenToolDefinition[];
};

export const callQwenChat = async ({ messages, signal, tools }: CallQwenChatInput): Promise<QwenChatCompletion> => {
  if (!env.DASHSCOPE_API_KEY) {
    throw createAppError('DASHSCOPE_API_KEY is not configured', undefined, { code: 'MISSING_DASHSCOPE_API_KEY' });
  }

  const response = await fetch(`${env.DASHSCOPE_BASE_URL}/chat/completions`, {
    method: 'POST',
    signal,
    headers: {
      Authorization: `Bearer ${env.DASHSCOPE_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: env.QWEN_MODEL,
      messages,
      tools,
      tool_choice: 'auto',
      temperature: 0.6,
    }),
  });

  if (!response.ok) {
    const detail = await response.text();
    throw createAppError(`DashScope request failed: ${response.status}`, response.status, { detail });
  }

  return (await response.json()) as QwenChatCompletion;
};
