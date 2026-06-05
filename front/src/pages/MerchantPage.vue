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
    {title: '总浏览量', value: dashboardData.value.totalViews, icon: Users, color: 'bg-blue-50 text-blue-500'},
    {title: 'AI 试戴量', value: dashboardData.value.tryOnVolume, icon: Sparkles, color: 'bg-pink-50 text-pink-500'},
    {title: '收藏量', value: dashboardData.value.favoriteVolume, icon: Target, color: 'bg-red-50 text-red-500'},
    {title: '预约量', value: dashboardData.value.bookingVolume, icon: Users, color: 'bg-green-50 text-green-500'},
  ];
});

onMounted(() => {
  merchantStore.fetchDashboard();
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
          <div class="grid grid-cols-2 md:grid-cols-4 gap-4 w-full">
            <div v-for="metric in metricCards" :key="metric.title" class="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm overflow-hidden relative">
              <div class="flex items-center gap-2 mb-2 relative z-10">
                <div :class="cn('w-8 h-8 rounded-lg flex items-center justify-center', metric.color)">
                  <component :is="metric.icon" class="w-4 h-4" />
                </div>
                <span class="text-xs font-semibold text-gray-500">{{ metric.title }}</span>
              </div>
              <div class="text-2xl font-black text-gray-900 font-mono tracking-tight relative z-10">
                {{ metric.value.toLocaleString() }}
              </div>
            </div>
          </div>

          <div class="grid md:grid-cols-2 gap-4">
            <div class="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm col-span-2">
              <h3 class="font-semibold text-gray-900 mb-4 flex items-center gap-2"><TrendingUp class="w-4 h-4" /> 最近7天试戴趋势</h3>
              <AreaTrendChart :data="dashboardData.trendData" />
            </div>

            <div class="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
              <h3 class="font-semibold text-gray-900 mb-4 flex items-center gap-2"><Target class="w-4 h-4" /> 各肤色用户偏好分布</h3>
              <DonutChart :data="dashboardData.skinToneData" :colors="pieColors" />
              <div class="flex flex-wrap justify-center gap-3 mt-2">
                <span v-for="(entry, index) in dashboardData.skinToneData" :key="entry.name" class="flex items-center text-xs text-gray-500">
                  <span class="w-2 h-2 rounded-full mr-1" :style="{backgroundColor: pieColors[index]}" />
                  {{ entry.name }}
                </span>
              </div>
            </div>

            <div class="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
              <h3 class="font-semibold text-gray-900 mb-4 flex items-center gap-2"><Activity class="w-4 h-4" /> 核心转化漏斗</h3>
              <div class="flex flex-col justify-center h-[180px] space-y-3 pt-4 px-4 relative">
                <div class="absolute left-1/2 top-4 bottom-4 w-px bg-gray-100 -z-10" />
                <div
                  v-for="(item, index) in dashboardData.funnelData"
                  :key="item.name"
                  class="flex items-center justify-between w-full z-10 transition-all hover:scale-105 origin-left"
                >
                  <div class="w-20 text-xs text-gray-500 text-right pr-2">{{ item.name }}</div>
                  <div class="flex-1 max-w-[200px]">
                    <div class="bg-[#FFD100]/30 h-8 rounded-r-md flex items-center shrink-0 border-l-2 border-[#FFD100]" :style="{width: `${100 - index * 20}%`}">
                      <span class="text-xs font-bold text-gray-800 ml-2">{{ item.value.toLocaleString() }}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div class="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
            <h3 class="font-semibold text-gray-900 mb-4">款式运营看板</h3>
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
                    class="border-b border-gray-50 last:border-0 hover:bg-gray-50/50 transition-colors"
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
        </div>
      </el-scrollbar>

      <div class="bg-white rounded-3xl border border-gray-200 shadow-sm flex flex-col h-full overflow-hidden relative">
        <div class="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-purple-500 via-[#FFD100] to-pink-500" />
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
