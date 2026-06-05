import type { ConsumerAgentSkill } from '../types.js';

export const prepareTryOnFlowSkill: ConsumerAgentSkill = {
  definition: {
    type: 'function',
    function: {
      name: 'prepare_try_on_flow',
      description: '当用户表达想试戴、拍照、上传手图、看效果时，准备进入试戴流程。',
      parameters: {
        type: 'object',
        properties: {
          mode: {
            type: 'string',
            enum: ['quick', 'detailed'],
            description: 'quick 表示直接试戴，detailed 表示先做偏好问卷。',
          },
        },
        required: ['mode'],
      },
    },
  },
  handler: (args = {}) => {
    const mode = args.mode === 'detailed' ? 'detailed' : 'quick';
    return {
      action: 'start_try_on',
      mode,
      quickMode: mode === 'quick',
      message: mode === 'quick' ? '已准备进入快速试戴流程。' : '已准备进入详细推荐流程。',
    };
  },
};
