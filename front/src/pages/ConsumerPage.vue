<script setup lang="ts">
import {computed, nextTick, onMounted, onUnmounted, ref, watch} from 'vue';
import {storeToRefs} from 'pinia';
import {
  Calendar,
  Camera,
  Check,
  ChevronLeft,
  ChevronRight,
  MapPin,
  Sparkles,
  Star,
  Upload,
} from 'lucide-vue-next';
import {
  analyzeHand,
  createBooking,
  createTryOn,
  getRecommendations,
  getStyles,
  trackStyleSelection,
  type Recommendation,
  type StyleItem,
} from '@/api';
import ConsumerChat from '@/components/ConsumerChat.vue';
import {cn} from '@/lib/utils';
import {type TryOnHistoryItem, useTryOnStore} from '@/stores/tryOn';
import {useUserStore} from '@/stores/user';

const tryOnStore = useTryOnStore();
const userStore = useUserStore();

const {analysisResult, recommendations, selectedStyleId, stepperIndex, tryOnHistory, tryOnResult, uploadedImageUrl} =
  storeToRefs(tryOnStore);
const {preferences} = storeToRefs(userStore);

const showChat = ref(true);
const styles = ref<StyleItem[]>([]);
const loadingStep = ref(0);
const generationProgress = ref(0);
const booking = ref(false);
const success = ref(false);
const captureMode = ref<'upload' | 'camera'>('upload');
const fileInputRef = ref<HTMLInputElement | null>(null);
const videoRef = ref<HTMLVideoElement | null>(null);
const cameraStream = ref<MediaStream | null>(null);
const cameraError = ref('');
const handQualityChecking = ref(false);
const handQualityError = ref('');
const isCameraStarting = ref(false);
const showDemoHandList = ref(false);
const showHistoryPanel = ref(false);
const styleListRef = ref<HTMLElement | null>(null);
const focusedStyleId = ref<number | null>(null);
const isTryOnRunning = ref(false);
const tryOnStatusMessage = ref('');
const backgroundTryOnNotice = ref('');
const lastCompletedTryOnKey = ref('');
const activeTryOnKey = ref('');
const pendingTryOnCount = ref(0);
const activeTryOnContext = ref<{
  analysis: typeof analysisResult.value;
  styleId: number;
  uploadedImageUrl: string;
} | null>(null);
let tryOnRunId = 0;
let handQualityRunId = 0;
let progressTimer: number | null = null;
let focusedStyleTimer: number | null = null;
let pseudoProgressValue = 0;

const steps = [
  {title: '偏好选择'},
  {title: '上传手图'},
  {title: '挑选款式'},
  {title: 'AI 试戴'},
  {title: '门店预约'},
];

const tryOnBadgeText = computed(() => (tryOnResult.value?.provider === 'safe-hand-fallback' ? '原图保护' : 'AI GENERATED'));
const historyItems = computed(() => tryOnHistory.value ?? []);
const currentTryOnKey = computed(() => `${selectedStyleId.value ?? 0}::${uploadedImageUrl.value ?? ''}`);
const topRecommendation = computed(() => recommendationsList()[0] ?? null);
const pendingTryOnBannerText = computed(() => `你目前正在有 ${pendingTryOnCount.value} 款美甲正在生成，点击之后就会自动跳转到生成的进度界面`);

onMounted(async () => {
  tryOnStore.resetDefault();
  styles.value = await getStyles();
});

onUnmounted(() => {
  stopCamera();
  stopPseudoProgress();
  stopFocusedStylePulse();
});

watch(stepperIndex, async (index) => {
  if (index !== 1) {
    stopCamera();
  }

  if (index === 2) {
    await scrollSelectedStyleIntoView();
  }

  if (index !== 3) {
    return;
  }

  if (lastCompletedTryOnKey.value && lastCompletedTryOnKey.value === currentTryOnKey.value && tryOnResult.value) {
    loadingStep.value = 4;
    setGenerationProgress(100);
    return;
  }

  if (isTryOnRunning.value && activeTryOnKey.value === currentTryOnKey.value) {
    return;
  }

  void runTryOnPipeline();
});

watch(showChat, (value) => {
  if (value) {
    showHistoryPanel.value = false;
  }
});

const startTryOn = (quickMode: boolean, styleId?: number) => {
  if (styleId) {
    selectStyle(styleId, 'ai_recommendation');
  }

  if (styleId && uploadedImageUrl.value) {
    tryOnStore.setStepperIndex(3);
  } else {
    tryOnStore.setStepperIndex(quickMode ? 1 : 0);
  }

  showChat.value = false;
};

const formatHistoryTime = (value: string) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return '刚刚';
  }

  return new Intl.DateTimeFormat('zh-CN', {
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    month: '2-digit',
  }).format(date);
};

const restoreHistoryItem = (item: TryOnHistoryItem) => {
  tryOnStore.setAnalysisResult(item.analysis);
  tryOnStore.setRecommendations(item.recommendations);
  if (item.styleId) {
    selectStyle(item.styleId, 'history_restore');
  } else {
    tryOnStore.setSelectedStyleId(item.styleId);
  }
  tryOnStore.setTryOnResult(item.result);
  tryOnStore.setUploadedImageUrl(item.uploadedImageUrl);
  lastCompletedTryOnKey.value = `${item.styleId ?? 0}::${item.uploadedImageUrl ?? ''}`;
  tryOnStore.setStepperIndex(3);
  showHistoryPanel.value = false;
};

const selectStyle = (styleId: number, source: 'catalog' | 'ai_recommendation' | 'history_restore' = 'catalog') => {
  tryOnStore.setSelectedStyleId(styleId);
  void trackStyleSelection({
    sessionId: userStore.sessionId,
    source,
    styleId,
  });
};

const dismissBackgroundTryOnNotice = () => {
  backgroundTryOnNotice.value = '';
};

const leaveTryOnToBackground = () => {
  tryOnStore.setStepperIndex(2);
};

const jumpToGeneratingTryOn = () => {
  const context = activeTryOnContext.value;
  if (!context) {
    return;
  }

  tryOnStore.setSelectedStyleId(context.styleId);
  tryOnStore.setUploadedImageUrl(context.uploadedImageUrl);
  tryOnStore.setAnalysisResult(context.analysis ?? null);
  tryOnStore.setStepperIndex(3);
};

const handleRecommendationTryOn = (styleId: number) => {
  selectStyle(styleId, 'ai_recommendation');
  tryOnStore.setStepperIndex(3);
};

const stopFocusedStylePulse = () => {
  if (focusedStyleTimer) {
    window.clearTimeout(focusedStyleTimer);
    focusedStyleTimer = null;
  }
};

const scrollSelectedStyleIntoView = async () => {
  const styleId = selectedStyleId.value;
  if (!styleId) {
    return;
  }

  await nextTick();
  const list = styleListRef.value;
  const card = list?.querySelector<HTMLElement>(`[data-style-id="${styleId}"]`);
  if (!list || !card) {
    return;
  }

  const top = card.offsetTop - list.offsetTop - Math.max(16, list.clientHeight * 0.18);
  list.scrollTo({
    top: Math.max(0, top),
    behavior: 'smooth',
  });

  stopFocusedStylePulse();
  focusedStyleId.value = styleId;
  focusedStyleTimer = window.setTimeout(() => {
    focusedStyleId.value = null;
    focusedStyleTimer = null;
  }, 1800);
};

const uploadModeOptions = [
  {key: 'upload' as const, label: '上传照片', icon: Upload},
  {key: 'camera' as const, label: '拍摄照片', icon: Camera},
];

