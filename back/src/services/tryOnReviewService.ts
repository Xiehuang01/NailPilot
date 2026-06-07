import { env } from '../config/env.js';
import { createAppError } from '../types/http.js';

type ReviewStyle = {
  id: number;
  imageUrl: string;
  name: string;
  price: string;
  score: number;
  tags: string[];
};

type HandProfile = {
  handShape?: string;
  nailBed?: string;
  skinTone?: string;
};

type ReviewPayload = {
  brightenScore?: number;
  fitScore?: number;
  recommendedStyles?: Array<{
    reason?: string;
    score?: number;
    styleId?: number;
  }>;
  styleMatchScore?: number;
  summary?: string[];
  totalScore?: number;
};

export type TryOnVisualReview = {
  brightenScore: number;
  fitScore: number;
  recommendedStyles: Array<{
    reason: string;
    score: number;
    styleId: number;
  }>;
  styleMatchScore: number;
  summary: string[];
  totalScore: number;
};

type ReviewTryOnInput = {
  generatedImageUrl: string;
  handImageUrl: string;
  handProfile?: HandProfile | null;
  selectedStyle: ReviewStyle;
  styleCatalog: ReviewStyle[];
  styleImageUrl: string;
};

const clampScore = (score: number, min = 0, max = 100) => Math.min(max, Math.max(min, Math.round(score)));

const normalizeContentText = (content: unknown) => {
  if (typeof content === 'string') {
    return content;
  }

  if (Array.isArray(content)) {
    return content
      .map((item) => {
        if (typeof item === 'string') {
          return item;
        }

        if (item && typeof item === 'object' && 'text' in item && typeof item.text === 'string') {
          return item.text;
        }

        return '';
      })
      .join('\n');
  }

  return JSON.stringify(content ?? '');
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
    return JSON.parse(raw.slice(start, end + 1)) as ReviewPayload;
  } catch {
    return null;
  }
};

const normalizeSummary = (value: unknown, fallback: string[]) =>
  Array.isArray(value)
    ? value.filter((item): item is string => typeof item === 'string' && item.trim().length > 0).slice(0, 4)
    : fallback;

const buildCatalogSnippet = (styles: ReviewStyle[], selectedStyleId: number) =>
  styles
    .filter((style) => style.id !== selectedStyleId)
    .map(
      (style) =>
        `#${style.id} | ${style.name} | tags=${style.tags.join('、') || '无'} | 价格=${style.price} | 基础热度=${style.score}`,
    )
    .join('\n');

const buildReviewPrompt = ({
  handProfile,
  selectedStyle,
  styleCatalog,
}: {
  handProfile?: HandProfile | null;
  selectedStyle: ReviewStyle;
  styleCatalog: ReviewStyle[];
}) =>
  [
    '你是美甲 AI 试戴质检与推荐模型。请只基于输入图片和款式库信息，返回严格 JSON。',
    '',
    '输入说明：',
    '图1：用户原始手图。',
    '图2：本次选中的目标款式参考图。',
    '图3：已经生成完成的 AI 试戴结果图。',
    '',
    '你的任务：',
    '1. 你的评价重点是“最终戴上之后好不好看”，不是单纯做技术质检。',
    '2. 分别输出：整体美观度 fitScore、显白与肤色映衬度 brightenScore、风格气质适配度 styleMatchScore、总分 totalScore。',
    '3. 总分必须综合前三项，但不要机械平均，要更看重最终视觉高级感、协调感和用户会不会想下单。',
    '4. 甲片边界、长度、透视是否自然，只作为底线判断：如果明显穿帮，会拉低整体美观度；如果自然，就不要一直重复讲技术细节。',
    '5. 再从“同一家店的其他款式库”里推荐最多 3 款更适合这只手的款式，不能推荐当前已选款式。',
    '6. 推荐时要结合手型、肤色、甲床长度、当前试戴效果和其他款式的 tags。',
    '',
    `当前已选款式：#${selectedStyle.id} ${selectedStyle.name} | tags=${selectedStyle.tags.join('、') || '无'} | 价格=${selectedStyle.price}`,
    handProfile?.skinTone ? `用户肤色：${handProfile.skinTone}` : '',
    handProfile?.handShape ? `用户手型：${handProfile.handShape}` : '',
    handProfile?.nailBed ? `用户甲床：${handProfile.nailBed}` : '',
    '',
    '同店其他候选款式库（只能从这里选推荐）：',
    buildCatalogSnippet(styleCatalog, selectedStyle.id),
    '',
    '打分标准：',
    'fitScore：这里表示整体美观度。重点看上手后是否精致、协调、顺眼，手和甲是不是一个完整高级的视觉整体。',
    'brightenScore：看颜色、材质、明暗和透明感对用户肤色是否显白、提气色、有质感。',
    'styleMatchScore：看款式风格与这只手的手型、甲床、整体气质是否匹配，是否会让人觉得“这就是适合她的款”。',
    'totalScore：最终综合分，0-100。',
    '',
    'summary 要求：',
    '1. 不要机械重复“边界清晰、透视自然”这类工程术语，除非真的明显影响美观。',
    '2. 多评价整体观感、手部气质、颜色衬肤、是否显贵/显白/显干净、是否适合日常或约会等。',
    '3. 语气像会说话、会哄人的专业美甲顾问，不像图像质检员。',
    '4. 可以自然使用“很衬你、会显手更白、看起来更温柔、很适合日常、会比较提气色、上手会更精致”这类表达。',
    '5. 尽量先肯定优点，再轻一点地提示哪里还能更适合，不要冷冰冰扣分。',
    '',
    '只输出 JSON，字段必须完整：',
    JSON.stringify(
      {
        fitScore: 92,
        brightenScore: 88,
        styleMatchScore: 90,
        totalScore: 91,
        summary: [
          '整体美观度一句话结论',
          '显白与肤色映衬一句话结论',
          '风格气质适配一句话结论',
        ],
        recommendedStyles: [
          {
            styleId: 1,
            score: 95,
            reason: '为什么这款更适合这只手',
          },
        ],
      },
      null,
      2,
    ),
  ]
    .filter(Boolean)
    .join('\n');

