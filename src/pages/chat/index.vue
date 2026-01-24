<script setup lang="ts">
import { computed, nextTick, onMounted, ref, watch } from "vue"
import { useRoute } from "vue-router"
import { useKnowledge } from "../knowledge/composables/useKnowledge"
import { useChat } from "./composables/useChat"

const route = useRoute()
const { readyKnowledge } = useKnowledge()

const selectedKnowledgeIds = ref<string[]>([])
const question = ref("")

const { session, createSession, ask, isThinking, errorMessage, retry, regenerate } = useChat(readyKnowledge)

const messagesEl = ref<HTMLElement | null>(null)

const isEmptyChat = computed(() => {
  return session.value && session.value.messages.length === 0
})

const autoScroll = ref(true)

const copiedId = ref<string | null>(null)
const copyError = ref<string | null>(null)

function scrollToBottom() {
  const el = messagesEl.value
  if (!el) return
  el.scrollTop = el.scrollHeight
}

function updateAutoScroll() {
  const el = messagesEl.value
  if (!el) return

  const distanceToBottom = el.scrollHeight - el.scrollTop - el.clientHeight
  autoScroll.value = distanceToBottom < 24
}

watch(
  () => session.value?.messages.length,
  async () => {
    if (!autoScroll.value) return
    await nextTick()
    scrollToBottom()
  }
)

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

// 3. 在 onMounted 中处理自动选中逻辑
onMounted(() => {
  createSession()

  // 检查 URL 是否带了 knowledge 参数
  const preSelectedId = route.query.knowledge as string
  if (preSelectedId) {
    // 确认该 ID 是否有效且已就绪
    const target = readyKnowledge.value.find(k => k.id === preSelectedId)
    if (target) {
      // 自动勾选
      if (!selectedKnowledgeIds.value.includes(preSelectedId)) {
        selectedKnowledgeIds.value.push(preSelectedId)
      }
    }
  }
})

// 监听路由参数 + readyKnowledge，就绪后自动选中
watch(
  () => [route.query.knowledge, readyKnowledge.value],
  () => {
    const id = route.query.knowledge as string | undefined
    if (!id) return

    const exists = readyKnowledge.value.some(k => k.id === id)
    if (exists && !selectedKnowledgeIds.value.includes(id)) {
      selectedKnowledgeIds.value.push(id)
    }
  },
  { immediate: true }
)

function onEnter() {
  if (isThinking.value) return
  if (!question.value.trim()) return

  ask(question.value, selectedKnowledgeIds.value)
  question.value = ""
}

function scrollToBottomAndResume() {
  autoScroll.value = true
  nextTick(() => {
    scrollToBottom()
  })
}

async function copyMessage(msgId: string, content: string) {
  try {
    await navigator.clipboard.writeText(content)
    copiedId.value = msgId
    copyError.value = null
    setTimeout(() => {
      if (copiedId.value === msgId) {
        copiedId.value = null
      }
    }, 1500)
  } catch {
    copyError.value = "复制失败"
    setTimeout(() => {
      copyError.value = null
    }, 1500)
  }
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
          v-for="(msg, index) in session.messages"
          :key="msg.id"
          class="chat-message"
          :class="msg.role"
          style="margin-bottom: 8px"
        >
          <!-- assistant 头像（左） -->
          <div v-if="msg.role === 'assistant'" class="chat-avatar assistant">
            🤖
          </div>
          <div class="chat-bubble">
            <!-- 操作按钮区（Copy + Regenerate） -->
            <div
              v-if="msg.role === 'assistant'"
              class="bubble-actions"
            >
              <!-- Copy -->
              <button
                type="button"
                class="action-btn"
                @click="copyMessage(msg.id, msg.content)"
              >
                {{ copiedId === msg.id ? "✓ 已复制" : "复制" }}
              </button>

              <!-- Regenerate（只给最后一条 assistant） -->
              <button
                v-if="index === session.messages.length - 1 && !isThinking"
                type="button"
                class="action-btn"
                @click="regenerate(selectedKnowledgeIds)"
              >
                🔄 重新生成
              </button>
            </div>

            <pre style="display: inline; white-space: pre-wrap">{{ msg.content }}</pre>
          </div>
          <!-- user 头像（右） -->
          <div v-if="msg.role === 'user'" class="chat-avatar user">
            👤
          </div>
        </div>
        <div
          v-if="isThinking"
          class="chat-message assistant"
          style="margin-top: 8px; color: #888"
        >
          <div class="chat-avatar assistant">
            🤖
          </div>
          <div class="chat-bubble thinking">
            正在思考中，请稍候…
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
  position: relative;
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

.chat-message {
  display: flex;
  align-items: flex-start;
  margin-bottom: 12px;
}

/* user 消息靠右 */
.chat-message.user {
  justify-content: flex-end;
}

/* assistant 消息靠左 */
.chat-message.assistant {
  justify-content: flex-start;
}

/* 头像通用样式 */
.chat-avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  font-size: 18px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 8px;
  flex-shrink: 0;
}

/* user 头像 */
.chat-avatar.user {
  background: #1677ff;
  color: #fff;
}

/* assistant 头像 */
.chat-avatar.assistant {
  background: #eee;
  color: #555;
}
.chat-bubble {
  position: relative;
}

/* 操作按钮容器 */
.bubble-actions {
  position: absolute;
  top: 6px;
  right: 6px;
  display: flex;
  gap: 6px;
  opacity: 0;
  transition: opacity 0.15s;
}

/* hover assistant 气泡时显示 */
.chat-message.assistant .chat-bubble:hover .bubble-actions {
  opacity: 1;
}

/* 按钮通用样式 */
.action-btn {
  font-size: 12px;
  padding: 2px 6px;
  border: none;
  border-radius: 4px;
  background: rgba(0, 0, 0, 0.05);
  color: #555;
  cursor: pointer;
  white-space: nowrap;
}

.action-btn:hover {
  background: rgba(0, 0, 0, 0.12);
}
</style>
