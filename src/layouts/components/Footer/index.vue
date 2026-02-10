<script lang="ts" setup>
const VITE_APP_TITLE = import.meta.env.VITE_APP_TITLE
</script>

<template>
  <footer class="layout-footer">
    <span>
      MIT License · © 2022-Present pany
    </span>
    <span class="divider">|</span>
    <span>
      {{ VITE_APP_TITLE }} · Maintained since 2025
    </span>
  </footer>
</template>

<style lang="scss" scoped>
.layout-footer {
  width: 100%;
  min-height: 50px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--el-text-color-placeholder);
}
.divider {
  margin: 0 8px; /* 左右空格就在这里控制 */
}
</style>
