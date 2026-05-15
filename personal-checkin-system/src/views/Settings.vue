<template>
  <ResponsiveLayout>
    <div class="settings-container">
      <el-card>
        <template #header>
          <span class="card-title">个人设置</span>
        </template>

        <el-tabs v-model="activeTab" class="responsive-tabs">
          <el-tab-pane label="基本信息" name="basic">
            <el-form :model="form" label-position="top">
              <el-form-item label="用户名">
                <el-input v-model="form.username" disabled />
              </el-form-item>
              <el-form-item label="注册时间">
                <el-input v-model="form.createdAt" disabled />
              </el-form-item>
              <el-form-item label="最后登录">
                <el-input v-model="form.lastLoginAt" disabled />
              </el-form-item>
            </el-form>
          </el-tab-pane>

          <el-tab-pane label="外观设置" name="appearance">
            <el-form :model="form" label-position="top">
              <el-form-item label="主题">
                <el-radio-group v-model="form.theme">
                  <el-radio label="light">浅色模式</el-radio>
                  <el-radio label="dark">深色模式</el-radio>
                </el-radio-group>
              </el-form-item>
              <el-form-item label="默认日历视图">
                <el-select v-model="form.defaultCalendarView" style="width: 100%">
                  <el-option label="日视图" value="day" />
                  <el-option label="周视图" value="week" />
                  <el-option label="月视图" value="month" />
                  <el-option label="年视图" value="year" />
                </el-select>
              </el-form-item>
            </el-form>
          </el-tab-pane>

          <el-tab-pane label="提醒设置" name="reminder">
            <el-form :model="form" label-position="top">
              <el-form-item label="启用提醒">
                <el-switch v-model="form.reminderEnabled" />
              </el-form-item>
              <el-form-item label="勿扰时段">
                <el-time-picker
                  v-model="quietHours"
                  is-range
                  range-separator="至"
                  start-placeholder="开始时间"
                  end-placeholder="结束时间"
                  placeholder="选择时间范围"
                  format="HH:mm"
                  style="width: 100%"
                />
              </el-form-item>
            </el-form>
          </el-tab-pane>

          <el-tab-pane label="通知权限" name="notification">
            <div class="notification-settings">
              <div class="permission-status-card">
                <el-row :gutter="20" align="middle">
                  <el-col :xs="24" :sm="4">
                    <div class="status-icon" :class="permissionInfo.status">
                      <el-icon v-if="permissionInfo.status === 'granted'" :size="48" color="#67c23a">
                        <Bell />
                      </el-icon>
                      <el-icon v-else-if="permissionInfo.status === 'denied'" :size="48" color="#f56c6c">
                        <BellFilled />
                      </el-icon>
                      <el-icon v-else :size="48" color="#e6a23c">
                        <MessageBox />
                      </el-icon>
                    </div>
                  </el-col>
                  <el-col :xs="24" :sm="20">
                    <h3>通知权限状态</h3>
                    <p class="status-label">
                      <el-tag :type="getStatusTagType(permissionInfo.status)" size="large">
                        {{ permissionInfo.message }}
                      </el-tag>
                    </p>
                    <p class="status-description">
                      {{ getStatusDescription(permissionInfo.status) }}
                    </p>
                  </el-col>
                </el-row>
              </div>

              <div class="action-buttons">
                <el-button 
                  v-if="permissionInfo.canRequest"
                  type="primary" 
                  size="large"
                  class="touch-button"
                  @click="handleRequestPermission"
                  :loading="requesting"
                >
                  <el-icon><Bell /></el-icon>
                  <span class="hidden-xs-only">申请通知权限</span>
                </el-button>
                
                <el-button 
                  v-if="permissionInfo.status === 'granted'"
                  type="success" 
                  size="large"
                  class="touch-button"
                  @click="handleTestNotification"
                >
                  <el-icon><VideoPlay /></el-icon>
                  <span class="hidden-xs-only">发送测试通知</span>
                </el-button>

                <el-button 
                  v-if="permissionInfo.status === 'denied'"
                  type="warning" 
                  size="large"
                  class="touch-button"
                  @click="showGuideDialog = true"
                >
                  <el-icon><Guide /></el-icon>
                  <span class="hidden-xs-only">查看开启指引</span>
                </el-button>
              </div>

              <el-dialog
                v-model="showGuideDialog"
                title="如何开启浏览器通知权限"
                width="90%"
                class="mobile-dialog"
              >
                <div class="guide-content">
                  <el-alert
                    type="info"
                    :closable="false"
                    style="margin-bottom: 20px;"
                  >
                    <template #title>
                      <strong>{{ browserInstructions.browserName }}</strong>
                    </template>
                  </el-alert>

                  <el-steps direction="vertical" :space="60" :active="browserInstructions.steps.length">
                    <el-step
                      v-for="(step, index) in browserInstructions.steps"
                      :key="index"
                      :title="'步骤 ' + (index + 1)"
                      :description="step"
                    />
                  </el-steps>

                  <div class="guide-actions" style="margin-top: 30px; text-align: center;">
                    <el-button type="primary" @click="handleOpenBrowserSettings" class="touch-button">
                      打开浏览器设置
                    </el-button>
                    <el-button @click="handleRefreshStatus" class="touch-button">
                      我已开启，刷新状态
                    </el-button>
                  </div>
                </div>
              </el-dialog>

              <el-card class="why-notification-card" style="margin-top: 20px;">
                <template #header>
                  <span>为什么要开启通知权限？</span>
                </template>
                <ul class="benefit-list">
                  <li>
                    <el-icon color="#409eff"><Check /></el-icon>
                    <span>定时提醒您打卡，养成良好习惯</span>
                  </li>
                  <li>
                    <el-icon color="#409eff"><Check /></el-icon>
                    <span>错过打卡日期时及时提醒，避免遗漏</span>
                  </li>
                  <li>
                    <el-icon color="#409eff"><Check /></el-icon>
                    <span>打卡成功/失败实时通知反馈</span>
                  </li>
                  <li>
                    <el-icon color="#409eff"><Check /></el-icon>
                    <span>重要计划到期提醒</span>
                  </li>
                </ul>
              </el-card>

              <div class="privacy-notice">
                <el-icon><InfoFilled /></el-icon>
                <span>隐私声明：通知功能仅用于打卡提醒，不会收集或上传您的个人信息。</span>
              </div>
            </div>
          </el-tab-pane>

          <el-tab-pane label="修改密码" name="password">
            <el-form :model="passwordForm" :rules="passwordRules" ref="passwordFormRef" label-position="top">
              <el-form-item label="当前密码" prop="oldPassword">
                <el-input
                  v-model="passwordForm.oldPassword"
                  type="password"
                  show-password
                  placeholder="请输入当前密码"
                />
              </el-form-item>
              <el-form-item label="新密码" prop="newPassword">
                <el-input
                  v-model="passwordForm.newPassword"
                  type="password"
                  show-password
                  placeholder="请输入新密码（6-20个字符）"
                />
              </el-form-item>
              <el-form-item label="确认新密码" prop="confirmPassword">
                <el-input
                  v-model="passwordForm.confirmPassword"
                  type="password"
                  show-password
                  placeholder="请再次输入新密码"
                />
              </el-form-item>
              <el-form-item>
                <el-button type="primary" @click="handleChangePassword" class="touch-button">
                  修改密码
                </el-button>
              </el-form-item>
            </el-form>
          </el-tab-pane>
        </el-tabs>

        <div class="save-button">
          <el-button type="primary" @click="handleSave" :loading="saving" class="touch-button">
            保存设置
          </el-button>
        </div>
      </el-card>
    </div>
  </ResponsiveLayout>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { 
  Bell, 
  BellFilled, 
  MessageBox, 
  Check, 
  InfoFilled,
  VideoPlay,
  Guide
} from '@element-plus/icons-vue'
import CryptoJS from 'crypto-js'
import { useAuthStore } from '@/stores/authStore'
import ResponsiveLayout from '@/components/ResponsiveLayout.vue'
import {
  checkPermission,
  requestPermission,
  showNotification,
  getBrowserInstructions,
  openBrowserSettings,
  getStatusDescription
} from '@/utils/notification'
import { showSuccess, showError, showWarning, showInfo } from '@/utils/message'

