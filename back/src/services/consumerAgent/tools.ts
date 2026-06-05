import { consumerAgentSkills } from './skills/index.js';
import type { ConsumerAgentSkill, QwenToolDefinition, SkillResult } from './types.js';

const handlers = Object.fromEntries(
  consumerAgentSkills.map((skill) => [skill.definition.function.name, skill.handler]),
) as Record<string, ConsumerAgentSkill['handler']>;

export const getConsumerAgentTools = (): QwenToolDefinition[] => consumerAgentSkills.map((skill) => skill.definition);

export const runConsumerAgentTool = async (name = '', args: Record<string, unknown> = {}): Promise<SkillResult> => {
  const handler = handlers[name];
  if (!handler) {
    return {
      error: `Unknown tool: ${name}`,
    };
  }

  return handler(args);
};
