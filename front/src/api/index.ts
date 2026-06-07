export type StyleItem = {
  id: number;
  name: string;
  tags: string[];
  price: string;
  score: number;
  img: string;
};

export type AnalysisResult = {
  skinTone: string;
  handShape: string;
  nailBed: string;
};

export type TryOnResult = {
  resultUrl: string;
  score: number;
  explanation: string[];
  provider?: string;
};

export type Recommendation = {
  id: number;
  name: string;
  score: number;
  reason: string;
  img: string;
};

export type TrendPoint = {
  date: string;
  tryOns: number;
};

export type FunnelPoint = {
  value: number;
  name: string;
};

export type SkinTonePoint = {
  value: number;
  name: string;
};

export type StyleRankingItem = {
  styleId: number;
  name: string;
  currentRank: number;
  previousRank: number;
  trend: 'up' | 'down' | 'stable' | 'new';
  compositeScore: number;
  views: number;
  tryOns: number;
  favorites: number;
  bookings: number;
  conversionRate: string;
};

export type UserPreferenceEntry = {
  label: string;
  value: number;
  percentage: string;
};

export type UserPreferencesGrouped = {
  handShapes: UserPreferenceEntry[];
  tags: UserPreferenceEntry[];
  priceRanges: UserPreferenceEntry[];
  nailBeds: UserPreferenceEntry[];
};

export type BookingTimeItem = {
  timePeriod: string;
  bookingCount: number;
  percentage: string;
  insight: string;
};

export type ConversionSuggestion = {
  id: number;
  category: string;
  title: string;
  suggestion: string;
  priority: string;
  expectedImpact: string;
  relatedStyleId: number | null;
};

export type WeeklyComparisonEntry = {
  metricName: string;
  currentWeekValue: number;
  lastWeekValue: number;
  changePercentage: string;
  trend: string;
};

export type StyleStat = {
  id: number;
  name: string;
  views: number;
  tryOns: number;
  favorites?: number;
  bookings?: number;
  conversion: string;
  advice: string;
};

export type MerchantDashboard = {
  shopName: string;
  todayTryOn: number;
  todayBooking: number;
  conversionRate: string;
  topStyle: string;
  totalViews: number;
  tryOnVolume: number;
  favoriteVolume: number;
  bookingVolume: number;
  tryOnToBookingRate: string;
  styleStats: StyleStat[];
  trendData: TrendPoint[];
  funnelData: FunnelPoint[];
  skinToneData: SkinTonePoint[];
  bookingTimeDistribution: BookingTimeItem[];
  weeklyComparison: WeeklyComparisonEntry[];
};

export type AgentReport = {
  title: string;
  content: string;
};

export type ConsumerAgentAction = {
  type: 'start_try_on';
  mode: 'quick' | 'detailed';
  quickMode: boolean;
};

export type ConsumerAgentStyleCard = {
  id: number;
  name: string;
  tags: string[];
  price: string;
  score: number;
  img: string;
};

export type ConsumerAgentResponse = {
  reply: string;
  actions: ConsumerAgentAction[];
  cards?: ConsumerAgentStyleCard[];
  blocked?: boolean;
  provider: string;
  toolCalls?: Array<{
    name: string;
    args: Record<string, unknown>;
    result: unknown;
  }>;
  memorySize?: number;
};

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:3003/api';

const requestJson = async <T>(path: string, options?: RequestInit): Promise<T> => {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
    ...options,
  });

  if (!response.ok) {
    throw new Error(`API request failed: ${response.status}`);
  }

  return response.json() as Promise<T>;
};

