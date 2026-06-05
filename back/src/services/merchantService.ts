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
