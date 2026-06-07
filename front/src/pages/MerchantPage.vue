<script setup lang="ts">
import {computed, onMounted, ref} from 'vue';
import {storeToRefs} from 'pinia';
import {ElMessage} from 'element-plus';
import {
  Activity,
  FileText,
  Megaphone,
  MessageSquare,
  Sparkles,
  Target,
  TrendingUp,
  Users,
} from 'lucide-vue-next';
import {marked} from 'marked';
import {generateAgentReport} from '@/api';
import AreaTrendChart from '@/components/charts/AreaTrendChart.vue';
import DonutChart from '@/components/charts/DonutChart.vue';
import {cn} from '@/lib/utils';
import {useMerchantStore} from '@/stores/merchant';

const merchantStore = useMerchantStore();
const {agentReports, dashboardData, isLoadingDashboard, loadError, rankingData, suggestions, userPreferences} = storeToRefs(merchantStore);

const hoveredCardIndex = ref<number | null>(null);
const selectedStyleId = ref<number | null>(null);

const renderMarkdown = (text: string) => marked.parse(text) as string;

const isShrunk = (index: number) => hoveredCardIndex.value !== null && hoveredCardIndex.value !== index;
const isExpanded = (index: number) => hoveredCardIndex.value === index;

const cardGridStyle = computed(() => {
  const cols = metricCards.value.map((_, i) =>
    hoveredCardIndex.value === null ? '1fr' : i === hoveredCardIndex.value ? '4.5fr' : '1fr',
  );
  return { gridTemplateColumns: cols.join(' ') };
});

const reportLoading = ref<Record<'trend' | 'strategy' | 'marketing', boolean>>({
  trend: false,
  strategy: false,
  marketing: false,
});

const reportActions = [
  {type: 'trend' as const, label: '生成本周趋势日报', icon: FileText},
  {type: 'strategy' as const, label: '生成运营策略建议', icon: Target},
  {type: 'marketing' as const, label: '生成小红书营销文案', icon: Megaphone},
];

const pieColors = ['#FFD100', '#FCD34D', '#FDE68A', '#FFFBEB'];

const getWeeklyComparison = (metricName: string) =>
  dashboardData.value?.weeklyComparison.find((item) => item.metricName === metricName);

const getMetricChange = (metricName: string) => {
  const metric = getWeeklyComparison(metricName);
  const value = metric ? Math.round(Math.abs(Number.parseFloat(metric.changePercentage))) : 0;
  return {
    value,
    trend: metric?.trend === 'down' ? 'down' : 'up',
  };
};

const metricCards = computed(() => {
  if (!dashboardData.value) {
    return [];
  }

  return [
    {
      title: '款式选中量',
      value: dashboardData.value.totalViews,
      unit: '次',
      icon: Users,
      color: 'bg-blue-50 text-blue-500',
      change: getMetricChange('views'),
      insight: `近一周款式累计被选中 ${dashboardData.value.totalViews.toLocaleString()} 次，当前热度第一是 ${dashboardData.value.topStyle}`,
    },
    {
      title: 'AI 试戴量',
      value: dashboardData.value.tryOnVolume,
      unit: '次',
      icon: Sparkles,
      color: 'bg-pink-50 text-pink-500',
      change: getMetricChange('try_ons'),
      insight: `近一周完成 ${dashboardData.value.tryOnVolume.toLocaleString()} 次试戴，今天新增 ${dashboardData.value.todayTryOn} 次`,
    },
    {
      title: '收藏意向量',
      value: dashboardData.value.favoriteVolume,
      unit: '次',
      icon: Target,
      color: 'bg-red-50 text-red-500',
      change: getMetricChange('favorites'),
      insight: `当前收藏意向累计 ${dashboardData.value.favoriteVolume.toLocaleString()} 次，可重点承接高意向用户`,
    },
    {
      title: '预约量',
      value: dashboardData.value.bookingVolume,
      unit: '单',
      icon: Users,
      color: 'bg-green-50 text-green-500',
      change: getMetricChange('bookings'),
      insight: `累计预约 ${dashboardData.value.bookingVolume.toLocaleString()} 单，试戴到预约转化率 ${dashboardData.value.tryOnToBookingRate}`,
    },
  ];
});

