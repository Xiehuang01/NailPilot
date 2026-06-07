import {ref} from 'vue';
import {defineStore} from 'pinia';
import type {AnalysisResult, Recommendation, TryOnResult} from '@/api';

export type TryOnHistoryItem = {
  analysis: AnalysisResult | null;
  createdAt: string;
  id: string;
  recommendations: Recommendation[];
  result: TryOnResult;
  styleId: number | null;
  styleImageUrl: string;
  styleName: string;
  uploadedImageUrl: string | null;
};

const TRY_ON_HISTORY_STORAGE_KEY = 'nailpilot_try_on_history_v1';
const MAX_TRY_ON_HISTORY_ITEMS = 6;

const loadStoredHistory = (): TryOnHistoryItem[] => {
  if (typeof window === 'undefined') {
    return [];
  }

  try {
    const raw = localStorage.getItem(TRY_ON_HISTORY_STORAGE_KEY);
    if (!raw) {
      return [];
    }

    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as TryOnHistoryItem[]).slice(0, MAX_TRY_ON_HISTORY_ITEMS) : [];
  } catch {
    return [];
  }
};

export const useTryOnStore = defineStore('try-on', () => {
  const stepperIndex = ref(0);
  const uploadedImageUrl = ref<string | null>(null);
  const selectedStyleId = ref<number | null>(null);
  const analysisResult = ref<AnalysisResult | null>(null);
  const tryOnResult = ref<TryOnResult | null>(null);
  const recommendations = ref<Recommendation[] | null>(null);
  const tryOnHistory = ref<TryOnHistoryItem[]>(loadStoredHistory());

  const persistTryOnHistory = () => {
    if (typeof window === 'undefined') {
      return;
    }

    try {
      localStorage.setItem(TRY_ON_HISTORY_STORAGE_KEY, JSON.stringify(tryOnHistory.value));
    } catch (error) {
      console.warn('Failed to persist try-on history:', error);
      tryOnHistory.value = tryOnHistory.value.slice(0, Math.max(1, Math.floor(MAX_TRY_ON_HISTORY_ITEMS / 2)));

      try {
        localStorage.setItem(TRY_ON_HISTORY_STORAGE_KEY, JSON.stringify(tryOnHistory.value));
      } catch {
        localStorage.removeItem(TRY_ON_HISTORY_STORAGE_KEY);
        tryOnHistory.value = [];
      }
    }
  };

  const setStepperIndex = (index: number) => {
    stepperIndex.value = index;
  };

  const setUploadedImageUrl = (url: string | null) => {
    uploadedImageUrl.value = url;
  };

  const setSelectedStyleId = (id: number | null) => {
    selectedStyleId.value = id;
  };

  const setAnalysisResult = (result: AnalysisResult | null) => {
    analysisResult.value = result;
  };

  const setTryOnResult = (result: TryOnResult | null) => {
    tryOnResult.value = result;
  };

  const setRecommendations = (nextRecommendations: Recommendation[] | null) => {
    recommendations.value = nextRecommendations;
  };

  const pushTryOnHistory = (item: Omit<TryOnHistoryItem, 'createdAt' | 'id'>) => {
    const nextItem: TryOnHistoryItem = {
      ...item,
      createdAt: new Date().toISOString(),
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      recommendations: item.recommendations.slice(0, 3),
    };

    tryOnHistory.value = [nextItem, ...tryOnHistory.value].slice(0, MAX_TRY_ON_HISTORY_ITEMS);
    persistTryOnHistory();
  };

  const clearTryOnHistory = () => {
    tryOnHistory.value = [];

    if (typeof window !== 'undefined') {
      localStorage.removeItem(TRY_ON_HISTORY_STORAGE_KEY);
    }
  };

  const resetDefault = () => {
    stepperIndex.value = 0;
    uploadedImageUrl.value = null;
    selectedStyleId.value = null;
    analysisResult.value = null;
    tryOnResult.value = null;
    recommendations.value = null;
  };

  return {
    analysisResult,
    clearTryOnHistory,
    pushTryOnHistory,
    recommendations,
    resetDefault,
    selectedStyleId,
    setAnalysisResult,
    setRecommendations,
    setSelectedStyleId,
    setStepperIndex,
    setTryOnResult,
    setUploadedImageUrl,
    stepperIndex,
    tryOnHistory,
    tryOnResult,
    uploadedImageUrl,
  };
});
