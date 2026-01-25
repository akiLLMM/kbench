<script setup lang="ts">
import { onMounted, ref } from "vue"
import KnowledgeEditor from "./components/KnowledgeEditor.vue"
import KnowledgeList from "./components/KnowledgeList.vue"
import { useKnowledge } from "./composables/useKnowledge"

const { list, addKnowledge, loadList } = useKnowledge()
// 引用编辑器组件以便从列表的“新增”按钮触发聚焦编辑器
const editorRef = ref<any>(null)

// 被 KnowledgeList 的 create 事件调用，聚焦标题输入
function onCreate() {
  editorRef.value?.focusTitle?.()
}

onMounted(() => {
  loadList()
})
</script>

<template>
  <div class="knowledge-page">
    <KnowledgeEditor ref="editorRef" @submit="addKnowledge" />
    <KnowledgeList :list="list" @create="onCreate" />
  </div>
</template>

<style scoped>
.knowledge-page {
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 16px;
}
</style>