const styleSales = [1, 7, 0, 2, 21, 5, 3, 8];
const styleDiscounts = ['8.2折', '7.1折', '7.6折', '5.9折', '4.2折', '8.8折', '6.6折', '7.9折'];
const demoHandImages = [
  'http://p0.meituan.net/pilotimages/b9632e3a699fdb63a1a6139bbfd6bf0d2159483.png',
  'http://p1.meituan.net/pilotimages/704b1c4bdf589b5d5367f2748f6868f42205269.png',
  'http://p0.meituan.net/pilotimages/3cd4bc446f321574df68ce0a749b16b62603765.png',
  'http://p0.meituan.net/pilotimages/7c791f4b4b13659d62d991f172f5ffd02674881.png',
  'http://p1.meituan.net/pilotimages/5a7efacd78020469ab44e4caca1afe972676586.png',
  'http://p1.meituan.net/pilotimages/6a3d032df4a143c79c3e2ec3cd4c53522723999.png',
  'http://p0.meituan.net/pilotimages/ed9a1cd3cca3997ede3779771dda6a772149757.png',
  'http://p1.meituan.net/pilotimages/a52c995f1f9e2e668c6093099cfd24032514125.png',
  'http://p0.meituan.net/pilotimages/e0d094b37e9595e465280b26b9cefc7b2318139.png',
  'http://p0.meituan.net/pilotimages/4b310e7ce87af3d5f20064a25420f34b2320446.png',
  'http://p0.meituan.net/pilotimages/e763917e1e5b4a68f33d8075fc1504bf2680556.png',
  'http://p0.meituan.net/pilotimages/8a73302ae05d6520b90d50db36d481492489372.png',
  'http://p0.meituan.net/pilotimages/badf638f6e3989a31d524b7a8cc4a2332706287.png',
];

const getStylePrice = (price: string) => Number.parseInt(price.split('-')[0] ?? '0', 10);
const getStyleOriginalPrice = (style: StyleItem) => {
  const price = getStylePrice(style.price);
  return price + [20, 41, 49, 21, 40, 15, 60, 34][(style.id - 1) % 8];
};
const getStyleSales = (style: StyleItem) => styleSales[(style.id - 1) % styleSales.length];
const getStyleDiscount = (style: StyleItem) => styleDiscounts[(style.id - 1) % styleDiscounts.length];
const getStyleListingTitle = (style: StyleItem) => {
  const titles: Record<number, string> = {
    1: '美甲 | 本甲 | 款式',
    2: '特惠半贴 款式美甲猫眼~含建构',
    3: '【精致美甲】甲片美甲任选',
    4: '美甲 | 本甲 | 纯色/跳色',
    5: '【轻松卸甲】温和不伤甲快速卸除',
  };

  return titles[style.id] ?? `美甲 | ${style.name}`;
};
const splitMeituanKeyword = (title: string) => title.split(/(美甲)/g).filter(Boolean);

const selectCaptureMode = (mode: 'upload' | 'camera') => {
  captureMode.value = mode;
  showDemoHandList.value = false;
  tryOnStore.setUploadedImageUrl(null);

  if (mode === 'camera') {
    startCamera();
    return;
  }

  stopCamera();
};

const resetUploadedHand = () => {
  handQualityRunId += 1;
  handQualityChecking.value = false;
  handQualityError.value = '';
  showDemoHandList.value = false;
  tryOnStore.setAnalysisResult(null);
  tryOnStore.setUploadedImageUrl(null);
};

const handleUpload = async () => {
  resetUploadedHand();
  captureMode.value = 'upload';
  stopCamera();
  await nextTick();
  fileInputRef.value?.click();
};

const handleRetake = async () => {
  resetUploadedHand();
  captureMode.value = 'camera';
  showDemoHandList.value = false;
  await startCamera();
};

const acceptUploadedHandImage = async (url: string, mode: 'camera' | 'upload') => {
  const currentRun = ++handQualityRunId;
  captureMode.value = mode;
  handQualityError.value = '';
  handQualityChecking.value = true;
  tryOnStore.setUploadedImageUrl(url);
  tryOnStore.setAnalysisResult(null);

  try {
    const analysis = await analyzeHand(url);
    if (currentRun !== handQualityRunId) {
      return;
    }

    tryOnStore.setAnalysisResult(analysis);
    if (analysis.isValidPhoto === false || analysis.fingersSpread === false || analysis.nailVisible === false) {
      handQualityError.value =
        analysis.qualityReason || 'AI 检测到手指没有充分张开或指尖不够清晰，请重新上传一张手部照片。';
      tryOnStore.setUploadedImageUrl(null);
      tryOnStore.setStepperIndex(1);
    }
  } catch (error) {
    if (currentRun !== handQualityRunId) {
      return;
    }

    handQualityError.value = error instanceof Error ? error.message : '手图质量检查失败，请重新上传。';
    tryOnStore.setUploadedImageUrl(null);
    tryOnStore.setStepperIndex(1);
  } finally {
    if (currentRun === handQualityRunId) {
      handQualityChecking.value = false;
    }
  }
};

const handleFileSelected = (event: Event) => {
  const input = event.target as HTMLInputElement;
  const file = input.files?.[0];
  if (!file) {
    return;
  }

  const reader = new FileReader();
  reader.onload = () => {
    if (typeof reader.result === 'string') {
      stopCamera();
      void acceptUploadedHandImage(reader.result, 'upload');
    }
  };
  reader.readAsDataURL(file);
  input.value = '';
};

const selectDemoHandImage = (url: string) => {
  showDemoHandList.value = false;
  stopCamera();
  void acceptUploadedHandImage(url, 'upload');
};

async function startCamera() {
  if (cameraStream.value || isCameraStarting.value) {
    return;
  }

  if (!navigator.mediaDevices?.getUserMedia) {
    cameraError.value = '当前浏览器不支持摄像头调用';
    return;
  }

  isCameraStarting.value = true;
  cameraError.value = '';

  try {
    const stream = await navigator.mediaDevices.getUserMedia({
      video: {
        facingMode: {ideal: 'environment'},
        width: {ideal: 1280},
        height: {ideal: 960},
      },
      audio: false,
    });
    cameraStream.value = stream;
    await nextTick();
    if (videoRef.value) {
      videoRef.value.srcObject = stream;
      await videoRef.value.play();
    }
  } catch (error) {
    cameraError.value = error instanceof Error ? error.message : '无法打开摄像头';
  } finally {
    isCameraStarting.value = false;
  }
}

function stopCamera() {
  cameraStream.value?.getTracks().forEach((track) => track.stop());
  cameraStream.value = null;
  if (videoRef.value) {
    videoRef.value.srcObject = null;
  }
}

const handleCapture = async () => {
  if (!cameraStream.value) {
    await startCamera();
    return;
  }

  const video = videoRef.value;
  if (!video || video.videoWidth === 0 || video.videoHeight === 0) {
    return;
  }

  const canvas = document.createElement('canvas');
  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;
  const context = canvas.getContext('2d');
  if (!context) {
    return;
  }

  context.drawImage(video, 0, 0, canvas.width, canvas.height);
  stopCamera();
  void acceptUploadedHandImage(canvas.toDataURL('image/jpeg', 0.92), 'camera');
};

const handleBook = async () => {
  booking.value = true;
  await createBooking('shop1', 1, 'none');
  booking.value = false;
  success.value = true;
};

const goToHome = () => {
  window.location.href = '/';
};

const loadingTexts = [
  '',
  '正在分析手型与肤色...',
  '正在保持皮肤纹理、动作、光影与形态生成试戴图...',
  '正在计算适配分并寻找更适合的款式...',
];

const recommendationsList = () => recommendations.value ?? [];
const isPreferenceComplete = () =>
  Boolean(preferences.value.scene && preferences.value.budget && preferences.value.style);

const overlayHint = () =>
  captureMode.value === 'camera' ? '将手掌与指尖对齐轮廓后拍摄' : '将手掌放在轮廓中后上传照片';

const setGenerationProgress = (value: number) => {
  pseudoProgressValue = Math.max(0, Math.min(100, value));
  generationProgress.value = Math.round(pseudoProgressValue);
};

const stopPseudoProgress = () => {
  if (progressTimer) {
    window.clearInterval(progressTimer);
    progressTimer = null;
  }
};

const startPseudoProgress = (from: number, to: number, interval = 820, easing = 0.08, maxStep = 2.4) => {
  stopPseudoProgress();
  setGenerationProgress(Math.max(generationProgress.value, from));
  progressTimer = window.setInterval(() => {
    if (pseudoProgressValue >= to) {
      stopPseudoProgress();
      return;
    }

    const distance = to - pseudoProgressValue;
    const step = Math.max(0.35, Math.min(maxStep, distance * easing));
    setGenerationProgress(Math.min(to, pseudoProgressValue + step));
  }, interval);
};

