export type AgentRole = 'assistant' | 'system' | 'tool' | 'user';

export type AgentMessage = {
  content: string;
  role: AgentRole;
  tool_call_id?: string;
  tool_calls?: QwenToolCall[];
};

export type QwenToolCall = {
  function?: {
    arguments?: unknown;
    name?: string;
  };
  id: string;
};

export type QwenToolDefinition = {
  function: {
    description: string;
    name: string;
    parameters: Record<string, unknown>;
  };
  type: 'function';
};

export type SkillResult = Record<string, unknown>;

export type ConsumerAgentSkill = {
  definition: QwenToolDefinition;
  handler: (args?: Record<string, unknown>) => SkillResult | Promise<SkillResult>;
};

export type AgentAction = {
  mode?: unknown;
  quickMode?: unknown;
  type: 'start_try_on';
};

export type AgentStyleCard = {
  id: number;
  img: string;
  name: string;
  price: string;
  score: number;
  tags: string[];
};

export type ConsumerAgentChatInput = {
  context?: Record<string, unknown>;
  message?: string;
  reset?: boolean;
  sessionId?: string;
  signal?: AbortSignal;
};

export type QwenChatCompletion = {
  choices?: Array<{
    message?: AgentMessage;
  }>;
};
