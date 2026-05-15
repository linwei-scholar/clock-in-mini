<template>
  <div class="settings-container">
    <div class="page-header">
      <h1 class="page-title">个人设置</h1>
    </div>

    <el-row :gutter="20">
      <el-col :xs="24" :lg="16">
        <div class="card-container mb-lg">
          <h3 class="card-title">
            <el-icon><User /></el-icon>
            用户信息
          </h3>

          <el-form ref="profileFormRef" :model="profileForm" label-width="120px">
            <el-form-item label="用户名">
              <el-input v-model="profileForm.username" disabled />
            </el-form-item>

            <el-form-item label="账号创建时间">
              <el-input :value="formatDate(profileForm.createdAt)" disabled />
            </el-form-item>

            <el-form-item label="最后登录时间">
              <el-input :value="formatDate(profileForm.lastLoginAt)" disabled />
            </el-form-item>

            <el-form-item label="操作">
              <el-button type="primary" @click="handleChangePassword" size="default">
                <el-icon><Key /></el-icon>
                修改密码
              </el-button>
            </el-form-item>
          </el-form>
        </div>

        <div class="card-container mb-lg">
          <h3 class="card-title">
            <el-icon><Monitor /></el-icon>
            主题设置
          </h3>

          <div class="theme-selector">
            <div 
              class="theme-option"
              :class="{ active: currentTheme === 'light' }"
              @click="handleThemeChange('light')"
            >
              <div class="theme-preview light-preview">
                <div class="preview-header"></div>
                <div class="preview-content">
                  <div class="preview-sidebar"></div>
                  <div class="preview-main"></div>
                </div>
              </div>
              <div class="theme-label">
                <el-icon><Sunny /></el-icon>
                <span>亮色主题</span>
              </div>
            </div>

            <div 
              class="theme-option"
              :class="{ active: currentTheme === 'dark' }"
              @click="handleThemeChange('dark')"
            >
              <div class="theme-preview dark-preview">
                <div class="preview-header"></div>
                <div class="preview-content">
                  <div class="preview-sidebar"></div>
                  <div class="preview-main"></div>
                </div>
              </div>
              <div class="theme-label">
                <el-icon><Moon /></el-icon>
                <span>暗色主题</span>
              </div>
            </div>

            <div 
              class="theme-option"
              :class="{ active: currentTheme === 'auto' }"
              @click="handleThemeChange('auto')"
            >
              <div class="theme-preview auto-preview">
                <div class="preview-header"></div>
                <div class="preview-content">
                  <div class="preview-sidebar"></div>
                  <div class="preview-main"></div>
                </div>
              </div>
              <div class="theme-label">
                <el-icon><Setting /></el-icon>
                <span>跟随系统</span>
              </div>
            </div>
          </div>

          <div class="theme-color-section">
            <span class="color-label">主题色</span>
            <div class="color-picker-wrapper">
              <el-color-picker 
                v-model="settings.themeColor" 
                @change="handleThemeColorChange" 
                :predefine="colorPresets"
                show-alpha
              />
              <span class="color-value">{{ settings.themeColor }}</span>
              <el-button 
                size="small" 
                @click="resetThemeColor"
                :disabled="settings.themeColor === '#409EFF'"
              >
                重置
              </el-button>
            </div>
          </div>
        </div>

        <div class="card-container mb-lg">
          <h3 class="card-title">
            <el-icon><Calendar /></el-icon>
            默认日历视图
          </h3>

          <el-form label-width="120px">
            <el-form-item label="视图类型">
              <el-radio-group v-model="settings.defaultCalendarView" @change="handleCalendarViewChange">
                <el-radio label="day">日视图</el-radio>
                <el-radio label="week">周视图</el-radio>
                <el-radio label="month">月视图</el-radio>
                <el-radio label="year">年视图</el-radio>
              </el-radio-group>
            </el-form-item>
          </el-form>
        </div>

        <div class="card-container mb-lg">
          <h3 class="card-title">
            <el-icon><Bell /></el-icon>
            提醒设置
          </h3>

          <el-form label-width="140px">
            <el-form-item label="全局提醒开关">
              <el-switch v-model="reminderConfig.enabled" @change="handleReminderConfigChange" />
              <span class="form-help-text">开启后将根据计划设置和全局配置发送提醒通知</span>
            </el-form-item>

            <el-form-item v-if="reminderConfig.enabled" label="默认提醒时间">
              <el-time-picker
                v-model="defaultTimeValue"
                format="HH:mm"
                placeholder="选择时间"
                style="width: 150px"
                @change="handleReminderConfigChange"
              />
              <span class="form-help-text">新计划的默认提醒时间</span>
            </el-form-item>

            <el-form-item v-if="reminderConfig.enabled" label="提前提醒">
              <el-select v-model="reminderConfig.advanceNotice" style="width: 150px" @change="handleReminderConfigChange">
                <el-option :value="0" label="准时提醒" />
                <el-option :value="5" label="提前5分钟" />
                <el-option :value="15" label="提前15分钟" />
                <el-option :value="30" label="提前30分钟" />
              </el-select>
              <span class="form-help-text">在计划时间前多久发送提醒</span>
            </el-form-item>

            <el-form-item v-if="reminderConfig.enabled" label="勿扰时段开关">
              <el-switch v-model="reminderConfig.quietHours.enabled" @change="handleReminderConfigChange" />
              <span class="form-help-text">开启后在勿扰时段内不发送任何通知</span>
            </el-form-item>

            <el-form-item v-if="reminderConfig.enabled && reminderConfig.quietHours.enabled" label="勿扰时段">
              <el-time-picker
                v-model="quietHoursStartValue"
                format="HH:mm"
                placeholder="开始时间"
                style="width: 120px"
                @change="handleQuietHoursChange"
              />
              <span style="margin: 0 8px;">至</span>
              <el-time-picker
                v-model="quietHoursEndValue"
                format="HH:mm"
                placeholder="结束时间"
                style="width: 120px"
                @change="handleQuietHoursChange"
              />
              <span class="form-help-text">此时段内不会发送通知</span>
            </el-form-item>
          </el-form>
        </div>

        <div class="card-container mb-lg">
          <h3 class="card-title">
            <el-icon><Message /></el-icon>
            通知权限
          </h3>

          <div class="notification-status-card">
            <div class="notification-status-icon" :class="notificationPermission">
              <el-icon v-if="notificationPermission === 'granted'" color="#67C23A"><CircleCheckFilled /></el-icon>
              <el-icon v-else-if="notificationPermission === 'denied'" color="#F56C6C"><CircleCloseFilled /></el-icon>
              <el-icon v-else color="#E6A23C"><WarningFilled /></el-icon>
            </div>
            
            <div class="notification-status-info">
              <div class="status-title">
                浏览器通知权限
                <el-tag :type="notificationPermissionType" size="small">
                  {{ notificationPermissionText }}
                </el-tag>
              </div>
              <div class="status-description">
                <span v-if="notificationPermission === 'granted'">
                  已获得通知权限，可以正常接收打卡提醒通知
                </span>
                <span v-else-if="notificationPermission === 'denied'">
                  通知权限被拒绝，需要手动在浏览器设置中开启
                </span>
                <span v-else>
                  点击下方按钮申请通知权限
                </span>
              </div>
            </div>
          </div>

          <div class="notification-actions">
            <el-button 
              v-if="notificationPermission !== 'granted'" 
              type="primary"
              @click="requestNotificationPermission"
            >
              <el-icon><Bell /></el-icon>
              {{ notificationPermission === 'denied' ? '重新申请权限' : '请求通知权限' }}
            </el-button>
            
            <el-button 
              v-if="notificationPermission === 'granted'"
              type="success"
              @click="handleTestNotification"
            >
              <el-icon><Position /></el-icon>
              发送测试通知
            </el-button>

            <el-button 
              v-if="notificationPermission === 'denied'"
              type="warning"
              @click="showNotificationGuide"
            >
              <el-icon><QuestionFilled /></el-icon>
              查看开启指引
            </el-button>
          </div>

          <div v-if="notificationPermission === 'denied'" class="notification-guide">
            <el-alert type="warning" :closable="false" show-icon>
              <template #title>
                <strong>如何开启浏览器通知权限？</strong>
              </template>
            </el-alert>
            
            <el-steps direction="vertical" :space="60" class="guide-steps">
              <el-step 
                v-for="(step, index) in browserGuideSteps" 
                :key="index"
                :title="step.title"
                :description="step.description"
              />
            </el-steps>

            <div class="guide-actions">
              <el-button type="primary" @click="openBrowserSettings">
                <el-icon><Setting /></el-icon>
                打开浏览器设置
              </el-button>
              <el-button @click="refreshPermissionStatus">
                <el-icon><Refresh /></el-icon>
                刷新权限状态
              </el-button>
            </div>
          </div>

          <div class="notification-tips">
            <el-alert type="info" :closable="false" show-icon>
              <template #title>
                <strong>为什么要开启通知权限？</strong>
              </template>
              <ul class="tips-list">
                <li>准时收到打卡提醒，不错过任何一个打卡计划</li>
                <li>支持浏览器后台运行，关闭标签页也能收到通知</li>
                <li>提升打卡效率，养成良好习惯</li>
              </ul>
            </el-alert>
          </div>
        </div>

        <div class="card-container">
          <h3 class="card-title">
            <el-icon><FolderOpened /></el-icon>
            数据管理
          </h3>

          <div class="data-actions">
            <el-button @click="handleExportData">
              <el-icon><Download /></el-icon>
              导出数据
            </el-button>

            <el-button type="danger" plain @click="handleClearData">
              <el-icon><Delete /></el-icon>
              清除所有数据
            </el-button>
          </div>
        </div>
      </el-col>

      <el-col :xs="24" :lg="8">
        <div class="card-container mb-lg">
          <h3 class="card-title">
            <el-icon><User /></el-icon>
            账户信息
          </h3>

          <div class="account-info">
            <div class="info-item">
              <span class="info-label">用户ID</span>
              <span class="info-value">{{ userId }}</span>
            </div>
            <div class="info-item">
              <span class="info-label">计划数量</span>
              <span class="info-value">{{ planCount }} 个</span>
            </div>
            <div class="info-item">
              <span class="info-label">打卡记录</span>
              <span class="info-value">{{ recordCount }} 条</span>
            </div>
            <div class="info-item">
              <span class="info-label">标签数量</span>
              <span class="info-value">{{ tagCount }} 个</span>
            </div>
          </div>
        </div>

        <div class="card-container">
          <h3 class="card-title">
            <el-icon><Bell /></el-icon>
            提醒状态
          </h3>

          <div class="reminder-status">
            <div class="status-item">
              <span class="status-label">提醒引擎</span>
              <el-tag :type="reminderEngineActive ? 'success' : 'info'" size="small">
                {{ reminderEngineActive ? '运行中' : '未启动' }}
              </el-tag>
            </div>
            <div class="status-item">
              <span class="status-label">活跃计划</span>
              <span class="status-value">{{ activePlanCount }} 个</span>
            </div>
            <div class="status-item">
              <span class="status-label">已开启提醒</span>
              <span class="status-value">{{ enabledReminderCount }} 个</span>
            </div>
            <div class="status-item">
              <span class="status-label">当前状态</span>
              <el-tag :type="currentInQuietHours ? 'warning' : 'success'" size="small">
                {{ currentInQuietHours ? '勿扰时段' : '正常' }}
              </el-tag>
            </div>
          </div>
        </div>
      </el-col>
    </el-row>

    <el-dialog
      v-model="passwordDialogVisible"
      title="修改密码"
      width="500px"
    >
      <el-form 
        ref="passwordFormRef"
        :model="passwordForm"
        :rules="passwordRules"
        label-width="100px"
      >
        <el-form-item label="当前密码" prop="currentPassword">
          <el-input 
            v-model="passwordForm.currentPassword" 
            type="password" 
            placeholder="请输入当前密码"
            show-password
          />
        </el-form-item>

        <el-form-item label="新密码" prop="newPassword">
          <el-input 
            v-model="passwordForm.newPassword" 
            type="password" 
            placeholder="请输入新密码（6-20位，包含字母和数字）"
            show-password
          />
        </el-form-item>

        <el-form-item label="确认密码" prop="confirmPassword">
          <el-input 
            v-model="passwordForm.confirmPassword" 
            type="password" 
            placeholder="请再次输入新密码"
            show-password
          />
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="passwordDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSubmitPassword" :loading="passwordLoading">
          确认修改
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, onUnmounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { 
  Download, 
  Delete,
  User,
  Key,
  Monitor,
  Sunny,
  Moon,
  Setting,
  Calendar,
  Bell,
  Message,
  CircleCheckFilled,
  CircleCloseFilled,
  WarningFilled,
  Position,
  QuestionFilled,
  Refresh,
  FolderOpened
} from '@element-plus/icons-vue'
import { 
  initReminderEngine, 
  updateReminderConfig, 
  updateReminderPlans,
  requestNotificationPermission as requestPerm,
  showBrowserNotification,
  destroyReminderEngine
} from '@/utils/reminder'
import { useAuthStore } from '@/stores/authStore'

