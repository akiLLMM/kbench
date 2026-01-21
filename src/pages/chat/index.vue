<script setup lang="ts">
import { onMounted, ref } from "vue"
import { useKnowledge } from "../knowledge/composables/useKnowledge"
import { useChat } from "./composables/useChat"

// 1 读取 Knowledge（只读视图）
const { readyKnowledge } = useKnowledge()

// 2 页面级 UI 状态
const selectedKnowledgeIds = ref<string[]>([])
const question = ref("")

// 3 Chat 引擎（通过依赖注入消费 knowledge）
const { session, createSession, ask, isThinking, errorMessage, retry } = useChat(readyKnowledge)

const messagesEl = ref<HTMLElement | null>(null)

// 判断chat空状态引导
const isEmptyChat = computed(() => {
  return session.value && session.value.messages.length === 0
})

// 是否自动滚动（用户手动上滑后可关闭）
const autoScroll = ref(true)

function scrollToBottom() {
  const el = messagesEl.value
  if (!el) return
  el.scrollTop = el.scrollHeight
}

function updateAutoScroll() {
  const el = messagesEl.value
  if (!el) return

  const distanceToBottom = el.scrollHeight - el.scrollTop - el.clientHeight
  // 离底部很近就认为用户希望自动滚动
  autoScroll.value = distanceToBottom < 24
}

// 监听消息列表长度变化：新消息出现时滚到底部
watch(
  () => session.value?.messages.length,
  async () => {
    if (!autoScroll.value) return
    await nextTick()
    scrollToBottom()
  }
)

// 监听 streaming：assistant 最后一条消息内容变化时也滚动
watch(
  () => {
    const messages = session.value?.messages
    if (!messages || messages.length === 0) return ""
    const last = messages[messages.length - 1]
    return `${last.id}:${last.content.length}`
  },
  async () => {
    if (!autoScroll.value) return
    await nextTick()
    scrollToBottom()
  }
)

onMounted(async () => {
  await nextTick()
  scrollToBottom()
})

onMounted(() => {
  createSession()
})

function onEnter() {
  if (isThinking.value) return
  if (!question.value.trim()) return

  ask(question.value, selectedKnowledgeIds.value)
  question.value = ""
}

// 立即回到底部
function scrollToBottomAndResume() {
  autoScroll.value = true
  nextTick(() => {
    scrollToBottom()
  })
}
</script>

<template>
  <div class="chat-page">
    <h2>Chat</h2>

    <!-- 知识选择区 -->
    <section>
      <h3>可用知识</h3>

      <ul>
        <li
          v-for="item in readyKnowledge"
          :key="item.id"
        >
          <label>
            <input
              type="checkbox"
              :value="item.id"
              v-model="selectedKnowledgeIds"
            >
            {{ item.title }}
          </label>
        </li>
      </ul>
    </section>

    <!-- 对话区 -->
    <section v-if="session">
      <h3>对话</h3>
      <!-- Chat 空状态 -->
      <div
        v-if="isEmptyChat"
        style="
          padding: 32px;
          text-align: center;
          color: #666;
          border: 1px dashed #ddd;
          border-radius: 8px;
        "
      >
        <div style="font-size: 18px; margin-bottom: 8px;">
          👋 欢迎使用 AI 知识助手
        </div>

        <div style="margin-bottom: 16px;">
          你可以基于自己的知识库，向 AI 提问并获得整理后的回答。
        </div>

        <div style="font-size: 14px; line-height: 1.8;">
          开始前你可以：<br>
          1️⃣ 选择要使用的知识<br>
          2️⃣ 在下方输入你的问题<br>
          3️⃣ 按 Enter 发送，Shift + Enter 换行
        </div>
      </div>
      <!-- 正常消息列表 -->
      <div
        ref="messagesEl"
        style="height: 420px; overflow: auto; border: 1px solid #eee; padding: 12px; border-radius: 8px"
        @scroll="updateAutoScroll"
      >
        <div
          v-for="msg in session.messages"
          :key="msg.id"
          class="chat-message"
          :class="msg.role"
          style="margin-bottom: 8px"
        >
          <div class="chat-bubble">
            <pre style="display: inline; white-space: pre-wrap">{{ msg.content }}</pre>
          </div>
        </div>
        <div
          v-if="isThinking"
          class="chat-message assistant"
          style="margin-top: 8px; color: #888"
        >
          <div class="chat-bubble thinking">
            🤖 正在思考中，请稍候…
          </div>
        </div>
        <!-- 回到底部按钮 -->
        <button
          v-if="!autoScroll"
          @click="scrollToBottomAndResume"
          style="
            position: sticky;
            bottom: 12px;
            float: right;
            margin-top: 8px;
            padding: 6px 10px;
            font-size: 12px;
            border-radius: 16px;
            border: 1px solid #ddd;
            background: #fff;
            cursor: pointer;
            box-shadow: 0 2px 6px rgba(0,0,0,0.1);
          "
        >
          ⬇ 回到底部
        </button>
      </div>
    </section>

    <!-- 输入区 -->
    <section>
      <div
        v-if="errorMessage"
        style="
          color: #d93026;
          font-size: 13px;
          margin-bottom: 6px;
        "
      >
        ⚠️ {{ errorMessage }}
      </div>
      <button
        v-if="errorMessage && !isThinking"
        @click="retry(selectedKnowledgeIds)"
        style="margin-left: 8px; font-size: 12px"
      >
        🔄 重试
      </button>
      <div
        v-if="selectedKnowledgeIds.length === 0"
        style="font-size: 12px; color: #999; margin-bottom: 4px;"
      >
        💡 未选择知识时，AI 将基于问题本身进行回答
      </div>
      <textarea
        v-model="question"
        placeholder="请输入你的问题"
        :disabled="isThinking"
        @keydown.enter.exact.prevent="onEnter"
        @keydown.shift.enter.stop
      />

      <button
        @click="onEnter"
        :disabled="isThinking"
      >
        {{ isThinking ? "思考中…" : "提问" }}
      </button>
    </section>
  </div>
</template>

<style scoped>
.chat-message {
  display: flex;
  margin-bottom: 12px;
}

/* 用户消息：右侧 */
.chat-message.user {
  justify-content: flex-end;
}

/* AI 消息：左侧 */
.chat-message.assistant {
  justify-content: flex-start;
}

.chat-bubble {
  max-width: 70%;
  padding: 10px 12px;
  border-radius: 12px;
  line-height: 1.6;
  font-size: 14px;
  white-space: pre-wrap;
  word-break: break-word;
}

/* 用户气泡样式 */
.chat-message.user .chat-bubble {
  background-color: #1677ff;
  color: #fff;
  border-bottom-right-radius: 4px;
}

/* AI 气泡样式 */
.chat-message.assistant .chat-bubble {
  background-color: #f5f5f5;
  color: #333;
  border-bottom-left-radius: 4px;
}

/* thinking 状态稍微弱一点 */
.chat-bubble.thinking {
  font-style: italic;
  color: #666;
}
</style>
