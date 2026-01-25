<script lang="ts" setup>
import type { FormRules } from "element-plus"
import type { LoginRequestData } from "./apis/type"
import { Key, Loading, Lock, Picture, User } from "@element-plus/icons-vue"
import { useUserStore } from "@/pinia/stores/user"
import { loginApi } from "./apis"

const router = useRouter()
const route = useRoute()
const userStore = useUserStore()

/** 登录表单元素的引用 */
const loginFormRef = useTemplateRef("loginFormRef")

/** 登录按钮 Loading */
const loading = ref(false)

/** 验证码图片 URL */
const codeUrl = ref("")
/** 本地验证码文本 */
const captchaText = ref("")

/** 登录表单数据 */
const loginFormData: LoginRequestData = reactive({
  username: "admin",
  password: "12345678",
  code: ""
})

/** 登录表单校验规则 */
const loginFormRules: FormRules = {
  username: [
    { required: true, message: "请输入用户名", trigger: "blur" }
  ],
  password: [
    { required: true, message: "请输入密码", trigger: "blur" },
    { min: 8, max: 16, message: "长度在 8 到 16 个字符", trigger: "blur" }
  ],
  code: [
    { required: true, message: "请输入验证码", trigger: "blur" }
  ]
}

/** 登录 */
function handleLogin() {
  loginFormRef.value?.validate((valid) => {
    if (!valid) {
      ElMessage.error("表单校验不通过")
      return
    }

    // 本地验证码校验
    if (loginFormData.code.trim().toLowerCase() !== captchaText.value.toLowerCase()) {
      ElMessage.error("验证码错误")
      createCode()
      loginFormData.code = ""
      return
    }

    loading.value = true
    loginApi(loginFormData).then(({ data }) => {
      userStore.setToken(data.token)
      router.push(route.query.redirect ? decodeURIComponent(route.query.redirect as string) : "/")
    }).catch(() => {
      createCode()
      loginFormData.password = ""
      loginFormData.code = ""
    }).finally(() => {
      loading.value = false
    })
  })
}

// 生成本地验证码
function generateCaptchaText(len = 4) {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"
  let result = ""
  for (let i = 0; i < len; i++) {
    result += chars[Math.floor(Math.random() * chars.length)]
  }
  return result
}

function buildCaptchaSvg(text: string) {
  const svg = `
<svg xmlns="http://www.w3.org/2000/svg" width="104" height="40">
  <rect width="100%" height="100%" fill="#f5f7fa"/>
  <text x="52" y="26" text-anchor="middle" font-size="18" font-family="Arial" fill="#1f2d3d" letter-spacing="3">
    ${text}
  </text>
  <line x1="6" y1="8" x2="98" y2="32" stroke="#dcdfe6" />
  <line x1="8" y1="30" x2="96" y2="6" stroke="#dcdfe6" />
</svg>`.trim()

  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`
}

/** 创建验证码（本地生成） */
function createCode() {
  loginFormData.code = ""
  const text = generateCaptchaText(4)
  captchaText.value = text
  codeUrl.value = buildCaptchaSvg(text)
}

// 初始化验证码
createCode()
</script>

<template>
  <div class="login-container">
    <div class="login-card">
      <div class="brand">
        <img class="brand-logo" src="@@/assets/images/layouts/klogo-text-1.png" alt="logo">
      </div>
      <div class="form-area">
        <el-form
          ref="loginFormRef"
          :model="loginFormData"
          :rules="loginFormRules"
          @keyup.enter="handleLogin"
        >
          <el-form-item prop="username">
            <el-input
              v-model.trim="loginFormData.username"
              placeholder="用户名"
              type="text"
              tabindex="1"
              :prefix-icon="User"
              size="large"
            />
          </el-form-item>

          <el-form-item prop="password">
            <el-input
              v-model.trim="loginFormData.password"
              placeholder="密码"
              type="password"
              tabindex="2"
              :prefix-icon="Lock"
              size="large"
              show-password
            />
          </el-form-item>

          <el-form-item prop="code">
            <el-input
              v-model.trim="loginFormData.code"
              placeholder="验证码"
              type="text"
              tabindex="3"
              :prefix-icon="Key"
              maxlength="7"
              size="large"
            >
              <template #append>
                <el-image :src="codeUrl" draggable="false" @click="createCode">
                  <template #placeholder>
                    <el-icon>
                      <Picture />
                    </el-icon>
                  </template>
                  <template #error>
                    <el-icon>
                      <Loading />
                    </el-icon>
                  </template>
                </el-image>
              </template>
            </el-input>
          </el-form-item>

          <el-button :loading="loading" type="primary" size="large" @click.prevent="handleLogin">
            登 录
          </el-button>
        </el-form>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.login-container {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(180deg, #f7f9fc 0%, #ffffff 100%);
  padding: 24px;
  position: relative;

  .theme-switch {
    position: fixed;
    top: 24px;
    right: 24px;
    cursor: pointer;
  }
}

.login-container {
  /* 默认主题（蓝白黑） */
  --login-bg-start: #f5f8ff;
  --login-bg-end: #ffffff;
  --login-card-bg: #ffffff;
  --login-border: #dbe6ff;
  --login-shadow: 0 10px 40px rgba(18, 42, 92, 0.12);
  --login-title: #0f1a2a;
  --login-subtitle: #5c6f90;

  background: linear-gradient(180deg, var(--login-bg-start) 0%, var(--login-bg-end) 100%);
}

.login-card {
  width: 520px;
  max-width: 94vw;
  padding: 40px 40px 42px;
  gap: 26px;
  border-radius: 18px;
  background: var(--login-card-bg);
  border: 1px solid var(--login-border);
  box-shadow: var(--login-shadow);
  display: flex;
  flex-direction: column;
}

.brand {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;

  .brand-logo {
    width: 100%;
    max-width: 360px;
    height: auto;
    display: block;
    object-fit: contain;
  }

  .brand-title {
    font-size: 18px;
    font-weight: 600;
    color: var(--login-title);
    letter-spacing: 0.2px;
  }

  .brand-subtitle {
    font-size: 13px;
    color: var(--login-subtitle);
  }
}

.form-area {
  :deep(.el-input-group__append) {
    padding: 0;
    overflow: hidden;
    .el-image {
      width: 104px;
      height: 40px;
      border-left: 0;
      user-select: none;
      cursor: pointer;
      text-align: center;
      background: var(--el-fill-color-light);
    }
  }

  .el-button {
    width: 100%;
    margin-top: 14px;
    margin-bottom: 12px;
  }

  .form-hint {
    margin-top: 10px;
    font-size: 12px;
    color: var(--el-text-color-secondary);
    text-align: center;
  }
}

/* 暗黑主题（蓝黑） */
:global(.dark) .login-container {
  --login-bg-start: #0b1220;
  --login-bg-end: #0f172a;
  --login-card-bg: #0f1b33;
  --login-border: rgba(70, 98, 150, 0.35);
  --login-shadow: 0 12px 36px rgba(0, 0, 0, 0.45);
  --login-title: #e6eefc;
  --login-subtitle: #9bb0d1;
}

:global(.dark) .login-card {
  border-color: var(--login-border);
  box-shadow: var(--login-shadow);
}
</style>