const profileFormRef = ref(null)
const passwordFormRef = ref(null)
const userId = ref('')
const planCount = ref(0)
const recordCount = ref(0)
const tagCount = ref(0)
const activePlanCount = ref(0)
const enabledReminderCount = ref(0)
const reminderEngineActive = ref(false)
const currentInQuietHours = ref(false)
const passwordDialogVisible = ref(false)
const passwordLoading = ref(false)

const notificationPermission = ref('default')
const defaultTimeValue = ref(new Date())
const quietHoursStartValue = ref(new Date())
const quietHoursEndValue = ref(new Date())

const currentTheme = ref('light')
const colorPresets = [
  '#409EFF',
  '#67C23A',
  '#E6A23C',
  '#F56C6C',
  '#909399',
  '#9B59B6',
  '#00BCD4',
  '#FF5722'
]

const browserGuideSteps = ref([])

const reminderConfig = reactive({
  enabled: true,
  defaultTime: '09:00',
  quietHours: {
    enabled: true,
    start: '22:00',
    end: '08:00'
  },
  advanceNotice: 0
})

const profileForm = reactive({
  username: '',
  createdAt: '',
  lastLoginAt: ''
})

const settings = reactive({
  defaultCalendarView: 'month',
  themeColor: '#409EFF',
  theme: 'light'
})

