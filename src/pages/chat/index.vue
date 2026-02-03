<script setup lang="ts">
import {
  ArrowDown,
  BookOpen,
  Bot,
  Copy,
  Info,
  RefreshCcw,
  Sparkles,
  User
} from "lucide-vue-next"
import { computed, nextTick, onMounted, ref, watch } from "vue"
import { useRoute } from "vue-router"
import { useKnowledge } from "../knowledge/composables/useKnowledge"
import { useChat } from "./composables/useChat"

defineOptions({
  name: "Chat"
})

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
    <div class="chat-layout">
      <!-- 左侧：对话区 -->
      <section class="chat-panel" v-if="session">
        <header class="panel-header">
          <div class="panel-title">
            <Sparkles class="icon" />
            <span>AI 对话</span>
          </div>
        </header>

        <!-- Chat 空状态 -->
        <div v-if="isEmptyChat" class="empty-state">
          <div class="empty-title">
            <Sparkles class="icon" />
            <span>欢迎使用 AI 知识助手</span>
          </div>
          <div class="empty-desc">
            你可以基于自己的知识库，向 AI 提问并获得整理后的回答。
          </div>
          <div class="empty-tips">
            <div><Info class="icon" /> 选择要使用的知识</div>
            <div><Info class="icon" /> 在下方输入你的问题</div>
          </div>
        </div>

        <!-- 正常消息列表 -->
        <div
          ref="messagesEl"
          class="messages"
          @scroll="updateAutoScroll"
        >
          <div
            v-for="(msg, index) in session.messages"
            :key="msg.id"
            class="chat-message"
            :class="msg.role"
          >
            <!-- assistant 头像（左） -->
            <div v-if="msg.role === 'assistant'" class="chat-avatar assistant">
              <Bot class="icon" />
            </div>

            <div class="chat-bubble">
              <!-- 操作按钮区（Copy + Regenerate） -->
              <div v-if="msg.role === 'assistant'" class="bubble-actions">
                <button
                  type="button"
                  class="action-btn"
                  @click="copyMessage(msg.id, msg.content)"
                >
                  <Copy class="icon-sm" />
                  {{ copiedId === msg.id ? "已复制" : "复制" }}
                </button>
                <button
                  v-if="index === session.messages.length - 1 && !isThinking"
                  type="button"
                  class="action-btn"
                  @click="regenerate(selectedKnowledgeIds)"
                >
                  <RefreshCcw class="icon-sm" />
                  重新生成
                </button>
              </div>

              <pre>{{ msg.content }}</pre>
            </div>

            <!-- user 头像（右） -->
            <div v-if="msg.role === 'user'" class="chat-avatar user">
              <User class="icon" />
            </div>
          </div>

          <div v-if="isThinking" class="chat-message assistant thinking">
            <div class="chat-avatar assistant">
              <Bot class="icon" />
            </div>
            <div class="chat-bubble thinking">
              正在思考中，请稍候…
            </div>
          </div>

          <!-- 回到底部按钮 -->
          <button
            v-if="!autoScroll"
            @click="scrollToBottomAndResume"
            class="scroll-bottom"
          >
            <ArrowDown class="icon-sm" />
            回到底部
          </button>
        </div>

        <!-- 输入区 -->
        <div class="input-panel">
          <div v-if="errorMessage" class="error-msg">
            ⚠️ {{ errorMessage }}
            <button
              v-if="!isThinking"
              class="retry-btn"
              @click="retry(selectedKnowledgeIds)"
            >
              <RefreshCcw class="icon-sm" />
              重试
            </button>
          </div>

          <div
            v-if="selectedKnowledgeIds.length === 0"
            class="hint"
          >
            <Info class="icon-sm" />
            未选择知识时，AI 将基于问题本身进行回答
          </div>

          <div class="input-row">
            <textarea
              v-model="question"
              placeholder="请输入你的问题，Enter 发送，Shift + Enter 换行"
              :disabled="isThinking"
              @keydown.enter.exact.prevent="onEnter"
              @keydown.shift.enter.stop
            />
            <button
              class="send-btn"
              @click="onEnter"
              :disabled="isThinking"
            >
              {{ isThinking ? "思考中…" : "提问" }}
            </button>
          </div>
        </div>
      </section>

      <!-- 右侧：可用知识区 -->
      <aside class="knowledge-panel">
        <header class="panel-header">
          <div class="panel-title">
            <BookOpen class="icon" />
            <span>可用知识</span>
          </div>
        </header>

        <ul class="knowledge-list">
          <li
            v-for="item in readyKnowledge"
            :key="item.id"
            class="knowledge-item"
          >
            <label class="knowledge-label">
              <input
                type="checkbox"
                :value="item.id"
                v-model="selectedKnowledgeIds"
              >
              <span>{{ item.title }}</span>
            </label>
          </li>
        </ul>
      </aside>
    </div>
  </div>
