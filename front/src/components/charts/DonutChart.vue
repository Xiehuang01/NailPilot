<script setup lang="ts">
import {computed} from 'vue';
import type {SkinTonePoint} from '@/api';

const props = defineProps<{
  colors: string[];
  data: SkinTonePoint[];
}>();

const total = computed(() => props.data.reduce((sum, item) => sum + item.value, 0));

const gradient = computed(() => {
  let start = 0;
  const stops = props.data.map((item, index) => {
    const span = total.value === 0 ? 0 : (item.value / total.value) * 360;
    const color = props.colors[index % props.colors.length];
    const segment = `${color} ${start}deg ${start + span}deg`;
    start += span;
    return segment;
  });
  return `conic-gradient(${stops.join(', ')})`;
});
</script>

<template>
  <div class="h-[180px] w-full flex flex-col items-center justify-center">
    <div class="relative w-[140px] h-[140px] rounded-full" :style="{background: gradient}">
      <div class="absolute inset-[28px] rounded-full bg-white shadow-[inset_0_0_0_1px_rgba(229,231,235,1)] flex items-center justify-center">
        <div class="text-center">
          <div class="text-xs text-gray-400">用户</div>
          <div class="text-lg font-black text-gray-900">{{ total }}</div>
        </div>
      </div>
    </div>
  </div>
</template>
