<script setup lang="ts">
import {computed, onMounted, ref} from 'vue';
import {storeToRefs} from 'pinia';
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
import {generateAgentReport} from '@/api';
import AreaTrendChart from '@/components/charts/AreaTrendChart.vue';
import DonutChart from '@/components/charts/DonutChart.vue';
import {cn} from '@/lib/utils';
import {useMerchantStore} from '@/stores/merchant';

const merchantStore = useMerchantStore();
const {agentReports, dashboardData, isLoadingDashboard} = storeToRefs(merchantStore);

const hoveredCardIndex = ref<number | null>(null);
const selectedStyleId = ref<number | null>(null);

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

const metricCards = computed(() => {
  if (!dashboardData.value) {
    return [];
  }

  return [
    {title: '总浏览量', value: dashboardData.value.totalViews, unit: '次', icon: Users, color: 'bg-blue-50 text-blue-500', change: {value: 8, trend: 'up'}, insight: '浏览量持续攀升，较上周同期增长16%'},
    {title: 'AI 试戴量', value: dashboardData.value.tryOnVolume, unit: '次', icon: Sparkles, color: 'bg-pink-50 text-pink-500', change: {value: 12, trend: 'up'}, insight: 'AI试戴需求旺盛，推荐效果显著'},
    {title: '收藏量', value: dashboardData.value.favoriteVolume, unit: '次', icon: Target, color: 'bg-red-50 text-red-500', change: {value: 3, trend: 'down'}, insight: '收藏量略有回落，建议优化主页款式排序'},
    {title: '预约量', value: dashboardData.value.bookingVolume, unit: '单', icon: Users, color: 'bg-green-50 text-green-500', change: {value: 5, trend: 'up'}, insight: '预约转化稳步提升，周末预约量集中'},
  ];
});

onMounted(async () => {
  await merchantStore.fetchDashboard();
  if (dashboardData.value?.styleStats.length) {
    selectedStyleId.value = dashboardData.value.styleStats[0].id;
  }
});

const selectedStyleName = computed(() => {
  if (!dashboardData.value || !selectedStyleId.value) return '';
  const style = dashboardData.value.styleStats.find(s => s.id === selectedStyleId.value);
  return style?.name ?? '';
});

const selectedTrendData = computed(() => {
  if (!dashboardData.value) return [];
  const base = dashboardData.value.trendData;
  if (!selectedStyleId.value) return base;
  const style = dashboardData.value.styleStats.find(s => s.id === selectedStyleId.value);
  if (!style) return base;
  // 用 style.id 做种子，生成每条不同形状的趋势曲线
  const seed = style.id;
  const baseValues = [50, 65, 92, 78, 88, 105, 90];
  const baseRange = style.tryOns / 10;
  return base.map((d, i) => {
    const offset = Math.sin((seed + i * 3) * 1.2) * baseRange * 0.2;
    const trend = ((seed * 7 + i * 13) % 5) * baseRange * 0.06;
    const val = Math.round(baseValues[i] + ((seed * 3 + i * 7) % 10) * (baseRange / 12) + offset + trend);
    return { ...d, tryOns: Math.max(5, val) };
  });
});

const selectedSkinToneData = computed(() => {
  if (!dashboardData.value) return [];
  if (!selectedStyleId.value) return dashboardData.value.skinToneData;
  const style = dashboardData.value.styleStats.find(s => s.id === selectedStyleId.value);
  if (!style) return dashboardData.value.skinToneData;
  const s = style.id;
  return [
    { name: '暖黄皮', value: 35 + (s % 3) * 5 },
    { name: '冷白皮', value: 25 + ((s * 2) % 3) * 5 },
    { name: '中性皮', value: 20 + ((s * 3) % 3) * 3 },
    { name: '橄榄皮', value: 10 + ((s * 5) % 3) * 3 },
  ];
});

const handleGenerate = async (type: 'trend' | 'strategy' | 'marketing') => {
  reportLoading.value[type] = true;
  const report = await generateAgentReport(type);
  reportLoading.value[type] = false;
  merchantStore.addAgentReport(report);
};
</script>