</template>

<style scoped>
.chat-page {
  padding: 12px 16px 4px;
  color: #0f172a;
}

.chat-layout {
  display: grid;
  grid-template-columns: 1fr 380px;
  gap: 16px;
}

.chat-panel {
  display: flex;
  flex-direction: column;
  background: #ffffff;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  box-shadow: 0 6px 20px rgba(15, 23, 42, 0.06);
  height: calc(100vh - var(--v3-header-height) - 16px);
  min-height: 560px;
}

.panel-header {
  padding: 12px 16px;
  border-bottom: 1px solid #f1f5f9;
}

.panel-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 600;
}

.icon {
  width: 18px;
  height: 18px;
  color: #2563eb;
}
.icon-sm {
  width: 14px;
  height: 14px;
}

.messages {
  flex: 1;
  min-height: 0;
  overflow: auto;
  padding: 12px 16px;
}

.empty-state {
  margin: 8px 16px;
  padding: 16px;
  border: 1px dashed #cbd5e1;
  border-radius: 10px;
  background: #f8fafc;
  text-align: center;
}
.empty-title {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  font-weight: 600;
  margin-bottom: 8px;
}
.empty-desc {
  color: #64748b;
  margin-bottom: 12px;
}
.empty-tips {
  display: grid;
  gap: 6px;
  color: #475569;
}
.empty-tips > div {
  display: flex;
  align-items: center;
  gap: 6px;
  justify-content: center;
}

.chat-message {
  display: flex;
  align-items: flex-start;
  margin-bottom: 12px;
}
.chat-message.user {
  justify-content: flex-end;
}
.chat-message.assistant {
  justify-content: flex-start;
}

.chat-avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 8px;
  flex-shrink: 0;
  background: #eef2ff;
  color: #1d4ed8;
}
.chat-avatar.user {
  background: #eef2ff;
  color: #1d4ed8;
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
.chat-message.user .chat-bubble {
  background-color: #dbeafe;
  color: #0f172a;
  border-bottom-right-radius: 4px;
}
.chat-message.assistant .chat-bubble {
  background-color: #f1f5f9;
  color: #0f172a;
  border-bottom-left-radius: 4px;
}
.chat-bubble.thinking {
  font-style: italic;
  color: #64748b;
}

.bubble-actions {
  position: absolute;
  top: 6px;
  right: 6px;
  display: flex;
  gap: 6px;
  opacity: 0;
  transition: opacity 0.15s;
}
.chat-message.assistant .chat-bubble:hover .bubble-actions {
  opacity: 1;
}
.action-btn {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  padding: 2px 6px;
  border: none;
  border-radius: 6px;
  background: rgba(15, 23, 42, 0.08);
  color: #475569;
  cursor: pointer;
  white-space: nowrap;
}
.action-btn:hover {
  background: rgba(15, 23, 42, 0.16);
}

.scroll-bottom {
  position: sticky;
  bottom: 12px;
  float: right;
  margin-top: 8px;
  padding: 6px 10px;
  font-size: 12px;
  border-radius: 16px;
  border: 1px solid #e5e7eb;
  background: #fff;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.08);
}

.input-panel {
  border-top: 1px solid #f1f5f9;
  padding: 16px 20px 16px;
  margin-top: auto;
}
.input-row {
  display: grid;
  grid-template-columns: 1fr auto;
  gap: 8px;
}
textarea {
  min-height: 120px;
  border: 1px solid #e5e7eb;
  border-radius: 10px;
  padding: 12px;
  outline: none;
  resize: vertical;
}
textarea:focus {
  border-color: #2563eb;
  box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.15);
}
.send-btn {
  padding: 0 16px;
  border: none;
  border-radius: 10px;
  background: #2563eb;
  color: #ffffff;
  cursor: pointer;
}
.send-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.error-msg {
  color: #dc2626;
  font-size: 13px;
  margin-bottom: 6px;
  display: flex;
  align-items: center;
  gap: 8px;
}
.retry-btn {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  border: none;
  background: transparent;
  color: #dc2626;
  cursor: pointer;
}

.hint {
  font-size: 12px;
  color: #64748b;
  margin-bottom: 6px;
  display: flex;
  align-items: center;
  gap: 6px;
}

.knowledge-panel {
  background: #ffffff;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  box-shadow: 0 6px 20px rgba(15, 23, 42, 0.06);
  height: calc(100vh - var(--v3-header-height) - 16px);
  min-height: 560px;
  padding-bottom: 4px;
}
.knowledge-list {
  list-style: none;
  padding: 8px 16px 0;
  margin: 0;
  display: grid;
  gap: 8px;
}
.knowledge-item {
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  padding: 8px 10px;
  background: #f8fafc;
}
.knowledge-label {
  display: flex;
  align-items: center;
  gap: 8px;
}
</style>