const passwordForm = reactive({
  currentPassword: '',
  newPassword: '',
  confirmPassword: ''
})

const passwordRules = reactive<any>({
  currentPassword: [
    { required: true, message: '请输入当前密码', trigger: 'blur' }
  ],
  newPassword: [
    { required: true, message: '请输入新密码', trigger: 'blur' },
    { min: 6, max: 20, message: '密码长度在6-20位之间', trigger: 'blur' },
    { pattern: /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d@$!%*#?&]/, message: '密码必须包含字母和数字', trigger: 'blur' }
  ],
  confirmPassword: [
    { required: true, message: '请再次输入新密码', trigger: 'blur' },
    {
      validator: (rule, value, callback) => {
        if (value !== passwordForm.newPassword) {
          callback(new Error('两次输入的密码不一致'))
        } else {
          callback()
        }
      },
      trigger: 'blur'
    }
  ]
})

const notificationPermissionText = computed(() => {
  const permissionMap = {
    default: '未决定',
    granted: '已授权',
    denied: '已拒绝'
  }
  return permissionMap[notificationPermission.value] || '未知'
})

const notificationPermissionType = computed(() => {
  const typeMap = {
    default: 'warning',
    granted: 'success',
    denied: 'danger'
  }
  return typeMap[notificationPermission.value] || 'info'
})

let destroyReminder = null
const authStore = useAuthStore()

const generateBrowserGuideSteps = () => {
  const userAgent = navigator.userAgent.toLowerCase()
  
  if (userAgent.includes('chrome') || userAgent.includes('edg')) {
    browserGuideSteps.value = [
      { title: '打开浏览器设置', description: '点击浏览器右上角的菜单按钮（三个点）' },
      { title: '进入设置页面', description: '滚动到页面底部，点击"设置"' },
      { title: '找到隐私和安全', description: '在左侧菜单中点击"隐私和安全"' },
      { title: '进入网站设置', description: '点击"网站设置"' },
      { title: '找到通知权限', description: '滚动到"权限"部分，点击"通知"' },
      { title: '修改权限设置', description: '将权限改为"允许"或移除阻止的网站' }
    ]
  } else if (userAgent.includes('firefox')) {
    browserGuideSteps.value = [
      { title: '打开设置', description: '点击浏览器右上角的菜单按钮（三条横线）' },
      { title: '进入隐私与安全', description: '在左侧菜单中点击"隐私与安全"' },
      { title: '找到通知设置', description: '滚动到"权限"部分，点击"通知"旁边的"设置..."' },
      { title: '修改权限设置', description: '将权限改为"允许"或移除阻止的网站' }
    ]
  } else if (userAgent.includes('safari')) {
    browserGuideSteps.value = [
      { title: '打开Safari偏好设置', description: '在Safari菜单中点击"偏好设置..."' },
      { title: '进入网站标签页', description: '点击"网站"标签' },
      { title: '找到通知', description: '在左侧菜单中滚动到"通知"部分' },
      { title: '修改权限设置', description: '选择允许通知的网站或删除阻止项' }
    ]
  } else {
    browserGuideSteps.value = [
      { title: '查找浏览器设置', description: '在浏览器右上角找到设置或选项按钮' },
      { title: '找到隐私设置', description: '在设置菜单中找到"隐私"或"权限"选项' },
      { title: '找到通知设置', description: '在权限设置中找到"通知"或"推送消息"' },
      { title: '允许通知', description: '将当前网站的通知权限改为"允许"' }
    ]
  }
}

const formatDate = (date) => {
  if (!date) return '-'
  return new Date(date).toLocaleString('zh-CN')
}

const handleThemeChange = async (theme) => {
  currentTheme.value = theme
  settings.theme = theme
  
  if (theme === 'auto') {
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
    document.documentElement.setAttribute('data-theme', prefersDark ? 'dark' : 'light')
    document.body.classList.remove('light-theme', 'dark-theme')
    document.body.classList.add(prefersDark ? 'dark-theme' : 'light-theme')
  } else {
    document.documentElement.setAttribute('data-theme', theme)
    document.body.classList.remove('light-theme', 'dark-theme')
    document.body.classList.add(`${theme}-theme`)
  }
  
  await saveSettings()
  ElMessage.success(`已切换到${theme === 'light' ? '亮色' : theme === 'dark' ? '暗色' : '自动'}主题`)
}

const handleThemeColorChange = (color) => {
  if (color) {
    document.documentElement.style.setProperty('--primary-color', color)
  }
  saveSettings()
}

const resetThemeColor = () => {
  settings.themeColor = '#409EFF'
  document.documentElement.style.setProperty('--primary-color', '#409EFF')
  saveSettings()
  ElMessage.success('主题色已重置')
}

const handleCalendarViewChange = async () => {
  await saveSettings()
  ElMessage.success('默认日历视图已更新')
}

const loadUserData = async () => {
  const uid = localStorage.getItem('userId')
  if (uid) {
    userId.value = uid
    const users = JSON.parse(localStorage.getItem('users') || '[]')
    const user = users.find(u => u.id === uid)

    if (user) {
      profileForm.username = user.username
      profileForm.createdAt = user.createdAt
      profileForm.lastLoginAt = user.lastLoginAt
      tagCount.value = user.tags?.length || 0
    }

    const plans = JSON.parse(localStorage.getItem(`plans_${uid}`) || '[]')
    const records = JSON.parse(localStorage.getItem(`records_${uid}`) || '[]')

    planCount.value = plans.length
    recordCount.value = records.length
    activePlanCount.value = plans.filter(p => p.status === 'active').length
    enabledReminderCount.value = plans.filter(p => p.reminderEnabled).length
  }

  const savedSettings = localStorage.getItem('userSettings')
  if (savedSettings) {
    const parsedSettings = JSON.parse(savedSettings)
    Object.assign(settings, parsedSettings)
    if (parsedSettings.reminderConfig) {
      Object.assign(reminderConfig, parsedSettings.reminderConfig)
      parseTimeValues()
    }
    if (parsedSettings.theme) {
      currentTheme.value = parsedSettings.theme
      if (parsedSettings.theme !== 'auto') {
        handleThemeChange(parsedSettings.theme)
      }
    }
  }

  const savedTheme = localStorage.getItem('themeColor')
  if (savedTheme) {
    settings.themeColor = savedTheme
    document.documentElement.style.setProperty('--primary-color', savedTheme)
  }

  checkNotificationPermission()
  initReminder()
  generateBrowserGuideSteps()
  
  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
    if (currentTheme.value === 'auto') {
      handleThemeChange('auto')
    }
  })
}

