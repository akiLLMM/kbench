import type { RouteRecordRaw } from "vue-router"
import { createRouter } from "vue-router"
import { routerConfig } from "@/router/config"
import { registerNavigationGuard } from "@/router/guard"
import { flatMultiLevelRoutes } from "./helper"

const Layouts = () => import("@/layouts/index.vue")

/**
 * @name static router
 * @description 除了 redirect/403/404/login 等隐藏页面，其他页面建议设置唯一的 Name 属性
 */
export const constantRoutes: RouteRecordRaw[] = [
  // 登录 / 重定向
  {
    path: "/login",
    component: () => import("@/pages/login/index.vue"),
    meta: {
      hidden: true
    }
  },
  {
    path: "/redirect",
    component: Layouts,
    meta: {
      hidden: true
    },
    children: [
      {
        path: ":path(.*)",
        component: () => import("@/pages/redirect/index.vue")
      }
    ]
  },
  // 业务路由
  // ================= Layout A：Dashboard区 =================
  {
    path: "/dashboard",
    component: Layouts,
    children: [
      {
        path: "",
        name: "Dashboard",
        component: () => import("@/pages/dashboard/index.vue"),
        meta: {
          title: "首页",
          svgIcon: "dashboard",
          affix: true
        }
      }
    ]
  },
  // ================= Layout B：业务功能区 =================
  {
    path: "/chat",
    component: Layouts,
    redirect: "/chat/index",
    children: [
      {
        path: "index",
        name: "Chat",
        component: () => import("@/pages/chat/index.vue"),
        meta: {
          title: "AI Chat",
          elIcon: "ChatDotRound"
        }
      }
    ]
  },
  {
    path: "/knowledge",
    component: Layouts,
    redirect: "/knowledge/index",
    children: [
      {
        path: "index",
        name: "Knowledge",
        component: () => import("@/pages/knowledge/index.vue"),
        meta: {
          title: "Knowledge Base",
          elIcon: "Collection"
        }
      }
    ]
  },
  {
    path: "/mcp",
    component: Layouts,
    redirect: "/mcp/index",
    children: [
      {
        path: "index",
        name: "MCP",
        component: () => import("@/pages/mcp/MCPTools.vue"),
        meta: {
          title: "MCP Tools",
          elIcon: "Tools"
        }
      }
    ]
  },
  {
    path: "/tasks",
    component: Layouts,
    redirect: "/tasks/index",
    children: [
      {
        path: "index",
        name: "Tasks",
        component: () => import("@/pages/tasks/TaskList.vue"),
        meta: {
          title: "Tasks / Logs",
          elIcon: "List"
        }
      }
    ]
  },
  // 错误页 403
  {
    path: "/403",
    component: () => import("@/pages/error/403.vue"),
    meta: {
      hidden: true
    }
  },
  // 兜底 404
  {
    path: "/404",
    component: () => import("@/pages/error/404.vue"),
    meta: {
      hidden: true
    },
    alias: "/:pathMatch(.*)*"
  }
]

/**
 * @name dynamic router
 * @description 用来放置有权限 (Roles 属性) 的路由
 * @description 必须带有唯一的 Name 属性
 */
export const dynamicRoutes: RouteRecordRaw[] = []

/** 路由实例 */
export const router = createRouter({
  history: routerConfig.history,
  routes: routerConfig.thirdLevelRouteCache ? flatMultiLevelRoutes(constantRoutes) : constantRoutes
})

/** 重置路由 */
export function resetRouter() {
  try {
    // 注意：所有动态路由路由必须带有 Name 属性，否则可能会不能完全重置干净
    router.getRoutes().forEach((route) => {
      const { name, meta } = route
      if (name && meta.roles?.length) {
        router.hasRoute(name) && router.removeRoute(name)
      }
    })
  } catch {
    // 强制刷新浏览器也行，只是交互体验不是很好
    location.reload()
  }
}

// 注册路由导航守卫
registerNavigationGuard(router)
