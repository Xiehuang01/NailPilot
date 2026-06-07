import type { RowDataPacket } from 'mysql2';
import { getDb } from '../config/db.js';

type StyleRow = RowDataPacket & {
  id: number;
  image_url: string;
  name: string;
  price: string;
  score: number;
  tags: string;
};

const parseTags = (tags: unknown) => {
  if (Array.isArray(tags)) {
    return tags.map(String).filter(Boolean);
  }

  if (typeof tags !== 'string' || !tags.trim()) {
    return [];
  }

  try {
    const parsed = JSON.parse(tags);
    return Array.isArray(parsed) ? parsed.map(String).filter(Boolean) : [];
  } catch {
    return tags
      .split(/[,，、]/)
      .map((item) => item.trim())
      .filter(Boolean);
  }
};

export const getStyles = async () => {
  const db = getDb();
  const [rows] = await db.query<StyleRow[]>(`
    SELECT id, name, tags, price, score, image_url
    FROM styles
    ORDER BY sort_order ASC, id ASC
  `);

  return rows.map((row) => ({
    id: row.id,
    name: row.name,
    tags: parseTags(row.tags),
    price: row.price,
    score: row.score,
    img: row.image_url,
  }));
};
