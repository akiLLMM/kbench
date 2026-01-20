import type { ChatMessage, ChatSession } from "../types"

import { ref } from "vue"

export function useChat() {
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

  return {
    session,
    createSession,
    sendUserMessage,
    sendAssistantMessage
  }
}
