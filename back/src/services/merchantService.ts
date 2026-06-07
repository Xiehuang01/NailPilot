import type { RowDataPacket } from 'mysql2';
import { getDb } from '../config/db.js';

type DashboardSummaryRow = RowDataPacket & {
  booking_volume: number;
  conversion_rate: string;
  favorite_volume: number;
  shop_name: string;
  today_booking: number;
  today_try_on: number;
  top_style: string;
  total_views: number;
  try_on_to_booking_rate: string;
  try_on_volume: number;
};

type StyleStatRow = RowDataPacket & {
  advice: string;
  bookings: number;
  conversion: string;
  favorites: number;
  id: number;
  name: string;
  try_ons: number;
  views: number;
};

type TrendRow = RowDataPacket & {
  date: string;
  try_ons: number;
};

type NameValueRow = RowDataPacket & {
  name: string;
  value: number;
};

type TryOnSummaryRow = RowDataPacket & {
  today_try_ons: number;
  try_on_volume: number;
};

type TryOnStyleRow = RowDataPacket & {
  avg_total_score: number | null;
  style_name: string | null;
  style_id: number;
  try_ons: number;
};

type TryOnToneRow = RowDataPacket & {
  skin_tone: string | null;
  value: number;
};

type TryOnTrendRow = RowDataPacket & {
  day: string;
  try_ons: number;
};

type StyleSelectionRow = RowDataPacket & {
  selections: number;
  style_id: number;
};

const formatRate = (numerator: number, denominator: number) => `${denominator > 0 ? ((numerator / denominator) * 100).toFixed(1) : '0.0'}%`;

const lastSevenDateLabels = () => {
  const formatter = new Intl.DateTimeFormat('zh-CN', {
    day: '2-digit',
    month: '2-digit',
    timeZone: 'Asia/Shanghai',
  });

  return Array.from({ length: 7 }, (_, index) => {
    const date = new Date();
    date.setDate(date.getDate() - (6 - index));
    const parts = formatter.formatToParts(date);
    const month = parts.find((item) => item.type === 'month')?.value ?? '01';
    const day = parts.find((item) => item.type === 'day')?.value ?? '01';
    return `${month}-${day}`;
  });
};

