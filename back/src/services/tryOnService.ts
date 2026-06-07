import type { RowDataPacket } from 'mysql2';
import { getDb } from '../config/db.js';
import { createAppError } from '../types/http.js';
import { compressImageToWebpDataUrl, generateTryOnImage } from './qwenImageService.js';
import { reviewTryOnResult } from './tryOnReviewService.js';

type StyleTryOnRow = RowDataPacket & {
  id: number;
  image_url: string;
  name: string;
  price: string;
  score: number;
  tags: unknown;
};

type TryOnTemplateRow = RowDataPacket & {
  explanation: string | null;
  result_url: string;
  score: number;
};

type CreateTryOnInput = {
  analysis?: {
    handShape?: string;
    nailBed?: string;
    skinTone?: string;
  } | null;
  imageUrl?: string;
  styleId: number;
};

const parseJson = <T>(value: unknown, fallback: T): T => {
  if (!value) {
    return fallback;
  }

  if (Array.isArray(value)) {
    return value as T;
  }

  try {
    return typeof value === 'string' ? (JSON.parse(value) as T) : fallback;
  } catch {
    return fallback;
  }
};

const parseTags = (value: unknown) => {
  if (Array.isArray(value)) {
    return value.map(String).filter(Boolean);
  }

  if (typeof value !== 'string' || !value.trim()) {
    return [] as string[];
  }

  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed.map(String).filter(Boolean) : [];
  } catch {
    return value
      .split(/[,，、]/)
      .map((item) => item.trim())
      .filter(Boolean);
  }
};

const insertTryOnEvent = async ({
  db,
  explanation,
  fitScore,
  handShape,
  nailBed,
  provider,
  recommendedStyleIds,
  skinTone,
  styleId,
  styleMatchScore,
  success,
  totalScore,
  brightenScore,
}: {
  brightenScore: number | null;
  db: ReturnType<typeof getDb>;
  explanation: string[];
  fitScore: number | null;
  handShape?: string;
  nailBed?: string;
  provider: string;
  recommendedStyleIds: number[];
  skinTone?: string;
  styleId: number;
  styleMatchScore: number | null;
  success: boolean;
  totalScore: number | null;
}) => {
  try {
    await db.query(
      `
        INSERT INTO try_on_events (
          style_id,
          provider,
          success,
          fit_score,
          brighten_score,
          style_match_score,
          total_score,
          skin_tone,
          hand_shape,
          nail_bed,
          recommended_style_ids,
          explanation
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `,
      [
        styleId,
        provider,
        success ? 1 : 0,
        fitScore,
        brightenScore,
        styleMatchScore,
        totalScore,
        skinTone ?? null,
        handShape ?? null,
        nailBed ?? null,
        JSON.stringify(recommendedStyleIds),
        JSON.stringify(explanation),
      ],
    );
  } catch (error) {
    console.warn('[AI 试戴] 试戴事件入库失败，已跳过数据埋点', {
      error: error instanceof Error ? error.message : error,
      styleId,
      time: new Date().toLocaleString('zh-CN', { hour12: false }),
    });
  }
};

