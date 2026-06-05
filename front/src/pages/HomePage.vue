<script setup lang="ts">
import {nextTick, onMounted, ref, watch} from 'vue';
import gsap from 'gsap';
import {useRouter} from 'vue-router';
import {useUserStore} from '@/stores/user';
import {cn} from '@/lib/utils';

const router = useRouter();
const userStore = useUserStore();

const container = ref<HTMLElement | null>(null);
const inputRef = ref<HTMLInputElement | null>(null);

const introDone = ref(false);
const isTransitioning = ref(false);
const inputStage = ref<'role' | 'nickname'>('role');
const selectedRole = ref<'consumer' | 'merchant' | null>(null);
const nickname = ref('');
const hasError = ref(false);

watch(inputStage, async (stage) => {
  if (stage === 'nickname') {
    await nextTick();
    inputRef.value?.focus();
  }
});

onMounted(() => {
  const timeline = gsap.timeline({defaults: {ease: 'power3.out'}});

  timeline.to('.gsap-bg', {opacity: 0, duration: 1, delay: 1.8, ease: 'power2.inOut'});
  timeline
    .from('.gsap-tape-1', {x: '-150vw', rotation: -15, duration: 1, ease: 'power4.out'}, 0)
    .from('.gsap-tape-2', {x: '150vw', rotation: 20, duration: 0.9, ease: 'power4.out'}, 0.2)
    .from('.gsap-tape-3', {y: '150vh', rotation: -5, duration: 0.8, ease: 'power4.out'}, 0.4)
    .to('.gsap-tapes-wrapper', {opacity: 0, scale: 1.3, duration: 0.7, ease: 'power2.in', delay: 1.4}, 0)
    .set('.gsap-tapes-wrapper', {display: 'none'})
    .call(() => {
      introDone.value = true;
    })
    .from('.gsap-title', {x: -30, opacity: 0, duration: 0.8, ease: 'power3.out'}, '-=0.2')
    .from('.gsap-subtitle', {x: -30, opacity: 0, duration: 0.8, ease: 'power3.out'}, '-=0.6')
    .from('.gsap-card', {y: 50, opacity: 0, duration: 0.7, stagger: 0.15}, '-=0.5')
    .from('.gsap-footer', {opacity: 0, duration: 0.6}, '-=0.2');
});

const handleRoleSelect = (role: 'consumer' | 'merchant') => {
  if (isTransitioning.value) {
    return;
  }

  selectedRole.value = role;
  nickname.value = localStorage.getItem(`${role}_nickname`) ?? '';
  inputStage.value = 'nickname';
};

const submitNickname = (event?: Event) => {
  event?.preventDefault();
  if (isTransitioning.value || !selectedRole.value) {
    return;
  }

  const nextNickname = nickname.value.trim() || (selectedRole.value === 'merchant' ? 'DemoMerchant' : 'DemoUser');

  localStorage.setItem(`${selectedRole.value}_nickname`, nextNickname);
  isTransitioning.value = true;

  const timeline = gsap.timeline({
    onComplete: () => {
      userStore.loginAs(selectedRole.value!, nextNickname);
      router.push(`/${selectedRole.value}`);
    },
  });

  timeline
    .to(container.value, {
      x: -25,
      skewX: 6,
      filter: 'hue-rotate(90deg) contrast(150%) drop-shadow(5px 0 0 #FFD100) drop-shadow(-5px 0 0 #ec4899)',
      duration: 0.08,
      ease: 'power1.inOut',
    })
    .to(container.value, {
      x: 25,
      y: 5,
      skewX: -6,
      filter: 'hue-rotate(-90deg) invert(10%) drop-shadow(-5px 0 0 #3b82f6)',
      duration: 0.08,
      ease: 'power1.inOut',
    })
    .to(container.value, {
      x: -10,
      y: -5,
      skewX: 2,
      filter: 'hue-rotate(45deg) saturate(200%)',
      duration: 0.05,
      ease: 'power1.inOut',
    })
    .to(container.value, {
      x: 0,
      y: 0,
      skewX: 0,
      filter: 'none',
      duration: 0.05,
    })
    .to(
      '.gsap-scene-slice',
      {
        scaleX: 1,
        duration: 0.35,
        stagger: 0.03,
        ease: 'power4.inOut',
      },
      '-=0.15',
    );
};
</script>

