import type { KnowledgeItem } from "@/pages/knowledge/types"
import { computed, ref, watch } from "vue"

const STORAGE_KEY = "ai-workbench-knowledge-list"

// 初始化：从 localStorage 读取
function loadFromStorage(): KnowledgeItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    const parsed = raw ? JSON.parse(raw) : []
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

// 【关键修改】单例 + 持久化
const list = ref<KnowledgeItem[]>(loadFromStorage())

// 自动持久化（深度监听）
watch(
  list,
  (val) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(val))
  },
  { deep: true }
)

export function useKnowledge() {
  const readyKnowledge = computed(() =>
    list.value.filter(item => item.status === "ready")
  )

  function addKnowledge(title: string) {
    const item: KnowledgeItem = {
      id: Date.now().toString(),
      title,
      type: "text",
      status: "processing", // 初始状态
      updatedAt: new Date().toISOString()
    }

    list.value.unshift(item)
    processKnowledge(item.id)
  }

  function processKnowledge(id: string) {
    setTimeout(() => {
      const target = list.value.find(item => item.id === id)
      if (!target) return
      target.status = "ready"
      target.updatedAt = new Date().toISOString()
    }, 2000)
  }

  function removeKnowledge(id: string) {
    list.value = list.value.filter(item => item.id !== id)
  }

  return {
    list,
    readyKnowledge,
    addKnowledge,
    removeKnowledge
  }
}
