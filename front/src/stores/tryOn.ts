import {ref} from 'vue';
import {defineStore} from 'pinia';
import type {AnalysisResult, Recommendation, TryOnResult} from '@/api';

export const useTryOnStore = defineStore('try-on', () => {
  const stepperIndex = ref(0);
  const uploadedImageUrl = ref<string | null>(null);
  const selectedStyleId = ref<number | null>(null);
  const analysisResult = ref<AnalysisResult | null>(null);
  const tryOnResult = ref<TryOnResult | null>(null);
  const recommendations = ref<Recommendation[] | null>(null);

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
    tryOnResult,
    uploadedImageUrl,
  };
});