const computeFallbackReview = ({
  handProfile,
  selectedStyle,
  styleCatalog,
}: {
  handProfile?: HandProfile | null;
  selectedStyle: ReviewStyle;
  styleCatalog: ReviewStyle[];
}): TryOnVisualReview => {
  const tags = new Set(selectedStyle.tags);
  const skinTone = handProfile?.skinTone ?? '';
  const nailBed = handProfile?.nailBed ?? '';
  const fitScore = clampScore(84 + (tags.has('短甲友好') ? 6 : 0) + (nailBed.includes('偏长') && tags.has('长甲') ? 3 : 0) - (nailBed.includes('偏短') && tags.has('长甲') ? 4 : 0));
  const brightenScore = clampScore(
    82 +
      (tags.has('显白') ? 7 : 0) +
      (skinTone.includes('暖黄') && (tags.has('裸色') || tags.has('裸咖') || tags.has('奶茶') || tags.has('通勤')) ? 5 : 0) +
      (tags.has('黑法式') || tags.has('豹纹') ? -2 : 0),
  );
  const styleMatchScore = clampScore(83 + Math.round((selectedStyle.score - 88) * 0.8) + (tags.has('通勤') || tags.has('百搭') ? 4 : 0));
  const totalScore = clampScore(fitScore * 0.4 + brightenScore * 0.25 + styleMatchScore * 0.35, 72, 98);

  const recommendedStyles = styleCatalog
    .filter((style) => style.id !== selectedStyle.id)
    .map((style) => {
      const sharedTagCount = style.tags.filter((tag) => selectedStyle.tags.includes(tag)).length;
      const comfortBoost = skinTone.includes('暖黄') && style.tags.some((tag) => ['显白', '裸色', '奶茶', '通勤', '百搭'].includes(tag)) ? 4 : 0;
      const score = clampScore(style.score + sharedTagCount * 2 + comfortBoost);
      return {
        reason: `${style.tags.slice(0, 2).join('、')} 的感觉会更衬 ${handProfile?.skinTone ?? '当前肤色'}，上手也更容易显得手部精致又耐看。`,
        score,
        styleId: style.id,
      };
    })
    .sort((left, right) => right.score - left.score)
    .slice(0, 3);

  return {
    fitScore,
    brightenScore,
    recommendedStyles,
    styleMatchScore,
    summary: [
      `整体美观度 ${fitScore} 分：${selectedStyle.name} 上手后的观感挺顺眼的，会让手部看起来更精致，不会有很突兀的感觉。`,
      `肤色映衬 ${brightenScore} 分：这款对 ${handProfile?.skinTone ?? '当前肤色'} 还蛮友好的，整体会比较提气色，也更容易显得手干净。`,
      `气质适配 ${styleMatchScore} 分：${selectedStyle.name} 和 ${handProfile?.handShape ?? '当前手型'}、${handProfile?.nailBed ?? '当前甲床'} 的感觉是搭的，日常看也会比较舒服耐看。`,
    ],
    totalScore,
  };
};

