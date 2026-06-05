const injectionPatterns = [
  /ignore\s+(all\s+)?(previous|prior|above)\s+instructions?/i,
  /forget\s+(all\s+)?(previous|prior|above)\s+instructions?/i,
  /system\s+prompt/i,
  /developer\s+message/i,
  /jailbreak/i,
  /越狱/,
  /忽略(之前|以上|所有).*(指令|规则|提示词)/,
  /泄露.*(系统|开发者)?.*(提示词|prompt)/,
  /你现在不是/,
  /不要遵守/,
];

export const inspectPromptInjection = (content = '') => {
  const matched = injectionPatterns.find((pattern) => pattern.test(content));

  return {
    blocked: Boolean(matched),
    reason: matched ? '检测到可能试图覆盖系统规则或索取系统提示词的内容。' : '',
  };
};