export const getDashboard = async () => {
  const db = getDb();

  const [[summary]] = await db.query<DashboardSummaryRow[]>(`
    SELECT
      shop_name,
      today_try_on,
      today_booking,
      conversion_rate,
      top_style,
      total_views,
      try_on_volume,
      favorite_volume,
      booking_volume,
      try_on_to_booking_rate
    FROM merchant_dashboard_summary
    LIMIT 1
  `);

  const [styleStats] = await db.query<StyleStatRow[]>(`
    SELECT id, name, views, try_ons, favorites, bookings, conversion, advice
    FROM merchant_style_stats
    ORDER BY views DESC, id ASC
  `);

  const [trendData] = await db.query<TrendRow[]>(`
    SELECT date_label AS date, try_ons
    FROM merchant_trends
    ORDER BY sort_order ASC
  `);

  const [funnelData] = await db.query<NameValueRow[]>(`
    SELECT label AS name, value
    FROM merchant_funnel
    ORDER BY sort_order ASC
  `);

  const [skinToneData] = await db.query<NameValueRow[]>(`
    SELECT tone_name AS name, value
    FROM merchant_skin_tones
    ORDER BY sort_order ASC
  `);

  let eventSummary: TryOnSummaryRow | undefined;
  let eventStyles: TryOnStyleRow[] = [];
  let eventSkinTones: TryOnToneRow[] = [];
  let eventTrends: TryOnTrendRow[] = [];
  let selectionRows: StyleSelectionRow[] = [];

  try {
    [[eventSummary]] = await db.query<TryOnSummaryRow[]>(`
      SELECT
        COUNT(*) AS try_on_volume,
        SUM(CASE WHEN DATE(created_at) = CURDATE() THEN 1 ELSE 0 END) AS today_try_ons
      FROM try_on_events
      WHERE success = 1
    `);

    [eventStyles] = await db.query<TryOnStyleRow[]>(`
      SELECT e.style_id, MAX(s.name) AS style_name, COUNT(*) AS try_ons, ROUND(AVG(e.total_score)) AS avg_total_score
      FROM try_on_events e
      INNER JOIN styles s ON s.id = e.style_id
      WHERE e.success = 1
      GROUP BY e.style_id
      ORDER BY try_ons DESC, style_id ASC
    `);

    [eventSkinTones] = await db.query<TryOnToneRow[]>(`
      SELECT skin_tone, COUNT(*) AS value
      FROM try_on_events
      WHERE success = 1 AND skin_tone IS NOT NULL AND skin_tone <> ''
      GROUP BY skin_tone
      ORDER BY value DESC, skin_tone ASC
    `);

    [eventTrends] = await db.query<TryOnTrendRow[]>(`
      SELECT DATE_FORMAT(created_at, '%m-%d') AS day, COUNT(*) AS try_ons
      FROM try_on_events
      WHERE success = 1 AND created_at >= DATE_SUB(CURDATE(), INTERVAL 6 DAY)
      GROUP BY DATE_FORMAT(created_at, '%m-%d')
      ORDER BY day ASC
    `);

    [selectionRows] = await db.query<StyleSelectionRow[]>(`
      SELECT style_id, COUNT(*) AS selections
      FROM style_selection_events
      GROUP BY style_id
      ORDER BY selections DESC, style_id ASC
    `);
  } catch (error) {
    console.warn('[商家看板] 真实试戴事件表不可用，已回退到种子统计数据', {
      error: error instanceof Error ? error.message : error,
      time: new Date().toLocaleString('zh-CN', { hour12: false }),
    });
  }

  if (!eventSummary?.try_on_volume && !selectionRows.length) {
    return {
      shopName: summary.shop_name,
      todayTryOn: summary.today_try_on,
      todayBooking: summary.today_booking,
      conversionRate: summary.conversion_rate,
      topStyle: summary.top_style,
      totalViews: summary.total_views,
      tryOnVolume: summary.try_on_volume,
      favoriteVolume: summary.favorite_volume,
      bookingVolume: summary.booking_volume,
      tryOnToBookingRate: summary.try_on_to_booking_rate,
      styleStats: styleStats.map((row) => ({
        id: row.id,
        name: row.name,
        views: row.views,
        tryOns: row.try_ons,
        favorites: row.favorites,
        bookings: row.bookings,
        conversion: row.conversion,
        advice: row.advice,
      })),
      trendData: trendData.map((row) => ({
        date: row.date,
        tryOns: row.try_ons,
      })),
      funnelData,
      skinToneData,
    };
  }

  const [bookingRows] = await db.query<Array<RowDataPacket & { bookings: number; style_id: number }>>(`
    SELECT style_id, COUNT(*) AS bookings
    FROM bookings
    GROUP BY style_id
  `);

  const styleSeedMap = new Map(
    styleStats.map((row) => [
      row.id,
      {
        advice: row.advice,
        bookings: row.bookings,
        conversion: row.conversion,
        favorites: row.favorites,
        id: row.id,
        name: row.name,
        views: row.views,
      },
    ]),
  );
  const bookingMap = new Map(bookingRows.map((row) => [row.style_id, row.bookings]));
  const tryOnMap = new Map(eventStyles.map((row) => [row.style_id, row]));
  const selectionMap = new Map(selectionRows.map((row) => [row.style_id, row.selections]));
  const topStyleId = eventStyles[0]?.style_id;
  const topStyleName =
    eventStyles[0]?.style_name ??
    styleSeedMap.get(topStyleId ?? -1)?.name ??
    styleStats.find((row) => row.id === topStyleId)?.name ??
    summary.top_style;
  const mergedStyleIds = Array.from(new Set([...styleSeedMap.keys(), ...tryOnMap.keys(), ...selectionMap.keys()]));
  const dynamicStyleStats = mergedStyleIds
    .map((styleId) => {
      const base = styleSeedMap.get(styleId);
      const currentTryOn = tryOnMap.get(styleId);
      if (!base && !currentTryOn) {
        return null;
      }

      const bookings = bookingMap.get(styleId) ?? base?.bookings ?? 0;
      const tryOns = currentTryOn?.try_ons ?? 0;
      const avgScore = currentTryOn?.avg_total_score ?? null;
      const selections = selectionMap.get(styleId) ?? 0;
      const advice =
        selections > 0 || tryOns > 0
          ? avgScore && avgScore >= 90
            ? '真实试戴分稳定偏高，建议继续加大曝光与预约承接。'
            : avgScore && avgScore < 84
              ? '真实试戴分偏低，建议优化封面图或调整推荐人群。'
              : selections > tryOns * 2 && tryOns > 0
                ? '被选中很多但试戴转化一般，建议优化试戴首图或默认推荐位。'
                : base?.advice ?? '试戴量已有积累，建议结合肤色与手型做人群定向。'
          : (base?.advice ?? '等待更多试戴数据后生成经营建议。');

      return {
        id: styleId,
        name: base?.name ?? currentTryOn?.style_name ?? `款式 ${styleId}`,
        views: selections || base?.views || 0,
        tryOns,
        favorites: base?.favorites ?? 0,
        bookings,
        conversion: formatRate(bookings, tryOns),
        advice,
      };
    })
    .filter((item): item is NonNullable<typeof item> => Boolean(item))
    .sort((left, right) => right.tryOns - left.tryOns || right.views - left.views || left.id - right.id);

  const trendMap = new Map(eventTrends.map((row) => [row.day, row.try_ons]));
  const dynamicTrendData = lastSevenDateLabels().map((date) => ({
    date,
    tryOns: trendMap.get(date) ?? 0,
  }));
  const dynamicSkinToneData = eventSkinTones.length
    ? eventSkinTones.map((row) => ({
        name: row.skin_tone ?? '未知肤色',
        value: row.value,
      }))
    : skinToneData;
  const tryOnVolume = eventSummary?.try_on_volume ?? 0;
  const bookingVolume = summary.booking_volume;
  const todayTryOn = eventSummary?.today_try_ons ?? 0;

  return {
    shopName: summary.shop_name,
    todayTryOn,
    todayBooking: summary.today_booking,
    conversionRate: formatRate(summary.today_booking, todayTryOn),
    topStyle: topStyleName,
    totalViews: summary.total_views,
    tryOnVolume,
    favoriteVolume: summary.favorite_volume,
    bookingVolume,
    tryOnToBookingRate: formatRate(bookingVolume, tryOnVolume),
    styleStats: dynamicStyleStats,
    trendData: dynamicTrendData,
    funnelData: [
      { name: '浏览', value: summary.total_views },
      { name: '试戴', value: tryOnVolume },
      { name: '收藏', value: summary.favorite_volume },
      { name: '预约', value: bookingVolume },
    ],
    skinToneData: dynamicSkinToneData,
  };
};

