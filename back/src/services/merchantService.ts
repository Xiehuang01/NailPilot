import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import type { RowDataPacket } from 'mysql2';
import { getDb } from '../config/db.js';

const execFileAsync = promisify(execFile);

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
type StyleRankingRow = RowDataPacket & {
  bookings: number;
  composite_score: string;
  conversion_rate: string;
  current_rank: number;
  favorites: number;
  name: string;
  previous_rank: number;
  style_id: number;
  trend: string;
  try_ons: number;
  views: number;
};

type UserPreferenceRow = RowDataPacket & {
  category: string;
  label: string;
  percentage: string;
  value: number;
};

type BookingTimeRow = RowDataPacket & {
  booking_count: number;
  insight: string;
  percentage: string;
  time_period: string;
};

type ConversionSuggestionRow = RowDataPacket & {
  category: string;
  expected_impact: string;
  id: number;
  priority: string;
  related_style_id: number | null;
  suggestion: string;
  title: string;
};

type WeeklyComparisonRow = RowDataPacket & {
  change_percentage: string;
  current_week_value: number;
  last_week_value: number;
  metric_name: string;
  trend: string;
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
  let bookingTimes: BookingTimeRow[] = [];
  let weeklyComparison: WeeklyComparisonRow[] = [];

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

    [bookingTimes] = await db.query<BookingTimeRow[]>(`
      SELECT time_period, booking_count, percentage, insight
      FROM merchant_booking_times
      ORDER BY sort_order ASC
    `);

    [weeklyComparison] = await db.query<WeeklyComparisonRow[]>(`
      SELECT metric_name, current_week_value, last_week_value, change_percentage, trend
      FROM merchant_weekly_comparison
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
      bookingTimeDistribution: bookingTimes.map((row) => ({
        timePeriod: row.time_period,
        bookingCount: row.booking_count,
        percentage: row.percentage,
        insight: row.insight,
      })),
      weeklyComparison: weeklyComparison.map((row) => ({
        metricName: row.metric_name,
        currentWeekValue: row.current_week_value,
        lastWeekValue: row.last_week_value,
        changePercentage: row.change_percentage,
        trend: row.trend,
      })),
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
    bookingTimeDistribution: bookingTimes.map((row) => ({
      timePeriod: row.time_period,
      bookingCount: row.booking_count,
      percentage: row.percentage,
      insight: row.insight,
    })),
    weeklyComparison: weeklyComparison.map((row) => ({
      metricName: row.metric_name,
      currentWeekValue: row.current_week_value,
      lastWeekValue: row.last_week_value,
      changePercentage: row.change_percentage,
      trend: row.trend,
    })),
  };
};

// --------------- other queries (unchanged) ---------------

export const getStyleRanking = async () => {
  const db = getDb();

  const [ranking] = await db.query<StyleRankingRow[]>(`
    SELECT style_id, name, current_rank, previous_rank, trend, composite_score,
           views, try_ons, favorites, bookings, conversion_rate
    FROM merchant_style_ranking
    ORDER BY sort_order ASC
  `);

  return ranking.map((row) => ({
    styleId: row.style_id,
    name: row.name,
    currentRank: row.current_rank,
    previousRank: row.previous_rank,
    trend: row.trend,
    compositeScore: Number(row.composite_score),
    views: row.views,
    tryOns: row.try_ons,
    favorites: row.favorites,
    bookings: row.bookings,
    conversionRate: row.conversion_rate,
  }));
};

export const getUserPreferences = async () => {
  const db = getDb();

  const [rows] = await db.query<UserPreferenceRow[]>(`
    SELECT category, label, value, percentage
    FROM merchant_user_preferences
    ORDER BY category, sort_order ASC
  `);

  const grouped: Record<string, Array<{ label: string; value: number; percentage: string }>> = {};

  for (const row of rows) {
    const key = row.category === 'hand_shape'
      ? 'handShapes'
      : row.category === 'price_range'
        ? 'priceRanges'
        : row.category === 'nail_bed'
          ? 'nailBeds'
          : 'tags';

    if (!grouped[key]) {
      grouped[key] = [];
    }
    grouped[key].push({
      label: row.label,
      value: row.value,
      percentage: row.percentage,
    });
  }

  return grouped;
};

export const getConversionSuggestions = async () => {
  const db = getDb();

  const [suggestions] = await db.query<ConversionSuggestionRow[]>(`
    SELECT id, category, title, suggestion, priority, expected_impact, related_style_id
    FROM merchant_conversion_suggestions
    ORDER BY FIELD(priority, 'high', 'medium', 'low'), sort_order ASC
  `);

  return suggestions.map((row) => ({
    id: row.id,
    category: row.category,
    title: row.title,
    suggestion: row.suggestion,
    priority: row.priority,
    expectedImpact: row.expected_impact,
    relatedStyleId: row.related_style_id,
  }));
};

// --------------- fallback templates ---------------

const reportTemplates = {
  trend: {
    title: '本周趋势日报',
    content:
      '本周奶茶裸粉、豆沙渐变、细法式增长明显。其中奶茶裸粉微闪试戴后预约率达到 18.2%，高于平均水平，属于低曝光高转化潜力款。黑色猫眼点击量高但预约率低，说明图片吸引力强但用户真实适配门槛较高。',
  },
  strategy: {
    title: '运营策略建议',
    content:
      '1. 首页主推"奶茶裸粉微闪"\n2. 上线"短甲显白通勤套餐"\n3. 给暖黄皮、短圆手用户优先推荐豆沙渐变\n4. 减少黑色猫眼的泛曝光，改为推荐给冷白皮细长手用户\n5. 推出 99 元低门槛体验套餐，提高预约转化',
  },
  marketing: {
    title: '营销文案生成',
    content:
      '【标题】：短甲女生也能显手长的奶茶裸粉美甲\n【卖点】：低饱和、不挑肤色、通勤约会都适合\n【Banner文案】：一眼温柔，十指显白\n【团购文案】：99 元短甲显白体验套餐，新客专享',
  },
};

type ReportType = keyof typeof reportTemplates;

const isReportType = (type: string): type is ReportType => Object.hasOwn(reportTemplates, type);

// --------------- DuckDuckGo search ---------------

const SEARCH_TIMEOUT_MS = 15_000;

const searchDuckDuckGo = async (query: string): Promise<string> => {
  const url = `https://lite.duckduckgo.com/lite/?q=${encodeURIComponent(query)}`;
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), SEARCH_TIMEOUT_MS);
    const res = await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
      },
    });
    clearTimeout(timeout);
    const html = await res.text();

    // Parse DDG lite HTML: extract result snippets (text between </a><br> or inside <td>)
    const snippets: string[] = [];
    // Match result links and their descriptions
    const linkRe = /<a[^>]*href="([^"]*)"[^>]*>([^<]+)<\/a>\s*(?:<br>\s*)?([^<]*)/gi;
    let match;
    let count = 0;
    while ((match = linkRe.exec(html)) !== null && count < 8) {
      const href = match[1];
      const title = match[2].replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"');
      const snippet = match[3]?.trim().replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>') || '';
      // Skip internal DDG links
      if (href.startsWith('//') || href.startsWith('/')) continue;
      if (title && title.length > 5) {
        snippets.push(`- ${title}${snippet ? `：${snippet}` : ''}`);
        count++;
      }
    }

    if (snippets.length === 0) {
      // Fallback: try to extract any text from result rows
      const rowRe = /<td[^>]*class="[^"]*result[^"]*"[^>]*>([\s\S]*?)<\/td>/gi;
      while ((match = rowRe.exec(html)) !== null && snippets.length < 5) {
        const text = match[1].replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
        if (text.length > 20) snippets.push(`- ${text.substring(0, 200)}`);
      }
    }

    return snippets.length > 0 ? snippets.join('\n') : '(未找到相关搜索结果)';
  } catch (err) {
    console.warn(`[DDG] search failed for "${query}":`, (err as Error).message);
    return '(搜索暂不可用)';
  }
};