const fallbackStyles: StyleItem[] = [
  { id: 1, name: '奶油裸杏纯色', tags: ['裸色', '通勤', '短甲友好'], price: '99-129', score: 96, img: 'http://p0.meituan.net/pilotimages/87797733466cfd525625a5947767e2ff1794125.png' },
  { id: 2, name: '抹茶奶咖跳色', tags: ['跳色', '秋冬', '显白'], price: '129-159', score: 91, img: 'http://p0.meituan.net/pilotimages/162afb52255bd908ba3ec418fd61824a2254875.png' },
  { id: 3, name: '牛奶奶牛纹', tags: ['奶牛纹', '可爱', '短甲'], price: '119-149', score: 89, img: 'http://p1.meituan.net/pilotimages/7bb5bc0c2c741f9f0aa63787a601d7ad2604877.png' },
  { id: 4, name: '幻黑星芒长甲', tags: ['星星', '甜酷', '长甲'], price: '169-219', score: 90, img: 'http://p0.meituan.net/pilotimages/fc8fe60e78341d77a5070fc2f8e520072098070.png' },
  { id: 5, name: '黑金花卉透感长甲', tags: ['花卉', '法式', '长甲'], price: '179-239', score: 92, img: 'http://p1.meituan.net/pilotimages/3c0d090e20f0cb56f70fcb56c54dd6582416974.png' },
  { id: 6, name: '香槟钻饰宫廷长甲', tags: ['钻饰', '轻奢', '宴会'], price: '199-269', score: 95, img: 'http://p0.meituan.net/pilotimages/6c857edd85a5fa4bcec59698fe9416cb1913981.png' },
  { id: 7, name: '红丝带法式', tags: ['法式', '约会', '少女'], price: '139-179', score: 93, img: 'http://p0.meituan.net/pilotimages/2ac2d01a9bc78320edbe2b545b485b4a2132292.png' },
  { id: 8, name: '冷茶裸咖方圆甲', tags: ['裸咖', '气质', '日常'], price: '109-149', score: 88, img: 'http://p1.meituan.net/pilotimages/d15c06e8c2137d4f39f3b60476a90cf92026957.png' },
  { id: 9, name: '冰透银豹纹长甲', tags: ['豹纹', '亮片', '甜酷'], price: '159-219', score: 90, img: 'http://p1.meituan.net/pilotimages/69614397f0ecb559b98cb46a5a46f3b32642714.png' },
  { id: 10, name: '琉璃裸感尖法式', tags: ['法式', '极简', '长甲'], price: '149-199', score: 87, img: 'http://p1.meituan.net/pilotimages/2277d6f9d82264fa6a3c986373e5e44c2292083.png' },
  { id: 11, name: '豆沙蝴蝶结碎钻', tags: ['蝴蝶结', '温柔', '约会'], price: '149-189', score: 91, img: 'http://p0.meituan.net/pilotimages/bc153edf655dd6961dc9f8e95ad8cd1e2561531.png' },
  { id: 12, name: '奶白珍珠新娘甲', tags: ['珍珠', '婚礼', '精致'], price: '189-259', score: 94, img: 'http://p0.meituan.net/pilotimages/43cc4ced977a3dd271f60ee2f05607772681747.png' },
  { id: 13, name: '低饱和雾白小花', tags: ['小花', '清新', '短甲'], price: '119-159', score: 88, img: 'http://p0.meituan.net/pilotimages/682c173ae3a95d0b838655e8337b30d72213857.png' },
  { id: 14, name: '极光糖纸镜面', tags: ['镜面', '潮流', '派对'], price: '169-229', score: 89, img: 'http://p1.meituan.net/pilotimages/eecfba4ab276e895b579a79491b2d0211982788.png' },
  { id: 15, name: '奶杏金箔温柔款', tags: ['金箔', '温柔', '百搭'], price: '129-169', score: 92, img: 'http://p0.meituan.net/pilotimages/1248ad42d355b98257e5fbcdf90efc552138079.png' },
  { id: 16, name: '烟粉流沙钻饰', tags: ['流沙', '轻奢', '长甲'], price: '179-239', score: 90, img: 'http://p0.meituan.net/pilotimages/137aad1f6a36655ae395cf7dc57604642782680.png' },
  { id: 17, name: '摩卡奶茶渐层', tags: ['渐层', '气质', '秋冬'], price: '129-169', score: 89, img: 'http://p0.meituan.net/pilotimages/ec437f6291295904c2f894edb8c01cb82131722.png' },
  { id: 18, name: '裸粉珍珠蝴蝶结', tags: ['蝴蝶结', '珍珠', '甜美'], price: '159-209', score: 90, img: 'http://p0.meituan.net/pilotimages/5591229138c4e7e1d183b59be442d9dc2267735.png' },
  { id: 19, name: '奶咖水光方甲', tags: ['方甲', '水光', '通勤'], price: '109-149', score: 86, img: 'http://p0.meituan.net/pilotimages/5fad21e6d38656170bf726ff3973a4501918338.png' },
  { id: 20, name: '蔷薇红爱心法式', tags: ['红法式', '爱心', '约会'], price: '139-179', score: 93, img: 'http://p1.meituan.net/pilotimages/d5eedc75b0021f79381962fc145b0bc62301165.png' },
  { id: 21, name: '香槟裸透猫眼', tags: ['猫眼', '轻透', '显手长'], price: '149-199', score: 91, img: 'http://p0.meituan.net/pilotimages/f4b69d45af5d3b496adbd9d21e768a8e2195181.png' },
  { id: 22, name: '奶白珍珠渐变', tags: ['渐变', '新娘', '精致'], price: '159-219', score: 90, img: 'http://p0.meituan.net/pilotimages/5b985a1c661ae2e964286178e6c0b0f92258113.png' },
  { id: 23, name: '烟灰豹纹细闪', tags: ['豹纹', '细闪', '个性'], price: '149-199', score: 88, img: 'http://p1.meituan.net/pilotimages/bf8657d94693fb0fe1da3f7729d5667d2020119.png' },
  { id: 24, name: '小香风黑尖法式', tags: ['黑法式', '法式', '高级感'], price: '169-229', score: 92, img: 'http://p0.meituan.net/pilotimages/e80e1d25e48d7ef5c505b29ee8e331822641412.png' },
  { id: 25, name: '清透香槟婚礼甲', tags: ['细闪', '婚礼', '长甲'], price: '169-239', score: 91, img: 'http://p1.meituan.net/pilotimages/73ee568aa09547d8bfc0168113ac9ebc2712329.png' },
];

