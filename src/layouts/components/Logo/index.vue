<script lang="ts" setup>
import logo from "@@/assets/images/layouts/klogo255.png?url"
import logoText1 from "@@/assets/images/layouts/klogo-text-1.png?url"
import logoText2 from "@@/assets/images/layouts/klogo-text.png?url"
import { useLayoutMode } from "@@/composables/useLayoutMode"
import { onMounted } from "vue"

interface Props {
  collapse?: boolean
}

const { collapse = true } = defineProps<Props>()

const { isLeft, isTop } = useLayoutMode()

onMounted(() => {
  [logo, logoText1, logoText2].forEach((src) => {
    const img = new Image()
    img.src = src
  })
})
</script>

<template>
  <div class="layout-logo-container" :class="{ 'collapse': collapse, 'layout-mode-top': isTop }">
    <transition name="layout-logo-fade" mode="out-in">
      <router-link v-show="collapse" key="collapse" to="/">
        <img :src="logo" class="layout-logo">
      </router-link>
    </transition>
    <transition name="layout-logo-fade" mode="out-in">
      <router-link v-show="!collapse" key="expand" to="/">
        <img :src="!isLeft ? logoText2 : logoText1" class="layout-logo-text">
      </router-link>
    </transition>
  </div>
</template>

<style lang="scss" scoped>
.layout-logo-container {
  display: flex;
  align-items: center;
  justify-content: center;
  height: var(--v3-header-height);
  overflow: hidden;

  .layout-logo,
  .layout-logo-text {
    position: static;
    display: block;
    width: 100%;
    height: auto; /* 只按宽度缩放，保持比例 */
    max-height: 100%;
    object-fit: contain;
  }
}

.layout-mode-top {
  height: var(--v3-navigationbar-height);
  line-height: var(--v3-navigationbar-height);
}

.collapse {
  .layout-logo {
    display: inline-block;
    width: 100%;
    height: 100%;
  }
  .layout-logo-text {
    display: none;
  }
}
</style>
