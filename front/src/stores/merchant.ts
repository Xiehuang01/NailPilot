import {ref} from 'vue';
import {defineStore} from 'pinia';
import {getMerchantDashboard, type AgentReport, type MerchantDashboard} from '@/api';

export const useMerchantStore = defineStore('merchant', () => {
  const dashboardData = ref<MerchantDashboard | null>(null);
  const agentReports = ref<AgentReport[]>([]);
  const isLoadingDashboard = ref(false);

  const fetchDashboard = async () => {
    isLoadingDashboard.value = true;
    try {
      dashboardData.value = await getMerchantDashboard();
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
  };
});
