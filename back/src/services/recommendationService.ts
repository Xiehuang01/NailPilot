import type { RowDataPacket } from 'mysql2';
import { getDb } from '../config/db.js';

type RecommendationRow = RowDataPacket & {
  id: number;
  image_url: string;
  name: string;
  reason: string;
  score: number;
};

export const getRecommendations = async () => {
  const db = getDb();
  const [rows] = await db.query<RecommendationRow[]>(`
    SELECT id, name, score, reason, image_url
    FROM recommendations
    ORDER BY score DESC, id ASC
    LIMIT 6
  `);

  return rows.map((row) => ({
    id: row.id,
    name: row.name,
    score: row.score,
    reason: row.reason,
    img: row.image_url,
  }));
};
