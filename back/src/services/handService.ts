import { env } from '../config/env.js';
import { createAppError } from '../types/http.js';

type HandAnalyzePayload = {
  imageUrl?: string;
};

type HandQualityResult = {
  fingersSpread: boolean;
  isValidPhoto: boolean;
  nailVisible: boolean;
  qualityReason: string;
  suggestions: string[];
};

type HandAnalysisResult = HandQualityResult & {
  handShape: string;
  nailBed: string;
  skinTone: string;
};

const extractImageUrl = (payload: unknown) => {
  if (typeof payload === 'string') {
    return payload;
  }

  if (!payload || typeof payload !== 'object') {
    return '';
  }

  return typeof (payload as HandAnalyzePayload).imageUrl === 'string' ? (payload as HandAnalyzePayload).imageUrl ?? '' : '';
};

const extractJsonObject = (text: string) => {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/i)?.[1];
  const raw = fenced ?? text;
  const start = raw.indexOf('{');
  const end = raw.lastIndexOf('}');
  if (start < 0 || end < start) {
    return null;
  }

  try {
    return JSON.parse(raw.slice(start, end + 1)) as Partial<HandAnalysisResult>;
  } catch {
    return null;
  }
};

const normalizeBoolean = (value: unknown, fallback: boolean) => (typeof value === 'boolean' ? value : fallback);
const normalizeText = (value: unknown, fallback: string) => (typeof value === 'string' && value.trim() ? value.trim() : fallback);
const normalizeStringArray = (value: unknown, fallback: string[]) =>
  Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string' && item.trim().length > 0).slice(0, 4) : fallback;

const normalizeAnalysis = (value: Partial<HandAnalysisResult> | null): HandAnalysisResult => {
  const fingersSpread = normalizeBoolean(value?.fingersSpread, false);
  const nailVisible = normalizeBoolean(value?.nailVisible, false);
  const isValidPhoto = normalizeBoolean(value?.isValidPhoto, fingersSpread && nailVisible);

  return {
    fingersSpread,
    handShape: normalizeText(value?.handShape, '未知手型'),
    isValidPhoto,
    nailBed: normalizeText(value?.nailBed, '未知甲床'),
    nailVisible,
    qualityReason: normalizeText(
      value?.qualityReason,
      isValidPhoto ? '手指张开且指尖清晰，适合继续试戴。' : '手指没有充分张开或指尖不够清晰，请重新上传。',
    ),
    skinTone: normalizeText(value?.skinTone, '未知肤色'),
    suggestions: normalizeStringArray(value?.suggestions, ['请手背朝上、五指自然张开，完整露出所有指尖。']),
  };
};

const buildHandQualityPrompt = () =>
  [
    '你是美甲试戴前的手图质检模型。请判断这张图片是否适合做 AI 美甲试戴。',
    '',
    '合格标准：',
    '1. 必须是人的手部照片。',
    '2. 手背或手掌可以，但 5 根手指应尽量自然张开，不能明显并拢、握拳、弯曲遮挡。',
    '3. 至少 4 个指甲/指尖清晰可见，最好 5 个都可见。',
    '4. 指尖不能严重裁切、模糊、过暗、过曝或被物体遮挡。',
    '5. 如果手指没有张开，会影响甲片定位，必须判定为不合格。',
    '',
    '只输出 JSON，不要输出解释性段落：',
    JSON.stringify(
      {
        fingersSpread: true,
        handShape: '短圆手/细长手/宽掌手/未知手型',
        isValidPhoto: true,
        nailBed: '偏短/适中/偏长/未知甲床',
        nailVisible: true,
        qualityReason: '一句中文说明为什么通过或不通过',
        skinTone: '冷白皮/暖黄皮/中性皮/橄榄皮/未知肤色',
        suggestions: ['如果不合格，给 1-3 条重新拍摄建议'],
      },
      null,
      2,
    ),
  ].join('\n');

export const analyzeHand = async (payload: unknown): Promise<HandAnalysisResult> => {
  const imageUrl = extractImageUrl(payload);
  if (!imageUrl) {
    throw createAppError('imageUrl is required', 400);
  }

  if (!env.DASHSCOPE_API_KEY) {
    throw createAppError('DASHSCOPE_API_KEY is required for hand quality check', 503, {
      code: 'MISSING_DASHSCOPE_API_KEY',
    });
  }

  const response = await fetch(`${env.DASHSCOPE_BASE_URL}/chat/completions`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${env.DASHSCOPE_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      messages: [
        {
          content: [
            {
              image_url: {
                url: imageUrl,
              },
              type: 'image_url',
            },
            {
              text: buildHandQualityPrompt(),
              type: 'text',
            },
          ],
          role: 'user',
        },
      ],
      model: env.HAND_QUALITY_MODEL,
      temperature: 0,
    }),
  });

  if (!response.ok) {
    const detail = await response.text();
    throw createAppError(`Hand quality model request failed: ${response.status}`, response.status, { detail });
  }

  const result = (await response.json()) as { choices?: Array<{ message?: { content?: unknown } }> };
  const content = result.choices?.[0]?.message?.content;
  const text = typeof content === 'string' ? content : JSON.stringify(content ?? '');
  const analysis = normalizeAnalysis(extractJsonObject(text));

  console.log('[手图质检] 已完成上传手图检查', {
    fingersSpread: analysis.fingersSpread,
    isValidPhoto: analysis.isValidPhoto,
    model: env.HAND_QUALITY_MODEL,
    nailVisible: analysis.nailVisible,
    reason: analysis.qualityReason,
    time: new Date().toLocaleString('zh-CN', { hour12: false }),
  });

  return analysis;
};