const authStore = useAuthStore()

const activeTab = ref('basic')
const saving = ref(false)
const passwordFormRef = ref(null)

const permissionInfo = ref({
  status: 'default',
  isSupported: true,
  canRequest: false,
  message: ''
})

const requesting = ref(false)
const showGuideDialog = ref(false)
const browserInstructions = ref(getBrowserInstructions())

const form = reactive({
  username: '',
  createdAt: '',
  lastLoginAt: '',
  theme: 'light',
  defaultCalendarView: 'month',
  reminderEnabled: true
})

const quietHours = ref([new Date(2024, 0, 1, 22, 0), new Date(2024, 0, 1, 8, 0)])

const passwordForm = reactive({
  oldPassword: '',
  newPassword: '',
  confirmPassword: ''
})

const getStatusTagType = (status) => {
  const typeMap = {
    'granted': 'success',
    'denied': 'danger',
    'default': 'warning',
    'unsupported': 'info'
  }
  return typeMap[status] || 'info'
}

const initPermissionInfo = () => {
  permissionInfo.value = checkPermission()
}

const handleRequestPermission = async () => {
  requesting.value = true
  try {
    const result = await requestPermission()
    
    if (result.success) {
      showSuccess('通知权限申请成功！您现在可以接收打卡提醒了。')
      initPermissionInfo()
    } else if (result.permission === 'denied') {
      showWarning('通知权限被拒绝。您可以在浏览器设置中手动开启。')
      showGuideDialog.value = true
      initPermissionInfo()
    } else {
      showInfo('您未选择授权，如需开启请重新点击"申请通知权限"。')
    }
  } catch (error) {
    showError('申请通知权限时发生错误')
  } finally {
    requesting.value = false
  }
}

