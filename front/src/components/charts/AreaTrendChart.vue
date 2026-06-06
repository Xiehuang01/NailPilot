<script setup lang="ts">
import {computed} from 'vue';
import type {TrendPoint} from '@/api';

const props = defineProps<{
  data: TrendPoint[];
}>();

const width = 360;
const height = 180;
const padding = 38;
const paddingRight = 20;

const values = computed(() => props.data.map((item) => item.tryOns));
const maxValue = computed(() => Math.max(...values.value, 1));
const minValue = computed(() => Math.min(...values.value, 0));

const points = computed(() =>
  props.data.map((item, index) => {
    const x = padding + (index * (width - padding - paddingRight)) / Math.max(props.data.length - 1, 1);
    const normalized = (item.tryOns - minValue.value) / Math.max(maxValue.value - minValue.value, 1);
    const y = height - padding - normalized * (height - padding * 2);
    return {...item, x, y};
  }),
);

const areaPath = computed(() => {
  if (!points.value.length) {
    return '';
  }
  const start = `M ${points.value[0].x} ${height - padding}`;
  const line = points.value.map((point, index) => `${index === 0 ? 'L' : 'L'} ${point.x} ${point.y}`).join(' ');
  const end = `L ${points.value.at(-1)?.x ?? width - paddingRight} ${height - padding} Z`;
  return `${start} ${line} ${end}`;
});

const linePath = computed(() => {
  if (!points.value.length) {
    return '';
  }
  return points.value.map((point, index) => `${index === 0 ? 'M' : 'L'} ${point.x} ${point.y}`).join(' ');
});

const yTicks = computed(() => {
  const range = maxValue.value - minValue.value;
  if (range === 0) return [{ label: `${maxValue.value}`, y: padding }];
  const ticks: Array<{ label: string; y: number }> = [];
  const tickCount = 4;
  for (let i = 0; i <= tickCount; i++) {
    const value = minValue.value + (range * i) / tickCount;
    const normalized = (value - minValue.value) / range;
    const y = height - padding - normalized * (height - padding * 2);
    ticks.push({ label: `${Math.round(value)}`, y });
  }
  return ticks;
});
</script>

<template>
  <div class="h-[200px] w-full">
    <svg :viewBox="`0 0 ${width} ${height}`" class="w-full h-full overflow-visible">
      <defs>
        <linearGradient id="trendFill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="5%" stop-color="#FFD100" stop-opacity="0.85" />
          <stop offset="95%" stop-color="#FFD100" stop-opacity="0" />
        </linearGradient>
      </defs>

      <line v-for="tick in yTicks" :key="tick.label" :x1="padding" :y1="tick.y" :x2="width - paddingRight" :y2="tick.y" stroke="#E5E7EB" stroke-width="1" />
      <text v-for="tick in yTicks" :key="'label-' + tick.label" :x="padding - 6" :y="tick.y + 4" text-anchor="end" font-size="10" fill="#9CA3AF">{{ tick.label }}</text>

      <path :d="areaPath" fill="url(#trendFill)" />
      <path :d="linePath" fill="none" stroke="#B89600" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" />

      <g v-for="point in points" :key="point.date">
        <circle :cx="point.x" :cy="point.y" r="4" fill="#FFD100" stroke="#fff" stroke-width="2" />
        <text :x="point.x" :y="height - 6" text-anchor="middle" font-size="11" fill="#9CA3AF">{{ point.date }}</text>
      </g>
    </svg>
  </div>
</template>
