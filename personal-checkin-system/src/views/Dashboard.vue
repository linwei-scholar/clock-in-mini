<template>
  <ResponsiveLayout>
    <div class="dashboard-container">
      <el-row :gutter="20" class="stat-row">
        <el-col :xs="12" :sm="12" :md="6">
          <el-card class="stat-card">
            <div class="stat-content">
              <div class="stat-icon" style="background-color: #409EFF;">
                <el-icon><Check /></el-icon>
              </div>
              <div class="stat-info">
                <div class="stat-label">今日打卡</div>
                <div class="stat-value">{{ todayCheckins }}</div>
              </div>
            </div>
          </el-card>
        </el-col>

        <el-col :xs="12" :sm="12" :md="6">
          <el-card class="stat-card">
            <div class="stat-content">
              <div class="stat-icon" style="background-color: #67C23A;">
                <el-icon><List /></el-icon>
              </div>
              <div class="stat-info">
                <div class="stat-label">进行中计划</div>
                <div class="stat-value">{{ activePlans.length }}</div>
              </div>
            </div>
          </el-card>
        </el-col>

        <el-col :xs="12" :sm="12" :md="6" class="hidden-sm-and-down">
          <el-card class="stat-card">
            <div class="stat-content">
              <div class="stat-icon" style="background-color: #E6A23C;">
                <el-icon><Calendar /></el-icon>
              </div>
              <div class="stat-info">
                <div class="stat-label">本周完成率</div>
                <div class="stat-value">{{ weekCompletionRate }}%</div>
              </div>
            </div>
          </el-card>
        </el-col>

        <el-col :xs="12" :sm="12" :md="6" class="hidden-sm-and-down">
          <el-card class="stat-card">
            <div class="stat-content">
              <div class="stat-icon" style="background-color: #F56C6C;">
                <el-icon><Trophy /></el-icon>
              </div>
              <div class="stat-info">
                <div class="stat-label">连续打卡</div>
                <div class="stat-value">{{ streakDays }} 天</div>
              </div>
            </div>
          </el-card>
        </el-col>
      </el-row>

      <el-row :gutter="20" class="mt-lg">
        <el-col :xs="24" :lg="12">
          <el-card>
            <template #header>
              <div class="card-header">
                <span class="card-title">快捷打卡</span>
                <el-button type="primary" size="small" @click="showCheckinDialog" class="touch-button">
                  <el-icon><Plus /></el-icon>
                  <span class="hidden-xs-only">新建打卡</span>
                </el-button>
              </div>
            </template>
            <div v-if="activePlans.length > 0" class="quick-checkin">
              <el-button
                v-for="plan in activePlans.slice(0, 4)"
                :key="plan.id"
                size="large"
                class="checkin-btn touch-button"
                @click="quickCheckin(plan)"
              >
                {{ plan.name }}
              </el-button>
            </div>
            <EmptyState
              v-else
              type="no-plan"
              message="暂无进行中的计划"
              description="创建打卡计划，开始养成好习惯"
              actionText="创建计划"
              @action="$router.push('/plans/create')"
            />
          </el-card>
        </el-col>

        <el-col :xs="24" :lg="12" class="mt-lg-mobile">
          <el-card>
            <template #header>
              <span class="card-title">最近打卡记录</span>
            </template>
            <div v-if="recentRecords.length > 0" class="record-list">
              <div
                v-for="record in recentRecords"
                :key="record.id"
                class="record-item"
                @click="viewRecordDetail(record)"
              >
                <div class="record-header">
                  <span class="record-plan">{{ getPlanName(record.planId) }}</span>
                  <span class="record-time">{{ formatTime(record.checkInTime) }}</span>
                </div>
                <p v-if="record.content" class="record-content">{{ record.content }}</p>
              </div>
            </div>
            <EmptyState
              v-else
              type="no-record"
              message="暂无打卡记录"
              description="开始今日打卡，记录您的成长轨迹"
            />
          </el-card>
        </el-col>
      </el-row>
    </div>

    <el-dialog v-model="checkinDialogVisible" title="快速打卡" width="90%" class="mobile-dialog">
      <el-form :model="checkinForm" label-position="top">
        <el-form-item label="选择计划">
          <el-select v-model="checkinForm.planId" placeholder="请选择打卡计划" style="width: 100%">
            <el-option
              v-for="plan in activePlans"
              :key="plan.id"
              :label="plan.name"
              :value="plan.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="打卡内容">
          <el-input
            v-model="checkinForm.content"
            type="textarea"
            :rows="4"
            placeholder="记录一下今天的打卡内容..."
            maxlength="500"
            show-word-limit
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="checkinDialogVisible = false" class="touch-button">取消</el-button>
        <el-button type="primary" @click="confirmCheckin" class="touch-button">确认打卡</el-button>
      </template>
    </el-dialog>
  </ResponsiveLayout>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import {
  Check,
  List,
  Trophy,
  Plus
} from '@element-plus/icons-vue'
import { useAuthStore } from '@/stores/authStore'
import { usePlanStore } from '@/stores/planStore'
import { useRecordStore } from '@/stores/recordStore'
import ResponsiveLayout from '@/components/ResponsiveLayout.vue'
import EmptyState from '@/components/common/EmptyState.vue'
import { showSuccess, showWarning, showInfo } from '@/utils/message'

const router = useRouter()
const authStore = useAuthStore()
const planStore = usePlanStore()
const recordStore = useRecordStore()

const checkinDialogVisible = ref(false)
const checkinForm = reactive({
  planId: '',
  content: ''
})

