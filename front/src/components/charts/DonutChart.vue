<script setup lang="ts">
import {computed, ref, watch} from 'vue';
import type {SkinTonePoint} from '@/api';

const props = defineProps<{
  colors: string[];
  data: SkinTonePoint[];
}>();

const total = computed(() => props.data.reduce((sum, item) => sum + item.value, 0));

// Animated segment values for smooth conic-gradient transition
const animatedSegments = ref<Array<{ value: number; name: string }>>(
  props.data.map((d) => ({ value: d.value, name: d.name })),
);

let rafId: number | null = null;

watch(
  () => props.data,
  (newData) => {
    if (rafId !== null) cancelAnimationFrame(rafId);

    const starts = animatedSegments.value.map((s) => s.value);
    const targets = newData.map((d) => d.value);
    const duration = 600;
    const startTime = performance.now();

    const animate = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3); // easeOutCubic

      animatedSegments.value = starts.map((from, i) => ({
        name: newData[i].name,
        value: from + (targets[i] - from) * eased,
      }));

      if (progress < 1) {
        rafId = requestAnimationFrame(animate);
      } else {
        rafId = null;
      }
    };

    rafId = requestAnimationFrame(animate);
  },
  { deep: true },
);

const gradient = computed(() => {
  const animTotal = animatedSegments.value.reduce((sum, seg) => sum + seg.value, 0);
  let start = 0;
  const stops = animatedSegments.value.map((seg, index) => {
    const span = animTotal === 0 ? 0 : (seg.value / animTotal) * 360;
    const color = props.colors[index % props.colors.length];
    const segment = `${color} ${start}deg ${start + span}deg`;
    start += span;
    return segment;
  });
  return `conic-gradient(${stops.join(', ')})`;
});

// Animated total counter
const displayTotal = ref(total.value);

watch(total, (newVal, oldVal) => {
  if (rafId === null) {
    // use a separate animation for the counter
    const startTime = performance.now();
    const from = oldVal ?? 0;
    const to = newVal;
    const duration = 600;

    const animate = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      displayTotal.value = Math.round(from + (to - from) * eased);
      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };

    requestAnimationFrame(animate);
  } else {
    displayTotal.value = newVal;
  }
});
</script>

<template>
  <div class="h-[180px] w-full flex flex-col items-center justify-center">
    <div class="relative w-[140px] h-[140px] rounded-full" :style="{background: gradient}">
      <div class="absolute inset-[28px] rounded-full bg-white shadow-[inset_0_0_0_1px_rgba(229,231,235,1)] flex items-center justify-center">
        <div class="text-center">
          <div class="text-xs text-gray-400">用户</div>
          <div class="text-lg font-black text-gray-900">{{ displayTotal }}</div>
        </div>
      </div>
    </div>
  </div>
</template>