const parseTimeValues = () => {
  const [hours, minutes] = reminderConfig.defaultTime.split(':').map(Number)
  defaultTimeValue.value = new Date()
  defaultTimeValue.value.setHours(hours, minutes, 0, 0)

  const [startHours, startMinutes] = reminderConfig.quietHours.start.split(':').map(Number)
  quietHoursStartValue.value = new Date()
  quietHoursStartValue.value.setHours(startHours, startMinutes, 0, 0)

  const [endHours, endMinutes] = reminderConfig.quietHours.end.split(':').map(Number)
  quietHoursEndValue.value = new Date()
  quietHoursEndValue.value.setHours(endHours, endMinutes, 0, 0)
}

const handleReminderConfigChange = () => {
  const hours = defaultTimeValue.value.getHours().toString().padStart(2, '0')
  const minutes = defaultTimeValue.value.getMinutes().toString().padStart(2, '0')
  reminderConfig.defaultTime = `${hours}:${minutes}`
  
  saveSettings()
  updateReminderEngine()
}

const handleQuietHoursChange = () => {
  const [startHours, startMinutes] = quietHoursStartValue.value.toTimeString().slice(0, 5).split(':')
  const [endHours, endMinutes] = quietHoursEndValue.value.toTimeString().slice(0, 5).split(':')
  
  reminderConfig.quietHours.start = `${startHours}:${startMinutes}`
  reminderConfig.quietHours.end = `${endHours}:${endMinutes}`
  
  saveSettings()
  updateReminderEngine()
}

