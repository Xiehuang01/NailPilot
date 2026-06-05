<script setup lang="ts">
import {nextTick, ref} from 'vue';
import {
  ChevronDown,
  LoaderCircle,
  Mic,
  MoreHorizontal,
  RotateCcw,
  SendHorizontal,
  Sparkles,
  ThumbsDown,
  ThumbsUp,
  Wand2,
  X,
} from 'lucide-vue-next';
import {chatWithConsumerAgent, type ConsumerAgentAction, type ConsumerAgentStyleCard} from '@/api';

const emit = defineEmits<{
  startTryOn: [quickMode: boolean, styleId?: number];
}>();

const chatState = ref<'default' | 'selecting_tryon_mode'>('default');
const inputMessage = ref('');
const loading = ref(false);
const agentMessages = ref<Array<{role: 'user' | 'assistant'; content: string; actions?: ConsumerAgentAction[]; cards?: ConsumerAgentStyleCard[]}>>([]);
const sessionId = `consumer-${localStorage.getItem('consumer_nickname') || 'demo'}`;
const activeAgentAbort = ref<AbortController | null>(null);
const activeRequestId = ref(0);

const handleStartClick = async () => {
  if (loading.value) {
    await interruptAgent(false);
  }

  chatState.value = 'selecting_tryon_mode';
  agentMessages.value.push(
    {role: 'user', content: '我想试戴美甲'},
    {
      role: 'assistant',
      content: '**选择试戴方式**\n- 快速试戴：直接上传手图并选择款式。\n- 详细推荐：先选择偏好，再帮你匹配更合适的款式。',
      actions: [
        {type: 'start_try_on', mode: 'quick', quickMode: true},
        {type: 'start_try_on', mode: 'detailed', quickMode: false},
      ],
    },
  );
  await scrollChatToBottom();
};

const scrollChatToBottom = async () => {
  await nextTick();
  const scrollable = document.getElementById('chat-scrollable');
  if (scrollable) {
    scrollable.scrollTop = scrollable.scrollHeight;
  }
};

const escapeHtml = (value: string) =>
  value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');

const renderInlineMarkdown = (value: string) =>
  escapeHtml(value)
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    .replace(/__([^_]+)__/g, '<strong>$1</strong>');

const renderMarkdown = (value: string) => {
  const lines = value.split(/\r?\n/);
  const html: string[] = [];
  let listType: 'ol' | 'ul' | null = null;

  const closeList = () => {
    if (listType) {
      html.push(`</${listType}>`);
      listType = null;
    }
  };

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) {
      closeList();
      continue;
    }

    const heading = trimmed.match(/^(#{1,3})\s+(.+)$/);
    if (heading) {
      closeList();
      const level = (heading[1]?.length ?? 1) + 2;
      html.push(`<h${level}>${renderInlineMarkdown(heading[2] ?? '')}</h${level}>`);
      continue;
    }

    const unordered = trimmed.match(/^[-*]\s+(.+)$/);
    if (unordered) {
      if (listType !== 'ul') {
        closeList();
        html.push('<ul>');
        listType = 'ul';
      }
      html.push(`<li>${renderInlineMarkdown(unordered[1] ?? '')}</li>`);
      continue;
    }

    const ordered = trimmed.match(/^\d+\.\s+(.+)$/);
    if (ordered) {
      if (listType !== 'ol') {
        closeList();
        html.push('<ol>');
        listType = 'ol';
      }
      html.push(`<li>${renderInlineMarkdown(ordered[1] ?? '')}</li>`);
      continue;
    }

    closeList();
    html.push(`<p>${renderInlineMarkdown(trimmed)}</p>`);
  }

  closeList();
  return html.join('');
};

const isAbortError = (error: unknown) => error instanceof DOMException && error.name === 'AbortError';

const interruptAgent = async (showHint = true) => {
  if (!activeAgentAbort.value) {
    return;
  }

  activeAgentAbort.value.abort();
  activeAgentAbort.value = null;
  activeRequestId.value += 1;
  loading.value = false;

  if (showHint) {
    agentMessages.value.push({
      role: 'assistant',
      content: '已打断上一轮回答，你可以继续问新的问题。',
    });
    await scrollChatToBottom();
  }
};

