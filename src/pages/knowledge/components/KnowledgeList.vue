<script setup lang="ts">
import type { KnowledgeItem } from "../types"
import { computed } from "vue"

// 接受 list，并对外发出 create 事件（父组件可据此聚焦编辑器）
const props = defineProps<{
  list: KnowledgeItem[]
}>()

defineEmits<{
  (e: "create"): void
}>()

const isEmpty = computed(() => props.list.length === 0)
</script>

<template>
  <!-- 空状态 + 引导 -->
  <div v-if="isEmpty" class="empty-container">
    <div class="empty-title">
      暂无知识条目
    </div>
    <div class="empty-desc">
      快速上手：新增知识用于在 Chat 中进行检索增强（RAG）。推荐：
      <ul class="empty-list">
        <li>简洁标题，如：Vue 响应式原理</li>
        <li>内容写清楚上下文：摘要 + 关键点 + 示例</li>
      </ul>
      新增后系统会自动处理（processing -> ready），2s 后可使用。
    </div>

    <div>
      <button @click="$emit('create')" class="empty-cta-button">
        新建第一个知识
      </button>
    </div>
  </div>

  <!-- 正常列表 -->
  <ul v-else class="list-ul">
    <li v-for="item in props.list" :key="item.id" class="list-item">
      <span class="item-title">{{ item.title }}</span>

      <!-- 行内 status badge：processing 显示 spinner -->
      <span
        class="badge"
        :class="item.status"
        :title="item.status === 'processing' ? '处理中 - 稍后可用' : '已完成 - 可在 Chat 中使用'"
        :aria-label="item.status"
      >
        <span v-if="item.status === 'processing'" class="spinner" aria-hidden="true" />
        <span class="badge-text">
          {{ item.status === 'processing' ? '处理中' : '已完成' }}
        </span>
      </span>
    </li>
  </ul>
</template>

<style scoped>
.empty-container {
  padding: 16px;
  border: 1px dashed #e6e6e6;
  border-radius: 8px;
  text-align: center;
  max-width: 800px;
}
.empty-title {
  font-size: 18px;
  margin-bottom: 8px;
  font-weight: 600;
}
.empty-desc {
  color: #666;
  font-size: 14px;
  margin-bottom: 12px;
  line-height: 1.6;
  max-width: 680px;
  margin-left: auto;
  margin-right: auto;
}
.empty-list {
  text-align: left;
  display: inline-block;
  margin: 8px 0 12px 0;
  padding-left: 16px;
}
.empty-cta-button {
  padding: 8px 12px;
  border-radius: 6px;
  border: 1px solid #1677ff;
  background: #1677ff;
  color: #fff;
  cursor: pointer;
}

.list-ul {
  list-style: none;
  padding: 0;
  margin: 0;
  max-width: 800px;
}
.list-item {
  display: flex;
  gap: 8px;
  align-items: center;
  padding: 6px 0;
  border-bottom: 1px solid #f0f0f0;
}
.item-title {
  flex: 1;
  font-size: 14px;
  color: #222;
}

/* badge 基础样式 */
.badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 4px 8px;
  border-radius: 999px;
  font-size: 13px;
  white-space: nowrap;
  min-height: 28px;
  box-sizing: border-box;
}

/* processing 风格（带 spinner）*/
.badge.processing {
  background: #fff7e6;
  color: #ad6a00;
  border: 1px solid #ffe7ba;
}

/* ready 风格 */
.badge.ready {
  background: #f6ffed;
  color: #237804;
  border: 1px solid #b7eb8f;
}

/* 小圆形 spinner */
.spinner {
  width: 14px;
  height: 14px;
  border: 2px solid rgba(0, 0, 0, 0.12);
  border-top-color: rgba(0, 0, 0, 0.36);
  border-radius: 50%;
  display: inline-block;
  box-sizing: border-box;
  animation: spin 0.9s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

/* 文字对齐微调 */
.badge-text {
  line-height: 1;
}
</style>