const saveSettings = async () => {
  try {
    const savedSettings = JSON.parse(localStorage.getItem('userSettings') || '{}')
    savedSettings.reminderConfig = { ...reminderConfig }
    savedSettings.defaultCalendarView = settings.defaultCalendarView
    savedSettings.themeColor = settings.themeColor
    savedSettings.theme = currentTheme.value
    localStorage.setItem('userSettings', JSON.stringify(savedSettings))
    
    if (authStore.isAuthenticated) {
      await authStore.updateSettings({
        theme: currentTheme.value,
        defaultCalendarView: settings.defaultCalendarView
      })
    }
  } catch (error) {
    console.error('保存设置失败:', error)
  }
}

const checkNotificationPermission = () => {
  if ('Notification' in window) {
    notificationPermission.value = Notification.permission
  }
}

const requestNotificationPermission = async () => {
  const granted = await requestPerm()
  if (granted) {
    notificationPermission.value = 'granted'
    ElMessage.success('通知权限已授权')
    showBrowserNotification('提醒设置', {
      body: '您已成功开启浏览器通知功能'
    })
  } else {
    notificationPermission.value = Notification.permission
    if (Notification.permission === 'denied') {
      ElMessage.warning('通知权限授权失败，请在浏览器设置中开启')
    } else {
      ElMessage.warning('通知权限授权失败')
    }
  }
}