export const getStyles = async (): Promise<StyleItem[]> => {
  try {
    return await requestJson<StyleItem[]>('/styles');
  } catch (error) {
    console.warn('Falling back to local style data:', error);
    return fallbackStyles;
  }
};

export const analyzeHand = async (_imageUrl: string): Promise<AnalysisResult> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        skinTone: '暖黄皮',
        handShape: '短圆手',
        nailBed: '偏短'
      });
    }, 1500);
  });
};

export const createTryOn = async (styleId: number, imageUrl: string): Promise<TryOnResult> => {
  try {
    return await requestJson<TryOnResult>('/try-on', {
      method: 'POST',
      body: JSON.stringify({styleId, imageUrl}),
    });
  } catch (error) {
    console.warn('Falling back to local try-on data:', error);
    const style = fallbackStyles.find((item) => item.id === styleId) ?? fallbackStyles[0];
    return {
      resultUrl: style.img,
      score: 86,
      explanation: [
        '当前款式来自商家真实款式库',
        '颜色与手部肤色匹配度较稳定',
        '建议继续查看更高适配款式',
      ],
    };
  }
};

export const getRecommendations = async (): Promise<Recommendation[]> => {
  try {
    return await requestJson<Recommendation[]>('/recommendations');
  } catch (error) {
    console.warn('Falling back to local recommendations:', error);
    return [
      { id: 1, name: '奶油裸杏纯色', score: 93, reason: '显白又稳妥，短甲和通勤用户友好', img: fallbackStyles[0].img },
      { id: 7, name: '红丝带法式', score: 90, reason: '设计感明确，适合约会和节日场景', img: fallbackStyles[6].img },
      { id: 12, name: '奶白珍珠新娘甲', score: 91, reason: '精致度和贵气感强，适合重要场合', img: fallbackStyles[11].img },
    ];
  }
};

export const createBooking = async (_shopId: string, _styleId: number, _time: string) => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({ success: true, message: '预约成功，本次为 Demo 模拟预约，不产生真实订单。' });
    }, 800);
  });
};

