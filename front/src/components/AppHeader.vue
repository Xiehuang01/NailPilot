<script setup lang="ts">
import {LogOut, Sparkles} from 'lucide-vue-next';
import {useRouter} from 'vue-router';
import {useUserStore} from '@/stores/user';

const router = useRouter();
const userStore = useUserStore();

const handleLogout = () => {
  userStore.logout();
  router.push('/');
};
</script>

<template>
  <header class="sticky top-0 z-50 w-full border-b border-gray-200 bg-white/80 backdrop-blur-md">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
      <RouterLink to="/" class="flex items-center gap-2 group">
        <div class="bg-[#FFD100] text-gray-900 p-2 rounded-xl group-hover:scale-105 transition-transform">
          <Sparkles class="w-5 h-5 fill-current" />
        </div>
        <span class="font-bold text-xl tracking-tight">甲选 AI</span>
      </RouterLink>

      <div v-if="userStore.role" class="flex items-center gap-4">
        <span class="text-sm font-medium text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
          {{ userStore.roleLabel }}
        </span>
        <button
          type="button"
          class="p-2 text-gray-400 hover:text-gray-700 transition-colors"
          title="退出"
          @click="handleLogout"
        >
          <LogOut class="w-5 h-5" />
        </button>
      </div>
    </div>
  </header>
</template>