const handleTestNotification = () => {
  const notification = showNotification('🔔 测试通知', {
    body: '这是一条测试通知，确认您已成功开启通知权限！',
    tag: 'test-notification',
    duration: 5000,
    onClick: () => {
      console.log('测试通知被点击')
    }
  })
  
  if (notification) {
    showSuccess('测试通知已发送！')
  } else {
    showError('发送测试通知失败')
  }
}

const handleOpenBrowserSettings = () => {
  openBrowserSettings()
}

const handleRefreshStatus = () => {
  initPermissionInfo()
  showGuideDialog.value = false
  if (permissionInfo.value.status === 'granted') {
    showSuccess('已检测到通知权限已开启！')
  } else if (permissionInfo.value.status === 'denied') {
    showWarning('通知权限仍被拒绝，请确认已在设置中开启。')
  }
}

const validateOldPassword = (rule, value, callback) => {
  if (!value) {
    callback(new Error('请输入当前密码'))
  } else {
    callback()
  }
}

const validateNewPassword = (rule, value, callback) => {
  if (!value) {
    callback(new Error('请输入新密码'))
  } else if (value.length < 6 || value.length > 20) {
    callback(new Error('密码长度应在6-20个字符之间'))
  } else if (!/^(?=.*[A-Za-z])(?=.*\d).+$/.test(value)) {
    callback(new Error('密码必须包含字母和数字'))
  } else {
    callback()
  }
}

const validateConfirmPassword = (rule, value, callback) => {
  if (!value) {
    callback(new Error('请再次输入新密码'))
  } else if (value !== passwordForm.newPassword) {
    callback(new Error('两次输入的密码不一致'))
  } else {
    callback()
  }
}

const passwordRules = {
  oldPassword: [{ validator: validateOldPassword, trigger: 'blur' }],
  newPassword: [{ validator: validateNewPassword, trigger: 'blur' }],
  confirmPassword: [{ validator: validateConfirmPassword, trigger: 'blur' }]
}

const loadSettings = () => {
  if (authStore.userInfo) {
    form.username = authStore.userInfo.username
    form.createdAt = new Date(authStore.userInfo.createdAt).toLocaleString()
    form.lastLoginAt = new Date(authStore.userInfo.lastLoginAt).toLocaleString()
    form.theme = authStore.userInfo.settings?.theme || 'light'
    form.defaultCalendarView = authStore.userInfo.settings?.defaultCalendarView || 'month'
    form.reminderEnabled = authStore.userInfo.settings?.reminderEnabled ?? true

    if (authStore.userInfo.settings?.quietHoursStart) {
      const [startHour, startMin] = authStore.userInfo.settings.quietHoursStart.split(':')
      const [endHour, endMin] = authStore.userInfo.settings.quietHoursEnd.split(':')
      quietHours.value = [
        new Date(2024, 0, 1, parseInt(startHour), parseInt(startMin)),
        new Date(2024, 0, 1, parseInt(endHour), parseInt(endMin))
      ]
    }
  }
}

const handleSave = () => {
  saving.value = true

  try {
    const users = JSON.parse(localStorage.getItem('users') || '[]')
    const userIndex = users.findIndex(u => u.id === authStore.userInfo.id)

    if (userIndex !== -1) {
      users[userIndex].settings = {
        theme: form.theme,
        defaultCalendarView: form.defaultCalendarView,
        reminderEnabled: form.reminderEnabled,
        quietHoursStart: `${quietHours.value[0].getHours()}:${quietHours.value[0].getMinutes()}`,
        quietHoursEnd: `${quietHours.value[1].getHours()}:${quietHours.value[1].getMinutes()}`
      }

      localStorage.setItem('users', JSON.stringify(users))
      localStorage.setItem('currentUser', JSON.stringify(users[userIndex]))

      authStore.userInfo = users[userIndex]

      showSuccess('设置保存成功')
    }
  } catch (error) {
    showError('保存失败')
  } finally {
    saving.value = false
  }
}