export const getMerchantDashboard = async (): Promise<MerchantDashboard> => {
  try {
    return await requestJson<MerchantDashboard>('/merchant/dashboard');
  } catch (error) {
    console.warn('Falling back to local dashboard data:', error);
    return {
      shopName: 'Lisa 美甲工作室',
      todayTryOn: 342,
      todayBooking: 45,
      conversionRate: '13.1%',
      topStyle: '奶茶裸粉微闪',
      totalViews: 12580,
      tryOnVolume: 4520,
      favoriteVolume: 1280,
      bookingVolume: 320,
      tryOnToBookingRate: '7.1%',
      styleStats: [
        { id: 1, name: '奶茶裸粉微闪', views: 3200, tryOns: 1500, favorites: 450, bookings: 120, conversion: '8.0%', advice: '低曝光高转化，建议上首页' },
        { id: 4, name: '黑色猫眼', views: 4100, tryOns: 1200, favorites: 150, bookings: 30, conversion: '2.5%', advice: '高点击低预约，建议减少泛曝光' },
        { id: 2, name: '豆沙渐变', views: 2800, tryOns: 900, favorites: 380, bookings: 95, conversion: '10.5%', advice: '暖黄皮用户转化高，建议做人群定向推荐' }
      ],
      trendData: [
        { date: '10-01', tryOns: 320 },
        { date: '10-02', tryOns: 380 },
        { date: '10-03', tryOns: 410 },
        { date: '10-04', tryOns: 390 },
        { date: '10-05', tryOns: 460 },
        { date: '10-06', tryOns: 520 },
        { date: '10-07', tryOns: 452 }
      ],
      funnelData: [
        { value: 12580, name: '浏览' },
        { value: 4520, name: '试戴' },
        { value: 1280, name: '收藏' },
        { value: 320, name: '预约' }
      ],
      skinToneData: [
        { value: 45, name: '暖黄皮' },
        { value: 25, name: '冷白皮' },
        { value: 20, name: '中性皮' },
        { value: 10, name: '橄榄皮' }
      ],
      bookingTimeDistribution: [
        { timePeriod: '下午 14:00-18:00', bookingCount: 156, percentage: '42%', insight: '下午茶时段为预约高峰' },
        { timePeriod: '上午 10:00-12:00', bookingCount: 112, percentage: '30%', insight: '周末上午集中' },
        { timePeriod: '晚上 18:00-21:00', bookingCount: 102, percentage: '28%', insight: '通勤族晚间为主' }
      ],
      weeklyComparison: [
        { metricName: 'views', currentWeekValue: 18760, lastWeekValue: 16120, changePercentage: '+16.4%', trend: 'up' },
        { metricName: 'try_ons', currentWeekValue: 6930, lastWeekValue: 5880, changePercentage: '+17.9%', trend: 'up' },
        { metricName: 'favorites', currentWeekValue: 1840, lastWeekValue: 1750, changePercentage: '+5.1%', trend: 'up' },
        { metricName: 'bookings', currentWeekValue: 512, lastWeekValue: 480, changePercentage: '+6.7%', trend: 'up' },
        { metricName: 'revenue', currentWeekValue: 68480, lastWeekValue: 62200, changePercentage: '+10.1%', trend: 'up' }
      ]
    };
  }
};

export const getMerchantRanking = async (): Promise<StyleRankingItem[]> => {
  return requestJson<StyleRankingItem[]>('/merchant/ranking');
};

export const getMerchantUserPreferences = async (): Promise<UserPreferencesGrouped> => {
  return requestJson<UserPreferencesGrouped>('/merchant/user-preferences');
};

export const getMerchantSuggestions = async (): Promise<ConversionSuggestion[]> => {
  return requestJson<ConversionSuggestion[]>('/merchant/suggestions');
};

export const generateAgentReport = async (type: 'trend' | 'strategy' | 'marketing'): Promise<AgentReport> => {
  try {
    return await requestJson<AgentReport>('/merchant/reports', {
      method: 'POST',
      body: JSON.stringify({ type }),
    });
  } catch (error) {
    console.warn('Falling back to local report generation:', error);
    return new Promise((resolve) => {
      setTimeout(() => {
      if (type === 'trend') {
        resolve({
          title: '本周趋势日报',
          content: '本周奶茶裸粉、豆沙渐变、细法式增长明显。其中奶茶裸粉微闪试戴后预约率达到 18.2%，高于平均水平，属于低曝光高转化潜力款。黑色猫眼点击量高但预约率低，说明图片吸引力强但用户真实适配门槛较高。'
        });
      } else if (type === 'strategy') {
        resolve({
          title: '运营策略建议',
          content: '1. 首页主推“奶茶裸粉微闪”\n2. 上线“短甲显白通勤套餐”\n3. 给暖黄皮、短圆手用户优先推荐豆沙渐变\n4. 减少黑色猫眼的泛曝光，改为推荐给冷白皮细长手用户\n5. 推出 99 元低门槛体验套餐，提高预约转化'
        });
      } else {
        resolve({
          title: '营销文案生成',
          content: '【标题】：短甲女生也能显手长的奶茶裸粉美甲\n【卖点】：低饱和、不挑肤色、通勤约会都适合\n【Banner文案】：一眼温柔，十指显白\n【团购文案】：99 元短甲显白体验套餐，新客专享'
        });
      }
    }, 1500);
    });
  }
};

export const chatWithConsumerAgent = async ({
  sessionId,
  message,
  context,
  signal,
}: {
  sessionId: string;
  message: string;
  context?: Record<string, unknown>;
  signal?: AbortSignal;
}): Promise<ConsumerAgentResponse> => {
  return requestJson<ConsumerAgentResponse>('/consumer-agent/chat', {
    method: 'POST',
    signal,
    body: JSON.stringify({
      sessionId,
      message,
      context,
    }),
  });
};