const runTryOnPipeline = async () => {
  const taskKey = currentTryOnKey.value;
  const currentRun = ++tryOnRunId;
  const selectedStyleIdAtStart = selectedStyleId.value ?? 1;
  const uploadedImageUrlAtStart = uploadedImageUrl.value ?? '';
  const selectedStyleAtStart = styles.value.find((item) => item.id === selectedStyleIdAtStart) ?? null;
  activeTryOnKey.value = taskKey;
  backgroundTryOnNotice.value = '';
  pendingTryOnCount.value += 1;
  isTryOnRunning.value = true;
  loadingStep.value = 1;
  tryOnStatusMessage.value = '正在分析手型与肤色...';
  tryOnStore.setTryOnResult(null);
  tryOnStore.setRecommendations(null);
  setGenerationProgress(6);

  try {
    const analysis = analysisResult.value ?? (await analyzeHand(uploadedImageUrlAtStart));
    activeTryOnContext.value = {
      analysis,
      styleId: selectedStyleIdAtStart,
      uploadedImageUrl: uploadedImageUrlAtStart,
    };
    if (currentRun !== tryOnRunId) {
      return;
    }

    tryOnStore.setAnalysisResult(analysis);
    loadingStep.value = 2;
    tryOnStatusMessage.value = '正在细化手部纹理与款式细节...';
    startPseudoProgress(16, 86, 860, 0.07, 2);
    const result = await createTryOn(selectedStyleIdAtStart, uploadedImageUrlAtStart, analysis);

    if (currentRun !== tryOnRunId) {
      const nextRecommendationsForHistory = result.recommendations?.length ? result.recommendations : await getRecommendations();
      if (selectedStyleAtStart) {
        tryOnStore.pushTryOnHistory({
          analysis,
          recommendations: nextRecommendationsForHistory,
          result,
          styleId: selectedStyleAtStart.id,
          styleImageUrl: selectedStyleAtStart.img,
          styleName: selectedStyleAtStart.name,
          uploadedImageUrl: uploadedImageUrlAtStart,
        });
      }
      return;
    }

    stopPseudoProgress();
    setGenerationProgress(92);
    loadingStep.value = 3;
    tryOnStatusMessage.value = '正在做审美复评与智能推荐...';
    startPseudoProgress(92, 97, 1100, 0.16, 1.2);
    const nextRecommendations = result.recommendations?.length ? result.recommendations : await getRecommendations();
    const taskStillMatchesCurrentSelection = currentTryOnKey.value === taskKey;

    if (currentRun !== tryOnRunId) {
      if (selectedStyleAtStart) {
        tryOnStore.pushTryOnHistory({
          analysis,
          recommendations: nextRecommendations,
          result,
          styleId: selectedStyleAtStart.id,
          styleImageUrl: selectedStyleAtStart.img,
          styleName: selectedStyleAtStart.name,
          uploadedImageUrl: uploadedImageUrlAtStart,
        });
      }
      return;
    }

    stopPseudoProgress();
    if (taskStillMatchesCurrentSelection) {
      tryOnStore.setTryOnResult(result);
      tryOnStore.setRecommendations(nextRecommendations);
    }
    lastCompletedTryOnKey.value = taskKey;
    if (selectedStyleAtStart) {
      tryOnStore.pushTryOnHistory({
        analysis,
        recommendations: nextRecommendations,
        result,
        styleId: selectedStyleAtStart.id,
        styleImageUrl: selectedStyleAtStart.img,
        styleName: selectedStyleAtStart.name,
        uploadedImageUrl: uploadedImageUrlAtStart,
      });
    }

    setGenerationProgress(100);
    loadingStep.value = 4;
    if (stepperIndex.value !== 3 || !taskStillMatchesCurrentSelection) {
      backgroundTryOnNotice.value = '上一张试戴图已经生成好了，点右上角“历史试戴”就能回看。';
    }
  } catch (error) {
    if (currentRun === tryOnRunId) {
      stopPseudoProgress();
      isTryOnRunning.value = false;
      tryOnStatusMessage.value = '';
      backgroundTryOnNotice.value = error instanceof Error ? error.message : 'AI 试戴生成失败，请重试。';
      loadingStep.value = 0;
      setGenerationProgress(0);
    }
  } finally {
    if (currentRun === tryOnRunId) {
      isTryOnRunning.value = false;
      tryOnStatusMessage.value = '';
    }

    pendingTryOnCount.value = Math.max(0, pendingTryOnCount.value - 1);
    if (pendingTryOnCount.value === 0) {
      activeTryOnContext.value = null;
    }
  }
};

const handGuidePath =
  'M82 284 C60 260 52 230 58 199 C62 178 72 168 86 173 C96 176 101 188 103 204 L105 96 C105 76 116 63 131 63 C146 63 154 76 154 96 L154 49 C154 30 165 18 181 18 C197 18 207 31 207 50 L207 102 L207 62 C207 45 218 34 233 36 C248 38 256 51 254 68 L250 120 L252 94 C255 78 266 69 279 74 C292 79 297 94 292 111 L273 196 C262 251 224 285 171 291 C130 296 100 293 82 284 Z';
const handThumbPath = 'M82 201 C60 176 34 164 21 178 C10 191 20 216 51 238 L79 260';
const handPalmPath = 'M102 210 C120 240 153 253 191 247 C229 241 258 216 270 180';
</script>