const searchNailTrends = async (): Promise<string> => {
  const queries = [
    '小红书 2026 美甲 爆款 趋势',
    '小红书 夏季 美甲 热门 款式',
    '美甲店 爆款 选品 运营 小红书',
  ];

  const results = await Promise.all(queries.map(async (q) => {
    const result = await searchDuckDuckGo(q);
    return `【搜索：${q}】\n${result}`;
  }));

  return results.join('\n\n');
};

// --------------- OpenClaw integration ---------------

const OPENCLAW_TIMEOUT_MS = 90_000;

const callOpenClawAgent = async (prompt: string): Promise<string | null> => {
  try {
    const { stdout } = await execFileAsync('openclaw', [
      'agent',
      '--json',
      '--timeout',
      '60',
      '--message',
      prompt,
    ], {
      timeout: OPENCLAW_TIMEOUT_MS,
      maxBuffer: 1024 * 1024, // 1 MB
    });

    const parsed = JSON.parse(stdout) as Record<string, unknown>;

    // OpenClaw agent --json returns { ok, reply, ... }
    const reply = parsed.reply ?? parsed.content ?? parsed.result;
    if (typeof reply === 'string' && reply.length > 0) {
      return reply;
    }

    console.warn('[OpenClaw] unexpected JSON shape:', Object.keys(parsed));
    return null;
  } catch (error) {
    console.warn('[OpenClaw] agent call failed, using template fallback:', (error as Error).message);
    return null;
  }
};

