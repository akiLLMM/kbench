<script lang="ts" setup>
import { BookOpen, ListTodo, MessageCircle, Plug } from "lucide-vue-next"
import WelcomeOverlay from "./components/WelcomeOverlay.vue"

defineOptions({
  name: "Dashboard"
})

const showWelcome = ref(
  localStorage.getItem("welcome_seen") !== "true"
)

function closeWelcome() {
  showWelcome.value = false
  localStorage.setItem("welcome_seen", "true")
}
</script>

<template>
  <WelcomeOverlay
    v-if="showWelcome"
    :targets="{
      knowledge: '.card-knowledge',
      chat: '.card-chat',
    }"
    @close="closeWelcome"
  />
  <div class="dashboard-container">
    <div class="dashboard-hero">
      <h1>AI Knowledge Workbench</h1>
      <p class="subtitle">
        一站式知识管理、RAG 对话与工具编排平台
      </p>
    </div>

    <div class="entry-grid">
      <div class="card card-knowledge">
        <div class="entry-card">
          <div class="entry-icon">
            <BookOpen class="lucide-icon" />
          </div>
          <div class="entry-title">
            Knowledge Base
          </div>
          <div class="entry-desc">
            管理知识库与文档资产
          </div>
          <div class="entry-cta">
            <router-link to="/knowledge">
              进入 →
            </router-link>
          </div>
        </div>
      </div>

      <div class="card card-chat">
        <div class="entry-card">
          <div class="entry-icon">
            <MessageCircle class="lucide-icon" />
          </div>
          <div class="entry-title">
            AI Chat
          </div>
          <div class="entry-desc">
            基于 RAG 的智能问答
          </div>
          <div class="entry-cta">
            <router-link to="/chat">
              进入 →
            </router-link>
          </div>
        </div>
      </div>

      <div class="entry-card">
        <div class="entry-icon">
          <Plug class="lucide-icon" />
        </div>
        <div class="entry-title">
          MCP Tools
        </div>
        <div class="entry-desc">
          可视化工具编排与调用
        </div>
        <div class="entry-cta">
          <router-link to="/mcp">
            进入 →
          </router-link>
        </div>
      </div>

      <div class="entry-card">
        <div class="entry-icon">
          <ListTodo class="lucide-icon" />
        </div>
        <div class="entry-title">
          Tasks & Logs
        </div>
        <div class="entry-desc">
          任务、日志与执行追踪
        </div>
        <div class="entry-cta">
          <router-link to="/tasks">
            进入 →
          </router-link>
        </div>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.dashboard-container {
  min-height: calc(100vh - var(--v3-header-height));
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 24px;
  padding: 32px 24px;
}

.dashboard-hero {
  text-align: center;

  h1 {
    margin: 0;
  }

  .subtitle {
    margin-top: 10px;
    color: var(--el-text-color-secondary);
  }
}

.entry-grid {
  width: min(900px, 94vw);
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 16px;
}

.entry-card {
  background: var(--el-bg-color);
  border: 1px solid var(--el-border-color-light);
  border-radius: 14px;
  padding: 18px 20px;
  box-shadow: var(--el-box-shadow-light);
  display: grid;
  gap: 6px;
  cursor: pointer;

  text-align: left;
  justify-items: start;

  &:hover {
    transform: translateY(-2px);
    box-shadow: var(--el-box-shadow);
  }

  .entry-icon {
    display: inline-flex;
    align-items: center;
    justify-content: center;

    align-self: start;
  }

  .entry-title {
    font-weight: 600;
  }

  .entry-desc {
    color: var(--el-text-color-secondary);
    font-size: 13px;
  }

  .entry-cta {
    margin-top: 4px;
    color: var(--el-color-primary);
    font-size: 13px;
  }
}

.lucide-icon {
  width: 22px;
  height: 22px;
  stroke-width: 1.75;
  color: var(--el-color-primary);
}

@media (max-width: 720px) {
  .entry-grid {
    grid-template-columns: 1fr;
  }
}
</style>