<template>
  <div class="flex-1 w-full flex items-center justify-center absolute inset-0 z-50 bg-gray-50/80 backdrop-blur-sm sm:relative sm:z-auto sm:bg-transparent sm:backdrop-blur-none sm:py-4">
    <div class="flex flex-col h-full sm:h-[800px] sm:max-h-[85vh] w-full max-w-none sm:max-w-[400px] mx-auto bg-white relative overflow-hidden sm:border sm:border-gray-200 sm:rounded-[40px] sm:shadow-2xl">
      <ConsumerChat v-if="showChat" @start-try-on="startTryOn" />

      <div v-else class="flex flex-col h-full w-full bg-[#f8f9fa] overflow-hidden">
        <div class="w-full bg-white px-4 pt-4 pb-4 border-b border-gray-100 shrink-0 shadow-sm z-10 relative">
          <button
            v-if="historyItems.length"
            type="button"
            class="absolute right-4 top-4 rounded-full border border-[#FFD100]/45 bg-[#FFFBE7] px-3 py-1 text-[11px] font-semibold text-[#8C6A00] transition hover:bg-[#FFF4B5]"
            @click="showHistoryPanel = !showHistoryPanel"
          >
            历史试戴
          </button>

          <div class="flex items-center mb-4">
            <button type="button" class="p-1.5 rounded-full hover:bg-gray-100 transition-colors shrink-0" @click="showChat = true">
              <ChevronLeft class="w-5 h-5 text-gray-700" />
            </button>
            <div class="flex-1 text-center font-semibold text-gray-800 text-sm mr-8">
              {{ steps[stepperIndex].title }}
            </div>
          </div>

          <button
            v-if="pendingTryOnCount > 0 && stepperIndex !== 3"
            type="button"
            class="mb-4 flex w-full items-start justify-between gap-3 rounded-2xl border border-[#FFD100]/35 bg-[#FFFBEA] px-3.5 py-3 text-left text-sm text-[#8C6A00] transition hover:bg-[#FFF7D2]"
            @click="jumpToGeneratingTryOn"
          >
            <p class="leading-relaxed">{{ pendingTryOnBannerText }}</p>
            <span class="shrink-0 rounded-full bg-white/80 px-2 py-1 text-[11px] font-semibold text-[#8C6A00] shadow-sm">去查看</span>
          </button>

          <div
            v-else-if="backgroundTryOnNotice"
            class="mb-4 flex items-start justify-between gap-3 rounded-2xl border border-[#FFD100]/35 bg-[#FFFBEA] px-3.5 py-3 text-sm text-[#8C6A00]"
          >
            <p class="leading-relaxed">{{ backgroundTryOnNotice }}</p>
            <button
              type="button"
              class="shrink-0 text-xs font-semibold text-[#8C6A00]/70 transition hover:text-[#8C6A00]"
              @click="dismissBackgroundTryOnNotice"
            >
              知道了
            </button>
          </div>

          <div
            v-if="showHistoryPanel && historyItems.length"
            class="absolute right-4 top-14 z-30 w-[248px] overflow-hidden rounded-[22px] border border-[#FFD100]/30 bg-white shadow-[0_18px_40px_rgba(15,23,42,0.14)]"
          >
            <div class="flex items-center justify-between border-b border-gray-100 px-4 py-3">
              <span class="text-sm font-semibold text-gray-900">最近试戴</span>
              <button type="button" class="text-[11px] font-medium text-gray-400 transition hover:text-gray-600" @click="showHistoryPanel = false">
                收起
              </button>
            </div>
            <div class="max-h-[280px] overflow-y-auto px-3 py-3">
              <button
                v-for="item in historyItems"
                :key="item.id"
                type="button"
                class="mb-2 flex w-full items-center gap-3 rounded-2xl border border-gray-100 bg-[#FCFCFD] p-2.5 text-left transition hover:border-[#FFD100]/60 hover:bg-[#FFFDF5]"
                @click="restoreHistoryItem(item)"
              >
                <img :src="item.result.resultUrl" :alt="item.styleName" class="h-14 w-14 rounded-xl object-cover bg-gray-100">
                <div class="min-w-0 flex-1">
                  <div class="truncate text-sm font-semibold text-gray-900">{{ item.styleName }}</div>
                  <div class="mt-1 text-xs text-gray-500">{{ formatHistoryTime(item.createdAt) }}</div>
                  <div class="mt-1 text-xs font-medium text-[#8C6A00]">适配 {{ item.result.score }} 分</div>
                </div>
              </button>
            </div>
          </div>

          <div class="flex items-center justify-between relative px-4">
            <div class="absolute left-6 right-6 top-1/2 h-[2px] bg-gray-100 -z-10" />
            <div
              class="absolute left-6 top-1/2 h-[2px] bg-[#FFD100] transition-all duration-500 -z-10"
              :style="{width: `calc(${(stepperIndex / (steps.length - 1)) * 100}% - 48px)`}"
            />
            <div
              v-for="(step, index) in steps"
              :key="step.title"
              class="flex flex-col items-center gap-1.5 bg-white px-1"
            >
              <div
                :class="cn(
                  'w-6 h-6 rounded-full flex items-center justify-center font-bold text-[11px] transition-colors duration-300 shadow-sm border-2',
                  index < stepperIndex
                    ? 'bg-[#FFD100] text-gray-900 border-[#FFD100]'
                    : index === stepperIndex
                      ? 'bg-white text-[#FFD100] border-[#FFD100]'
                      : 'bg-white text-gray-300 border-gray-200',
                )"
              >
                <Check v-if="index < stepperIndex" class="w-3.5 h-3.5" />
                <span v-else>{{ index + 1 }}</span>
              </div>
            </div>
          </div>
        </div>

        <el-scrollbar class="consumer-step-scroll flex-1">
          <Transition name="step-slide" mode="out-in">
            <div :key="stepperIndex" class="min-h-full h-full flex flex-col p-4 sm:p-5 w-full bg-white">
              <div v-if="stepperIndex === 0" class="flex flex-col h-full bg-white">
                <div class="mb-8">
                  <h2 class="text-2xl font-bold text-gray-900 mb-2">告诉我们你的偏好</h2>
                  <p class="text-gray-500">AI 将根据你的场景、预算、款式风格推荐最适合你的美甲</p>
                </div>

                <div class="space-y-8 flex-1">
                  <div>
                    <h3 class="text-sm font-semibold text-gray-900 mb-4 uppercase tracking-wider">选择场景</h3>
                    <div class="flex flex-wrap gap-3">
                      <button
                        v-for="scene in ['通勤', '约会', '婚礼', '旅行', '日常']"
                        :key="scene"
                        type="button"
                        :class="cn(
                          'px-6 py-2.5 rounded-full text-sm font-medium transition-all',
                          preferences.scene === scene ? 'bg-[#FFD100] text-gray-900 shadow-md' : 'bg-gray-50 text-gray-600 hover:bg-gray-100',
                        )"
                        @click="userStore.setPreferences({scene})"
                      >
                        {{ scene }}
                      </button>
                    </div>
                  </div>

                  <div>
                    <h3 class="text-sm font-semibold text-gray-900 mb-4 uppercase tracking-wider">选择预算</h3>
                    <div class="flex flex-wrap gap-3">
                      <button
                        v-for="budget in ['100以下', '100-200', '200+']"
                        :key="budget"
                        type="button"
                        :class="cn(
                          'px-6 py-2.5 rounded-full text-sm font-medium transition-all',
                          preferences.budget === budget ? 'bg-[#FFD100] text-gray-900 shadow-md' : 'bg-gray-50 text-gray-600 hover:bg-gray-100',
                        )"
                        @click="userStore.setPreferences({budget})"
                      >
                        {{ budget }}
                      </button>
                    </div>
                  </div>

                  <div>
                    <h3 class="text-sm font-semibold text-gray-900 mb-4 uppercase tracking-wider">风格偏好</h3>
                    <div class="flex flex-wrap gap-3">
                      <button
                        v-for="style in ['显白', '温柔', '简约', '高级感', '个性', '低饱和']"
                        :key="style"
                        type="button"
                        :class="cn(
                          'px-6 py-2.5 rounded-full text-sm font-medium transition-all',
                          preferences.style === style ? 'bg-[#FFD100] text-gray-900 shadow-md' : 'bg-gray-50 text-gray-600 hover:bg-gray-100',
                        )"
                        @click="userStore.setPreferences({style})"
                      >
                        {{ style }}
                      </button>
                    </div>
                  </div>
                </div>

                <div class="mt-8 flex justify-end">
                  <button
                    type="button"
                    :disabled="!isPreferenceComplete()"
                    class="bg-gray-900 text-white px-8 py-3 rounded-xl font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-800 transition-colors shadow-lg"
                    @click="tryOnStore.setStepperIndex(1)"
                  >
                    下一步
                  </button>
                </div>
              </div>

              <div v-else-if="stepperIndex === 1" class="flex flex-col h-full">
                <div class="mb-8">
                  <h2 class="text-2xl font-bold text-gray-900 mb-2">上传手部照片</h2>
                  <p class="text-gray-500">为了更精准地分析肤色与手型，请上传一张光线明亮的手部照片</p>
                </div>

                <div class="mb-5 rounded-2xl bg-[#FFFDF7] border border-[#FFD100]/30 p-1 shadow-sm">
                  <div class="grid grid-cols-2 gap-1">
                    <button
                      v-for="option in uploadModeOptions"
                      :key="option.key"
                      type="button"
                      :class="cn(
                        'flex items-center justify-center gap-2 rounded-[14px] px-4 py-2.5 text-sm font-semibold transition-all',
                        captureMode === option.key
                          ? 'bg-[#FFD100] text-gray-900 shadow-[0_8px_20px_rgba(255,209,0,0.22)]'
                          : 'text-gray-500 hover:bg-white/70',
                      )"
                      @click="selectCaptureMode(option.key)"
                    >
                      <component :is="option.icon" class="w-4 h-4" />
                      {{ option.label }}
                    </button>
                  </div>
                </div>
                <input
                  ref="fileInputRef"
                  class="hidden"
                  type="file"
                  accept="image/*"
                  @change="handleFileSelected"
                >

                <div class="flex-1 flex flex-col items-center justify-center min-h-0 py-4">
                  <div
                    v-if="handQualityError"
                    class="mb-3 w-full max-w-md rounded-2xl border border-[#FFB4A8] bg-[#FFF1EF] px-4 py-3 text-sm text-[#A73520] shadow-sm"
                  >
                    <p class="font-semibold">手图不适合试戴</p>
                    <p class="mt-1 leading-relaxed">{{ handQualityError }}</p>
                    <p class="mt-1 text-xs text-[#A73520]/75">请手背朝上、五指自然张开，完整露出所有指尖后重新上传。</p>
                  </div>

                  <template v-if="!uploadedImageUrl">
                    <div
                      :class="cn(
                        'upload-stage w-full max-w-md aspect-[4/3] rounded-[28px] overflow-hidden relative transition-colors group',
                        captureMode === 'camera'
                          ? 'bg-[radial-gradient(circle_at_top,#293248,#111827_65%)] border border-[#FFD100]/25 shadow-[0_18px_50px_rgba(17,24,39,0.32)]'
                          : 'border-2 border-dashed border-[#FFD100] bg-[#FFFDF7] hover:bg-[#FFF8D6]',
                      )"
                      @click="captureMode === 'camera' ? handleCapture() : handleUpload()"
                    >
                      <div :class="cn('absolute inset-0', captureMode === 'camera' ? 'opacity-100' : 'opacity-0')">
                        <video
                          v-if="captureMode === 'camera'"
                          ref="videoRef"
                          class="absolute inset-0 h-full w-full object-cover opacity-80"
                          autoplay
                          playsinline
                          muted
                        />
                        <div
                          v-if="captureMode === 'camera' && !cameraStream"
                          class="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,209,0,0.12),rgba(17,24,39,0.92)_62%)]"
                        />
                        <div class="absolute inset-0 bg-[linear-gradient(rgba(255,209,0,0.08)_1px,transparent_1px),linear-gradient(90deg,rgba(255,209,0,0.08)_1px,transparent_1px)] bg-[size:22px_22px]" />
                        <div class="absolute top-5 left-5 right-5 flex items-center justify-between text-[11px] font-mono tracking-[0.16em] text-[#FFE27A]">
                          <span>HAND FRAME</span>
                          <span class="flex items-center gap-2">
                            <span :class="cn('w-2 h-2 rounded-full shadow-[0_0_12px_rgba(255,90,84,0.8)]', cameraStream ? 'bg-[#FF5A54]' : 'bg-[#FFD100]')" />
                            {{ cameraStream ? 'REC' : 'READY' }}
                          </span>
                        </div>
                      </div>

                      <div v-if="captureMode === 'camera'" class="absolute inset-4 rounded-[24px] border border-white/10 pointer-events-none" />
                      <svg
                        v-if="captureMode === 'camera'"
                        class="hand-outline pointer-events-none absolute left-1/2 top-[48%] h-[84%] w-[70%] max-w-[230px] -translate-x-1/2 -translate-y-1/2"
                        viewBox="0 0 310 310"
                        aria-hidden="true"
                      >
                        <path class="hand-outline-fill" :d="handGuidePath" />
                        <path class="hand-outline-main" :d="handGuidePath" />
                        <path class="hand-outline-main" :d="handThumbPath" />
                        <path class="hand-outline-soft" :d="handPalmPath" />
                        <path class="hand-outline-soft" d="M130 86 L131 205" />
                        <path class="hand-outline-soft" d="M181 38 L181 211" />
                        <path class="hand-outline-soft" d="M232 58 L226 210" />
                        <path class="hand-outline-soft" d="M279 95 L260 205" />
                        <circle class="hand-outline-target" cx="176" cy="226" r="22" />
                        <path class="hand-outline-soft" d="M176 194 L176 258 M143 226 L209 226" />
                      </svg>

                      <div
                        :class="cn(
                          'relative z-10 flex h-full flex-col px-6 text-center',
                          captureMode === 'camera' ? 'items-center justify-end pb-5' : 'items-center justify-center',
                        )"
                      >
                        <div
                          :class="cn(
                            'space-y-1.5 rounded-2xl px-4 backdrop-blur-sm',
                            captureMode === 'camera' ? 'bg-black/42 py-2 text-xs' : 'bg-transparent py-3 shadow-none',
                          )"
                        >
                          <div
                            :class="cn(
                              'mx-auto flex items-center justify-center transition-transform group-hover:scale-110',
                              captureMode === 'camera' ? 'text-[#FFD100]' : 'text-[#B89600]',
                            )"
                          >
                            <Camera v-if="captureMode === 'camera'" class="w-6 h-6" />
                            <Upload v-else class="w-8 h-8" />
                          </div>

                          <p :class="cn('font-semibold', captureMode === 'camera' ? 'text-white text-sm' : 'text-gray-900')">
                            {{ captureMode === 'camera' ? (cameraStream ? '点击快门拍摄' : '点击开启系统相机') : '点击上传或拖拽图片' }}
                          </p>
                          <p :class="cn(captureMode === 'camera' ? 'text-white/70 text-xs' : 'text-sm text-gray-500')">
                            {{ cameraError || overlayHint() }}
                          </p>
                          <p :class="cn('text-xs', captureMode === 'camera' ? 'text-[#FFE27A]/80' : 'text-gray-400')">
                            {{ captureMode === 'camera' ? (isCameraStarting ? '正在请求摄像头权限...' : '拍摄时请露出完整指尖与掌缘') : '支持 JPG, PNG 格式' }}
                          </p>
                        </div>

                        <div
                          v-if="captureMode === 'camera'"
                          :class="cn(
                            'pointer-events-none absolute top-5 left-1/2 -translate-x-1/2 rounded-full px-4 py-1.5 text-[11px] font-medium tracking-[0.12em]',
                            captureMode === 'camera'
                              ? 'bg-black/35 text-[#FFE27A] border border-[#FFD100]/35'
                              : 'bg-white/70 text-[#8C6A00] border border-[#FFD100]/25',
                          )"
                        >
                          对齐手指轮廓
                        </div>
                      </div>
                    </div>

                    <div v-if="captureMode === 'upload'" class="mt-3 flex w-full max-w-md flex-col items-center">
                      <button
                        type="button"
                        class="rounded-full border border-[#FFD100]/70 bg-white px-4 py-2 text-xs font-semibold text-[#8C6A00] shadow-sm transition hover:bg-[#FFD100] hover:text-gray-900"
                        @click.stop="showDemoHandList = !showDemoHandList"
                      >
                        {{ showDemoHandList ? '收起测试数据' : '使用测试数据' }}
                      </button>

                      <div
                        v-if="showDemoHandList"
                        class="mt-3 w-full rounded-2xl border border-[#FFD100]/25 bg-[#111827] p-3 shadow-[0_12px_30px_rgba(17,24,39,0.16)]"
                      >
                        <div class="mb-2 flex items-center justify-between">
                          <span class="text-xs font-semibold text-white/95">选择测试手图</span>
                          <span class="text-[10px] text-white/55 font-mono">DEMO_HAND_SET</span>
                        </div>
                        <div class="grid grid-cols-5 gap-2">
                          <button
                            v-for="(url, index) in demoHandImages"
                            :key="url"
                            type="button"
                            class="group/thumb relative aspect-square overflow-hidden rounded-xl border border-white/20 bg-white/10 transition-all hover:scale-[1.04] hover:border-[#FFD100] hover:shadow-[0_0_0_2px_rgba(255,209,0,0.25)]"
                            @click.stop="selectDemoHandImage(url)"
                          >
                            <img :src="url" :alt="`测试手图 ${index + 1}`" class="h-full w-full object-cover">
                            <span class="absolute left-1.5 top-1.5 rounded-full bg-black/50 px-1.5 py-0.5 text-[9px] font-mono text-white/85 backdrop-blur-sm">
                              {{ String(index + 1).padStart(2, '0') }}
                            </span>
                          </button>
                        </div>
                      </div>
                    </div>
                  </template>

                  <div v-else class="w-full max-w-md aspect-[4/3] rounded-[28px] overflow-hidden relative shadow-lg border border-gray-200 bg-gray-950/5">
                    <img :src="uploadedImageUrl" alt="Uploaded Hand" class="w-full h-full object-contain">
                    <div
                      v-if="handQualityChecking"
                      class="absolute inset-0 z-20 flex flex-col items-center justify-center bg-black/55 text-white backdrop-blur-sm"
                    >
                      <Sparkles class="mb-3 h-7 w-7 animate-pulse text-[#FFD100]" />
                      <p class="text-sm font-semibold">AI 正在检查手指是否张开</p>
                      <p class="mt-1 text-xs text-white/70">请稍等，检查通过后才能继续试戴</p>
                    </div>
                    <div v-if="captureMode === 'camera'" class="hand-preview-mask absolute inset-0 pointer-events-none">
                      <div class="absolute inset-0 bg-[linear-gradient(to_bottom,rgba(0,0,0,0.04),rgba(0,0,0,0.28))]" />
                      <svg
                        class="hand-outline hand-outline-preview absolute left-1/2 top-[50%] h-[80%] w-[62%] -translate-x-1/2 -translate-y-1/2"
                        viewBox="0 0 310 310"
                        aria-hidden="true"
                      >
                        <path class="hand-outline-fill" :d="handGuidePath" />
                        <path class="hand-outline-main" :d="handGuidePath" />
                        <path class="hand-outline-main" :d="handThumbPath" />
                        <path class="hand-outline-soft" :d="handPalmPath" />
                        <path class="hand-outline-soft" d="M130 86 L131 205" />
                        <path class="hand-outline-soft" d="M181 38 L181 211" />
                        <path class="hand-outline-soft" d="M232 58 L226 210" />
                        <path class="hand-outline-soft" d="M279 95 L260 205" />
                        <circle class="hand-outline-target" cx="176" cy="226" r="22" />
                        <path class="hand-outline-soft" d="M176 194 L176 258 M143 226 L209 226" />
                      </svg>
                      <div class="absolute left-1/2 bottom-4 -translate-x-1/2 rounded-full bg-black/45 text-white text-[11px] px-4 py-1.5 border border-white/20 backdrop-blur-sm">
                        已对齐手指轮廓
                      </div>
                    </div>
                    <div class="absolute inset-0 bg-black/40 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center">
                      <div class="flex items-center gap-3">
                        <button
                          type="button"
                          class="bg-white/90 text-gray-900 px-4 py-2 rounded-lg font-medium flex items-center gap-2 hover:bg-white"
                          @click="handleUpload"
                        >
                          <Upload class="w-4 h-4" /> 重新上传
                        </button>
                        <button
                          type="button"
                          class="bg-[#111827]/80 text-white px-4 py-2 rounded-lg font-medium flex items-center gap-2 border border-white/15 hover:bg-[#111827]"
                          @click="handleRetake"
                        >
                          <Camera class="w-4 h-4" /> 重新拍摄
                        </button>
                      </div>
                    </div>
                    <div class="absolute top-4 left-4 rounded-full bg-white/90 backdrop-blur-sm text-gray-800 text-[11px] px-3 py-1.5 border border-white/60 shadow-sm">
                      {{ captureMode === 'camera' ? '拍摄结果' : '上传结果' }}
                    </div>
                  </div>
                </div>

                <div class="mt-auto pt-6 flex justify-between">
                  <button type="button" class="px-8 py-3 rounded-xl font-medium text-gray-600 hover:bg-gray-100 transition-colors" @click="tryOnStore.setStepperIndex(0)">
                    上一步
                  </button>
                  <button
                    type="button"
                    :disabled="!uploadedImageUrl || handQualityChecking"
                    class="bg-gray-900 text-white px-8 py-3 rounded-xl font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-800 transition-colors shadow-lg"
                    @click="tryOnStore.setStepperIndex(2)"
                  >
                    下一步
                  </button>
                </div>
              </div>

              <div v-else-if="stepperIndex === 2" class="flex flex-col h-full min-h-0">
                <div class="mb-4 flex justify-between items-end">
                  <div>
                    <h2 class="text-xl font-bold text-gray-900 mb-1">挑选心仪款式</h2>
                    <p class="text-sm text-gray-500">选择一款喜欢的美甲，小团生成试戴效果</p>
                  </div>
                </div>

                <div ref="styleListRef" class="flex-1 min-h-0 overflow-y-auto bg-white pr-1 scroll-smooth">
                  <div
                    v-for="style in styles"
                    :key="style.id"
                    :data-style-id="style.id"
                    :class="cn(
                      'group cursor-pointer transition-all flex items-stretch gap-2.5 rounded-xl border px-2.5 py-2.5 mb-2 last:mb-0',
                      selectedStyleId === style.id
                        ? 'bg-[#FFF9D8] border-[#FFD100] shadow-[0_8px_18px_rgba(255,209,0,0.14)]'
                        : 'bg-white border-gray-100 hover:bg-[#FFFDF3] hover:border-[#FFD100]/70',
                      focusedStyleId === style.id && 'ring-4 ring-[#FFD100]/30 shadow-[0_0_0_8px_rgba(255,209,0,0.10),0_16px_32px_rgba(255,209,0,0.18)]',
                    )"
                    @click="selectStyle(style.id, 'catalog')"
                  >
                    <div class="pt-7 flex items-start justify-center shrink-0">
                      <div
                        :class="cn(
                          'w-[20px] h-[20px] rounded-full border-2 flex items-center justify-center transition-all',
                          selectedStyleId === style.id
                            ? 'bg-white border-[#FFD100] shadow-[0_0_0_4px_rgba(255,209,0,0.18)]'
                            : 'bg-white border-gray-300 group-hover:border-[#FFD100]',
                        )"
                      >
                        <span
                          :class="cn(
                            'rounded-full transition-all',
                            selectedStyleId === style.id ? 'w-[10px] h-[10px] bg-[#FFD100]' : 'w-0 h-0 bg-transparent',
                          )"
                        />
                      </div>
                    </div>

                    <div class="w-[78px] h-[78px] shrink-0 rounded-lg overflow-hidden relative bg-gray-100">
                      <img :src="style.img" :alt="style.name" class="w-full h-full object-cover">
                    </div>

                    <div class="min-w-0 flex-1 flex flex-col justify-between py-0.5">
                      <div class="min-w-0">
                        <div class="flex items-start justify-between gap-2">
                          <h3 class="min-w-0 flex-1 text-[15px] font-semibold leading-[1.22] text-gray-950 line-clamp-2">
                            <span
                              v-for="(part, keywordIndex) in splitMeituanKeyword(getStyleListingTitle(style))"
                              :key="`${style.id}-${keywordIndex}-${part}`"
                              :class="part === '美甲' ? 'text-[#F04B23]' : ''"
                            >{{ part }}</span>
                          </h3>
                          <span class="shrink-0 pt-0.5 text-[11px] text-gray-400">年售{{ getStyleSales(style) }}</span>
                        </div>

                        <p class="mt-0.5 truncate text-[12px] leading-4 text-gray-500">
                          {{ style.tags.join('、') }}<span class="mx-1 text-gray-300">|</span>手部
                        </p>
                      </div>

                      <div class="mt-2 flex items-end gap-1.5">
                        <span class="text-[21px] font-black leading-none text-[#F33416] tracking-normal"><span class="text-[13px] font-black">¥</span>{{ getStylePrice(style.price) }}</span>
                        <span class="rounded bg-[#FFF2EF] px-1 py-0.5 text-[10px] font-medium text-[#F04B23]">{{ getStyleDiscount(style) }}</span>
                        <span class="pb-0.5 text-[12px] text-gray-400 line-through">¥{{ getStyleOriginalPrice(style) }}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div class="mt-3 pt-3 border-t border-gray-100 flex justify-between">
                  <button type="button" class="px-8 py-3 rounded-xl font-medium text-gray-600 hover:bg-gray-100 transition-colors" @click="tryOnStore.setStepperIndex(1)">
                    上一步
                  </button>
                  <button
                    type="button"
                    :disabled="!selectedStyleId"
                    class="flex items-center gap-2 bg-gradient-to-r from-gray-900 to-gray-800 text-white px-8 py-3 rounded-xl font-medium disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
                    @click="tryOnStore.setStepperIndex(3)"
                  >
                    <Sparkles class="w-4 h-4 text-[#FFD100]" /> 开始 AI 试戴
                  </button>
                </div>
              </div>

              <div v-else-if="stepperIndex === 3" class="flex flex-col h-full">
                <div v-if="loadingStep < 4" class="h-full flex flex-col items-center justify-center space-y-6">
                  <div class="relative">
                    <div class="nail-loader-shell">
                      <div class="nail-loader-core">
                        <div
                          class="nail-loader-fill"
                          :style="{height: `${Math.max(generationProgress, 8)}%`}"
                        />
                        <div class="nail-loader-gloss" />
                        <div class="nail-loader-cuticle" />
                      </div>
                    </div>
                    <div class="pointer-events-none absolute -right-3 -top-3 flex h-10 w-10 items-center justify-center rounded-full bg-white/88 shadow-[0_10px_24px_rgba(157,140,255,0.18)] backdrop-blur-sm">
                      <Sparkles class="h-4 w-4 text-[#FF7AC8]" />
                    </div>
                  </div>
                  <div class="w-full max-w-xs space-y-3 text-center">
                    <p class="text-lg font-medium text-gray-700">{{ tryOnStatusMessage || loadingTexts[loadingStep] }}</p>
                    <div class="flex items-center justify-between text-[11px] font-mono tracking-[0.12em] text-gray-400">
                      <span>TRY-ON PIPELINE</span>
                      <span>{{ generationProgress }}%</span>
                    </div>
                    <button
                      type="button"
                      class="mx-auto inline-flex rounded-full border border-gray-200 px-4 py-2 text-xs font-semibold text-gray-500 transition hover:border-[#FFD100]/60 hover:bg-[#FFFDF3] hover:text-gray-700"
                      @click="leaveTryOnToBackground"
                    >
                      返回并后台继续生成
                    </button>
                  </div>
                </div>

                <template v-else>
                  <div class="mb-5 flex items-end justify-between gap-3">
                    <h2 class="text-2xl font-bold text-gray-900">AI 试戴效果</h2>
                    <div class="text-right">
                      <span class="block text-[10px] font-medium uppercase tracking-[0.16em] text-gray-400">MATCH SCORE</span>
                      <span class="text-3xl font-extrabold leading-none text-transparent bg-clip-text bg-[linear-gradient(135deg,#FFF34A_0%,#FF7AC8_36%,#9D8CFF_62%,#35DDEB_100%)]">{{ tryOnResult?.score }}分</span>
                      <span class="mt-1 block text-[10px] text-gray-400">动态适配分</span>
                    </div>
                  </div>

                  <div class="grid gap-5">
                    <div class="relative overflow-hidden rounded-[24px] border border-[#FFD100]/80 bg-[#FFF9D8] p-2 shadow-[0_16px_40px_rgba(255,209,0,0.16)]">
                      <img :src="tryOnResult?.resultUrl" class="w-full max-h-[430px] object-contain rounded-[18px] bg-white" alt="AI Try On Result">
                      <div class="absolute left-5 top-5 flex items-center gap-1.5 rounded-full bg-black/55 px-3 py-1.5 text-xs font-medium text-white backdrop-blur-sm">
                        <Sparkles class="w-3.5 h-3.5 text-[#FFD100]" />
                        {{ tryOnBadgeText }}
                      </div>
                    </div>

                    <div class="bg-gray-50 rounded-2xl p-5 flex flex-col">
                      <div class="mb-5 pb-5 border-b border-gray-200">
                        <h3 class="text-sm font-semibold text-gray-900 mb-3 px-1">你的手部密码</h3>
                        <div class="grid grid-cols-3 gap-2">
                          <div class="bg-white p-2.5 rounded-xl text-center shadow-sm">
                            <span class="block text-2xl mb-1">🎨</span>
                            <span class="text-xs text-gray-500 block mb-1">肤色</span>
                            <span class="text-[12px] font-semibold text-gray-900">{{ analysisResult?.skinTone }}</span>
                          </div>
                          <div class="bg-white p-2.5 rounded-xl text-center shadow-sm">
                            <span class="block text-2xl mb-1">🖐️</span>
                            <span class="text-xs text-gray-500 block mb-1">手型</span>
                            <span class="text-[12px] font-semibold text-gray-900">{{ analysisResult?.handShape }}</span>
                          </div>
                          <div class="bg-white p-2.5 rounded-xl text-center shadow-sm">
                            <span class="block text-2xl mb-1">💅</span>
                            <span class="text-xs text-gray-500 block mb-1">甲床</span>
                            <span class="text-[12px] font-semibold text-gray-900">{{ analysisResult?.nailBed }}</span>
                          </div>
                        </div>
                      </div>

                      <div class="mb-5 grid grid-cols-3 gap-2.5">
                        <div class="rounded-2xl bg-white p-3 shadow-sm">
                          <span class="block text-[11px] text-gray-400">整体美观</span>
                          <span class="mt-1 block text-xl font-black text-gray-900">{{ tryOnResult?.scoreBreakdown?.fitScore ?? tryOnResult?.score }}</span>
                        </div>
                        <div class="rounded-2xl bg-white p-3 shadow-sm">
                          <span class="block text-[11px] text-gray-400">肤色映衬</span>
                          <span class="mt-1 block text-xl font-black text-gray-900">{{ tryOnResult?.scoreBreakdown?.brightenScore ?? tryOnResult?.score }}</span>
                        </div>
                        <div class="rounded-2xl bg-white p-3 shadow-sm">
                          <span class="block text-[11px] text-gray-400">气质适配</span>
                          <span class="mt-1 block text-xl font-black text-gray-900">{{ tryOnResult?.scoreBreakdown?.styleMatchScore ?? tryOnResult?.score }}</span>
                        </div>
                      </div>

                      <div class="mb-1">
                        <div class="flex items-end justify-between mb-2">
                          <h3 class="text-sm font-semibold text-gray-900 flex items-center gap-1"><Sparkles class="w-4 h-4 text-[#8B8CF6]" /> AI 审美复评</h3>
                          <span class="text-xs font-medium text-gray-400">{{ tryOnResult?.score }} / 100</span>
                        </div>
                        <div class="w-full bg-gray-200 rounded-full h-2 mb-4">
                          <div class="bg-[linear-gradient(90deg,#FFF34A_0%,#FF7AC8_36%,#9D8CFF_62%,#35DDEB_100%)] h-2 rounded-full shadow-[0_0_12px_rgba(120,220,235,0.35)]" :style="{width: `${tryOnResult?.score ?? 0}%`}" />
                        </div>
                        <ul class="space-y-2">
                          <li v-for="(item, index) in tryOnResult?.explanation ?? []" :key="index" class="text-sm text-gray-600 flex items-start gap-2">
                            <div class="w-1.5 h-1.5 rounded-full bg-[#9D8CFF] mt-1.5 shrink-0 shadow-[0_0_8px_rgba(157,140,255,0.45)]" />
                            {{ item }}
                          </li>
                        </ul>
                      </div>
                    </div>
                  </div>

                  <div class="mt-5 flex items-center justify-between border-t border-gray-100 pt-4">
                    <button type="button" class="px-6 py-2.5 rounded-xl font-medium text-gray-600 hover:bg-gray-100 transition-colors" @click="tryOnStore.setStepperIndex(2)">
                      换个款式
                    </button>
                    <button
                      type="button"
                      class="flex items-center gap-2 bg-gray-900 text-white px-8 py-3 rounded-xl font-medium transition-transform hover:scale-105 shadow-lg"
                      @click="tryOnStore.setStepperIndex(4)"
                    >
                      智能推荐&amp;预约 <ChevronRight class="w-5 h-5" />
                    </button>
                  </div>
                </template>
              </div>

              <div v-else class="flex flex-col h-full min-h-0">
                <div v-if="success" class="h-full flex flex-col items-center justify-center space-y-4">
                  <div class="w-20 h-20 bg-green-100 text-green-500 rounded-full flex items-center justify-center">
                    <Check class="w-10 h-10" />
                  </div>
                  <h2 class="text-2xl font-bold text-gray-900">预约成功！</h2>
                  <p class="text-gray-500">本次为 Demo 模拟预约，不产生真实订单。</p>
                  <button type="button" class="mt-6 text-[#B89600] font-medium hover:underline" @click="goToHome">返回首页</button>
                </div>

                <template v-else>
                  <div class="flex-1 min-h-0 overflow-y-auto pr-1">
                    <div class="mb-4 rounded-[28px] border border-[#FFD100]/30 bg-[linear-gradient(180deg,#FFFDF3_0%,#FFFFFF_100%)] px-5 py-5 shadow-[0_14px_34px_rgba(255,209,0,0.10)]">
                      <div class="flex items-start justify-between gap-3">
                        <div class="min-w-0">
                          <p class="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#B89600]">SMART MATCH</p>
                          <h2 class="mt-2 text-[25px] font-black leading-tight text-gray-950">智能推荐&amp;预约</h2>
                        </div>
                        <div class="shrink-0 rounded-2xl bg-white px-3 py-2 text-right shadow-sm">
                          <span class="block text-[10px] font-medium uppercase tracking-[0.14em] text-gray-400">Top Pick</span>
                          <span class="mt-1 block text-lg font-black text-gray-900">{{ topRecommendation?.score ?? tryOnResult?.score }}分</span>
                        </div>
                      </div>

                      <div class="mt-4 rounded-2xl border border-white/80 bg-white/90 px-4 py-3 shadow-sm">
                        <p class="text-sm leading-7 text-gray-600">
                          <span class="font-semibold text-gray-900">{{ topRecommendation?.name ?? '这组推荐' }}</span>
                          <span class="mx-1 text-[#B89600]">更衬你</span>
                          <span>小团综合了这次试戴效果、肤色映衬和手型气质，优先帮你挑了几款上手更顺眼、也更容易显手白的选择。</span>
                        </p>
                      </div>
                    </div>

                    <div class="space-y-3.5">
                      <div
                        v-for="rec in recommendationsList()"
                        :key="rec.id"
                        class="rounded-[26px] border border-[#FFE9A6] bg-white p-3 shadow-[0_10px_26px_rgba(15,23,42,0.06)] transition-all hover:border-[#FFD100]/70 hover:shadow-[0_14px_30px_rgba(255,209,0,0.12)]"
                      >
                        <div class="flex gap-3.5">
                          <img :src="rec.img" class="h-[90px] w-[90px] rounded-[20px] border border-gray-100 object-cover shadow-sm shrink-0" :alt="rec.name">
                          <div class="min-w-0 flex-1">
                            <div class="flex items-start justify-between gap-3">
                              <div class="min-w-0">
                                <div class="flex items-center gap-2">
                                  <span class="rounded-full bg-[#FFF5C7] px-2 py-1 text-[10px] font-bold uppercase tracking-[0.14em] text-[#A77A00]">
                                    {{ rec === topRecommendation ? 'AI 首推' : '候选推荐' }}
                                  </span>
                                  <span class="text-[11px] text-gray-400">适配 {{ rec.score }} 分</span>
                                </div>
                                <h3 class="mt-2 text-[18px] font-black leading-[1.25] text-gray-950">{{ rec.name }}</h3>
                              </div>

                              <div class="shrink-0 rounded-2xl border border-[#FFD100]/35 bg-[#FFFBE5] px-3 py-2 text-center shadow-sm">
                                <span class="block text-[10px] uppercase tracking-[0.16em] text-[#B89600]">MATCH</span>
                                <span class="mt-1 block text-lg font-black text-gray-900">{{ rec.score }}</span>
                              </div>
                            </div>

                            <p class="mt-3 text-[13px] leading-6 text-gray-600">
                              {{ rec.reason }}
                            </p>

                            <div class="mt-3 flex items-center justify-between gap-3">
                              <p class="text-[12px] leading-5 text-gray-400">
                                更适合直接上手、也更容易拍出好看的试戴效果。
                              </p>
                              <button
                                type="button"
                                class="shrink-0 rounded-full border border-[#FFD100]/70 bg-[#FFF9D8] px-4 py-2 text-[12px] font-semibold text-[#8C6A00] transition hover:bg-[#FFD100] hover:text-gray-900"
                                @click="handleRecommendationTryOn(rec.id)"
                              >
                                试戴这款
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div class="relative mt-4 overflow-hidden rounded-[28px] border border-[#FFD100]/30 bg-[#FFFDF7] p-5 shadow-sm">
                      <div class="absolute right-0 top-0 h-32 w-32 rounded-bl-full bg-gradient-to-br from-[#FFD100]/18 to-transparent" />

                      <div class="relative flex flex-col gap-5">
                        <div>
                          <p class="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#B89600]">STORE READY</p>
                          <div class="mt-2 flex items-center gap-2">
                            <h3 class="text-xl font-black text-gray-950">Lisa 美甲工作室</h3>
                            <span class="flex items-center rounded-full bg-orange-100 px-2 py-1 text-[11px] font-semibold text-orange-600">
                              <Star class="mr-1 h-3 w-3 fill-current" /> 4.8
                            </span>
                          </div>
                          <p class="mt-2 text-sm leading-6 text-gray-500">
                            款式已经帮你挑好了，如果想直接到店，也可以按下面的时间模拟预约。
                          </p>
                        </div>

                        <div class="grid grid-cols-2 gap-3 text-sm">
                          <div class="rounded-2xl bg-white px-4 py-3 shadow-sm">
                            <span class="flex items-center gap-1 text-gray-400"><MapPin class="h-4 w-4" /> 距离</span>
                            <p class="mt-1 font-semibold text-gray-900">1.2km，路上很顺</p>
                          </div>
                          <div class="rounded-2xl bg-white px-4 py-3 shadow-sm">
                            <span class="flex items-center gap-1 text-gray-400"><Calendar class="h-4 w-4" /> 可约时段</span>
                            <p class="mt-1 font-semibold text-gray-900">今天 16:00 / 18:00</p>
                          </div>
                        </div>

                        <div class="flex items-center justify-between gap-4 rounded-2xl bg-white px-4 py-4 shadow-sm">
                          <div>
                            <p class="text-[12px] text-gray-400">到店体验</p>
                            <div class="mt-1 text-2xl font-black text-gray-950">129<span class="ml-1 text-sm font-normal text-gray-500">元起</span></div>
                          </div>
                          <button
                            type="button"
                            :disabled="booking"
                            class="flex min-w-[124px] items-center justify-center rounded-2xl bg-gray-900 px-6 py-3 font-medium text-[#FFD100] shadow-md transition-colors hover:bg-gray-800"
                            @click="handleBook"
                          >
                            <div v-if="booking" class="h-5 w-5 rounded-full border-2 border-[#FFD100] border-t-transparent animate-spin" />
                            <span v-else>模拟预约</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </template>
              </div>

            </div>
          </Transition>
        </el-scrollbar>
      </div>
    </div>
  </div>