const handleTestNotification = () => {
  showBrowserNotification('测试通知', {
    body: '这是一条测试通知，确认您已成功开启通知功能！'
  })
  ElMessage.success('测试通知已发送')
}

const showNotificationGuide = () => {
  generateBrowserGuideSteps()
}

const openBrowserSettings = () => {
  const userAgent = navigator.userAgent.toLowerCase()
  
  if (userAgent.includes('chrome') || userAgent.includes('edg')) {
    window.open('chrome://settings/content/notifications', '_blank')
  } else if (userAgent.includes('firefox')) {
    window.open('about:preferences#privacy', '_blank')
  } else if (userAgent.includes('safari')) {
    ElMessage.info('请在Safari菜单中打开"偏好设置" > "网站" > "通知"')
  } else {
    ElMessage.info('请在浏览器设置中手动找到通知权限设置')
  }
}

const refreshPermissionStatus = () => {
  checkNotificationPermission()
  ElMessage.success('权限状态已刷新')
}

const handleChangePassword = () => {
  passwordDialogVisible.value = true
  passwordForm.currentPassword = ''
  passwordForm.newPassword = ''
  passwordForm.confirmPassword = ''
}

const handleSubmitPassword = async () => {
  if (!passwordFormRef.value) return
  
  try {
    await passwordFormRef.value.validate()
    
    passwordLoading.value = true
    
    const users = JSON.parse(localStorage.getItem('users') || '[]')
    const uid = localStorage.getItem('userId')
    const userIndex = users.findIndex(u => u.id === uid)
    
    if (userIndex === -1) {
      ElMessage.error('用户未找到')
      return
    }
    
    const currentPasswordHash = await hashPassword(passwordForm.currentPassword)
    if (currentPasswordHash !== users[userIndex].passwordHash) {
      ElMessage.error('当前密码错误')
      return
    }
    
    const newPasswordHash = await hashPassword(passwordForm.newPassword)
    users[userIndex].passwordHash = newPasswordHash
    localStorage.setItem('users', JSON.stringify(users))
    
    ElMessage.success('密码修改成功')
    passwordDialogVisible.value = false
  } catch (error) {
    if (error !== false) {
      ElMessage.error('密码修改失败')
    }
  } finally {
    passwordLoading.value = false
  }
}

const hashPassword = async (password) => {
  const encoder = new TextEncoder()
  const data = encoder.encode(password)
  const hashBuffer = await crypto.subtle.digest('SHA-256', data)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
}

const initReminder = () => {
  const plans = JSON.parse(localStorage.getItem(`plans_${userId.value}`) || '[]')
  
  if (destroyReminder) {
    destroyReminder()
  }
  
  destroyReminder = initReminderEngine(reminderConfig, plans, (reminderInfo) => {
    const message = `该打卡了：${reminderInfo.planName}`
    ElMessage.info(message)
    
    if (notificationPermission.value === 'granted') {
      showBrowserNotification('打卡提醒', {
        body: message,
        tag: `reminder-${reminderInfo.planId}`,
        requireInteraction: true
      })
    }
  })
  
  reminderEngineActive.value = true
  updateCurrentQuietHoursStatus()
}

const updateReminderEngine = () => {
  updateReminderConfig({ ...reminderConfig })
  const plans = JSON.parse(localStorage.getItem(`plans_${userId.value}`) || '[]')
  updateReminderPlans(plans)
}

