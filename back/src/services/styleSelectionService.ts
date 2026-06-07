import { getDb } from '../config/db.js';
import { createAppError } from '../types/http.js';

type RecordStyleSelectionInput = {
  sessionId?: string;
  source?: string;
  styleId?: number;
};

const normalizeSource = (source?: string) => {
  const value = (source ?? 'catalog').trim().toLowerCase();
  if (!value) {
    return 'catalog';
  }

  return value.slice(0, 32);
};

export const recordStyleSelection = async ({ sessionId, source, styleId }: RecordStyleSelectionInput) => {
  if (!styleId || !Number.isInteger(styleId) || styleId <= 0) {
    throw createAppError('styleId is required', 400);
  }

  const db = getDb();
  await db.query(
    `
      INSERT INTO style_selection_events (style_id, source, session_id)
      VALUES (?, ?, ?)
    `,
    [styleId, normalizeSource(source), sessionId?.trim().slice(0, 128) || null],
  );

  console.log('[款式选择] 已记录用户选中款式', {
    sessionId: sessionId ?? 'anonymous',
    source: normalizeSource(source),
    styleId,
    time: new Date().toLocaleString('zh-CN', { hour12: false }),
  });

  return { success: true };
};