</template>

<style scoped>
.nail-loader-shell {
  position: relative;
  width: 108px;
  height: 146px;
  border-radius: 52px 52px 24px 24px;
  padding: 4px;
  background: linear-gradient(180deg, rgba(255, 243, 74, 0.95) 0%, rgba(255, 122, 200, 0.8) 46%, rgba(53, 221, 235, 0.8) 100%);
  box-shadow:
    0 18px 40px rgba(255, 122, 200, 0.18),
    0 10px 24px rgba(53, 221, 235, 0.14);
}

.nail-loader-core {
  position: relative;
  height: 100%;
  overflow: hidden;
  border-radius: 48px 48px 20px 20px;
  background: linear-gradient(180deg, #fffdf7 0%, #fff7d8 100%);
  border: 1px solid rgba(255, 255, 255, 0.88);
}

.nail-loader-fill {
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  border-radius: 34px 34px 16px 16px;
  background: linear-gradient(180deg, #35ddeb 0%, #9d8cff 32%, #ff7ac8 68%, #fff34a 100%);
  box-shadow:
    inset 0 10px 18px rgba(255, 255, 255, 0.22),
    0 -10px 30px rgba(255, 122, 200, 0.18);
  transition: height 520ms cubic-bezier(0.22, 1, 0.36, 1);
}

.nail-loader-gloss {
  position: absolute;
  top: 10px;
  left: 16px;
  width: 22px;
  height: 84px;
  border-radius: 999px;
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.78) 0%, rgba(255, 255, 255, 0.06) 100%);
  transform: rotate(8deg);
  mix-blend-mode: screen;
}

.nail-loader-cuticle {
  position: absolute;
  top: 10px;
  left: 50%;
  width: 62px;
  height: 18px;
  transform: translateX(-50%);
  border-radius: 0 0 999px 999px;
  background: rgba(255, 255, 255, 0.88);
  box-shadow: 0 8px 12px rgba(255, 255, 255, 0.18);
}
</style>
