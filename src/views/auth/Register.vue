<template>
  <div class="register-container">
    <div class="register-box">
      <div class="register-header">
        <el-icon :size="48" color="#409EFF"><Clock /></el-icon>
        <h1>创建账号</h1>
        <p>开启您的打卡之旅</p>
      </div>

      <el-form
        ref="formRef"
        :model="form"
        :rules="rules"
        class="register-form"
        @submit.prevent="handleRegister"
      >
        <el-form-item prop="username">
          <el-input
            v-model="form.username"
            placeholder="请输入用户名（4-20位字母、数字、下划线）"
            size="large"
            :prefix-icon="User"
            :disabled="loading"
            @blur="handleUsernameBlur"
          />
        </el-form-item>

        <el-form-item prop="password">
          <el-input
            v-model="form.password"
            type="password"
            placeholder="请输入密码（6-20位，需包含字母和数字）"
            size="large"
            :prefix-icon="Lock"
            :disabled="loading"
            show-password
          />
        </el-form-item>

        <el-form-item prop="confirmPassword">
          <el-input
            v-model="form.confirmPassword"
            type="password"
            placeholder="请再次输入密码"
            size="large"
            :prefix-icon="Lock"
            :disabled="loading"
            show-password
            @keyup.enter="handleRegister"
          />
        </el-form-item>

        <el-form-item>
          <el-button
            type="primary"
            size="large"
            :loading="loading"
            class="register-button"
            @click="handleRegister"
          >
            注册
          </el-button>
        </el-form-item>
      </el-form>

      <div class="register-footer">
        <span>已有账号？</span>
        <router-link to="/login">立即登录</router-link>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { Clock, User, Lock } from '@element-plus/icons-vue'
import { useAuthStore } from '@/stores/authStore'

const router = useRouter()
const authStore = useAuthStore()
const formRef = ref(null)
const usernameChecking = ref(false)

const form = reactive({
  username: '',
  password: '',
  confirmPassword: ''
})

const loading = computed(() => authStore.isLoading)

const validateUsername = (rule, value, callback) => {
  const usernameRegex = /^[a-zA-Z0-9_]{4,20}$/
  if (!value) {
    callback(new Error('请输入用户名'))
  } else if (!usernameRegex.test(value)) {
    callback(new Error('用户名需为4-20位字母、数字或下划线'))
  } else {
    callback()
  }
}

const validatePassword = (rule, value, callback) => {
  if (!value) {
    callback(new Error('请输入密码'))
  } else if (value.length < 6 || value.length > 20) {
    callback(new Error('密码长度需为6-20位'))
  } else if (!/[a-zA-Z]/.test(value)) {
    callback(new Error('密码必须包含至少一个字母'))
  } else if (!/[0-9]/.test(value)) {
    callback(new Error('密码必须包含至少一个数字'))
  } else {
    callback()
  }
}

const validateConfirmPassword = (rule, value, callback) => {
  if (!value) {
    callback(new Error('请再次输入密码'))
  } else if (value !== form.password) {
    callback(new Error('两次输入的密码不一致'))
  } else {
    callback()
  }
}

const rules = {
  username: [{ validator: validateUsername, trigger: 'blur' }],
  password: [{ validator: validatePassword, trigger: 'blur' }],
  confirmPassword: [{ validator: validateConfirmPassword, trigger: 'blur' }]
}

const handleUsernameBlur = async () => {
  if (!form.username || form.username.length < 4) {
    return
  }

  const usernameRegex = /^[a-zA-Z0-9_]{4,20}$/
  if (!usernameRegex.test(form.username)) {
    return
  }

  usernameChecking.value = true
  try {
    const exists = await authStore.checkUsernameExists(form.username)
    if (exists) {
      ElMessage.warning('用户名已存在，请选择其他用户名')
      formRef.value?.validateField('username')
    }
  } finally {
    usernameChecking.value = false
  }
}

const handleRegister = async () => {
  if (!formRef.value) return

  try {
    await formRef.value.validate()
    loading.value = true

    const success = await authStore.register({
      username: form.username,
      password: form.password,
      confirmPassword: form.confirmPassword
    })

    if (success) {
      ElMessage.success('注册成功，欢迎使用个人打卡系统！')
      router.push('/dashboard')
    } else {
      ElMessage.error(authStore.error || '注册失败，请稍后重试')
    }
  } catch (error) {
    console.error('Register error:', error)
    ElMessage.error('注册失败，请稍后重试')
  }
}
</script>

<style lang="scss" scoped>
.register-container {
  min-height: 100vh;
  display: flex;
  justify-content: center;
  align-items: center;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: var(--spacing-lg);
}

.register-box {
  width: 100%;
  max-width: 400px;
  background: var(--bg-card);
  border-radius: var(--radius-large);
  box-shadow: var(--shadow-heavy);
  padding: var(--spacing-xl);
}

.register-header {
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

.register-form {
  margin-bottom: var(--spacing-lg);
}

.register-button {
  width: 100%;
}

.register-footer {
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
