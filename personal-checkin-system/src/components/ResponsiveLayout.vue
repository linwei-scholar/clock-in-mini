<template>
  <div class="responsive-layout">
    <el-container>
      <el-header v-if="!isMobile" class="desktop-header">
        <div class="header-content">
          <div class="header-left">
            <div class="logo" @click="$router.push('/dashboard')">
              <el-icon><Check /></el-icon>
              <span>打卡系统</span>
            </div>
          </div>
          
          <div class="header-center">
            <el-menu
              mode="horizontal"
              :default-active="activeMenu"
              router
              class="horizontal-menu"
            >
              <el-menu-item index="/dashboard">
                <el-icon><HomeFilled /></el-icon>
                <span>首页</span>
              </el-menu-item>
              <el-menu-item index="/plans">
                <el-icon><List /></el-icon>
                <span>打卡计划</span>
              </el-menu-item>
              <el-menu-item index="/calendar">
                <el-icon><Calendar /></el-icon>
                <span>打卡日历</span>
              </el-menu-item>
              <el-menu-item index="/statistics">
                <el-icon><DataAnalysis /></el-icon>
                <span>统计分析</span>
              </el-menu-item>
              <el-menu-item index="/tags">
                <el-icon><PriceTag /></el-icon>
                <span>标签管理</span>
              </el-menu-item>
              <el-menu-item index="/export">
                <el-icon><Download /></el-icon>
                <span>数据导出</span>
              </el-menu-item>
            </el-menu>
          </div>
          
          <div class="header-right">
            <el-dropdown @command="handleCommand">
              <span class="user-dropdown-link">
                <el-icon><User /></el-icon>
                <span class="username">{{ authStore.userInfo?.username }}</span>
                <el-icon><ArrowDown /></el-icon>
              </span>
              <template #dropdown>
                <el-dropdown-menu>
                  <el-dropdown-item command="settings">
                    <el-icon><Setting /></el-icon>
                    个人设置
                  </el-dropdown-item>
                  <el-dropdown-item command="admin" v-if="isAdmin">
                    <el-icon><Tools /></el-icon>
                    管理员
                  </el-dropdown-item>
                  <el-dropdown-item command="logout" divided>
                    <el-icon><SwitchButton /></el-icon>
                    退出登录
                  </el-dropdown-item>
                </el-dropdown-menu>
              </template>
            </el-dropdown>
          </div>
        </div>
      </el-header>

      <el-header v-if="isMobile" class="mobile-header">
        <div class="mobile-header-content">
          <div class="mobile-logo">
            <el-icon><Check /></el-icon>
            <span>打卡系统</span>
          </div>
          <el-dropdown @command="handleCommand">
            <span class="mobile-user-btn">
              <el-icon><User /></el-icon>
            </span>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item disabled>
                  <span>{{ authStore.userInfo?.username }}</span>
                </el-dropdown-item>
                <el-dropdown-item command="settings">
                  <el-icon><Setting /></el-icon>
                  个人设置
                </el-dropdown-item>
                <el-dropdown-item command="admin" v-if="isAdmin">
                  <el-icon><Tools /></el-icon>
                  管理员
                </el-dropdown-item>
                <el-dropdown-item command="logout" divided>
                  <el-icon><SwitchButton /></el-icon>
                  退出登录
                </el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </div>
      </el-header>

      <el-container v-if="!isMobile" class="desktop-container">
        <el-aside width="200px" class="desktop-aside">
          <el-menu
            :default-active="activeMenu"
            router
            class="sidebar-menu"
          >
            <el-menu-item index="/dashboard">
              <el-icon><HomeFilled /></el-icon>
              <span>首页</span>
            </el-menu-item>
            <el-menu-item index="/plans">
              <el-icon><List /></el-icon>
              <span>打卡计划</span>
            </el-menu-item>
            <el-menu-item index="/calendar">
              <el-icon><Calendar /></el-icon>
              <span>打卡日历</span>
            </el-menu-item>
            <el-menu-item index="/statistics">
              <el-icon><DataAnalysis /></el-icon>
              <span>统计分析</span>
            </el-menu-item>
            <el-menu-item index="/tags">
              <el-icon><PriceTag /></el-icon>
              <span>标签管理</span>
            </el-menu-item>
            <el-menu-item index="/export">
              <el-icon><Download /></el-icon>
              <span>数据导出</span>
            </el-menu-item>
          </el-menu>
        </el-aside>

        <el-main class="desktop-main">
          <slot></slot>
        </el-main>
      </el-container>

      <el-main v-if="isMobile" class="mobile-main">
        <slot></slot>
        <BottomNavigation />
      </el-main>
    </el-container>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import {
  User,
  ArrowDown,
  Setting,
  Tools,
  SwitchButton,
  HomeFilled,
  List,
  Calendar,
  DataAnalysis,
  PriceTag,
  Download,
  Check
} from '@element-plus/icons-vue'
import { useAuthStore } from '@/stores/authStore'
import BottomNavigation from './BottomNavigation.vue'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()