const sendAgentMessage = async (message?: string) => {
  const content = (message ?? inputMessage.value).trim();
  if (!content) {
    if (loading.value) {
      await interruptAgent();
    }
    return;
  }

  if (loading.value) {
    await interruptAgent(false);
  }

  const controller = new AbortController();
  const requestId = activeRequestId.value + 1;
  activeAgentAbort.value = controller;
  activeRequestId.value = requestId;
  inputMessage.value = '';
  chatState.value = 'selecting_tryon_mode';
  agentMessages.value.push({role: 'user', content});
  loading.value = true;
  await scrollChatToBottom();

  try {
    const result = await chatWithConsumerAgent({
      sessionId,
      message: content,
      context: {
        page: 'consumer-chat',
        availableActions: ['start_try_on_quick', 'start_try_on_detailed'],
      },
      signal: controller.signal,
    });

    if (controller.signal.aborted || requestId !== activeRequestId.value) {
      return;
    }

    agentMessages.value.push({
      role: 'assistant',
      content: result.reply,
      actions: result.actions,
      cards: result.cards,
    });
  } catch (error) {
    if (isAbortError(error) || controller.signal.aborted || requestId !== activeRequestId.value) {
      return;
    }

    agentMessages.value.push({
      role: 'assistant',
      content: '我这边暂时连不上 AI 服务，但你仍然可以先进入快速试戴流程。',
      actions: [{type: 'start_try_on', mode: 'quick', quickMode: true}],
    });
  } finally {
    if (requestId === activeRequestId.value) {
      loading.value = false;
      activeAgentAbort.value = null;
    }
    await scrollChatToBottom();
  }
};
</script>