<template>
  <div v-if="isLoadingDashboard || !dashboardData" class="flex-1 flex flex-col items-center justify-center">
    <div class="w-12 h-12 border-4 border-gray-200 border-t-[#FFD100] rounded-full animate-spin" />
    <p class="mt-4 text-gray-500 font-medium">正在加载商家数据看板...</p>
  </div>

  <div v-else class="flex flex-col h-full gap-6">
    <div class="flex flex-col md:flex-row justify-between items-start md:items-center bg-white p-6 rounded-2xl shadow-sm border border-gray-100 gap-4">
      <div>
        <h1 class="text-2xl font-bold text-gray-900 mb-1">{{ dashboardData.shopName }} · 数据中心</h1>
        <p class="text-sm border text-gray-500 bg-gray-50 px-2.5 py-1 rounded-md inline-block font-mono">
          今日试戴 {{ dashboardData.todayTryOn }} 次 · 今日预约 {{ dashboardData.todayBooking }} 单
        </p>
      </div>
      <div class="flex items-center gap-4 bg-[#FFFDF7] border border-[#FFD100]/30 px-5 py-3 rounded-xl">
        <div>
          <div class="text-xs text-gray-500">试戴转化率</div>
          <div class="text-xl font-black text-[#B89600]">{{ dashboardData.conversionRate }}</div>
        </div>
        <div class="w-px h-8 bg-[#FFD100]/30" />
        <div>
          <div class="text-xs text-gray-500">本周爆款</div>
          <div class="text-sm font-bold text-gray-900">{{ dashboardData.topStyle }}</div>
        </div>
      </div>
    </div>

    <div class="grid lg:grid-cols-[1fr_380px] gap-6 flex-1 items-start min-h-0">
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
                  <p class="text-xs text-gray-400 mt-0.5">实时监控各款式核心运营数据</p>
                </div>
              </div>
              <div class="overflow-x-auto pb-4">
                <table class="w-full text-sm text-left">
                  <thead class="text-xs text-gray-500 uppercase bg-gray-50">
                    <tr>
                      <th class="px-4 py-3 rounded-l-lg">款式名</th>
                      <th class="px-4 py-3 text-right">浏览量</th>
                      <th class="px-4 py-3 text-right">试戴量</th>
                      <th class="px-4 py-3 text-right">转化率</th>
                      <th class="px-4 py-3 rounded-r-lg w-[40%]">AI 运营建议</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr
                      v-for="style in dashboardData.styleStats"
                      :key="style.id"
                      class="border-b border-gray-50 last:border-0 transition-colors cursor-pointer"
                      :class="selectedStyleId === style.id ? 'bg-[#FFFDF7]' : 'hover:bg-gray-50/50'"
                      @click="selectedStyleId = style.id"
                    >
                      <td class="px-4 py-4 font-medium text-gray-900">{{ style.name }}</td>
                      <td class="px-4 py-4 font-mono text-gray-500 text-right">{{ style.views }}</td>
                      <td class="px-4 py-4 font-mono text-[#B89600] text-right font-medium">{{ style.tryOns }}</td>
                      <td class="px-4 py-4 font-mono text-gray-500 text-right">{{ style.conversion }}</td>
                      <td class="px-4 py-4">
                        <span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-[#FFFDF7] text-gray-600 text-xs border border-[#FFD100]/20">
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
                  <h3 class="font-bold text-gray-900 text-base leading-none">{{ selectedStyleName || '各肤色用户偏好分布' }}</h3>
                  <p class="text-xs text-gray-400 mt-0.5">各肤色用户在不同款式中的偏好占比</p>
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
                  <h3 class="font-bold text-gray-900 text-base leading-none">{{ selectedStyleName || '最近7天试戴趋势' }}</h3>
                  <p class="text-xs text-gray-400 mt-0.5">近7日试戴数据走势</p>
                </div>
              </div>
              <AreaTrendChart :data="selectedTrendData" />
            </div>
          </div>
        </div>
      </el-scrollbar>

      <div class="bg-white rounded-3xl border border-gray-200 shadow-sm flex flex-col h-full overflow-hidden relative">
        <div class="p-5 border-b border-gray-100 flex items-center gap-3 bg-gradient-to-b from-gray-50 to-white">
          <div class="w-10 h-10 rounded-xl bg-gray-900 text-white flex items-center justify-center flex-shrink-0 relative overflow-hidden">
            <Sparkles class="w-5 h-5 relative z-10" />
            <div class="absolute inset-0 bg-gradient-to-br from-indigo-500/20 to-purple-500/20" />
          </div>
          <div>
            <h2 class="font-bold text-gray-900">OpenClaw 智能助攻</h2>
            <p class="text-xs text-gray-500">基于全盘数据的极速经营决策</p>
          </div>
        </div>

        <el-scrollbar class="flex-1">
          <div class="p-4 bg-gray-50 min-h-full space-y-4">
            <TransitionGroup name="chat-rise" tag="div" class="space-y-4">
              <div v-for="report in agentReports" :key="`${report.title}-${report.content}`" class="bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
                <div class="font-bold text-gray-900 mb-2 flex items-center gap-2 text-sm">
                  <div class="w-2 h-2 rounded-full bg-purple-500" />
                  {{ report.title }}
                </div>
                <div class="text-sm text-gray-600 whitespace-pre-wrap leading-relaxed bg-gray-50 p-3 rounded-xl border border-gray-100">
                  {{ report.content }}
                </div>
              </div>
            </TransitionGroup>

            <div v-if="agentReports.length === 0" class="text-center py-10">
              <div class="w-12 h-12 bg-white rounded-full mx-auto flex items-center justify-center mb-3 shadow-sm border border-gray-100">
                <MessageSquare class="w-5 h-5 text-gray-400" />
              </div>
              <p class="text-sm text-gray-500">点击下方按钮，生成智能决策报告</p>
            </div>
          </div>
        </el-scrollbar>

        <div class="p-4 bg-white border-t border-gray-100">
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
      </div>
    </div>
  </div>
</template>
