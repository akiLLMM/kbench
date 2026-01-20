import type { Ref } from "vue"
import type { KnowledgeItem } from "../../knowledge/types"

import type { ChatMessage, ChatSession } from "../types"

import { ref } from "vue"
import { streamRag } from "@/pages/chat/services/rag.service.ts"

const errorMessage = ref<string | null>(null)

const lastQuestion = ref<string | null>(null)

interface ChatContext {
  question: string
  knowledge: {
    id: string
    title: string
  }[]
}

export function useChat(
  knowledgeSource: Ref<KnowledgeItem[]>
) {
  // 新增：thinking / loading 状态
  const isThinking = ref(false)

  const session = ref<ChatSession | null>(null)

  function createSession() {
    session.value = {
      id: Date.now().toString(),
      messages: [],
      createdAt: new Date().toISOString()
    }
  }

  function sendUserMessage(content: string) {
    if (!session.value) return

    const message: ChatMessage = {
      id: Date.now().toString(),
      role: "user",
      content,
      createdAt: new Date().toISOString()
    }

    session.value.messages.push(message)
  }

  function sendAssistantMessage(content: string) {
    if (!session.value) return

    const message: ChatMessage = {
      id: Date.now().toString(),
      role: "assistant",
      content,
      createdAt: new Date().toISOString()
    }

    session.value.messages.push(message)
  }

  function buildContext(
    question: string,
    selectedIds: string[]
  ): ChatContext {
    const knowledge = knowledgeSource.value
      .filter(item => selectedIds.includes(item.id))
      .map(item => ({
        id: item.id,
        title: item.title
      }))

    return {
      question,
      knowledge
    }
  }

  async function ask(
    question: string,
    selectedKnowledgeIds: string[]
  ) {
    if (!session.value || isThinking.value) return

    // 记录本次问题，用于 retry
    lastQuestion.value = question

    // 清空旧错误
    errorMessage.value = null

    // 记录用户消息
    sendUserMessage(question)

    // 插入一条“空的 assistant 消息”
    const assistantMessage: ChatMessage = {
      id: Date.now().toString(),
      role: "assistant",
      content: "",
      createdAt: new Date().toISOString()
    }
    session.value.messages.push(assistantMessage)

    // 3 进入 thinking 状态
    isThinking.value = true

    try {
      const context = buildContext(question, selectedKnowledgeIds)

      // 开始 streaming
      await streamRag(
        {
          question: context.question,
          knowledge: context.knowledge
        },
        (chunk) => {
          appendToLastAssistant(chunk)
        }
      )
    } catch {
      // 出错时：补一条错误提示
      assistantMessage.content = "❌ 出现错误，暂时无法生成回答。"

      errorMessage.value = "生成回答失败，请检查网络或稍后重试。"
    } finally {
      // 结束 thinking
      isThinking.value = false
    }
  }

  function appendToLastAssistant(chunk: string) {
    if (!session.value) return

    const messages = session.value.messages
    const last = messages[messages.length - 1]

    if (last && last.role === "assistant") {
      last.content += chunk
    }
  }

  // streaming出现错误时处理方法
  function retry(selectedKnowledgeIds: string[]) {
    if (!lastQuestion.value) return
    if (isThinking.value) return

    ask(lastQuestion.value, selectedKnowledgeIds)
  }

  return {
    session,
    isThinking,
    errorMessage,
    lastQuestion,
    createSession,
    ask,
    retry,
    appendToLastAssistant,
    sendAssistantMessage
  }
}
