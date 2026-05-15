<template>
  <nav class="bottom-navigation" :class="{ 'is-visible': isVisible }">
    <div class="nav-item-wrapper">
      <router-link
        v-for="item in navItems"
        :key="item.path"
        :to="item.path"
        class="nav-item"
        :class="{ 'is-active': isActive(item.path) }"
        @click="handleNavClick(item)"
      >
        <div class="nav-icon">
          <component :is="item.icon" />
          <span v-if="item.badge && item.badge > 0" class="nav-badge">
            {{ item.badge > 99 ? '99+' : item.badge }}
          </span>
        </div>
        <span class="nav-label">{{ item.label }}</span>
      </router-link>
    </div>
  </nav>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { useRoute } from 'vue-router'
import {
  HomeFilled,
  List,
  Calendar,
  DataAnalysis,
  User
} from '@element-plus/icons-vue'

const route = useRoute()
const isVisible = ref(true)

const navItems = ref([
  {
    path: '/dashboard',
    label: '首页',
    icon: HomeFilled,
    badge: 0
  },
  {
    path: '/plans',
    label: '计划',
    icon: List,
    badge: 0
  },
  {
    path: '/calendar',
    label: '日历',
    icon: Calendar,
    badge: 0
  },
  {
    path: '/statistics',
    label: '统计',
    icon: DataAnalysis,
    badge: 0
  },
  {
    path: '/settings',
    label: '我的',
    icon: User,
    badge: 0
  }
])

const isActive = (path) => {
  return route.path === path || route.path.startsWith(path + '/')
}

const handleNavClick = (item) => {
  const index = navItems.value.findIndex(nav => nav.path === item.path)
  if (index !== -1) {
    item.badge = 0
  }
}

const handleScroll = () => {
  const scrollTop = window.pageYOffset || document.documentElement.scrollTop || document.body.scrollTop
  const scrollHeight = document.documentElement.scrollHeight
  const clientHeight = document.documentElement.clientHeight

  if (scrollTop > 100) {
    isVisible.value = false
  } else {
    isVisible.value = true
  }

  if (scrollTop + clientHeight >= scrollHeight - 50) {
    isVisible.value = true
  }
}

const isMobile = () => {
  return window.innerWidth < 768
}

onMounted(() => {
  if (isMobile()) {
    window.addEventListener('scroll', handleScroll)
  }
})

onUnmounted(() => {
  window.removeEventListener('scroll', handleScroll)
})

watch(() => route.path, () => {
  if (isMobile()) {
    isVisible.value = true
  }
})
</script>

<style scoped>
.bottom-navigation {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  height: var(--bottom-nav-height);
  background-color: var(--bg-card);
  border-top: 1px solid var(--border-light);
  box-shadow: 0 -2px 12px rgba(0, 0, 0, 0.08);
  z-index: 1000;
  transform: translateY(100%);
  transition: transform 0.3s ease-in-out;
  
  @media (min-width: 768px) {
    display: none;
  }
}

.bottom-navigation.is-visible {
  transform: translateY(0);
}

.nav-item-wrapper {
  display: flex;
  justify-content: space-around;
  align-items: center;
  height: 100%;
  max-width: 500px;
  margin: 0 auto;
}

.nav-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  flex: 1;
  padding: var(--spacing-xs);
  color: var(--text-secondary);
  text-decoration: none;
  transition: all 0.3s ease;
  min-height: 44px;
  touch-action: manipulation;
  user-select: none;
  -webkit-user-select: none;
}

.nav-item:active {
  transform: scale(0.95);
  background-color: var(--bg-hover);
  border-radius: var(--border-radius-md);
}

.nav-item.is-active {
  color: var(--primary-color);
}

.nav-icon {
  position: relative;
  font-size: 22px;
  margin-bottom: 2px;
}

.nav-badge {
  position: absolute;
  top: -8px;
  right: -10px;
  background-color: var(--danger-color);
  color: white;
  font-size: 10px;
  padding: 2px 5px;
  border-radius: 10px;
  min-width: 18px;
  text-align: center;
  line-height: 1;
}

.nav-label {
  font-size: 11px;
  line-height: 1.2;
}

@media (max-width: 400px) {
  .nav-icon {
    font-size: 20px;
  }

  .nav-label {
    font-size: 10px;
  }
}
</style>