const handleChangePassword = async () => {
  if (!passwordFormRef.value) return

  try {
    await passwordFormRef.value.validate()
    
    const oldPasswordHash = CryptoJS.SHA256(passwordForm.oldPassword).toString()

    if (oldPasswordHash !== authStore.userInfo.passwordHash) {
      showError('当前密码错误')
      return
    }

    try {
      authStore.resetPassword(authStore.userInfo.id, passwordForm.newPassword)
      showSuccess('密码修改成功')

      passwordForm.oldPassword = ''
      passwordForm.newPassword = ''
      passwordForm.confirmPassword = ''
    } catch (error) {
      showError(error.message || '密码修改失败')
    }
  } catch (error) {
    // 表单验证失败，不需要额外处理
  }
}

onMounted(() => {
  loadSettings()
  initPermissionInfo()
})
</script>

<style scoped>
.settings-container {
  width: 100%;
  max-width: 800px;
  margin: 0 auto;
}

.card-title {
  font-size: var(--font-size-md);
  font-weight: bold;
}

@media (min-width: 768px) {
  .card-title {
    font-size: var(--font-size-lg);
  }
}

.responsive-tabs :deep(.el-tabs__header) {
  margin-bottom: var(--spacing-lg);
}

.responsive-tabs :deep(.el-tabs__nav-wrap::after) {
  height: 1px;
}

@media (max-width: 767px) {
  .responsive-tabs :deep(.el-tabs__item) {
    padding: 0 12px;
    font-size: var(--font-size-sm);
  }
  
  .responsive-tabs :deep(.el-tabs__nav) {
    display: flex;
    overflow-x: auto;
  }
  
  .responsive-tabs :deep(.el-tabs__nav-scroll) {
    overflow-x: auto;
    -webkit-overflow-scrolling: touch;
  }
}

.save-button {
  margin-top: var(--spacing-lg);
  padding-top: var(--spacing-lg);
  border-top: 1px solid var(--border-light);
  display: flex;
  justify-content: flex-end;
}

.notification-settings {
  padding: 10px 0;
}

.permission-status-card {
  background: linear-gradient(135deg, #f5f7fa 0%, #e4e8eb 100%);
  padding: 25px;
  border-radius: 12px;
  margin-bottom: 25px;
  border: 1px solid #e8ecf0;
}

.permission-status-card h3 {
  margin: 0 0 12px 0;
  font-size: 18px;
  color: #303133;
}

.status-label {
  margin: 10px 0;
}

.status-description {
  margin: 15px 0 0 0;
  color: #606266;
  font-size: 14px;
  line-height: 1.6;
}

.status-icon {
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 15px;
  background: white;
  border-radius: 50%;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  margin-bottom: 15px;
}

@media (min-width: 768px) {
  .status-icon {
    margin-bottom: 0;
  }
}

.status-icon.granted {
  background: linear-gradient(135deg, #67c23a 0%, #85ce61 100%);
}

.status-icon.denied {
  background: linear-gradient(135deg, #f56c6c 0%, #f78989 100%);
}

.status-icon.default {
  background: linear-gradient(135deg, #e6a23c 0%, #ebb563 100%);
}

.action-buttons {
  display: flex;
  gap: 15px;
  flex-wrap: wrap;
  margin-bottom: 20px;
}

@media (max-width: 767px) {
  .action-buttons {
    flex-direction: column;
  }
  
  .action-buttons .el-button {
    width: 100%;
  }
}

.guide-content {
  max-height: 60vh;
  overflow-y: auto;
}

.benefit-list {
  list-style: none;
  padding: 0;
  margin: 0;
}

.benefit-list li {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 0;
  border-bottom: 1px solid #ebeef5;
  color: #606266;
  font-size: 14px;
}

.benefit-list li:last-child {
  border-bottom: none;
}

.benefit-list li .el-icon {
  font-size: 18px;
  flex-shrink: 0;
}

.privacy-notice {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 20px;
  padding: 12px 15px;
  background: #f4f4f5;
  border-radius: 6px;
  color: #909399;
  font-size: 13px;
}

.privacy-notice .el-icon {
  font-size: 16px;
  flex-shrink: 0;
}

:deep(.el-step__title) {
  font-size: 14px;
  font-weight: 600;
}

:deep(.el-step__description) {
  font-size: 13px;
  color: #606266;
  line-height: 1.6;
}

@media (max-width: 768px) {
  .mobile-dialog {
    margin: 10px;
  }
  
  .mobile-dialog :deep(.el-dialog) {
    width: calc(100% - 20px) !important;
    max-width: 500px;
  }
}
</style>
