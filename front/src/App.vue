<script setup lang="ts">
import {RouterView} from 'vue-router';
import AppHeader from '@/components/AppHeader.vue';
</script>

<template>
  <div class="min-h-screen bg-[#F9FAFB] text-[#1F2937] font-sans selection:bg-[#FFD100]/30 flex flex-col">
    <AppHeader />
    <div
      class="w-full bg-[#0a0a0a] text-gray-300 overflow-hidden border-y-[3px] border-[#FFD100] relative z-20 flex items-center h-10 md:h-12 shadow-[0_0_20px_rgba(255,209,0,0.15)] shrink-0"
    >
      <div
        class="absolute inset-0 opacity-[0.15]"
        style="background-image: repeating-linear-gradient(-45deg, transparent, transparent 10px, #FFD100 10px, #FFD100 20px)"
      />
      <div class="absolute inset-0 bg-gradient-to-b from-black/80 to-transparent" />
      <div class="absolute left-0 top-0 bottom-0 w-12 md:w-24 bg-gradient-to-r from-[#0a0a0a] to-transparent z-10 border-l-[6px] border-[#FFD100]" />
      <div class="absolute right-0 top-0 bottom-0 w-12 md:w-24 bg-gradient-to-l from-[#0a0a0a] to-transparent z-10 border-r-[6px] border-[#FFD100]" />

      <div class="flex animate-marquee hover:[animation-play-state:paused] items-center w-max z-20">
        <div
          v-for="block in 2"
          :key="block"
          class="flex px-12 items-center gap-12 font-tech text-base md:text-xl tracking-[0.2em] select-none uppercase whitespace-nowrap w-max opacity-90"
        >
          <template v-for="item in 6" :key="`${block}-${item}`">
            <div class="flex items-center gap-1.5 sm:gap-2">
              <span class="w-1.5 h-4 sm:w-2 sm:h-5 bg-[#FFD100] skew-x-[-15deg] animate-pulse" />
              <span class="w-1.5 h-4 sm:w-2 sm:h-5 bg-[#FFD100]/40 skew-x-[-15deg]" />
            </div>
            <span class="text-white font-black drop-shadow-[0_0_5px_rgba(255,255,255,0.5)]">PRJ_ZERO</span>
            <span class="text-[#FFD100] animate-pulse">///</span>
            <span class="text-gray-300 font-bold">MEITUAN HACKATHON</span>
            <span class="px-3 py-0.5 bg-[#FFD100] text-black skew-x-[-15deg] flex items-center justify-center border border-[#FFD100] shadow-[0_0_10px_rgba(255,209,0,0.5)]">
              <span class="skew-x-[15deg] block leading-none font-bold">TRACK_03</span>
            </span>
            <span class="text-gray-500 font-normal">SYS_STATUS:</span>
            <span class="text-[#22c55e] border border-[#22c55e]/50 px-1 rounded-sm text-sm shadow-[0_0_5px_rgba(34,197,94,0.3)]">OK</span>
          </template>
        </div>
      </div>
    </div>

    <main class="flex-1 w-full max-w-7xl mx-auto px-0 py-0 sm:px-6 sm:py-8 lg:px-8 flex flex-col relative overflow-hidden bg-transparent">
      <div
        class="absolute inset-0 pointer-events-none"
        style="background-image: linear-gradient(rgba(0,0,0,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(0,0,0,0.04) 1px, transparent 1px); background-size: 40px 40px"
      />
      <div class="absolute top-10 right-[-100px] text-[180px] font-black text-black/[0.02] leading-none pointer-events-none transform -rotate-12 italic whitespace-nowrap select-none">
        RHODES ISLAND
      </div>
      <div class="absolute bottom-6 right-6 text-gray-400 font-mono text-[10px] tracking-[0.2em] pointer-events-none select-none uppercase flex flex-col items-end gap-1 z-0">
        <span>[SYS.PRTS.ONLINE]</span>
        <span>WARN:// TERMINAL.ACT_</span>
        <span>DEMO:// IMG_ANALYSIS_ONLY / NO_REAL_DATA_SAVE</span>
      </div>
      <div class="absolute top-10 left-10 flex items-center gap-2 pointer-events-none z-0">
        <div class="w-3 h-3 bg-[#FFD100] animate-pulse" />
        <div class="h-3 border-r-2 border-[#B89600]/50 pr-2 flex items-center">
          <span class="text-[#B89600]/80 font-mono text-xs tracking-widest leading-none">SYS_READY</span>
        </div>
      </div>
      <div class="absolute bottom-0 left-10 w-px h-32 bg-gradient-to-t from-[#B89600]/30 to-transparent pointer-events-none z-0" />

      <div class="relative z-10 w-full flex-1 flex flex-col">
        <RouterView />
      </div>
    </main>
  </div>
</template>