onMounted(async () => {
  try {
    await merchantStore.fetchDashboard();
    if (dashboardData.value?.styleStats.length) {
      selectedStyleId.value = dashboardData.value.styleStats[0].id;
    }
  } catch {
    ElMessage.error('商家数据加载失败，请确认后端服务和数据库已启动');
  }
});

const selectedTrendData = computed(() => dashboardData.value?.trendData ?? []);
const selectedSkinToneData = computed(() => dashboardData.value?.skinToneData ?? []);
const selectedStyleRanking = computed(() =>
  rankingData.value.find((item) => item.styleId === selectedStyleId.value) ?? null,
);
const topPreferenceRows = computed(() => ({
  handShapes: userPreferences.value.handShapes.slice(0, 3),
  tags: userPreferences.value.tags.slice(0, 4),
  priceRanges: userPreferences.value.priceRanges.slice(0, 3),
}));
const topSuggestions = computed(() => suggestions.value.slice(0, 3));

const handleGenerate = async (type: 'trend' | 'strategy' | 'marketing') => {
  reportLoading.value[type] = true;
  try {
    const report = await generateAgentReport(type);
    merchantStore.addAgentReport(report);
  } catch {
    ElMessage.error('报告生成失败，请检查 OpenClaw 和后端服务');
  } finally {
    reportLoading.value[type] = false;
  }
};
</script>