const updateCurrentQuietHoursStatus = () => {
  if (!reminderConfig.quietHours.enabled) {
    currentInQuietHours.value = false
    return
  }
  
  const now = new Date()
  const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`
  const quietStart = reminderConfig.quietHours.start
  const quietEnd = reminderConfig.quietHours.end
  
  const timeToMinutes = (time) => {
    const [h, m] = time.split(':').map(Number)
    return h * 60 + m
  }
  
  const currentMinutes = timeToMinutes(currentTime)
  const startMinutes = timeToMinutes(quietStart)
  const endMinutes = timeToMinutes(quietEnd)
  
  if (startMinutes <= endMinutes) {
    currentInQuietHours.value = currentMinutes >= startMinutes && currentMinutes <= endMinutes
  } else {
    currentInQuietHours.value = currentMinutes >= startMinutes || currentMinutes <= endMinutes
  }
}

const handleExportData = () => {
  const uid = localStorage.getItem('userId')
  if (!uid) {
    ElMessage.error('用户未登录')
    return
  }

  const plans = JSON.parse(localStorage.getItem(`plans_${uid}`) || '[]')
  const records = JSON.parse(localStorage.getItem(`records_${uid}`) || '[]')
  const users = JSON.parse(localStorage.getItem('users') || '[]')
  const user = users.find(u => u.id === uid)

  const content = JSON.stringify({
    user: {
      username: user?.username,
      createdAt: user?.createdAt
    },
    plans,
    records,
    tags: user?.tags || [],
    exportedAt: new Date().toISOString()
  }, null, 2)

  const blob = new Blob([content], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `checkin_backup_${new Date().toISOString().split('T')[0]}.json`
  link.click()
  URL.revokeObjectURL(url)

  ElMessage.success('导出成功')
}

const handleClearData = async () => {
  try {
    await ElMessageBox.confirm(
      '确定要清除所有数据吗？此操作不可恢复！',
      '警告',
      {
        confirmButtonText: '确定清除',
        cancelButtonText: '取消',
        type: 'error'
      }
    )

    const uid = localStorage.getItem('userId')
    if (uid) {
      localStorage.removeItem(`plans_${uid}`)
      localStorage.removeItem(`records_${uid}`)

      const users = JSON.parse(localStorage.getItem('users') || '[]')
      const userIndex = users.findIndex(u => u.id === uid)
      if (userIndex !== -1) {
        users[userIndex].tags = [
          { id: generateId(), name: '运动健身', icon: 'Running', color: '#409EFF', isDefault: true },
          { id: generateId(), name: '合理膳食', icon: 'Food', color: '#67C23A', isDefault: true },
          { id: generateId(), name: '阅读学习', icon: 'Books', color: '#E6A23C', isDefault: true },
          { id: generateId(), name: '习惯养成', icon: 'Star', color: '#909399', isDefault: true },
          { id: generateId(), name: '工作任务', icon: 'Briefcase', color: '#F56C6C', isDefault: true },
          { id: generateId(), name: '兴趣爱好', icon: 'Heart', color: '#9B59B6', isDefault: true }
        ]
        localStorage.setItem('users', JSON.stringify(users))
      }
    }

    ElMessage.success('数据已清除')
    loadUserData()
  } catch {
    // 用户取消
  }
}

const generateId = () => {
  return Date.now().toString(36) + Math.random().toString(36).substr(2)
}

onMounted(() => {
  loadUserData()
  
  setInterval(() => {
    updateCurrentQuietHoursStatus()
  }, 60000)
})

onUnmounted(() => {
  if (destroyReminder) {
    destroyReminder()
  }
  destroyReminderEngine()
})
</script>

<style lang="scss" scoped>
.settings-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: var(--spacing-lg);
}

.page-header {
  margin-bottom: var(--spacing-xl);
}

.page-title {
  font-size: 28px;
  font-weight: bold;
  margin: 0;
}

.card-title {
  font-size: 16px;
  font-weight: 600;
  margin-bottom: var(--spacing-lg);
  color: var(--text-primary);
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);

  .el-icon {
    font-size: 18px;
    color: var(--primary-color);
  }
}

.theme-selector {
  display: flex;
  gap: var(--spacing-lg);
  margin-bottom: var(--spacing-xl);
}

.theme-option {
  flex: 1;
  cursor: pointer;
  border: 2px solid var(--border-color);
  border-radius: var(--radius-medium);
  padding: var(--spacing-md);
  transition: all 0.3s;
  background: var(--bg-card);

  &:hover {
    border-color: var(--primary-color);
    transform: translateY(-2px);
    box-shadow: var(--shadow-light);
  }

  &.active {
    border-color: var(--primary-color);
    background: linear-gradient(135deg, rgba(64, 158, 255, 0.1), rgba(64, 158, 255, 0.05));
    box-shadow: 0 0 0 3px rgba(64, 158, 255, 0.1);
  }
}

.theme-preview {
  height: 80px;
  border-radius: var(--radius-small);
  margin-bottom: var(--spacing-md);
  overflow: hidden;

  .preview-header {
    height: 20px;
  }

  .preview-content {
    display: flex;
    height: 60px;

    .preview-sidebar {
      width: 20px;
    }

    .preview-main {
      flex: 1;
    }
  }

  &.light-preview {
    background: #ffffff;
    border: 1px solid #e4e7ed;

    .preview-header {
      background: #409EFF;
    }

    .preview-sidebar {
      background: #f5f7fa;
    }

    .preview-main {
      background: #ffffff;
    }
  }

  &.dark-preview {
    background: #1a1a2e;
    border: 1px solid #3a3a5c;

    .preview-header {
      background: #16213e;
    }

    .preview-sidebar {
      background: #0f0f1a;
    }

    .preview-main {
      background: #1a1a2e;
    }
  }

  &.auto-preview {
    background: linear-gradient(135deg, #ffffff 50%, #1a1a2e 50%);
    border: 1px solid #e4e7ed;

    .preview-header {
      background: linear-gradient(90deg, #409EFF 50%, #16213e 50%);
    }

    .preview-sidebar {
      background: linear-gradient(180deg, #f5f7fa 50%, #0f0f1a 50%);
    }

    .preview-main {
      background: linear-gradient(180deg, #ffffff 50%, #1a1a2e 50%);
    }
  }
}

.theme-label {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--spacing-sm);
  font-size: 14px;
  font-weight: 500;
  color: var(--text-primary);

  .el-icon {
    font-size: 18px;
  }
}

.theme-color-section {
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
  padding-top: var(--spacing-lg);
  border-top: 1px solid var(--border-light);
}

.color-label {
  font-size: 14px;
  font-weight: 500;
  color: var(--text-primary);
}

.color-picker-wrapper {
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
}

.color-value {
  font-size: 13px;
  color: var(--text-secondary);
  font-family: 'Courier New', monospace;
}

.notification-status-card {
  display: flex;
  align-items: center;
  gap: var(--spacing-lg);
  padding: var(--spacing-lg);
  background: var(--bg-page);
  border-radius: var(--radius-medium);
  margin-bottom: var(--spacing-lg);
}

.notification-status-icon {
  font-size: 48px;
  display: flex;
  align-items: center;
  justify-content: center;

  &.granted {
    color: var(--success-color);
  }

  &.denied {
    color: var(--danger-color);
  }

  &.default {
    color: var(--warning-color);
  }
}

.notification-status-info {
  flex: 1;

  .status-title {
    font-size: 16px;
    font-weight: 600;
    color: var(--text-primary);
    margin-bottom: var(--spacing-sm);
    display: flex;
    align-items: center;
    gap: var(--spacing-sm);
  }

  .status-description {
    font-size: 14px;
    color: var(--text-secondary);
    line-height: 1.6;
  }
}

.notification-actions {
  display: flex;
  gap: var(--spacing-md);
  margin-bottom: var(--spacing-lg);
  flex-wrap: wrap;
}

.notification-guide {
  padding: var(--spacing-lg);
  background: var(--bg-page);
  border-radius: var(--radius-medium);
  margin-bottom: var(--spacing-lg);
}

.guide-steps {
  margin: var(--spacing-lg) 0;
}

.guide-actions {
  display: flex;
  gap: var(--spacing-md);
  justify-content: center;
  margin-top: var(--spacing-lg);
}

.notification-tips {
  .tips-list {
    margin: var(--spacing-sm) 0 0 0;
    padding-left: var(--spacing-lg);
    font-size: 14px;
    line-height: 1.8;
    color: var(--text-secondary);
  }
}

.account-info {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-md);
}

.info-item {
  display: flex;
  justify-content: space-between;
  padding: var(--spacing-sm) 0;
  border-bottom: 1px solid var(--border-light);

  &:last-child {
    border-bottom: none;
  }
}

.info-label {
  font-size: 14px;
  color: var(--text-secondary);
}

.info-value {
  font-size: 14px;
  color: var(--text-primary);
  font-weight: 500;
}

.data-actions {
  display: flex;
  gap: var(--spacing-md);
}

.form-help-text {
  margin-left: 12px;
  font-size: 12px;
  color: var(--text-secondary);
}

.reminder-status {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-md);
}

.status-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--spacing-sm) 0;
}

.status-label {
  font-size: 14px;
  color: var(--text-secondary);
}

.status-value {
  font-size: 14px;
  color: var(--text-primary);
  font-weight: 500;
}

@media (max-width: 768px) {
  .theme-selector {
    flex-direction: column;
  }

  .notification-status-card {
    flex-direction: column;
    text-align: center;
  }

  .notification-actions {
    justify-content: center;
  }
}
</style>