const normalizeReview = (
  payload: ReviewPayload | null,
  fallback: TryOnVisualReview,
  styleCatalog: ReviewStyle[],
  selectedStyleId: number,
): TryOnVisualReview => {
  const styleIds = new Set(styleCatalog.map((style) => style.id));
  const recommendedStyles = Array.isArray(payload?.recommendedStyles)
    ? payload.recommendedStyles
        .map((item) => ({
          reason: typeof item?.reason === 'string' && item.reason.trim() ? item.reason.trim() : '这款和当前手型、肤色的适配度更稳定。',
          score: clampScore(typeof item?.score === 'number' ? item.score : fallback.totalScore),
          styleId: typeof item?.styleId === 'number' ? item.styleId : -1,
        }))
        .filter((item) => item.styleId !== selectedStyleId && styleIds.has(item.styleId))
        .slice(0, 3)
    : [];

  const fitScore = clampScore(typeof payload?.fitScore === 'number' ? payload.fitScore : fallback.fitScore);
  const brightenScore = clampScore(typeof payload?.brightenScore === 'number' ? payload.brightenScore : fallback.brightenScore);
  const styleMatchScore = clampScore(typeof payload?.styleMatchScore === 'number' ? payload.styleMatchScore : fallback.styleMatchScore);
  const computedTotal = clampScore(fitScore * 0.42 + brightenScore * 0.22 + styleMatchScore * 0.36, 72, 99);
  const totalScore = clampScore(typeof payload?.totalScore === 'number' ? payload.totalScore : computedTotal, 72, 99);

  return {
    fitScore,
    brightenScore,
    recommendedStyles: recommendedStyles.length ? recommendedStyles : fallback.recommendedStyles,
    styleMatchScore,
    summary: normalizeSummary(payload?.summary, fallback.summary),
    totalScore,
  };
};

export const reviewTryOnResult = async ({
  generatedImageUrl,
  handImageUrl,
  handProfile,
  selectedStyle,
  styleCatalog,
  styleImageUrl,
}: ReviewTryOnInput): Promise<TryOnVisualReview> => {
  const fallback = computeFallbackReview({ handProfile, selectedStyle, styleCatalog });

  if (!env.DASHSCOPE_API_KEY) {
    console.warn('[AI 复评] 未配置视觉模型 Key，已使用本地评分兜底');
    return fallback;
  }

  try {
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
                  url: handImageUrl,
                },
                type: 'image_url',
              },
              {
                image_url: {
                  url: styleImageUrl,
                },
                type: 'image_url',
              },
              {
                image_url: {
                  url: generatedImageUrl,
                },
                type: 'image_url',
              },
              {
                text: buildReviewPrompt({
                  handProfile,
                  selectedStyle,
                  styleCatalog,
                }),
                type: 'text',
              },
            ],
            role: 'user',
          },
        ],
        model: env.TRY_ON_REVIEW_MODEL,
        temperature: 0,
      }),
    });

    if (!response.ok) {
      const detail = await response.text();
      throw createAppError(`Try-on review model request failed: ${response.status}`, response.status, { detail });
    }

    const result = (await response.json()) as { choices?: Array<{ message?: { content?: unknown } }> };
    const content = result.choices?.[0]?.message?.content;
    const text = normalizeContentText(content);
    const review = normalizeReview(extractJsonObject(text), fallback, styleCatalog, selectedStyle.id);

    console.log('[AI 复评] 已完成试戴评分与改款推荐', {
      brightenScore: review.brightenScore,
      fitScore: review.fitScore,
      model: env.TRY_ON_REVIEW_MODEL,
      recommendedStyleIds: review.recommendedStyles.map((item) => item.styleId),
      styleId: selectedStyle.id,
      styleMatchScore: review.styleMatchScore,
      totalScore: review.totalScore,
      time: new Date().toLocaleString('zh-CN', { hour12: false }),
    });

    return review;
  } catch (error) {
    console.warn('[AI 复评] 视觉评分失败，已使用本地规则兜底', {
      error: error instanceof Error ? error.message : error,
      styleId: selectedStyle.id,
      time: new Date().toLocaleString('zh-CN', { hour12: false }),
    });
    return fallback;
  }
};