<template>
  <div class="relative flex-1 flex flex-col items-center justify-center w-full">
    <div class="fixed inset-0 pointer-events-none z-0 overflow-hidden">
      <div class="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:32px_32px]" />
      <div class="orb-primary absolute -top-[20%] -left-[10%] w-[50vw] h-[50vw] rounded-full bg-gradient-to-tr from-[#FFD100]/20 to-transparent blur-[120px]" />
      <div class="orb-secondary absolute top-[30%] -right-[10%] w-[40vw] h-[40vw] rounded-full bg-gradient-to-bl from-pink-400/20 to-transparent blur-[120px]" />
    </div>

    <div ref="container" class="w-full h-full flex flex-col items-center z-10 flex-1 justify-center relative">
      <div v-if="!introDone" class="gsap-tapes-wrapper fixed inset-0 z-[9999] pointer-events-none flex items-center justify-center overflow-hidden">
        <div class="gsap-bg absolute inset-0 bg-[#0a0a0a]/90 backdrop-blur-[4px]" />

        <div class="gsap-tape-1 absolute top-[25%] left-[-10%] w-[120%] h-20 sm:h-28 bg-[#FFD100] transform -rotate-[15deg] shadow-[0_15px_35px_rgba(255,209,0,0.3)] border-y-[6px] border-black flex items-center overflow-hidden z-20 whitespace-nowrap">
          <div class="absolute inset-0 opacity-[0.2]" style="background-image: repeating-linear-gradient(45deg, #000, #000 20px, transparent 20px, transparent 40px)" />
          <div class="flex font-black italic text-black tracking-[0.3em] sm:tracking-[0.5em] text-4xl sm:text-7xl uppercase opacity-90 w-max animate-marquee drop-shadow-md">
            <span v-for="index in 6" :key="`hack-${index}`" class="mx-8 sm:mx-12 flex items-center gap-8 sm:gap-12">
              <span>美团 HACKATHON</span><span class="text-black/30">✦</span>
            </span>
          </div>
        </div>

        <div class="gsap-tape-2 absolute top-[43%] left-[-10%] w-[120%] h-16 sm:h-24 bg-white transform rotate-[10deg] shadow-[0_15px_35px_rgba(255,255,255,0.2)] border-y-[6px] border-black flex items-center overflow-hidden z-30 whitespace-nowrap">
          <div class="absolute inset-0 opacity-[0.08]" style="background-image: repeating-linear-gradient(-45deg, #000, #000 30px, transparent 30px, transparent 60px)" />
          <div class="flex font-black italic text-gray-900 tracking-widest text-3xl sm:text-6xl uppercase opacity-90 w-max animate-marquee-reverse drop-shadow-md">
            <span v-for="index in 8" :key="`zero-${index}`" class="mx-8 sm:mx-12 flex items-center gap-8 sm:gap-12">
              <span>组名：ZERO</span><span class="text-pink-500 font-tech not-italic text-4xl sm:text-7xl">//</span>
            </span>
          </div>
        </div>

        <div class="gsap-tape-3 absolute top-[62%] left-[-10%] w-[120%] h-14 sm:h-20 bg-pink-500 transform -rotate-[8deg] shadow-[0_15px_35px_rgba(236,72,153,0.3)] border-y-[6px] border-black flex items-center overflow-hidden z-10 whitespace-nowrap">
          <div class="absolute inset-0 opacity-[0.2]" style="background-image: repeating-linear-gradient(90deg, #000, #000 10px, transparent 10px, transparent 20px)" />
          <div class="flex font-black italic text-white tracking-[0.4em] sm:tracking-[0.6em] text-2xl sm:text-5xl uppercase opacity-90 w-max animate-marquee drop-shadow-lg">
            <span v-for="index in 10" :key="`track-${index}`" class="mx-8 sm:mx-12 flex items-center gap-8 sm:gap-12">
              <span class="font-tech not-italic">TRACK_03</span><span class="font-tech text-yellow-300">///</span><span>03 赛道</span>
            </span>
          </div>
        </div>
      </div>

      <div class="w-full max-w-7xl mx-auto px-4 md:px-8 py-8 flex-1 flex flex-col justify-center">
        <div class="flex flex-col lg:flex-row items-center lg:items-center justify-between gap-12 lg:gap-16 w-full">
          <div class="lg:w-[45%] flex flex-col items-center lg:items-start text-center lg:text-left z-10">
            <div class="gsap-title">
              <h1 class="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-black tracking-tighter text-gray-900 mb-6 drop-shadow-xl inline-block leading-[1.1]">
                甲选 <span class="ai-shift text-transparent bg-clip-text bg-gradient-to-br from-[#FFD100] to-pink-500 inline-block">AI</span>
              </h1>
            </div>

            <div class="gsap-subtitle flex flex-col items-center lg:items-start">
              <p class="text-xl sm:text-2xl md:text-3xl lg:text-4xl text-gray-600 mb-6 font-bold tracking-tight">
                从<span class="text-gray-900 relative mx-1">“试试看”<span class="absolute -bottom-1 left-0 w-full h-1 sm:h-[6px] bg-pink-400/40 rounded-full" /></span>到<span class="text-gray-900 relative mx-1">“卖得动”<span class="absolute -bottom-1 left-0 w-full h-1 sm:h-[6px] bg-[#FFD100]/50 rounded-full" /></span>
                <br class="hidden lg:block">
                <span class="lg:mt-3 inline-block">的美甲智能决策大脑</span>
              </p>
              <p class="text-sm md:text-base lg:text-lg text-gray-500 max-w-lg leading-relaxed font-medium">
                全息 AI 虚拟试戴，肤色手型像素级分析。<br class="hidden sm:block">
                搭载 OpenClaw 商业大模型，让每款设计找到对的人。
              </p>
            </div>
          </div>

          <div class="lg:w-[55%] w-full relative z-10 flex justify-center lg:justify-end mt-8 lg:mt-0 perspective-[1000px] sm:perspective-[1200px]">
            <div class="w-full sm:max-w-[550px] xl:max-w-[650px] gsap-card transform-gpu rotate-y-0 rotate-x-0 sm:rotate-y-[-5deg] sm:rotate-x-[2deg]">
              <div class="relative p-2 sm:p-4 bg-[#1a1a1a] rounded-[2rem] sm:rounded-[2.5rem] shadow-[0_20px_50px_rgba(0,0,0,0.8),inset_0_2px_1px_rgba(255,255,255,0.05),inset_0_-2px_6px_rgba(0,0,0,0.6)] border border-[#2a2a2a] ring-1 ring-black">
                <div class="absolute top-3 left-1/2 -translate-x-1/2 flex gap-1.5 opacity-40">
                  <div v-for="index in 12" :key="`vent-${index}`" class="w-2.5 h-1 sm:h-1.5 bg-black rounded-full shadow-[inset_0_1px_2px_rgba(0,0,0,0.8)]" />
                </div>

                <div class="absolute bottom-3 left-6 text-[#444] font-sans font-black text-[10px] sm:text-xs tracking-widest uppercase">
                  ZERO // CRT-8X PRO
                </div>

                <div class="absolute bottom-3 right-6 flex items-center gap-3">
                  <div class="w-6 h-2 bg-[#111] rounded-sm shadow-[inset_0_2px_4px_rgba(0,0,0,0.8)] border border-[#222]" />
                  <div class="w-1.5 h-1.5 rounded-full bg-[#FFD100] shadow-[0_0_8px_rgba(255,209,0,0.8)]" />
                </div>

                <div class="mt-6 mb-5 mx-2 bg-[#050505] p-3 sm:p-5 rounded-[1.5rem] sm:rounded-[2rem] shadow-[inset_0_10px_30px_rgba(0,0,0,1),0_1px_1px_rgba(255,255,255,0.05)] relative border border-[#111]">
                  <div class="relative bg-[#0a0a0a] rounded-[1rem] sm:rounded-[1.5rem] overflow-hidden crt-glass">
                    <div class="crt-content relative z-10 min-h-[480px] sm:min-h-[520px] p-6 sm:p-8 text-white flex flex-col font-tech">
                      <div class="flex items-center justify-between mb-6 text-[11px] sm:text-sm tracking-[0.15em] uppercase text-[#FFD100]/80">
                        <span class="text-glow">NailPilot // Boot Console</span>
                        <span>{{ selectedRole ? `ROLE://${selectedRole.toUpperCase()}` : 'SELECT://ENTRY' }}</span>
                      </div>

                      <div class="space-y-4 mb-8">
                        <div class="w-fit px-2 py-1 border border-[#FFD100]/40 bg-[#FFD100]/10 text-[#FFD100] text-[11px] sm:text-sm tracking-[0.2em] uppercase">
                          Project Zero
                        </div>
                        <h2 class="pixel-chinese text-4xl sm:text-5xl lg:text-6xl leading-none text-glow font-black tracking-[0.08em]">
                          启动终端
                        </h2>
                        <p class="text-base sm:text-lg leading-relaxed text-white/60 max-w-[26rem]">
                          请选择身份并完成模拟登录，系统将载入对应的 AI 试戴体验仓或商家经营决策舱。
                        </p>
                      </div>

                      <div class="space-y-4">
                        <template v-if="inputStage === 'role'">
                          <button
                            type="button"
                            class="text-left w-full hover:bg-[#FFD100] hover:text-[#000] py-3 sm:py-4 px-4 sm:px-5 transition-none flex items-center cursor-pointer group/btn border border-[#FFD100]/50 hover:border-[#FFD100] z-40 bg-black/40 ring-1 ring-[#FFD100]/10 shadow-[inset_0_0_15px_rgba(255,209,0,0.1)] hover:shadow-none"
                            @click="handleRoleSelect('consumer')"
                          >
                            <div class="flex flex-col justify-center">
                              <span class="text-xl sm:text-4xl font-bold tracking-[0.1em] leading-none flex items-center">
                                <span class="opacity-0 group-hover/btn:opacity-100 mr-2">█</span>1.我是消费者
                              </span>
                              <span class="text-[10px] sm:text-[14px] opacity-60 group-hover/btn:opacity-100 group-hover/btn:font-bold tracking-[0.1em] mt-2 sm:mt-3 uppercase">// 启动 AI 智能试戴体验仓</span>
                            </div>
                          </button>

                          <button
                            type="button"
                            class="text-left w-full hover:bg-[#FFD100] hover:text-[#000] py-3 sm:py-4 px-4 sm:px-5 transition-none flex items-center cursor-pointer group/btn border border-[#FFD100]/50 hover:border-[#FFD100] z-40 bg-black/40 ring-1 ring-[#FFD100]/10 shadow-[inset_0_0_15px_rgba(255,209,0,0.1)] hover:shadow-none"
                            @click="handleRoleSelect('merchant')"
                          >
                            <div class="flex flex-col justify-center">
                              <span class="text-xl sm:text-4xl font-bold tracking-[0.1em] leading-none flex items-center">
                                <span class="opacity-0 group-hover/btn:opacity-100 mr-2">█</span>2.我是商家
                              </span>
                              <span class="text-[10px] sm:text-[14px] opacity-60 group-hover/btn:opacity-100 group-hover/btn:font-bold tracking-[0.1em] mt-2 sm:mt-3 uppercase">// 商家 BI 数据决策舱</span>
                            </div>
                          </button>
                        </template>

                        <form v-else class="relative z-40 flex flex-col gap-4 w-full pointer-events-auto" @submit="submitNickname">
                          <p :class="cn('tracking-widest text-sm sm:text-base mb-2', hasError ? 'text-red-500 font-bold' : 'text-[#FFD100]')">
                            {{ hasError ? '// ERROR: IDENTITY_REQUIRED_FOR_SYS_ACCESS' : '// 请输入您的模拟用户昵称：' }}
                          </p>
                          <div :class="cn('flex items-center gap-3 text-xl sm:text-2xl border-b-2 pb-3', hasError ? 'border-red-500/80' : 'border-[#FFD100]/40')">
                            <span :class="cn('font-bold', hasError ? 'text-red-500' : 'text-[#FFD100]')">]</span>
                            <input
                              ref="inputRef"
                              v-model="nickname"
                              type="text"
                              :class="cn('bg-transparent border-none outline-none flex-1 min-w-0 tracking-widest font-bold', hasError ? 'text-red-100 placeholder:text-red-500/40' : 'text-white placeholder:text-white/20')"
                              :placeholder="hasError ? 'REQUIRED...' : 'NICKNAME...'"
                              maxlength="15"
                              @input="hasError = false"
                            >
                          </div>
                          <button
                            type="submit"
                            :class="cn('relative z-40 pointer-events-auto touch-manipulation text-left w-full py-3 px-4 transition-none group/btn bg-black/40 ring-1 hover:shadow-none mt-4', hasError ? 'hover:bg-red-500 hover:text-[#000] border border-red-500/50 hover:border-red-500 ring-red-500/10 shadow-[inset_0_0_15px_rgba(255,0,0,0.2)] text-red-500' : 'hover:bg-[#FFD100] hover:text-[#000] border border-[#FFD100]/50 hover:border-[#FFD100] ring-[#FFD100]/10 shadow-[inset_0_0_15px_rgba(255,209,0,0.1)] text-[#FFD100]')"
                            @pointerdown.prevent.stop="submitNickname"
                            @click.prevent.stop="submitNickname"
                          >
                            <span class="text-lg sm:text-xl font-bold tracking-[0.1em] leading-none flex items-center">
                              <span class="opacity-0 group-hover/btn:opacity-100 mr-2">█</span>确认启动
                              <span class="text-[10px] sm:text-xs opacity-60 ml-3 uppercase">(ENTER)</span>
                            </span>
                          </button>
                        </form>
                      </div>

                      <div :class="cn('mt-auto text-xs sm:text-sm flex items-center tracking-widest pt-4 uppercase', hasError ? 'text-red-500 font-bold' : 'text-[#FFD100]/80')">
                        {{ hasError ? 'SYS_HALTED_MISSING_ARGS' : 'AWAITING_INPUT' }}
                        <span :class="cn('inline-block w-2.5 h-4 sm:w-3 sm:h-5 ml-2 animate-pulse', hasError ? 'bg-red-500' : 'bg-[#FFD100]')" />
                      </div>
                    </div>

                    <div class="absolute inset-0 z-20 crt-scanlines pointer-events-none" />
                    <div class="absolute inset-0 z-30 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.12),transparent_45%)] pointer-events-none" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="gsap-footer w-full mt-auto pt-4 pb-2 text-center px-4 relative z-10">
          <p class="text-[10px] sm:text-xs text-gray-400 font-medium mb-1 relative inline-block">
            <span class="absolute -left-6 top-1/2 -translate-y-1/2 w-4 h-px bg-gray-300 hidden sm:block" />
            本项目为美团 Hackathon 参赛作品 Demo，只做功能展示与技术验证。
            <span class="absolute -right-6 top-1/2 -translate-y-1/2 w-4 h-px bg-gray-300 hidden sm:block" />
          </p>
          <p class="text-[10px] text-gray-400 font-mono tracking-[0.2em] uppercase">
            Designed &amp; Engineered by Zero Squad &copy; 2024
          </p>
        </div>
      </div>

      <div v-if="isTransitioning" class="fixed inset-0 z-[10000] pointer-events-none flex flex-col">
        <div
          v-for="index in 12"
          :key="index"
          :class="cn('gsap-scene-slice w-full flex-1 transform scale-x-0 border-t border-black/20', index % 2 === 0 ? 'bg-[#FFD100] origin-right' : 'bg-[#111111] origin-left')"
        />
      </div>
    </div>
  </div>
</template>
