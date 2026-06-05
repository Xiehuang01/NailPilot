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
    tags: JSON.parse(row.tags),
    price: row.price,
    score: row.score,
    img: row.image_url,
  }));
};
