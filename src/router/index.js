import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/authStore'

const routes = [
  {
    path: '/login',
    name: 'Login',
    component: () => import('@/views/auth/Login.vue'),
    meta: { title: '登录', requiresAuth: false }
  },
  {
    path: '/register',
    name: 'Register',
    component: () => import('@/views/auth/Register.vue'),
    meta: { title: '注册', requiresAuth: false }
  },
  {
    path: '/',
    component: () => import('@/components/layout/Layout.vue'),
    redirect: '/dashboard',
    meta: { requiresAuth: true },
    children: [
      {
        path: 'dashboard',
        name: 'Dashboard',
        component: () => import('@/views/Dashboard.vue'),
        meta: { title: '首页', icon: 'HomeFilled' }
      },
      {
        path: 'plans',
        name: 'Plans',
        component: () => import('@/views/plans/Plans.vue'),
        meta: { title: '打卡计划', icon: 'List' }
      },
      {
        path: 'plans/create',
        name: 'PlanCreate',
        component: () => import('@/views/plans/PlanForm.vue'),
        meta: { title: '创建计划', icon: 'Plus' }
      },
      {
        path: 'plans/:id',
        name: 'PlanDetail',
        component: () => import('@/views/plans/PlanDetail.vue'),
        meta: { title: '计划详情', icon: 'Document' }
      },
      {
        path: 'plans/:id/edit',
        name: 'PlanEdit',
        component: () => import('@/views/plans/PlanForm.vue'),
        meta: { title: '编辑计划', icon: 'Edit' }
      },
      {
        path: 'records/:id/edit',
        name: 'RecordEdit',
        component: () => import('@/views/records/RecordEdit.vue'),
        meta: { title: '编辑记录', icon: 'Edit' }
      },
      {
        path: 'records',
        name: 'Records',
        component: () => import('@/views/records/Records.vue'),
        meta: { title: '打卡记录', icon: 'List' }
      },
      {
        path: 'calendar',
        name: 'Calendar',
        component: () => import('@/views/calendar/Calendar.vue'),
        meta: { title: '日历视图', icon: 'Calendar' }
      },
      {
        path: 'statistics',
        name: 'Statistics',
        component: () => import('@/views/statistics/Statistics.vue'),
        meta: { title: '统计分析', icon: 'DataAnalysis' }
      },
      {
        path: 'tags',
        name: 'Tags',
        component: () => import('@/views/tags/Tags.vue'),
        meta: { title: '标签管理', icon: 'PriceTag' }
      },
      {
        path: 'export',
        name: 'Export',
        component: () => import('@/views/export/Export.vue'),
        meta: { title: '数据导出', icon: 'Download' }
      },
      {
        path: 'settings',
        name: 'Settings',
        component: () => import('@/views/settings/Settings.vue'),
        meta: { title: '个人设置', icon: 'Setting' }
      },
      {
        path: 'admin',
        name: 'Admin',
        component: () => import('@/views/admin/Admin.vue'),
        meta: { title: '管理员', icon: 'User', requiresAdmin: true }
      }
    ]
  },
  {
    path: '/:pathMatch(.*)*',
    redirect: '/dashboard'
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

router.beforeEach(async (to, from, next) => {
  const authStore = useAuthStore()
  
  const isLoggedIn = authStore.isAuthenticated || localStorage.getItem('auth_token')
  const isAdmin = localStorage.getItem('isAdmin') === 'true'
  
  if (to.meta.requiresAuth !== false && !isLoggedIn) {
    next('/login')
  } else if (to.path === '/login' && isLoggedIn) {
    next('/dashboard')
  } else if (to.meta.requiresAdmin && !isAdmin) {
    next('/dashboard')
  } else {
    if (to.meta.title) {
      document.title = `${to.meta.title} - 个人打卡系统`
    }
    next()
  }
})

export default router