const todayCheckins = computed(() => {
  return recordStore.getTodayRecords().length
})

const activePlans = computed(() => {
  return planStore.getActivePlans()
})

const recentRecords = computed(() => {
  return recordStore.records
    .slice()
    .sort((a, b) => new Date(b.checkInTime) - new Date(a.checkInTime))
    .slice(0, 5)
})

const weekCompletionRate = computed(() => {
  const now = new Date()
  const weekStart = new Date(now.setDate(now.getDate() - now.getDay()))
  const weekRecords = recordStore.records.filter(r => new Date(r.checkInTime) >= weekStart)

  const targetCount = activePlans.value.length * 7
  if (targetCount === 0) return 0

  return Math.round((weekRecords.length / targetCount) * 100)
})

const streakDays = computed(() => {
  if (recordStore.records.length === 0) return 0

  const dates = [...new Set(
    recordStore.records.map(r => new Date(r.checkInDate).toDateString())
  )].sort((a, b) => new Date(b) - new Date(a))

  let streak = 0
  let currentDate = new Date()

  for (const dateStr of dates) {
    const date = new Date(dateStr)
    const diffDays = Math.floor((currentDate - date) / (1000 * 60 * 60 * 24))

    if (diffDays <= 1) {
      streak++
      currentDate = date
    } else {
      break
    }
  }

  return streak
})

const formatTime = (time) => {
  const date = new Date(time)
  const now = new Date()
  const diff = now - date
  const minutes = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days = Math.floor(diff / 86400000)

  if (minutes < 1) return '刚刚'
  if (minutes < 60) return `${minutes}分钟前`
  if (hours < 24) return `${hours}小时前`
  if (days < 7) return `${days}天前`
  return date.toLocaleDateString()
}

const getPlanName = (planId) => {
  const plan = planStore.getPlanById(planId)
  return plan ? plan.name : '未知计划'
}

const showCheckinDialog = () => {
  checkinForm.planId = activePlans.value[0]?.id || ''
  checkinForm.content = ''
  checkinDialogVisible.value = true
}

const quickCheckin = (plan) => {
  checkinForm.planId = plan.id
  checkinDialogVisible.value = true
}

const viewRecordDetail = (record) => {
  showInfo(`查看记录：${getPlanName(record.planId)}`)
}

const confirmCheckin = () => {
  if (!checkinForm.planId) {
    showWarning('请选择打卡计划')
    return
  }

  const record = {
    id: Date.now().toString(),
    planId: checkinForm.planId,
    userId: authStore.userInfo.id,
    content: checkinForm.content,
    images: [],
    checkInDate: new Date().toISOString().split('T')[0],
    checkInTime: new Date().toISOString(),
    isLate: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }

  recordStore.addRecord(record)
  showSuccess('打卡成功！')
  checkinDialogVisible.value = false
  checkinForm.content = ''
}
</script>

<style scoped>
.dashboard-container {
  width: 100%;
}

.stat-row {
  margin-bottom: var(--spacing-md);
}

.stat-card {
  margin-bottom: var(--spacing-md);
}

.stat-content {
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
}

.stat-icon {
  width: 50px;
  height: 50px;
  border-radius: var(--border-radius-md);
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 22px;
  flex-shrink: 0;
}

@media (min-width: 768px) {
  .stat-icon {
    width: 60px;
    height: 60px;
    font-size: 24px;
  }
}

.stat-info {
  flex: 1;
  min-width: 0;
}

.stat-label {
  font-size: var(--font-size-xs);
  color: var(--text-secondary);
  margin-bottom: 2px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

@media (min-width: 768px) {
  .stat-label {
    font-size: var(--font-size-sm);
    margin-bottom: var(--spacing-xs);
  }
}

.stat-value {
  font-size: var(--font-size-lg);
  font-weight: bold;
  color: var(--text-primary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

@media (min-width: 768px) {
  .stat-value {
    font-size: var(--font-size-xl);
  }
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: var(--spacing-sm);
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

.quick-checkin {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: var(--spacing-md);
}

@media (min-width: 768px) {
  .quick-checkin {
    grid-template-columns: repeat(2, 1fr);
  }
}

.checkin-btn {
  height: 70px;
  font-size: var(--font-size-sm);
  padding: var(--spacing-sm);
}

@media (min-width: 768px) {
  .checkin-btn {
    height: 80px;
    font-size: var(--font-size-md);
    padding: var(--spacing-md);
  }
}

.record-list {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm);
}

.record-item {
  padding: var(--spacing-md);
  background-color: var(--bg-hover);
  border-radius: var(--border-radius-md);
  cursor: pointer;
  transition: all var(--transition-duration);
  min-height: 44px;
}

.record-item:active {
  transform: scale(0.98);
  background-color: var(--border-light);
}

.record-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--spacing-xs);
  gap: var(--spacing-sm);
}

.record-plan {
  font-weight: bold;
  color: var(--text-primary);
  font-size: var(--font-size-sm);
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.record-time {
  font-size: var(--font-size-xs);
  color: var(--text-secondary);
  flex-shrink: 0;
}

.record-content {
  font-size: var(--font-size-xs);
  color: var(--text-regular);
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  line-height: 1.4;
}

.mt-lg {
  margin-top: var(--spacing-lg);
}

.mt-lg-mobile {
  margin-top: var(--spacing-lg);
}

@media (max-width: 767px) {
  .mt-lg-mobile {
    margin-top: var(--spacing-md);
  }
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
