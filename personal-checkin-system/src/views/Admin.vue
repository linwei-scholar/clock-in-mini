<template>
  <div class="admin-container">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>管理员面板</span>
        </div>
      </template>

      <div v-if="!isVerified" class="verify-section">
        <el-alert
          title="管理员验证"
          type="info"
          :closable="false"
          description="请输入管理员Token以访问管理功能"
        />

        <el-form :model="tokenForm" class="token-form">
          <el-form-item>
            <el-input
              v-model="tokenForm.token"
              placeholder="请输入管理员Token"
              type="password"
              show-password
            />
          </el-form-item>
          <el-form-item>
            <el-button type="primary" @click="verifyToken">
              验证Token
            </el-button>
          </el-form-item>
        </el-form>
      </div>

      <div v-else class="admin-panel">
        <el-tabs v-model="activeTab">
          <el-tab-pane label="用户管理" name="users">
            <el-table :data="users" stripe>
              <el-table-column prop="username" label="用户名" />
              <el-table-column prop="createdAt" label="注册时间">
                <template #default="{ row }">
                  {{ formatDate(row.createdAt) }}
                </template>
              </el-table-column>
              <el-table-column prop="lastLoginAt" label="最后登录">
                <template #default="{ row }">
                  {{ formatDate(row.lastLoginAt) }}
                </template>
              </el-table-column>
              <el-table-column label="操作" width="200">
                <template #default="{ row }">
                  <el-button
                    size="small"
                    type="warning"
                    @click="handleResetPassword(row)"
                  >
                    重置密码
                  </el-button>
                  <el-button
                    size="small"
                    type="danger"
                    @click="handleDeleteUser(row)"
                  >
                    删除
                  </el-button>
                </template>
              </el-table-column>
            </el-table>
          </el-tab-pane>

          <el-tab-pane label="系统统计" name="stats">
            <el-row :gutter="20">
              <el-col :span="8">
                <el-card>
                  <div class="stat-content">
                    <div class="stat-value">{{ users.length }}</div>
                    <div class="stat-label">总用户数</div>
                  </div>
                </el-card>
              </el-col>
              <el-col :span="8">
                <el-card>
                  <div class="stat-content">
                    <div class="stat-value">{{ totalPlans }}</div>
                    <div class="stat-label">总计划数</div>
                  </div>
                </el-card>
              </el-col>
              <el-col :span="8">
                <el-card>
                  <div class="stat-content">
                    <div class="stat-value">{{ totalRecords }}</div>
                    <div class="stat-label">总打卡数</div>
                  </div>
                </el-card>
              </el-col>
            </el-row>
          </el-tab-pane>
        </el-tabs>
      </div>
    </el-card>
  </div>
</template>

<script setup>
import { ref, reactive, computed } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useAuthStore } from '@/stores/authStore'

const authStore = useAuthStore()

const ADMIN_TOKEN = 'checkin-admin-token-2024'

const isVerified = ref(false)
const activeTab = ref('users')
const tokenForm = reactive({
  token: ''
})

const users = computed(() => {
  return authStore.getAllUsers()
})

const totalPlans = computed(() => {
  let total = 0
  users.value.forEach(user => {
    const plans = JSON.parse(localStorage.getItem(`plans_${user.id}`) || '[]')
    total += plans.length
  })
  return total
})

const totalRecords = computed(() => {
  let total = 0
  users.value.forEach(user => {
    const records = JSON.parse(localStorage.getItem(`records_${user.id}`) || '[]')
    total += records.length
  })
  return total
})

const formatDate = (dateStr) => {
  if (!dateStr) return '-'
  return new Date(dateStr).toLocaleString()
}

const verifyToken = () => {
  if (tokenForm.token === ADMIN_TOKEN) {
    isVerified.value = true
    ElMessage.success('验证成功')
  } else {
    ElMessage.error('Token错误')
  }
}

const handleResetPassword = async (user) => {
  await ElMessageBox.confirm(
    `确定要重置用户 ${user.username} 的密码吗？`,
    '确认',
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    }
  )

  authStore.resetPassword(user.id, 'AaBb@123456')
  ElMessage.success(`用户 ${user.username} 的密码已重置为：AaBb@123456`)
}

const handleDeleteUser = async (user) => {
  if (user.username === 'admin') {
    ElMessage.error('不能删除管理员账户')
    return
  }

  await ElMessageBox.confirm(
    `确定要删除用户 ${user.username} 吗？这将删除该用户的所有数据！`,
    '危险操作',
    {
      confirmButtonText: '确定删除',
      cancelButtonText: '取消',
      type: 'error'
    }
  )

  authStore.deleteUser(user.id)
  ElMessage.success(`用户 ${user.username} 已删除`)
}
</script>

<style scoped>
.admin-container {
  padding: var(--spacing-lg);
}

.verify-section {
  max-width: 400px;
  margin: 0 auto;
}

.token-form {
  margin-top: var(--spacing-lg);
}

.admin-panel {
  min-height: 400px;
}

.stat-content {
  text-align: center;
  padding: var(--spacing-md);
}

.stat-value {
  font-size: var(--font-size-xxl);
  font-weight: bold;
  color: var(--primary-color);
  margin-bottom: var(--spacing-xs);
}

.stat-label {
  font-size: var(--font-size-sm);
  color: var(--text-secondary);
}
</style>
