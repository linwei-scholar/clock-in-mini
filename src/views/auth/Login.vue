<template>
  <div class="login-container">
    <div class="login-box">
      <div class="login-header">
        <el-icon :size="48" color="#409EFF"><Clock /></el-icon>
        <h1>个人打卡系统</h1>
        <p>记录成长，养成好习惯</p>
      </div>

      <el-form
        ref="formRef"
        :model="form"
        :rules="rules"
        class="login-form"
        @submit.prevent="handleLogin"
      >
        <el-form-item prop="username">
          <el-input
            v-model="form.username"
            placeholder="请输入用户名"
            size="large"
            :prefix-icon="User"
            :disabled="isLocked"
          />
        </el-form-item>

        <el-form-item prop="password">
          <el-input
            v-model="form.password"
            type="password"
            placeholder="请输入密码"
            size="large"
            :prefix-icon="Lock"
            show-password
            :disabled="isLocked"
            @keyup.enter="handleLogin"
          />
        </el-form-item>

        <el-form-item>
          <el-button
            type="primary"
            size="large"
            :loading="loading"
            :disabled="isLocked"
            class="login-button"
            @click="handleLogin"
          >
            <span v-if="isLocked">{{ remainingTime }}秒后可重试</span>
            <span v-else>登录</span>
          </el-button>
        </el-form-item>
      </el-form>

      <div class="login-footer">
        <span>还没有账号？</span>
        <router-link to="/register">立即注册</router-link>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { Clock, User, Lock } from '@element-plus/icons-vue'
import { useAuthStore } from '@/stores/authStore'
import { useTagStore } from '@/stores/tagStore'
import { usePlanStore } from '@/stores/planStore'
import { useRecordStore } from '@/stores/recordStore'

const router = useRouter()
const authStore = useAuthStore()
const tagStore = useTagStore()
const planStore = usePlanStore()
const recordStore = useRecordStore()

const formRef = ref(null)
const loading = ref(false)
const remainingTime = ref(0)
const isLocked = ref(false)

const LOGIN_FAIL_LIMIT = 3
const LOCK_DURATION = 30

let lockTimer = null
let countdownTimer = null

const form = reactive({
  username: '',
  password: ''
})

const rules = {
  username: [
    { required: true, message: '请输入用户名', trigger: 'blur' }
  ],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' }
  ]
}

const getLoginFailCount = () => {
  return parseInt(localStorage.getItem('loginFailCount') || '0')
}

const setLoginFailCount = (count) => {
  localStorage.setItem('loginFailCount', count.toString())
}

const getLockEndTime = () => {
  return parseInt(localStorage.getItem('lockEndTime') || '0')
}

const setLockEndTime = (time) => {
  localStorage.setItem('lockEndTime', time.toString())
}

const clearLockState = () => {
  localStorage.removeItem('loginFailCount')
  localStorage.removeItem('lockEndTime')
  isLocked.value = false
  remainingTime.value = 0
  if (lockTimer) {
    clearTimeout(lockTimer)
    lockTimer = null
  }
  if (countdownTimer) {
    clearInterval(countdownTimer)
    countdownTimer = null
  }
}

const checkLockStatus = () => {
  const lockEndTime = getLockEndTime()
  const now = Date.now()
  
  if (lockEndTime > now) {
    isLocked.value = true
    remainingTime.value = Math.ceil((lockEndTime - now) / 1000)
    
    if (countdownTimer) {
      clearInterval(countdownTimer)
    }
    countdownTimer = setInterval(() => {
      const remaining = getLockEndTime() - Date.now()
      if (remaining <= 0) {
        clearLockState()
        ElMessage.warning('登录已解锁，请重新尝试')
      } else {
        remainingTime.value = Math.ceil(remaining / 1000)
      }
    }, 1000)
    
    return true
  }
  
  clearLockState()
  return false
}

const handleLoginFailure = () => {
  let failCount = getLoginFailCount()
  failCount++
  setLoginFailCount(failCount)
  
  if (failCount >= LOGIN_FAIL_LIMIT) {
    const lockEndTime = Date.now() + (LOCK_DURATION * 1000)
    setLockEndTime(lockEndTime)
    isLocked.value = true
    remainingTime.value = LOCK_DURATION
    
    if (countdownTimer) {
      clearInterval(countdownTimer)
    }
    countdownTimer = setInterval(() => {
      const remaining = getLockEndTime() - Date.now()
      if (remaining <= 0) {
        clearLockState()
        ElMessage.warning('登录已解锁，请重新尝试')
      } else {
        remainingTime.value = Math.ceil(remaining / 1000)
      }
    }, 1000)
    
    ElMessage.error(`连续登录失败次数过多，请等待 ${LOCK_DURATION} 秒后重试`)
  } else {
    ElMessage.error(`用户名或密码错误，剩余尝试次数：${LOGIN_FAIL_LIMIT - failCount}`)
  }
}

const handleLoginSuccess = () => {
  clearLockState()
  ElMessage.success('登录成功')
  router.push('/dashboard')
}

const handleLogin = async () => {
  if (!formRef.value) return
  
  if (checkLockStatus()) {
    ElMessage.warning(`账号已被锁定，请等待 ${remainingTime.value} 秒后再试`)
    return
  }
  
  try {
    await formRef.value.validate()
    loading.value = true
    
    const user = authStore.login(form.username, form.password)
    
    tagStore.loadTags(user.id)
    planStore.loadPlans(user.id)
    recordStore.loadRecords(user.id)
    
    handleLoginSuccess()
  } catch (error) {
    console.error('Login error:', error)
    handleLoginFailure()
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  checkLockStatus()
})

onUnmounted(() => {
  if (countdownTimer) {
    clearInterval(countdownTimer)
  }
  if (lockTimer) {
    clearTimeout(lockTimer)
  }
})
</script>

<style lang="scss" scoped>
.login-container {
  min-height: 100vh;
  display: flex;
  justify-content: center;
  align-items: center;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: var(--spacing-lg);
}

.login-box {
  width: 100%;
  max-width: 400px;
  background: var(--bg-card);
  border-radius: var(--radius-large);
  box-shadow: var(--shadow-heavy);
  padding: var(--spacing-xl);
}

.login-header {
  text-align: center;
  margin-bottom: var(--spacing-xl);

  h1 {
    font-size: 24px;
    color: var(--text-primary);
    margin: var(--spacing-md) 0 var(--spacing-sm);
  }

  p {
    color: var(--text-secondary);
    font-size: 14px;
  }
}

.login-form {
  margin-bottom: var(--spacing-lg);
}

.login-button {
  width: 100%;
}

.login-footer {
  text-align: center;
  color: var(--text-secondary);
  font-size: 14px;

  a {
    color: var(--primary-color);
    margin-left: var(--spacing-xs);

    &:hover {
      text-decoration: underline;
    }
  }
}
</style>