export const createTryOn = async ({ styleId, imageUrl, analysis }: CreateTryOnInput) => {
  const db = getDb();
  const [styleRows] = await db.query<StyleTryOnRow[]>(
    `
      SELECT id, name, tags, price, score, image_url
      FROM styles
      WHERE id = ?
      LIMIT 1
    `,
    [styleId],
  );
  const style = styleRows[0];

  if (!style) {
    throw createAppError('Style not found', 404);
  }

  const [catalogRows] = await db.query<StyleTryOnRow[]>(
    `
      SELECT id, name, tags, price, score, image_url
      FROM styles
      ORDER BY sort_order ASC, id ASC
    `,
  );

  const [templateRows] = await db.query<TryOnTemplateRow[]>(
    `
      SELECT result_url, score, explanation
      FROM try_on_templates
      WHERE style_id = ?
      LIMIT 1
    `,
    [styleId],
  );

  const template = templateRows[0];
  const fallbackResult = {
    resultUrl: template?.result_url ?? style.image_url,
    score: template?.score ?? style.score ?? 86,
    scoreBreakdown: {
      brightenScore: Math.max(76, (template?.score ?? style.score ?? 86) - 2),
      fitScore: Math.max(75, (template?.score ?? style.score ?? 86) - 1),
      styleMatchScore: Math.max(78, template?.score ?? style.score ?? 86),
    },
    explanation: parseJson(template?.explanation, [
      '已使用商家真实款式图生成试戴预览',
      '建议重点观察指尖长度、颜色显白程度和日常适配度',
      '真实效果会受光线、甲型和拍摄角度影响',
    ]),
    provider: 'template-fallback',
    recommendations: [] as Array<{ id: number; img: string; name: string; reason: string; score: number }>,
  };

  if (!imageUrl) {
    return fallbackResult;
  }

  const safeHandFallback = {
    resultUrl: imageUrl,
    score: Math.max(72, (style.score ?? fallbackResult.score) - 10),
    scoreBreakdown: {
      brightenScore: Math.max(70, (style.score ?? fallbackResult.score) - 12),
      fitScore: 68,
      styleMatchScore: Math.max(72, (style.score ?? fallbackResult.score) - 8),
    },
    explanation: [
      '图像模型暂时没有返回可靠试戴结果，已保留你的原始手图',
      '建议换一张指甲更清晰、光线更均匀的手图后重新生成',
      '也可以换一个款式图案更清楚的美甲款式再试',
    ],
    provider: 'safe-hand-fallback',
    recommendations: [] as Array<{ id: number; img: string; name: string; reason: string; score: number }>,
  };

  try {
    const generatedResult = await generateTryOnImage({
      handImageUrl: imageUrl,
      styleImageUrl: style.image_url,
      styleName: style.name,
      styleTags: parseTags(style.tags),
    });

    const selectedStyle = {
      id: style.id,
      imageUrl: style.image_url,
      name: style.name,
      price: style.price,
      score: style.score,
      tags: parseTags(style.tags),
    };
    const styleCatalog = catalogRows.map((row) => ({
      id: row.id,
      imageUrl: row.image_url,
      name: row.name,
      price: row.price,
      score: row.score,
      tags: parseTags(row.tags),
    }));
    const reviewed = await reviewTryOnResult({
      generatedImageUrl: generatedResult.imageUrl,
      handImageUrl: imageUrl,
      handProfile: analysis ?? null,
      selectedStyle,
      styleCatalog,
      styleImageUrl: style.image_url,
    });
    const compressedResultUrl = await compressImageToWebpDataUrl(generatedResult.imageUrl);
    const recommendationMap = new Map(styleCatalog.map((item) => [item.id, item]));
    const recommendations = reviewed.recommendedStyles
      .map((item) => {
        const matched = recommendationMap.get(item.styleId);
        if (!matched) {
          return null;
        }

        return {
          id: matched.id,
          img: matched.imageUrl,
          name: matched.name,
          reason: item.reason,
          score: item.score,
        };
      })
      .filter((item): item is NonNullable<typeof item> => Boolean(item));

    await insertTryOnEvent({
      brightenScore: reviewed.brightenScore,
      db,
      explanation: reviewed.summary,
      fitScore: reviewed.fitScore,
      handShape: analysis?.handShape,
      nailBed: analysis?.nailBed,
      provider: generatedResult.provider,
      recommendedStyleIds: recommendations.map((item) => item.id),
      skinTone: analysis?.skinTone,
      styleId,
      styleMatchScore: reviewed.styleMatchScore,
      success: true,
      totalScore: reviewed.totalScore,
    });

    console.log('[AI 试戴] 已使用 Cats/gptImage2 直接合成试戴图', {
      compressedFormat: 'webp',
      compressedMaxEdge: 1024,
      provider: generatedResult.provider,
      recommendedStyleIds: recommendations.map((item) => item.id),
      reviewScore: reviewed.totalScore,
      styleId,
      styleName: style.name,
      time: new Date().toLocaleString('zh-CN', { hour12: false }),
    });

    return {
      resultUrl: compressedResultUrl,
      score: reviewed.totalScore,
      scoreBreakdown: {
        brightenScore: reviewed.brightenScore,
        fitScore: reviewed.fitScore,
        styleMatchScore: reviewed.styleMatchScore,
      },
      explanation: reviewed.summary,
      provider: generatedResult.provider,
      recommendations,
    };
  } catch (error) {
    await insertTryOnEvent({
      brightenScore: safeHandFallback.scoreBreakdown.brightenScore,
      db,
      explanation: safeHandFallback.explanation,
      fitScore: safeHandFallback.scoreBreakdown.fitScore,
      handShape: analysis?.handShape,
      nailBed: analysis?.nailBed,
      provider: safeHandFallback.provider,
      recommendedStyleIds: [],
      skinTone: analysis?.skinTone,
      styleId,
      styleMatchScore: safeHandFallback.scoreBreakdown.styleMatchScore,
      success: false,
      totalScore: safeHandFallback.score,
    });

    console.warn('[AI 试戴] Cats/gptImage2 直接合成失败，已返回安全原图兜底', {
      error: error instanceof Error ? error.message : error,
      styleId,
      styleName: style.name,
      time: new Date().toLocaleString('zh-CN', { hour12: false }),
    });
    return safeHandFallback;
  }
};
