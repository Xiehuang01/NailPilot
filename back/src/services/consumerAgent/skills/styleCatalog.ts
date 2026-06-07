import type { RowDataPacket } from 'mysql2';
import { getDb } from '../../../config/db.js';
import type { ConsumerAgentSkill } from '../types.js';

type StyleCatalogRow = RowDataPacket & {
  id: number;
  image_url: string;
  name: string;
  price: string;
  score: number;
  tags: string;
};

const fallbackStyleCatalog = [
  {
    id: 1,
    name: '奶油裸杏纯色',
    tags: ['裸色', '通勤', '短甲友好'],
    price: '99-129',
    score: 96,
    img: 'http://p0.meituan.net/pilotimages/87797733466cfd525625a5947767e2ff1794125.png',
    bestFor: ['暖黄皮', '短圆手', '日常通勤'],
    caution: '喜欢强视觉冲击的用户可能会觉得偏低调。',
  },
  {
    id: 7,
    name: '红丝带法式',
    tags: ['法式', '约会', '少女'],
    price: '139-179',
    score: 93,
    img: 'http://p0.meituan.net/pilotimages/2ac2d01a9bc78320edbe2b545b485b4a2132292.png',
    bestFor: ['中性皮', '约会', '节日'],
    caution: '极简用户可能会觉得设计感偏强。',
  },
  {
    id: 12,
    name: '奶白珍珠新娘甲',
    tags: ['珍珠', '婚礼', '精致'],
    price: '189-259',
    score: 94,
    img: 'http://p0.meituan.net/pilotimages/43cc4ced977a3dd271f60ee2f05607772681747.png',
    bestFor: ['婚礼', '写真', '宴会'],
    caution: '日常通勤会略显隆重。',
  },
  {
    id: 24,
    name: '小香风黑尖法式',
    tags: ['黑法式', '法式', '高级感'],
    price: '169-229',
    score: 92,
    img: 'http://p0.meituan.net/pilotimages/e80e1d25e48d7ef5c505b29ee8e331822641412.png',
    bestFor: ['冷白皮', '高级感', '长甲'],
    caution: '暖黄皮用户建议降低黑色面积。',
  },
  {
    id: 2,
    name: '抹茶奶咖跳色',
    tags: ['跳色', '秋冬', '显白'],
    price: '129-159',
    score: 91,
    img: 'http://p0.meituan.net/pilotimages/162afb52255bd908ba3ec418fd61824a2254875.png',
    bestFor: ['秋冬穿搭', '暖黄皮', '自然风格'],
    caution: '夏季清透风用户可能会觉得偏厚重。',
  },
];

const normalizeText = (text = '') => text.toLowerCase();
const splitQuery = (query: string) => query.split(/\s+|、|，|,|。/).filter(Boolean);

const parseTags = (tags: unknown) => {
  if (Array.isArray(tags)) {
    return tags.map(String).filter(Boolean);
  }

  if (typeof tags !== 'string' || !tags.trim()) {
    return [];
  }

  try {
    const parsed = JSON.parse(tags);
    return Array.isArray(parsed) ? parsed.map(String) : [];
  } catch {
    return tags
      .split(/[,，、]/)
      .map((item) => item.trim())
      .filter(Boolean);
  }
};

const normalizeLimit = (value: unknown) => {
  const limit = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(limit) ? Math.min(Math.max(limit, 1), 8) : 5;
};

const queryStylesFromDb = async (preference: string, limit: number) => {
  const db = getDb();
  const tokens = splitQuery(normalizeText(preference));

  if (!tokens.length) {
    const [rows] = await db.query<StyleCatalogRow[]>(
      `
        SELECT id, name, tags, price, score, image_url
        FROM styles
        ORDER BY score DESC, sort_order ASC, id ASC
        LIMIT ?
      `,
      [limit],
    );
    return rows;
  }

  const likeValues = tokens.map((token) => `%${token}%`);
  const whereClause = tokens.map(() => '(LOWER(name) LIKE ? OR LOWER(CAST(tags AS CHAR)) LIKE ? OR price LIKE ?)').join(' OR ');
  const params = tokens.flatMap((_, index) => [likeValues[index], likeValues[index], likeValues[index]]);
  const [rows] = await db.query<StyleCatalogRow[]>(
    `
      SELECT id, name, tags, price, score, image_url
      FROM styles
      WHERE ${whereClause}
      ORDER BY score DESC, sort_order ASC, id ASC
      LIMIT ?
    `,
    [...params, limit],
  );

  if (rows.length) {
    return rows;
  }

  const [fallbackRows] = await db.query<StyleCatalogRow[]>(
    `
      SELECT id, name, tags, price, score, image_url
      FROM styles
      ORDER BY score DESC, sort_order ASC, id ASC
      LIMIT ?
    `,
    [limit],
  );
  return fallbackRows;
};

const queryStylesFromFallback = (preference: string, limit: number) => {
  const query = normalizeText(preference);
  const tokens = splitQuery(query);
  const filtered = tokens.length
    ? fallbackStyleCatalog.filter((style) => {
        const content = [style.name, ...style.tags, ...style.bestFor, style.price].join(' ').toLowerCase();
        return tokens.some((token) => content.includes(token));
      })
    : fallbackStyleCatalog;

  return (filtered.length ? filtered : fallbackStyleCatalog).slice(0, limit);
};

export const styleCatalogSkill: ConsumerAgentSkill = {
  definition: {
    type: 'function',
    function: {
      name: 'get_style_catalog',
      description: '查询 NailPilot 当前可推荐的美甲款式、标签、价格和适配建议。',
      parameters: {
        type: 'object',
        properties: {
          preference: {
            type: 'string',
            description: '用户偏好的关键词，例如显白、通勤、猫眼、短甲、预算等。',
          },
          limit: {
            type: 'number',
            description: '需要返回几款，默认 5，最多 8。',
          },
        },
      },
    },
  },
  handler: async (args = {}) => {
    const preference = typeof args.preference === 'string' ? args.preference : '';
    const limit = normalizeLimit(args.limit);
    try {
      const rows = await queryStylesFromDb(preference, limit);
      const styles = rows.map((row) => ({
        id: row.id,
        name: row.name,
        tags: parseTags(row.tags),
        price: row.price,
        score: row.score,
        img: row.image_url,
      }));

      return {
        display: 'style_cards',
        styles,
      };
    } catch (error) {
      console.warn('[小团 Agent] 查询数据库款式失败，已改用本地兜底款式数据', {
        error: error instanceof Error ? error.message : error,
        preference,
        time: new Date().toLocaleString('zh-CN', { hour12: false }),
      });
    }

    const styles = queryStylesFromFallback(preference, limit).map(({ bestFor: _bestFor, caution: _caution, ...style }) => style);
    return {
      display: 'style_cards',
      styles,
    };
  },
};
