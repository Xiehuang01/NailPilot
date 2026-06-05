import { randomUUID } from 'node:crypto';
import type { SkillResult } from './types.js';

type AgentLogPayload = Record<string, unknown>;

const agentEventText: Record<string, string> = {
  agent_loop_start: '开始进入 Agent 循环，准备让模型判断是否需要调用 skill',
  direct_skill_finish: '直接查询款式完成，准备把款式卡片返回给前端',
  direct_skill_start: '识别到用户在问店内款式，直接查询款式库',
  invalid_request: '收到无效请求，用户消息为空',
  llm_call_finish: '大模型本轮回复完成',
  llm_call_start: '正在请求大模型思考下一步',
  llm_empty_message: '大模型没有返回有效内容，本轮提前结束',
  local_fallback_used: '未配置 DashScope Key，已使用本地兜底回复',
  memory_reset: '已清空当前会话记忆',
  prompt_guard_blocked: '检测到疑似提示词注入，已拦截',
  request_aborted: '用户打断了本轮 Agent 请求',
  request_received: '收到用户消息',
  response_ready: '回复已生成，准备返回给前端',
  tool_call_finish: 'skill 调用完成',
  tool_call_start: '准备调用一个 skill',
};

export const createAgentTraceId = () => randomUUID().slice(0, 8);

export const previewText = (text: string, maxLength = 80) => {
  const normalized = text.replace(/\s+/g, ' ').trim();
  return normalized.length > maxLength ? `${normalized.slice(0, maxLength)}...` : normalized;
};

export const summarizeSkillResult = (result: SkillResult) => ({
  action: result.action,
  display: result.display,
  error: result.error,
  returnedFields: Object.keys(result),
  stylesCount: Array.isArray(result.styles) ? result.styles.length : undefined,
});

export const logAgent = (traceId: string, event: string, payload: AgentLogPayload = {}) => {
  console.log(`[小团 Agent][${traceId}] ${agentEventText[event] ?? event}`, {
    event,
    time: new Date().toLocaleString('zh-CN', { hour12: false }),
    ...payload,
  });
};

export const logAgentWarn = (traceId: string, event: string, payload: AgentLogPayload = {}) => {
  console.warn(`[小团 Agent][${traceId}] ${agentEventText[event] ?? event}`, {
    event,
    time: new Date().toLocaleString('zh-CN', { hour12: false }),
    ...payload,
  });
};
