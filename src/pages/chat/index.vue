<script setup lang="ts">
import { onMounted, ref } from "vue"
import { useChat } from "./composables/useChat"

const { session, createSession, sendUserMessage, sendAssistantMessage } = useChat()
const input = ref("")

onMounted(() => {
  createSession()
})

function onSend() {
  if (!input.value.trim()) return

  sendUserMessage(input.value)
  sendAssistantMessage("这是一个模拟回复")
  input.value = ""
}
</script>

<template>
  <div class="chat-page">
    <div v-if="session">
      <div
        v-for="msg in session.messages"
        :key="msg.id"
      >
        <strong>{{ msg.role }}:</strong>
        {{ msg.content }}
      </div>
    </div>

    <input
      v-model="input"
      placeholder="输入消息"
    >
    <button @click="onSend">
      发送
    </button>
  </div>
</template>
