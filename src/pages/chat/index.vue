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
const { session, createSession, ask, isThinking } = useChat(readyKnowledge)

const messagesEl = ref<HTMLElement | null>(null)

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

function onAsk() {
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
      <div
        ref="messagesEl"
        style="height: 420px; overflow: auto; border: 1px solid #eee; padding: 12px; border-radius: 8px"
        @scroll="updateAutoScroll"
      >
        <div
          v-for="msg in session.messages"
          :key="msg.id"
          style="margin-bottom: 8px"
        >
          <strong>{{ msg.role }}：</strong>
          <pre style="display: inline; white-space: pre-wrap">{{ msg.content }}</pre>
        </div>
        <div
          v-if="isThinking"
          style="margin-top: 8px; color: #888"
        >
          🤖 正在思考中，请稍候…
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
      <textarea
        v-model="question"
        placeholder="请输入你的问题"
        :disabled="isThinking"
      />

      <button
        @click="onAsk"
        :disabled="isThinking"
      >
        提问
      </button>
    </section>
  </div>
</template>