<template>
  <div v-if="isLoadingDashboard || !dashboardData" class="flex-1 flex flex-col items-center justify-center">
    <div class="w-12 h-12 border-4 border-gray-200 border-t-[#FFD100] rounded-full animate-spin" />
    <p class="mt-4 text-gray-500 font-medium">{{ loadError || '正在加载商家数据看板...' }}</p>
  </div>

  <div v-else class="flex flex-col h-full gap-6">
    <div class="flex flex-col md:flex-row justify-between items-start md:items-center bg-white p-6 rounded-2xl shadow-sm border border-gray-100 gap-4">
      <div class="flex items-center gap-4">
        <div class="w-1.5 h-12 rounded-full bg-gradient-to-b from-[#FFD100] to-[#B89600]" />
        <div>
          <h1 class="text-2xl font-black text-gray-900 tracking-tight">{{ dashboardData.shopName }}</h1>
          <p class="text-xs text-gray-400 mt-0.5 tracking-wide">
            今日试戴 <span class="font-semibold text-gray-600">{{ dashboardData.todayTryOn }}</span> 次 · 预约 <span class="font-semibold text-gray-600">{{ dashboardData.todayBooking }}</span> 单
          </p>
        </div>
      </div>
      <div class="flex items-center gap-3">
        <div class="flex items-center gap-2 px-3 py-2 rounded-xl bg-[#FFFDF7] border border-[#FFD100]/20">
          <TrendingUp class="w-3.5 h-3.5 text-[#B89600]" />
          <div>
            <span class="text-xs text-gray-400">转化率 </span>
            <span class="text-sm font-bold text-[#B89600]">{{ dashboardData.conversionRate }}</span>
          </div>
        </div>
        <div class="flex items-center gap-2 px-3 py-2 rounded-xl bg-[#FFFDF7] border border-[#FFD100]/20">
          <Sparkles class="w-3.5 h-3.5 text-[#B89600]" />
          <div>
            <span class="text-xs text-gray-400">爆款 </span>
            <span class="text-sm font-bold text-gray-900">{{ dashboardData.topStyle }}</span>
          </div>
        </div>
        <div class="flex items-center gap-2 px-3 py-2 rounded-xl bg-green-50 border border-green-200">
          <span class="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
          <span class="text-xs font-medium text-green-700">营业中</span>
        </div>
      </div>
    </div>

    <div class="grid lg:grid-cols-[1fr_460px] gap-6 flex-1 items-start min-h-0">
      <el-scrollbar class="h-full">
        <div class="space-y-6 flex flex-col h-full pr-2 pb-4">
          <div class="grid grid-cols-2 md:grid-cols-4 gap-4 w-full transition-[grid-template-columns] duration-500 ease-in-out" :style="cardGridStyle" @mouseleave="hoveredCardIndex = null">
            <div v-for="(metric, index) in metricCards" :key="metric.title" class="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm overflow-hidden relative cursor-pointer h-[7.5rem]" @mouseenter="hoveredCardIndex = index">
              <div class="flex items-center gap-2 mb-2 relative z-10">
                <div :class="cn('w-8 h-8 rounded-lg flex items-center justify-center shrink-0', metric.color)">
                  <component :is="metric.icon" class="w-4 h-4" />
                </div>
                <span
                  class="text-xs font-semibold text-gray-500 whitespace-nowrap transition-all duration-500 ease-in-out overflow-hidden"
                  :class="isShrunk(index) ? 'max-w-0 opacity-0' : 'max-w-32 opacity-100'"
                >{{ metric.title }}</span>
              </div>
              <div class="relative z-10 h-7">
                <span
                  class="text-xs font-semibold text-gray-500 absolute inset-0 flex items-center transition-all duration-500 ease-in-out whitespace-nowrap"
                  :class="isShrunk(index) ? 'opacity-100' : 'opacity-0'"
                >{{ metric.title }}</span>
                <div
                  class="text-xl font-black text-gray-900 font-mono tracking-tight absolute inset-0 flex items-center transition-all duration-500 ease-in-out whitespace-nowrap"
                  :class="isShrunk(index) ? 'opacity-0' : 'opacity-100'"
                >
                  {{ metric.value.toLocaleString() }}<span class="text-sm font-medium text-gray-400 ml-1">{{ metric.unit }}</span>
                  <span
                    v-show="isExpanded(index)"
                    class="inline-flex items-center gap-0.5 ml-2 px-1.5 py-0.5 rounded text-xs font-bold transition-all duration-500"
                    :class="metric.change.trend === 'up' ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-500'"
                  >{{ metric.change.trend === 'up' ? '↑' : '↓' }}{{ metric.change.value }}%</span>
                </div>
              </div>
              <p
                class="text-xs text-gray-400 overflow-hidden transition-all duration-500 ease-in-out whitespace-nowrap"
                :class="isExpanded(index) ? 'max-h-4 opacity-100 mt-0.5' : 'max-h-0 opacity-0'"
              >{{ metric.insight }}</p>
            </div>
          </div>

          <div class="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
            <div class="flex items-center gap-3 mb-4">
              <div class="w-9 h-9 rounded-xl bg-[#FFFDF7] border border-[#FFD100]/30 flex items-center justify-center">
                <Activity class="w-4 h-4 text-[#B89600]" />
              </div>
              <div>
                <h3 class="font-bold text-gray-900 text-base leading-none">核心转化漏斗</h3>
                <p class="text-xs text-gray-400 mt-0.5">从浏览到预约的全链路转化分析</p>
              </div>
            </div>
            <div class="flex flex-col justify-center h-[200px] space-y-4 pt-4 px-8">
              <div
                v-for="(item, index) in dashboardData.funnelData"
                :key="item.name"
                class="flex items-center gap-4 w-full z-10 transition-all hover:scale-[1.01] origin-left"
              >
                <span class="text-xs text-gray-500 w-10 shrink-0 font-medium">{{ item.name }}</span>
                <div class="flex-1">
                  <div class="bg-[#FFD100]/30 h-9 rounded-r-lg flex items-center shrink-0 border-l-2 border-[#FFD100]" :style="{width: `${100 - index * 15}%`}">
                    <span class="text-sm font-bold text-gray-800 ml-3">{{ item.value.toLocaleString() }}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div class="grid md:grid-cols-2 gap-4">
            <div class="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm col-span-2">
              <div class="flex items-center gap-3 mb-4">
                <div class="w-9 h-9 rounded-xl bg-[#FFFDF7] border border-[#FFD100]/30 flex items-center justify-center">
                  <Sparkles class="w-4 h-4 text-[#B89600]" />
                </div>
                <div>
                  <h3 class="font-bold text-gray-900 text-base leading-none">款式运营看板</h3>
                  <p class="text-xs text-gray-400 mt-0.5">直接读取用户端同一套商品的选款、试戴与预约数据</p>
                </div>
              </div>
              <div class="overflow-x-auto pb-4 max-h-[320px] overflow-y-auto">
                <table class="w-full text-sm text-left">
                  <thead class="text-xs text-gray-500 uppercase bg-gray-50">
                    <tr>
                      <th class="px-4 py-3 rounded-l-lg">款式名</th>
                      <th class="px-4 py-3 text-right">选中量</th>
                      <th class="px-4 py-3 text-right">试戴量</th>
                      <th class="px-4 py-3 text-right">转化率</th>
                      <th class="px-4 py-3 rounded-r-lg w-[40%]">AI 运营建议</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr
                      v-for="style in dashboardData.styleStats"
                      :key="style.id"
                      class="border-b border-gray-50 last:border-0 transition-colors duration-500 cursor-pointer"
                      :class="selectedStyleId === style.id ? 'bg-[#FFFDF7]' : 'hover:bg-gray-50/50'"
                      @click="selectedStyleId = style.id"
                    >
                      <td class="px-4 py-4">
                        <div class="flex items-center gap-2">
                          <span
                            v-if="rankingData.find((item) => item.styleId === style.id)"
                            class="inline-flex min-w-9 items-center justify-center rounded-full bg-[#FFF6D5] px-2 py-1 text-[11px] font-bold text-[#B89600]"
                          >
                            #{{ rankingData.find((item) => item.styleId === style.id)?.currentRank }}
                          </span>
                          <div>
                            <div class="font-medium text-gray-900">{{ style.name }}</div>
                            <div
                              v-if="rankingData.find((item) => item.styleId === style.id)"
                              class="text-[11px] text-gray-400"
                            >
                              综合分 {{ rankingData.find((item) => item.styleId === style.id)?.compositeScore }}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td class="px-4 py-4 font-mono text-gray-500 text-right">{{ style.views }}</td>
                      <td class="px-4 py-4 font-mono text-[#B89600] text-right font-medium">{{ style.tryOns }}</td>
                      <td class="px-4 py-4 font-mono text-gray-500 text-right">{{ style.conversion }}</td>
                      <td class="px-4 py-4">
                        <span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-[#FFFDF7] text-gray-600 text-xs border border-[#B89600]/40">
                          <Sparkles class="w-3 h-3 text-[#B89600] shrink-0" />
                          <span class="line-clamp-2 leading-relaxed">{{ style.advice }}</span>
                        </span>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            <div class="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
              <div class="flex items-center gap-3 mb-4">
                <div class="w-9 h-9 rounded-xl bg-[#FFFDF7] border border-[#FFD100]/30 flex items-center justify-center">
                  <Target class="w-4 h-4 text-[#B89600]" />
                </div>
                <div>
                  <h3 class="font-bold text-gray-900 text-base leading-none">近期试戴用户肤色分布</h3>
                  <p class="text-xs text-gray-400 mt-0.5">来自真实试戴事件的肤色标签统计</p>
                </div>
              </div>
              <DonutChart :data="selectedSkinToneData" :colors="pieColors" />
              <div class="flex flex-wrap justify-center gap-3 mt-2">
                <span v-for="(entry, index) in selectedSkinToneData" :key="entry.name" class="flex items-center text-xs text-gray-500">
                  <span class="w-2 h-2 rounded-full mr-1" :style="{backgroundColor: pieColors[index]}" />
                  {{ entry.name }}
                </span>
              </div>
            </div>

            <div class="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
              <div class="flex items-center gap-3 mb-4">
                <div class="w-9 h-9 rounded-xl bg-[#FFFDF7] border border-[#FFD100]/30 flex items-center justify-center">
                  <TrendingUp class="w-4 h-4 text-[#B89600]" />
                </div>
                <div>
                  <h3 class="font-bold text-gray-900 text-base leading-none">店铺最近 7 天试戴趋势</h3>
                  <p class="text-xs text-gray-400 mt-0.5">来自真实试戴事件的日级走势</p>
                </div>
              </div>
              <AreaTrendChart :data="selectedTrendData" />
            </div>

            <div class="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
              <div class="flex items-center justify-between gap-3 mb-4">
                <div>
                  <h3 class="font-bold text-gray-900 text-base leading-none">高频用户偏好</h3>
                  <p class="text-xs text-gray-400 mt-0.5">来自用户端真实试戴与选款标签</p>
                </div>
                <div
                  v-if="selectedStyleRanking"
                  class="rounded-2xl border border-[#FFD100]/30 bg-[#FFFDF7] px-3 py-2 text-right"
                >
                  <div class="text-[11px] font-semibold tracking-[0.24em] text-[#B89600]">TOP STYLE</div>
                  <div class="mt-1 text-lg font-black text-gray-900">#{{ selectedStyleRanking.currentRank }}</div>
                </div>
              </div>
              <div class="space-y-4">
                <div>
                  <p class="text-xs font-semibold text-gray-400">热门标签</p>
                  <div class="mt-2 flex flex-wrap gap-2">
                    <span
                      v-for="item in topPreferenceRows.tags"
                      :key="item.label"
                      class="inline-flex items-center gap-1 rounded-full border border-[#FFD100]/25 bg-[#FFFDF7] px-3 py-1 text-xs text-gray-700"
                    >
                      {{ item.label }}
                      <span class="font-semibold text-[#B89600]">{{ item.percentage }}</span>
                    </span>
                  </div>
                </div>
                <div>
                  <p class="text-xs font-semibold text-gray-400">主流手型</p>
                  <div class="mt-2 flex flex-wrap gap-2">
                    <span
                      v-for="item in topPreferenceRows.handShapes"
                      :key="item.label"
                      class="inline-flex items-center gap-1 rounded-full border border-gray-200 bg-gray-50 px-3 py-1 text-xs text-gray-600"
                    >
                      {{ item.label }}
                      <span class="font-semibold text-gray-900">{{ item.percentage }}</span>
                    </span>
                  </div>
                </div>
                <div>
                  <p class="text-xs font-semibold text-gray-400">主流客单带</p>
                  <div class="mt-2 flex flex-wrap gap-2">
                    <span
                      v-for="item in topPreferenceRows.priceRanges"
                      :key="item.label"
                      class="inline-flex items-center gap-1 rounded-full border border-gray-200 bg-gray-50 px-3 py-1 text-xs text-gray-600"
                    >
                      {{ item.label }}
                      <span class="font-semibold text-gray-900">{{ item.percentage }}</span>
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div class="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
              <div class="flex items-center gap-3 mb-4">
                <div class="w-9 h-9 rounded-xl bg-[#FFFDF7] border border-[#FFD100]/30 flex items-center justify-center">
                  <Sparkles class="w-4 h-4 text-[#B89600]" />
                </div>
                <div>
                  <h3 class="font-bold text-gray-900 text-base leading-none">当前转化建议</h3>
                  <p class="text-xs text-gray-400 mt-0.5">由后端建议库直接返回，方便商家快速决策</p>
                </div>
              </div>
              <div class="space-y-3">
                <div
                  v-for="item in topSuggestions"
                  :key="item.id"
                  class="rounded-2xl border border-gray-100 bg-gray-50 px-4 py-3"
                >
                  <div class="flex items-center justify-between gap-3">
                    <div class="text-sm font-semibold text-gray-900">{{ item.title }}</div>
                    <span
                      class="rounded-full px-2.5 py-1 text-[11px] font-semibold"
                      :class="item.priority === 'high' ? 'bg-red-50 text-red-500' : item.priority === 'medium' ? 'bg-amber-50 text-amber-600' : 'bg-gray-100 text-gray-500'"
                    >
                      {{ item.priority === 'high' ? '高优先' : item.priority === 'medium' ? '中优先' : '低优先' }}
                    </span>
                  </div>
                  <p class="mt-2 text-sm leading-6 text-gray-600">{{ item.suggestion }}</p>
                  <p class="mt-2 text-xs font-medium text-[#B89600]">{{ item.expectedImpact }}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </el-scrollbar>

      <div class="bg-white rounded-3xl border border-gray-200 shadow-sm flex flex-col overflow-hidden relative self-stretch max-h-[calc(100vh-8rem+200px)]">
        <div class="p-5 border-b border-gray-100 flex items-center gap-3 bg-gradient-to-b from-gray-50 to-white shrink-0">
          <div class="w-10 h-10 rounded-xl bg-gray-900 text-white flex items-center justify-center flex-shrink-0 relative overflow-hidden">
            <Sparkles class="w-5 h-5 relative z-10" />
            <div class="absolute inset-0 bg-gradient-to-br from-indigo-500/20 to-purple-500/20" />
          </div>
          <div>
            <h2 class="font-bold text-gray-900">OpenClaw 智能助攻</h2>
            <p class="text-xs text-gray-500">基于全盘数据的极速经营决策</p>
          </div>
        </div>

        <div class="p-4 bg-white border-b border-gray-100">
          <div class="grid grid-cols-1 gap-2">
            <button
              v-for="action in reportActions"
              :key="action.type"
              type="button"
              :disabled="reportLoading[action.type]"
              :class="cn(
                'flex items-center justify-between px-4 py-3 rounded-xl text-sm font-medium transition-all group',
                reportLoading[action.type]
                  ? 'bg-gray-50 text-gray-400 cursor-not-allowed border border-gray-200'
                  : 'bg-white text-gray-700 hover:bg-[#FFFDF7] hover:text-[#B89600] hover:border-[#FFD100]/50 border border-gray-200 shadow-sm',
              )"
              @click="handleGenerate(action.type)"
            >
              <div class="flex items-center gap-2">
                <component :is="action.icon" :class="cn('w-4 h-4', reportLoading[action.type] ? 'text-gray-400' : 'text-gray-400 group-hover:text-[#B89600]')" />
                {{ action.label }}
              </div>
              <span v-if="reportLoading[action.type]" class="flex items-center text-xs">
                <div class="w-3 h-3 border-2 border-gray-300 border-t-gray-500 rounded-full animate-spin mr-1" />
                生成中
              </span>
              <span v-else class="text-gray-300 group-hover:text-[#FFD100] transition-colors">&rarr;</span>
            </button>
          </div>
        </div>

        <el-scrollbar class="flex-1 min-h-0">
          <div class="p-4 bg-gray-50 min-h-full space-y-4">
            <TransitionGroup name="chat-rise" tag="div" class="space-y-4">
              <div v-for="report in agentReports" :key="`${report.title}-${report.content}`" class="bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
                <div class="font-bold text-gray-900 mb-2 flex items-center gap-2 text-sm">
                  <div class="w-2 h-2 rounded-full bg-purple-500" />
                  {{ report.title }}
                </div>
                <div class="text-sm text-gray-600 leading-relaxed bg-gray-50 p-3 rounded-xl border border-gray-100 markdown-body" v-html="renderMarkdown(report.content)" />
              </div>
            </TransitionGroup>

            <div v-if="agentReports.length === 0" class="text-center py-10">
              <div class="w-12 h-12 bg-white rounded-full mx-auto flex items-center justify-center mb-3 shadow-sm border border-gray-100">
                <MessageSquare class="w-5 h-5 text-gray-400" />
              </div>
              <p class="text-sm text-gray-500">点击上方按钮，生成智能决策报告</p>
            </div>
          </div>
        </el-scrollbar>
      </div>
    </div>
  </div>
