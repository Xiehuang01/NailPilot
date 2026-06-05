import type { ConsumerAgentSkill } from '../types.js';

const normalizeText = (text = '') => text.toLowerCase();

export const analyzeNailPreferenceSkill: ConsumerAgentSkill = {
  definition: {
    type: 'function',
    function: {
      name: 'analyze_nail_preference',
      description: '根据用户描述提取美甲偏好，用于推荐款式或引导试戴。',
      parameters: {
        type: 'object',
        properties: {
          user_text: {
            type: 'string',
            description: '用户原始描述。',
          },
        },
        required: ['user_text'],
      },
    },
  },
  handler: (args = {}) => {
    const userText = typeof args.user_text === 'string' ? args.user_text : '';
    const text = normalizeText(userText);
    const budget = text.match(/(\d{2,4})\s*(元|块|rmb|¥)?/)?.[1] ?? '';
    const styleKeywords = ['显白', '温柔', '通勤', '猫眼', '法式', '短甲', '长甲', '低调', '高级', '可爱'].filter((item) =>
      userText.includes(item),
    );

    return {
      budget,
      styleKeywords,
      scene: ['约会', '上班', '通勤', '婚礼', '派对'].find((item) => userText.includes(item)) ?? '',
      wantsTryOn: /试戴|拍照|上传|效果|看看|模拟/.test(userText),
    };
  },
};
