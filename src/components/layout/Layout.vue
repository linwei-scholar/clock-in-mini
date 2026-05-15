<template>
  <div class="layout-container">
    <header class="header" :class="{ 'is-mobile': isMobile }">
      <div class="header-content">
        <div class="logo" @click="router.push('/dashboard')">
          <el-icon :size="24"><Clock /></el-icon>
          <span class="logo-text">打卡系统</span>
        </div>

        <nav class="nav-menu" v-if="!isMobile">
          <router-link
            v-for="item in navItems"
            :key="item.path"
            :to="item.path"
            class="nav-item"
            :class="{ active: isActive(item.path) }"
          >
            <el-icon><component :is="item.icon" /></el-icon>
            <span>{{ item.title }}</span>
          </router-link>
        </nav>

        <div class="user-menu">
          <el-dropdown trigger="click" v-if="!isMobile">
            <div class="user-info">
              <el-avatar :size="32" :icon="UserFilled" />
              <span class="username">{{ username }}</span>
              <el-icon><ArrowDown /></el-icon>
            </div>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item @click="router.push('/settings')">
                  <el-icon><Setting /></el-icon>
                  个人设置
                </el-dropdown-item>
                <el-dropdown-item @click="router.push('/admin')" v-if="isAdmin">
                  <el-icon><User /></el-icon>
                  管理员
                </el-dropdown-item>
                <el-dropdown-item divided @click="handleLogout">
                  <el-icon><SwitchButton /></el-icon>
                  退出登录
                </el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
          <el-icon v-else :size="24" @click="showMobileMenu = true"><UserFilled /></el-icon>
        </div>
      </div>
    </header>

    <main class="main-content">
      <router-view v-slot="{ Component, route }">
        <keep-alive :include="keepAliveRoutes" :exclude="excludeRoutes" :max="10">
          <component :is="Component" :key="route.fullPath" />
        </keep-alive>
      </router-view>
    </main>

    <nav class="mobile-nav" v-if="isMobile">
      <router-link
        v-for="item in mobileNavItems"
        :key="item.path"
        :to="item.path"
        class="mobile-nav-item"
        :class="{ active: isActive(item.path) }"
      >
        <el-icon :size="24"><component :is="item.icon" /></el-icon>
        <span class="nav-text">{{ item.title }}</span>
      </router-link>
    </nav>

    <el-drawer
      v-model="showMobileMenu"
      direction="rtl"
      size="60%"
      :show-close="false"
      :with-header="false"
    >
      <div class="mobile-menu">
        <div class="mobile-user-info">
          <el-avatar :size="64" :icon="UserFilled" />
          <div class="user-details">
            <span class="username">{{ username }}</span>
            <el-tag size="small" type="info">用户</el-tag>
          </div>
        </div>

        <div class="mobile-menu-list">
          <router-link
            v-for="item in navItems"
            :key="item.path"
            :to="item.path"
            class="mobile-menu-item"
            :class="{ active: isActive(item.path) }"
            @click="showMobileMenu = false"
          >
            <el-icon><component :is="item.icon" /></el-icon>
            <span>{{ item.title }}</span>
          </router-link>
        </div>

        <div class="mobile-menu-footer">
          <el-button type="danger" @click="handleLogout" plain>
            <el-icon><SwitchButton /></el-icon>
            退出登录
          </el-button>
        </div>
      </div>
    </el-drawer>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { ElMessageBox, ElMessage } from 'element-plus'
import { useAuthStore } from '@/stores/authStore'
import { usePlanStore } from '@/stores/planStore'
import { useRecordStore } from '@/stores/recordStore'
import { useTagStore } from '@/stores/tagStore'
import {
  Clock,
  HomeFilled,
  List,
  Calendar,
  DataAnalysis,
  PriceTag,
  Download,
  Setting,
  User,
  UserFilled,
  ArrowDown,
  SwitchButton
} from '@element-plus/icons-vue'

const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()
const planStore = usePlanStore()
const recordStore = useRecordStore()
const tagStore = useTagStore()
const showMobileMenu = ref(false)
const windowWidth = ref(window.innerWidth)

const isMobile = computed(() => windowWidth.value < 768)

const username = computed(() => authStore.user?.username || localStorage.getItem('username') || '用户')
const isAdmin = computed(() => localStorage.getItem('isAdmin') === 'true')

const keepAliveRoutes = ['Dashboard', 'Plans', 'Records', 'Calendar', 'Statistics']
const excludeRoutes = ['PlanDetail', 'PlanCreate', 'PlanEdit', 'RecordEdit', 'Admin']

const navItems = [
  { path: '/dashboard', title: '首页', icon: 'HomeFilled' },
  { path: '/plans', title: '打卡计划', icon: 'List' },
  { path: '/records', title: '打卡记录', icon: 'Document' },
  { path: '/calendar', title: '日历视图', icon: 'Calendar' },
  { path: '/statistics', title: '统计分析', icon: 'DataAnalysis' },
  { path: '/tags', title: '标签管理', icon: 'PriceTag' }
]

