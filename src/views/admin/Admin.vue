<template>
  <div class="admin-container">
    <div class="page-header">
      <h1 class="page-title">管理员面板</h1>
    </div>

    <div v-if="!isTokenVerified" class="card-container">
      <div class="token-input-section">
        <el-icon :size="48" color="#409EFF"><Lock /></el-icon>
        <h2>管理员验证</h2>
        <p class="token-hint">请输入管理员Token以访问管理功能</p>
        
        <el-input
          v-model="tokenInput"
          type="password"
          placeholder="请输入管理员Token"
          size="large"
          class="token-input"
          @keyup.enter="verifyToken"
          show-password
        >
          <template #prefix>
            <el-icon><Key /></el-icon>
          </template>
        </el-input>
        
        <el-button 
          type="primary" 
          size="large" 
          class="verify-btn"
          :loading="verifying"
          @click="verifyToken"
        >
          验证Token
        </el-button>
        
        <p v-if="tokenError" class="token-error">{{ tokenError }}</p>
      </div>
    </div>

    <template v-else>
      <div class="card-container mb-lg">
        <div class="admin-info">
          <el-icon :size="24" color="#409EFF"><User /></el-icon>
          <div class="info-text">
            <h3>管理员功能</h3>
            <p>此处可管理所有注册用户，重置用户密码</p>
          </div>
          <el-button type="info" size="small" @click="logout" class="logout-btn">
            退出登录
          </el-button>
        </div>
      </div>

      <div class="card-container">
        <div class="table-header">
          <h3 class="card-title">用户列表</h3>
          <span class="user-count">共 {{ users.length }} 位用户</span>
        </div>

      <el-table :data="users" stripe style="width: 100%">
        <el-table-column prop="username" label="用户名" width="180" />
        <el-table-column prop="createdAt" label="注册时间" width="180">
          <template #default="{ row }">
            {{ formatDate(row.createdAt) }}
          </template>
        </el-table-column>
        <el-table-column prop="lastLoginAt" label="最后登录" width="180">
          <template #default="{ row }">
            {{ formatDate(row.lastLoginAt) }}
          </template>
        </el-table-column>
        <el-table-column prop="isAdmin" label="角色" width="100">
          <template #default="{ row }">
            <el-tag :type="row.isAdmin ? 'danger' : 'info'" size="small">
              {{ row.isAdmin ? '管理员' : '用户' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作">
          <template #default="{ row }">
            <el-button
              type="warning"
              size="small"
              :disabled="row.isAdmin"
              @click="handleResetPassword(row)"
            >
              重置密码
            </el-button>
            <el-button
              type="danger"
              size="small"
              :disabled="row.isAdmin"
              @click="handleDeleteUser(row)"
            >
              删除
            </el-button>
          </template>
        </el-table-column>
      </el-table>

      <el-empty v-if="users.length === 0" description="暂无用户数据" />
    </div>
    </template>

    <el-dialog v-model="resetDialogVisible" title="重置密码" width="400px">
      <p>确定要重置用户 <strong>{{ selectedUser?.username }}</strong> 的密码吗？</p>
      <p style="color: var(--text-secondary); font-size: 12px; margin-top: 8px;">
        重置后密码将变为：<code style="background: #f5f5f5; padding: 2px 6px; border-radius: 4px;">AaBb@123456</code>
      </p>

      <template #footer>
        <el-button @click="resetDialogVisible = false">取消</el-button>
        <el-button type="warning" @click="confirmResetPassword">确认重置</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="deleteDialogVisible" title="删除用户" width="400px">
      <p>确定要删除用户 <strong>{{ selectedUser?.username }}</strong> 吗？</p>
      <p style="color: var(--danger-color); font-size: 12px; margin-top: 8px;">
        此操作将删除用户的所有数据，且不可恢复！
      </p>

      <template #footer>
        <el-button @click="deleteDialogVisible = false">取消</el-button>
        <el-button type="danger" @click="confirmDeleteUser">确认删除</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { User, Lock, Key } from '@element-plus/icons-vue'

const ADMIN_TOKEN = 'checkin-admin-token-2024'
const users = ref([])
const resetDialogVisible = ref(false)
const deleteDialogVisible = ref(false)
const selectedUser = ref(null)
const isTokenVerified = ref(false)
const tokenInput = ref('')
const tokenError = ref('')
const verifying = ref(false)

const formatDate = (date) => {
  if (!date) return '-'
  return new Date(date).toLocaleString('zh-CN')
}

const verifyToken = async () => {
  tokenError.value = ''
  verifying.value = true
  
  await new Promise(resolve => setTimeout(resolve, 500))
  
  if (tokenInput.value === ADMIN_TOKEN) {
    isTokenVerified.value = true
    localStorage.setItem('adminToken', ADMIN_TOKEN)
    ElMessage.success('Token验证成功，欢迎管理员！')
    loadUsers()
  } else {
    tokenError.value = 'Token无效，请检查后重试'
    ElMessage.error('Token验证失败')
  }
  
  verifying.value = false
}

const logout = () => {
  isTokenVerified.value = false
  tokenInput.value = ''
  localStorage.removeItem('adminToken')
  ElMessage.info('已退出管理员登录')
}

const loadUsers = () => {
  users.value = JSON.parse(localStorage.getItem('users') || '[]')
}

const handleResetPassword = (user) => {
  selectedUser.value = user
  resetDialogVisible.value = true
}

const confirmResetPassword = async () => {
  if (!selectedUser.value) return

  const hashedPassword = await hashPassword('AaBb@123456')

  const userIndex = users.value.findIndex(u => u.id === selectedUser.value.id)
  if (userIndex !== -1) {
    users.value[userIndex].passwordHash = hashedPassword
    localStorage.setItem('users', JSON.stringify(users.value))
  }

  ElMessage.success(`用户 ${selectedUser.value.username} 的密码已重置`)
  resetDialogVisible.value = false
  selectedUser.value = null
}

const handleDeleteUser = (user) => {
  selectedUser.value = user
  deleteDialogVisible.value = true
}

const confirmDeleteUser = async () => {
  if (!selectedUser.value) return

  users.value = users.value.filter(u => u.id !== selectedUser.value.id)
  localStorage.setItem('users', JSON.stringify(users.value))

  localStorage.removeItem(`plans_${selectedUser.value.id}`)
  localStorage.removeItem(`records_${selectedUser.value.id}`)

  ElMessage.success(`用户 ${selectedUser.value.username} 已删除`)
  deleteDialogVisible.value = false
  selectedUser.value = null
}

const hashPassword = async (password) => {
  const encoder = new TextEncoder()
  const data = encoder.encode(password)
  const hashBuffer = await crypto.subtle.digest('SHA-256', data)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
}

onMounted(() => {
  const savedToken = localStorage.getItem('adminToken')
  if (savedToken === ADMIN_TOKEN) {
    isTokenVerified.value = true
    loadUsers()
  }
})
</script>

<style lang="scss" scoped>
.admin-container {
  max-width: 1200px;
  margin: 0 auto;
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
}

.table-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--spacing-lg);
  
  .card-title {
    margin-bottom: 0;
  }
  
  .user-count {
    color: var(--text-secondary);
    font-size: 14px;
  }
}