const isMobile = ref(false)
const isAdmin = ref(false)

const activeMenu = computed(() => {
  return route.path
})

const checkMobile = () => {
  isMobile.value = window.innerWidth < 768
}

const handleCommand = (command) => {
  switch (command) {
    case 'settings':
      router.push('/settings')
      break
    case 'admin':
      router.push('/admin')
      break
    case 'logout':
      authStore.logout()
      router.push('/login')
      ElMessage.success('已退出登录')
      break
  }
}

onMounted(() => {
  checkMobile()
  window.addEventListener('resize', checkMobile)
  
  if (authStore.userInfo) {
    isAdmin.value = authStore.userInfo.username === 'admin'
  }
})

onUnmounted(() => {
  window.removeEventListener('resize', checkMobile)
})
</script>

<style scoped>
.responsive-layout {
  width: 100%;
  height: 100vh;
}

.desktop-header {
  background-color: var(--bg-card);
  border-bottom: 1px solid var(--border-light);
  display: flex;
  align-items: center;
  padding: 0 var(--spacing-lg);
  height: var(--header-height);
}

.header-content {
  width: 100%;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.header-left {
  flex: 0 0 auto;
}

.logo {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  font-size: var(--font-size-lg);
  font-weight: bold;
  color: var(--primary-color);
  cursor: pointer;
  padding: var(--spacing-sm);
  border-radius: var(--border-radius-md);
  transition: background-color var(--transition-duration);
}

.logo:hover {
  background-color: var(--bg-hover);
}

.header-center {
  flex: 1;
  display: flex;
  justify-content: center;
}

.horizontal-menu {
  border: none;
  background: transparent;
}

.header-right {
  flex: 0 0 auto;
}

.user-dropdown-link {
  display: flex;
  align-items: center;
  gap: var(--spacing-xs);
  cursor: pointer;
  padding: var(--spacing-sm) var(--spacing-md);
  border-radius: var(--border-radius-md);
  transition: background-color var(--transition-duration);
}

.user-dropdown-link:hover {
  background-color: var(--bg-hover);
}

.username {
  max-width: 100px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.mobile-header {
  background-color: var(--bg-card);
  border-bottom: 1px solid var(--border-light);
  display: flex;
  align-items: center;
  padding: 0 var(--spacing-md);
  height: var(--header-height);
  position: sticky;
  top: 0;
  z-index: 100;
}

.mobile-header-content {
  width: 100%;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.mobile-logo {
  display: flex;
  align-items: center;
  gap: var(--spacing-xs);
  font-size: var(--font-size-md);
  font-weight: bold;
  color: var(--primary-color);
}

.mobile-user-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  cursor: pointer;
  transition: background-color var(--transition-duration);
}

.mobile-user-btn:hover {
  background-color: var(--bg-hover);
}

.desktop-container {
  height: calc(100vh - var(--header-height));
}

.desktop-aside {
  background-color: var(--bg-card);
  border-right: 1px solid var(--border-light);
  overflow-y: auto;
}

.sidebar-menu {
  border: none;
  background: transparent;
}

.desktop-main {
  padding: var(--spacing-lg);
  overflow-y: auto;
  background-color: var(--bg-page);
}

.mobile-main {
  padding: var(--spacing-md);
  overflow-y: auto;
  background-color: var(--bg-page);
  min-height: calc(100vh - var(--header-height));
  padding-bottom: calc(var(--bottom-nav-height) + var(--spacing-lg));
}

@media (max-width: 768px) {
  .mobile-main {
    padding: var(--spacing-md);
  }
}

@media (min-width: 768px) and (max-width: 1199px) {
  .desktop-header {
    padding: 0 var(--spacing-md);
  }
}

@media (min-width: 1200px) {
  .desktop-header {
    padding: 0 var(--spacing-xl);
  }
  
  .desktop-main {
    padding: var(--spacing-xl);
  }
}
</style>