const reportTemplates = {
  trend: {
    title: '本周趋势日报',
    content:
      '本周奶茶裸粉、豆沙渐变、细法式增长明显。其中奶茶裸粉微闪试戴后预约率达到 18.2%，高于平均水平，属于低曝光高转化潜力款。黑色猫眼点击量高但预约率低，说明图片吸引力强但用户真实适配门槛较高。',
  },
  strategy: {
    title: '运营策略建议',
    content:
      '1. 首页主推“奶茶裸粉微闪”\n2. 上线“短甲显白通勤套餐”\n3. 给暖黄皮、短圆手用户优先推荐豆沙渐变\n4. 减少黑色猫眼的泛曝光，改为推荐给冷白皮细长手用户\n5. 推出 99 元低门槛体验套餐，提高预约转化',
  },
  marketing: {
    title: '营销文案生成',
    content:
      '【标题】：短甲女生也能显手长的奶茶裸粉美甲\n【卖点】：低饱和、不挑肤色、通勤约会都适合\n【Banner文案】：一眼温柔，十指显白\n【团购文案】：99 元短甲显白体验套餐，新客专享',
  },
};

type ReportType = keyof typeof reportTemplates;

const isReportType = (type: string): type is ReportType => Object.hasOwn(reportTemplates, type);

export const generateReport = async (type = 'trend') => {
  return isReportType(type) ? reportTemplates[type] : reportTemplates.trend;
};