.admin-info {
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
  padding: var(--spacing-md);
  background: #409EFF10;
  border-radius: var(--radius-medium);
  
  .info-text {
    flex: 1;
    
    h3 {
      margin: 0 0 var(--spacing-xs);
      font-size: 16px;
      color: var(--text-primary);
    }
    
    p {
      margin: 0;
      font-size: 14px;
      color: var(--text-secondary);
    }
  }
  
  .logout-btn {
    margin-left: auto;
  }
}

.token-input-section {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: var(--spacing-xl);
  max-width: 400px;
  margin: 0 auto;
  
  h2 {
    margin: var(--spacing-lg) 0 var(--spacing-sm);
    font-size: 24px;
    color: var(--text-primary);
  }
  
  .token-hint {
    margin: 0 0 var(--spacing-lg);
    color: var(--text-secondary);
    font-size: 14px;
  }
  
  .token-input {
    width: 100%;
    margin-bottom: var(--spacing-md);
  }
  
  .verify-btn {
    width: 100%;
    margin-bottom: var(--spacing-md);
  }
  
  .token-error {
    margin: 0;
    color: var(--danger-color);
    font-size: 14px;
  }
}

code {
  font-family: monospace;
}

.mb-lg {
  margin-bottom: var(--spacing-lg);
}
</style>