</template>

<style scoped>
.markdown-body :deep(h1) { font-size: 1.25rem; font-weight: 700; margin: 1rem 0 0.5rem; color: #111827; }
.markdown-body :deep(h2) { font-size: 1.1rem; font-weight: 700; margin: 0.75rem 0 0.5rem; color: #111827; }
.markdown-body :deep(h3) { font-size: 1rem; font-weight: 600; margin: 0.75rem 0 0.25rem; color: #1f2937; }
.markdown-body :deep(p) { margin: 0.25rem 0; }
.markdown-body :deep(ul), .markdown-body :deep(ol) { padding-left: 1.5rem; margin: 0.25rem 0; }
.markdown-body :deep(li) { margin: 0.125rem 0; }
.markdown-body :deep(table) { width: 100%; border-collapse: collapse; margin: 0.5rem 0; font-size: 0.8125rem; }
.markdown-body :deep(th) { background: #f3f4f6; padding: 0.375rem 0.5rem; text-align: left; font-weight: 600; border: 1px solid #e5e7eb; }
.markdown-body :deep(td) { padding: 0.25rem 0.5rem; border: 1px solid #e5e7eb; }
.markdown-body :deep(strong) { font-weight: 600; color: #111827; }
.markdown-body :deep(hr) { border: none; border-top: 1px solid #e5e7eb; margin: 0.75rem 0; }
.markdown-body :deep(code) { background: #f3f4f6; padding: 0.125rem 0.25rem; border-radius: 0.25rem; font-size: 0.8125rem; }
.markdown-body :deep(blockquote) { border-left: 3px solid #a78bfa; padding-left: 0.75rem; margin: 0.5rem 0; color: #6b7280; }
</style>
