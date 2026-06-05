import type { RowDataPacket } from 'mysql2';
import { getDb } from '../config/db.js';
import { createAppError } from '../types/http.js';
import { generateMaskedTryOnImage } from './maskedTryOnService.js';

type StyleTryOnRow = RowDataPacket & {
  id: number;
  image_url: string;
  name: string;
  score: number;
  tags: unknown;
};

type TryOnTemplateRow = RowDataPacket & {
  explanation: string | null;
  result_url: string;
  score: number;
};

type CreateTryOnInput = {
  imageUrl?: string;
  styleId: number;
};

const clampScore = (score: number, min = 72, max = 97) => Math.min(max, Math.max(min, Math.round(score)));

const stableHash = (value: string) => {
  let hash = 0;
  for (let index = 0; index < value.length; index += 1) {
    hash = (hash * 31 + value.charCodeAt(index)) >>> 0;
  }

  return hash;
};

const calculateTryOnScore = ({
  baseScore,
  imageUrl = '',
  provider,
  styleId,
}: {
  baseScore: number;
  imageUrl?: string;
  provider: 'local-mask-composite' | 'safe-hand-fallback' | 'template-fallback';
  styleId: number;
}) => {
  const seed = stableHash(`${styleId}:${imageUrl.slice(0, 180)}:${provider}`);
  const styleAdjustment = ((styleId * 7) % 9) - 4;
  const imageAdjustment = (seed % 11) - 5;
  const providerAdjustment = provider === 'local-mask-composite' ? 1 : provider === 'safe-hand-fallback' ? -10 : -5;
  const base = baseScore * 0.72 + 24;

  return clampScore(
    base + styleAdjustment + imageAdjustment + providerAdjustment,
    provider === 'local-mask-composite' ? 78 : 70,
    provider === 'local-mask-composite' ? 97 : 88,
  );
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

const getMaskDetectionLabel = (mode: string) => {
  if (mode === 'color-component') {
    return '颜色组件检测';
  }

  return mode;
};

export const createTryOn = async ({ styleId, imageUrl }: CreateTryOnInput) => {
  const db = getDb();
  const [styleRows] = await db.query<StyleTryOnRow[]>(
    `
      SELECT id, name, tags, score, image_url
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
    score: calculateTryOnScore({
      baseScore: template?.score ?? style.score ?? 86,
      imageUrl,
      provider: 'template-fallback',
      styleId,
    }),
    explanation: parseJson(template?.explanation, [
      '已使用商家真实款式图生成试戴预览',
      '建议重点观察指尖长度、颜色显白程度和日常适配度',
      '真实效果会受光线、甲型和拍摄角度影响',
    ]),
    provider: 'template-fallback',
  };

  if (!imageUrl) {
    return fallbackResult;
  }

  const safeHandFallback = {
    resultUrl: imageUrl,
    score: calculateTryOnScore({
      baseScore: style.score ?? fallbackResult.score,
      imageUrl,
      provider: 'safe-hand-fallback',
      styleId,
    }),
    explanation: [
      '系统未能生成可靠的指甲区域蒙版，已阻止展示可能跑偏的试戴结果',
      '当前先保留你的原始手图，避免改动手势、背景或肤色',
      '建议换一张指甲更清晰、光线更均匀的手图后重新生成',
    ],
    provider: 'safe-hand-fallback',
  };

  try {
    const maskedResult = await generateMaskedTryOnImage({
      handImageUrl: imageUrl,
      styleImageUrl: style.image_url,
      styleName: style.name,
      styleTags: parseJson<string[]>(style.tags, []),
    });
    console.log('[AI 试戴] 已完成局部 mask 合成', {
      changedPixelRatio: maskedResult.changedPixelRatio,
      detectionMode: maskedResult.detectionMode,
      maskCoverage: maskedResult.maskCoverage,
      nailCount: maskedResult.nailCount,
      provider: maskedResult.provider,
      sourceDesignCount: maskedResult.sourceDesignCount,
      styleId,
      styleName: style.name,
      time: new Date().toLocaleString('zh-CN', { hour12: false }),
    });

    return {
      maskUrl: maskedResult.maskUrl,
      resultUrl: maskedResult.imageUrl,
      score: calculateTryOnScore({
        baseScore: style.score ?? fallbackResult.score,
        imageUrl,
        provider: 'local-mask-composite',
        styleId,
      }),
      explanation: [
        '已先检测原手图指甲区域并生成 nail mask',
        `本次使用 ${getMaskDetectionLabel(maskedResult.detectionMode)}，识别到约 ${maskedResult.nailCount} 个甲面区域`,
        '最终图已用 mask 强制合成，mask 外像素完全来自原图',
      ],
      provider: maskedResult.provider,
    };
  } catch (error) {
    console.warn('[AI 试戴] 局部 mask 合成失败，已返回安全原图兜底', {
      error: error instanceof Error ? error.message : error,
      styleId,
      styleName: style.name,
      time: new Date().toLocaleString('zh-CN', { hour12: false }),
    });
    return safeHandFallback;
  }
};