const buildPrompt = async (type: ReportType): Promise<string> => {
  // Fetch live dashboard data + 小红书搜索 for context
  let dash;
  let searchData = '';
  try {
    dash = await getDashboard();
  } catch {
    dash = null;
  }
  try {
    searchData = await searchNailTrends();
  } catch {
    // search fail silently, prompt still works with dashboard data only
  }

  const searchBlock = searchData
    ? `
【小红书/外部美甲趋势搜索】
${searchData}
`
    : '';

  const dataBlock = dash
    ? `
【店铺数据】
- 店铺名：${dash.shopName}
- 今日试戴：${dash.todayTryOn} 次
- 今日预约：${dash.todayBooking} 单
- 试戴转化率：${dash.conversionRate}
- 本周爆款：${dash.topStyle}
- 总浏览量：${dash.totalViews}
- 试戴总量：${dash.tryOnVolume}
- 预约总量：${dash.bookingVolume}

【款式排行】
${dash.styleStats.map((s) => `- ${s.name}：浏览${s.views} 试戴${s.tryOns} 转化${s.conversion}`).join('\n')}

【7天趋势】
${dash.trendData.map((t) => `${t.date}：${t.tryOns}次`).join(' | ')}

【漏斗】
${dash.funnelData.map((f) => `${f.name} ${f.value}`).join(' → ')}

【肤色分布】
${dash.skinToneData.map((s) => `${s.name} ${s.value}`).join(' | ')}
`
    : '';

  switch (type) {
    case 'trend':
      return `你是美甲店的AI数据助手，请基于店铺数据和外部趋势搜索，生成一份「本周趋势日报」。

${searchBlock}
${dataBlock}

要求：
1. 先总结外部美甲趋势热点（从以上搜索结果中提炼：现在什么款式在火、什么风格流行）
2. 对照店铺数据，指出哪些款式与外部趋势吻合/有差异
3. 分析近7天趋势变化，找出峰值和低谷
4. 给出2-3条结合外部趋势的可执行建议

请严格按以下JSON格式返回，不要加额外文字：
{"title":"本周趋势日报","content":"你的报告内容在这里"}`;

    case 'strategy':
      return `你是美甲店的AI运营顾问，请基于店铺数据和外部趋势搜索，生成一份「运营策略建议」。

${searchBlock}
${dataBlock}

要求：
1. 先总结外部美甲运营趋势和爆款选品思路（从以上搜索结果中提炼）
2. 对照店铺数据，推荐首页主推款和套餐组合（参考外部热门款式）
3. 根据肤色分布和外部趋势，给出人群定向推荐
4. 根据漏斗数据找出瓶颈，结合外部运营经验给优化方案
5. 给出3-5条结合外部趋势的具体运营动作

请严格按以下JSON格式返回，不要加额外文字：
{"title":"运营策略建议","content":"你的报告内容在这里（可换行分条）"}`;

    case 'marketing':
      return `你是美甲店的小红书营销专家，请基于店铺数据和外部趋势搜索，生成一份「小红书营销文案」。

${searchBlock}
${dataBlock}

要求：
1. 先总结搜索结果中小红书美甲热门文案的风格特点和常用话术
2. 参考热门风格，围绕店铺爆款写一个吸引人的标题
3. 提炼2-3个贴合外部趋势的核心卖点
4. 写Banner/封面文案 + 团购/体验套餐转化文案
5. 风格严格参考小红书：亲切、有emoji、短句、带话题标签

请严格按以下JSON格式返回，不要加额外文字：
{"title":"小红书营销文案","content":"你的文案内容在这里"}`;

    default:
      return '';
  }
};

const parseReport = (reply: string, fallback: { title: string; content: string }) => {
  try {
    // Try to extract JSON from the reply (may be wrapped in markdown code fences)
    const jsonMatch = reply.match(/\{[\s\S]*"title"[\s\S]*"content"[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]) as { title?: string; content?: string };
      if (parsed.title && parsed.content) {
        return { title: parsed.title, content: parsed.content };
      }
    }
    // If no JSON found but we have a non-empty reply, use it as content
    if (reply.trim().length > 0) {
      return { title: fallback.title, content: reply.trim() };
    }
  } catch {
    // fall through
  }
  return fallback;
};

export const generateReport = async (type = 'trend') => {
  const reportType: ReportType = isReportType(type) ? type : 'trend';
  const fallback = reportTemplates[reportType];

  const prompt = await buildPrompt(reportType);
  const reply = await callOpenClawAgent(prompt);

  if (reply) {
    return parseReport(reply, fallback);
  }

  return fallback;
};