const mobileNavItems = [
  { path: '/dashboard', title: '首页', icon: 'HomeFilled' },
  { path: '/plans', title: '计划', icon: 'List' },
  { path: '/records', title: '记录', icon: 'Document' },
  { path: '/calendar', title: '日历', icon: 'Calendar' },
  { path: '/statistics', title: '统计', icon: 'DataAnalysis' },
  { path: '/settings', title: '设置', icon: 'Setting' }
]

const isActive = (path) => {
  if (path === '/dashboard') {
    return route.path === '/dashboard'
  }
  return route.path.startsWith(path)
}

const handleLogout = async () => {
  showMobileMenu.value = false
  try {
    await ElMessageBox.confirm('确定要退出登录吗？', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })

    planStore.clearPlans()
    recordStore.clearRecords()
    tagStore.clearTags()
    await authStore.logout()

    ElMessage.success('已退出登录')
    router.push('/login')
  } catch {
    // 用户取消
  }
}

const handleResize = () => {
  windowWidth.value = window.innerWidth
}

onMounted(() => {
  window.addEventListener('resize', handleResize)
})

onUnmounted(() => {
  window.removeEventListener('resize', handleResize)
})
</script>

<style lang="scss" scoped>
.layout-container {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.header {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  height: 60px;
  background: var(--bg-card);
  box-shadow: var(--shadow-light);
  z-index: 1000;

  &.is-mobile {
    .header-content {
      padding: 0 var(--spacing-md);
    }

    .logo-text {
      display: none;
    }
  }
}

.header-content {
  max-width: 1400px;
  margin: 0 auto;
  height: 100%;
  padding: 0 var(--spacing-lg);
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.logo {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  cursor: pointer;
  color: var(--primary-color);
  font-weight: bold;
  font-size: 18px;

  &:hover {
    opacity: 0.8;
  }
}

.logo-text {
  white-space: nowrap;
}

.nav-menu {
  display: flex;
  align-items: center;
  gap: var(--spacing-xs);
}

.nav-item {
  display: flex;
  align-items: center;
  gap: var(--spacing-xs);
  padding: var(--spacing-sm) var(--spacing-md);
  border-radius: var(--radius-medium);
  color: var(--text-regular);
  transition: all 0.3s ease;
  font-size: 14px;

  &:hover {
    background: var(--bg-hover);
    color: var(--primary-color);
  }

  &.active {
    background: var(--primary-color);
    color: white;

    &:hover {
      background: var(--primary-dark);
      color: white;
    }
  }
}

.user-menu {
  display: flex;
  align-items: center;
}

.user-info {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  padding: var(--spacing-xs) var(--spacing-sm);
  border-radius: var(--radius-medium);
  cursor: pointer;
  transition: background 0.3s ease;

  &:hover {
    background: var(--bg-hover);
  }
}

.username {
  font-size: 14px;
  color: var(--text-regular);
}

.main-content {
  flex: 1;
  margin-top: 60px;
  padding: var(--spacing-lg);
  background: var(--bg-page);
  min-height: calc(100vh - 60px);

  .layout-container:not(:has(.mobile-nav)) & {
    padding-bottom: calc(var(--spacing-lg) + 70px);
  }
}

.mobile-nav {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  height: 70px;
  background: var(--bg-card);
  box-shadow: 0 -2px 12px rgba(0, 0, 0, 0.08);
  display: flex;
  justify-content: space-around;
  align-items: center;
  padding: 0 var(--spacing-sm);
  z-index: 1000;
}

.mobile-nav-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  padding: var(--spacing-xs);
  color: var(--text-secondary);
  transition: color 0.3s ease;

  .nav-text {
    font-size: 11px;
  }

  &.active {
    color: var(--primary-color);
  }

  &:active {
    opacity: 0.7;
  }
}

.mobile-menu {
  height: 100%;
  display: flex;
  flex-direction: column;
  padding: var(--spacing-lg);
}

.mobile-user-info {
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
  padding-bottom: var(--spacing-lg);
  border-bottom: 1px solid var(--border-light);
  margin-bottom: var(--spacing-lg);
}

.user-details {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xs);

  .username {
    font-size: 18px;
    font-weight: bold;
    color: var(--text-primary);
  }
}

.mobile-menu-list {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xs);
}

.mobile-menu-item {
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
  padding: var(--spacing-md);
  border-radius: var(--radius-medium);
  color: var(--text-regular);
  transition: all 0.3s ease;

  &:hover,
  &.active {
    background: var(--bg-hover);
    color: var(--primary-color);
  }
}

.mobile-menu-footer {
  padding-top: var(--spacing-lg);
  border-top: 1px solid var(--border-light);

  .el-button {
    width: 100%;
  }
}
</style>