<template>
  <div class="flex flex-col h-full w-full bg-gradient-to-b from-[#F5F8FF] via-[#FCF5FF] to-white relative overflow-hidden">
    <div class="absolute top-0 left-0 w-64 h-64 bg-blue-100/40 rounded-full blur-3xl -z-10 mix-blend-multiply" />
    <div class="absolute top-20 right-0 w-64 h-64 bg-pink-100/40 rounded-full blur-3xl -z-10 mix-blend-multiply" />

    <div class="flex items-center justify-between px-4 py-3 shrink-0">
      <div class="flex items-center gap-2">
        <img
          src="https://fridgeflow.oss-cn-hongkong.aliyuncs.com/meituanHackathon/aiimage.webp"
          alt="小团"
          class="w-8 h-8 object-contain shrink-0"
        >
        <span class="font-semibold text-gray-800">问小团</span>
      </div>
      <div class="flex items-center bg-white/80 backdrop-blur-md rounded-full px-2 py-1 shadow-sm border border-gray-200/50 gap-2">
        <button type="button" class="w-6 h-6 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-700">
          <MoreHorizontal class="w-4 h-4" />
        </button>
        <div class="w-[1px] h-4 bg-gray-300" />
        <button type="button" class="w-6 h-6 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-700">
          <X class="w-4 h-4" />
        </button>
      </div>
    </div>

    <div id="chat-scrollable" class="flex-1 overflow-y-auto px-4 pt-2 pb-28 sm:px-6 sm:pt-8 sm:pb-32 flex flex-col items-center hide-scrollbar">
      <div class="relative mb-3 mt-1 sm:mb-6 sm:mt-4">
        <img
          src="https://fridgeflow.oss-cn-hongkong.aliyuncs.com/meituanHackathon/aiimage.webp"
          alt="AI Avatar"
          class="w-24 h-24 sm:w-[140px] sm:h-[140px] object-contain"
        >
      </div>

      <h2 class="text-lg sm:text-xl font-medium text-gray-900 mb-1.5 sm:mb-2">Hi，我是小团</h2>
      <p class="text-sm text-gray-500 text-center mb-4 sm:mb-8 max-w-[220px] leading-relaxed">
        想了解店内信息还是找团购套餐？让我来帮你~
      </p>

      <div class="w-full flex flex-wrap items-start justify-center gap-2 sm:flex-col sm:justify-start sm:space-y-2.5 sm:gap-0 sm:pl-1">
        <button
          v-for="text in ['贴甲片伤不伤真甲', '美甲师做的精细吗', '手黑适合什么颜色美甲', '美甲可以维持多长时间']"
          :key="text"
          type="button"
          class="flex items-center gap-1.5 sm:gap-2 bg-[#F9FAFB]/80 hover:bg-white backdrop-blur-md px-3 py-2 sm:px-4 sm:py-2.5 rounded-[12px] shadow-[0_1px_2px_rgba(0,0,0,0.02)] border border-white transition-all text-gray-700 text-sm"
          @click="sendAgentMessage(text)"
        >
          <span class="text-[#8B5CF6] text-base leading-none">✨</span>
          {{ text }}
        </button>
      </div>

      <Transition name="chat-rise">
        <div v-if="chatState === 'selecting_tryon_mode'" class="w-full mt-6 flex flex-col">
          <template v-for="(message, index) in agentMessages" :key="`${message.role}-${index}`">
            <div v-if="message.role === 'user'" class="flex justify-end mb-6 pr-2">
              <div class="bg-[#EFEDFF] text-gray-900 px-[16px] py-[12px] rounded-2xl rounded-tr-md text-[15px] max-w-[85%] leading-relaxed">
                {{ message.content }}
              </div>
            </div>

            <div v-else class="flex w-full mb-4">
              <div class="flex flex-col flex-1 pb-4">
                <div class="text-gray-500 text-[13px] mb-2 flex items-center gap-1 cursor-pointer w-fit">
                  为你精选以下内容 <ChevronDown class="w-3.5 h-3.5" />
                </div>

                <div class="chat-markdown text-[15px] text-gray-800 leading-relaxed mb-4" v-html="renderMarkdown(message.content)" />

                <div v-if="message.cards?.length" class="mb-4 grid grid-cols-2 gap-2.5">
                  <article
                    v-for="card in message.cards"
                    :key="card.id"
                    class="group overflow-hidden rounded-[18px] bg-white border border-[#E7EAF3] shadow-[0_10px_30px_rgba(21,34,63,0.08)] active:scale-[0.98] transition-transform"
                  >
                    <div class="relative aspect-[4/3] overflow-hidden bg-[#F7F8FB]">
                      <img :src="card.img" :alt="card.name" class="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105">
                      <div class="absolute left-2 top-2 inline-flex items-center gap-1 rounded-full bg-white/90 px-2 py-1 text-[11px] font-bold text-[#13233F] shadow-sm">
                        <Sparkles class="h-3 w-3 text-[#FFB800]" />
                        {{ card.score }}
                      </div>
                    </div>
                    <div class="relative min-h-[106px] p-2.5 pb-11">
                      <h3 class="line-clamp-1 text-[13px] font-bold text-gray-900">{{ card.name }}</h3>
                      <div class="mt-1 flex flex-wrap gap-1">
                        <span
                          v-for="tag in card.tags.slice(0, 2)"
                          :key="`${card.id}-${tag}`"
                          class="rounded-full bg-[#FFF7D7] px-1.5 py-0.5 text-[10px] font-semibold text-[#8A6510]"
                        >
                          {{ tag }}
                        </span>
                      </div>
                      <p class="mt-2 text-[13px] font-black text-[#FF4D00]">¥{{ card.price }}</p>
                      <button
                        type="button"
                        class="absolute bottom-2 right-2 inline-flex items-center gap-1 overflow-hidden rounded-full p-[1px] shadow-[0_8px_20px_rgba(255,122,200,0.22)] active:scale-95 transition-transform"
                        @click.stop="emit('startTryOn', true, card.id)"
                      >
                        <span class="absolute inset-[-120%] bg-[conic-gradient(from_0deg,#FFF34A,#FF7AC8,#9D8CFF,#35DDEB,#FFF34A)] animate-[spin_4s_linear_infinite]" />
                        <span class="relative inline-flex items-center gap-1 rounded-full bg-white px-2.5 py-1 text-[11px] font-black text-[#13233F]">
                          <Wand2 class="h-3 w-3 text-[#FF7AC8]" />
                          AI试戴
                        </span>
                      </button>
                    </div>
                  </article>
                </div>

                <div v-if="message.actions?.some((action) => action.type === 'start_try_on')" class="flex flex-col gap-2 mb-4 w-full">
                  <button
                    type="button"
                    class="w-full bg-white text-gray-800 px-4 py-3 rounded-2xl text-[15px] font-medium border border-gray-200 hover:bg-gray-50 transition-colors relative active:scale-[0.98] text-left"
                    @click="emit('startTryOn', true)"
                  >
                    快速试戴
                  </button>
                  <button
                    type="button"
                    class="w-full bg-white text-gray-800 px-4 py-3 rounded-2xl text-[15px] font-medium border border-gray-200 hover:bg-gray-50 transition-colors relative active:scale-[0.98] text-left"
                    @click="emit('startTryOn', false)"
                  >
                    详细推荐
                  </button>
                </div>

                <div class="flex items-center justify-between mt-2 pt-2 border-t border-transparent w-full">
                  <div class="flex gap-2">
                    <button type="button" class="flex items-center justify-center p-2 rounded-[14px] border border-gray-200 text-gray-500 hover:bg-gray-50 bg-white">
                      <ThumbsUp class="w-4 h-4" />
                    </button>
                    <button type="button" class="flex items-center justify-center p-2 rounded-[14px] border border-gray-200 text-gray-500 hover:bg-gray-50 bg-white">
                      <ThumbsDown class="w-4 h-4" />
                    </button>
                  </div>
                  <button type="button" class="flex items-center justify-center px-3.5 py-1.5 rounded-[14px] border border-gray-200 text-gray-500 hover:bg-gray-50 bg-white text-[13px] gap-1" @click="sendAgentMessage('换一种说法再回答一次')">
                    <RotateCcw class="w-[14px] h-[14px]" /> 重答
                  </button>
                </div>
              </div>
            </div>
          </template>

          <button
            v-if="loading"
            type="button"
            class="flex items-center gap-2 text-sm text-gray-500 pl-1 hover:text-gray-900 transition-colors w-fit"
            @click="interruptAgent()"
          >
            <LoaderCircle class="w-4 h-4 animate-spin" />
            小团正在分析，点击打断
          </button>
        </div>
      </Transition>
    </div>

    <div class="absolute bottom-0 left-0 w-full px-4 pb-4 pt-3 sm:pb-6 sm:pt-4 bg-transparent">
      <button
        type="button"
        class="mb-3 relative inline-flex group active:scale-95 transition-transform overflow-hidden rounded-full p-[2px] cursor-pointer"
        @click="handleStartClick"
      >
        <span class="absolute inset-[-1000%] bg-[conic-gradient(from_0deg,#FFF2B2,#FFD1ED,#C1EFFF,#FFD1ED,#FFF2B2)] animate-[spin_3s_linear_infinite]" />
        <span class="relative inline-flex items-center gap-1.5 px-4 py-1.5 bg-white rounded-full">
          <Wand2 class="w-4 h-4 text-[#8B5CF6]" />
          <span class="text-sm font-bold text-gray-800">AI试美甲</span>
        </span>
      </button>

      <div class="bg-white border border-gray-200/80 rounded-full flex items-center pl-5 pr-2 py-2 shadow-[0_4px_20px_rgba(0,0,0,0.03)]">
        <input
          v-model="inputMessage"
          type="text"
          placeholder="发消息或按住说话"
          class="flex-1 bg-transparent border-none outline-none text-gray-700 text-sm placeholder:text-gray-400"
          @keydown.enter.prevent="sendAgentMessage()"
        >
        <button
          type="button"
          class="w-8 h-8 rounded-full flex items-center justify-center shrink-0 ml-2 text-gray-700 hover:bg-gray-50 active:bg-gray-100 transition-colors"
          @click="sendAgentMessage()"
        >
          <X v-if="loading && !inputMessage.trim()" class="w-5 h-5" />
          <SendHorizontal v-else-if="inputMessage.trim()" class="w-5 h-5" />
          <Mic v-else class="w-5 h-5" />
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.chat-markdown :deep(p) {
  margin: 0 0 0.55rem;
}

.chat-markdown :deep(p:last-child) {
  margin-bottom: 0;
}

.chat-markdown :deep(strong) {
  color: #111827;
  font-weight: 800;
}

.chat-markdown :deep(code) {
  border-radius: 8px;
  background: rgba(255, 209, 0, 0.18);
  color: #6b4f00;
  font-size: 0.88em;
  padding: 0.08rem 0.32rem;
}

.chat-markdown :deep(ul),
.chat-markdown :deep(ol) {
  margin: 0.35rem 0 0.65rem;
  padding-left: 1.1rem;
}

.chat-markdown :deep(li) {
  margin: 0.2rem 0;
}

.chat-markdown :deep(h3),
.chat-markdown :deep(h4),
.chat-markdown :deep(h5) {
  color: #111827;
  font-size: 0.95rem;
  font-weight: 800;
  margin: 0.2rem 0 0.45rem;
}
</style>
