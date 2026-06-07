import {ref} from 'vue';
import {defineStore} from 'pinia';
import {
  getMerchantDashboard,
  getMerchantRanking,
  getMerchantSuggestions,
  getMerchantUserPreferences,
  type AgentReport,
  type ConversionSuggestion,
  type MerchantDashboard,
  type StyleRankingItem,
  type UserPreferencesGrouped,
} from '@/api';

export const useMerchantStore = defineStore('merchant', () => {
  const dashboardData = ref<MerchantDashboard | null>(null);
  const agentReports = ref<AgentReport[]>([]);
  const rankingData = ref<StyleRankingItem[]>([]);
  const suggestions = ref<ConversionSuggestion[]>([]);
  const userPreferences = ref<UserPreferencesGrouped>({
    handShapes: [],
    tags: [],
    priceRanges: [],
    nailBeds: [],
  });
  const loadError = ref('');
  const isLoadingDashboard = ref(false);

  const fetchDashboard = async () => {
    isLoadingDashboard.value = true;
    loadError.value = '';
    try {
      const [dashboard, ranking, preferences, nextSuggestions] = await Promise.all([
        getMerchantDashboard(),
        getMerchantRanking(),
        getMerchantUserPreferences(),
        getMerchantSuggestions(),
      ]);

      dashboardData.value = dashboard;
      rankingData.value = ranking;
      userPreferences.value = preferences;
      suggestions.value = nextSuggestions;
    } catch (error) {
      loadError.value = error instanceof Error ? error.message : '商家数据加载失败';
      throw error;
    } finally {
      isLoadingDashboard.value = false;
    }
  };

  const addAgentReport = (report: AgentReport) => {
    agentReports.value = [...agentReports.value, report];
  };

  const clearReports = () => {
    agentReports.value = [];
  };

  return {
    addAgentReport,
    agentReports,
    clearReports,
    dashboardData,
    fetchDashboard,
    isLoadingDashboard,
    loadError,
    rankingData,
    suggestions,
    userPreferences,
  };
});
