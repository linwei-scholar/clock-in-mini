<template>
  <div class="plan-detail-container">
    <div class="page-header">
      <el-button :icon="ArrowLeft" @click="router.push('/plans')">返回</el-button>
      <h1 class="page-title">{{ plan?.name || '计划详情' }}</h1>
      <div class="header-actions">
        <el-button type="primary" :icon="Edit" @click="router.push(`/plans/${planId}/edit`)">
          编辑
        </el-button>
      </div>
    </div>

    <div v-if="loading" class="loading-container">
      <el-icon class="is-loading"><Loading /></el-icon>
      <span>加载中...</span>
    </div>

    <div v-else-if="plan" class="detail-content">
      <el-row :gutter="20">
        <el-col :xs="24" :lg="16">
          <el-card class="mb-lg">
            <template #header>
              <div class="card-header">
                <span class="card-title">基本信息</span>
                <el-tag :type="getStatusType(plan.status)" size="small">
                  {{ getStatusLabel(plan.status) }}
                </el-tag>
              </div>
            </template>
            <div class="info-grid">
              <div class="info-item">
                <span class="info-label">计划名称</span>
                <span class="info-value">{{ plan.name }}</span>
              </div>
              <div class="info-item">
                <span class="info-label">计划描述</span>
                <span class="info-value">{{ plan.description || '暂无描述' }}</span>
              </div>
              <div class="info-item">
                <span class="info-label">打卡频率</span>
                <el-tag :type="getFrequencyType(plan.frequency)" size="small">
                  {{ getFrequencyLabel(plan.frequency) }}
                </el-tag>
              </div>
              <div class="info-item">
                <span class="info-label">开始日期</span>
                <span class="info-value">{{ formatDate(plan.startDate) }}</span>
              </div>
              <div class="info-item">
                <span class="info-label">结束日期</span>
                <span class="info-value">{{ plan.endDate ? formatDate(plan.endDate) : '永久有效' }}</span>
              </div>
              <div class="info-item">
                <span class="info-label">目标次数</span>
                <span class="info-value">{{ plan.targetCount ? `${plan.targetCount}次` : '不限制' }}</span>
              </div>
              <div class="info-item">
                <span class="info-label">提醒设置</span>
                <span class="info-value">
                  <el-tag v-if="plan.reminderEnabled" type="success" size="small">
                    {{ plan.reminderTime || '已开启' }}
                  </el-tag>
                  <span v-else>已关闭</span>
                </span>
              </div>
            </div>
          </el-card>

          <el-card class="mb-lg">
            <template #header>
              <div class="card-header">
                <span class="card-title">打卡记录</span>
                <span class="record-count">共 {{ statistics.actualCount }} 条记录</span>
              </div>
            </template>
            <div v-if="paginatedRecords.length > 0" class="record-list">
              <div v-for="record in paginatedRecords" :key="record.id" class="record-item">
                <div class="record-icon">
                  <el-icon color="#67C23A" :size="20"><CircleCheck /></el-icon>
                </div>
                <div class="record-content">
                  <div class="record-text">{{ record.content || '无内容' }}</div>
                  <div class="record-meta">
                    <span class="record-date">{{ formatDateTime(record.checkInTime) }}</span>
                    <el-tag v-if="record.isLate" type="warning" size="small">迟到</el-tag>
                  </div>
                </div>
                <div class="record-actions">
                  <el-button
                    type="danger"
                    size="small"
                    text
                    @click="handleDeleteRecord(record.id)"
                  >
                    删除
                  </el-button>
                </div>
              </div>
            </div>
            <el-empty v-else description="暂无打卡记录" />
            <el-pagination
              v-if="planRecords.length > 0"
              v-model:current-page="currentPage"
              v-model:page-size="pageSize"
              :page-sizes="[5, 10, 20]"
              :total="planRecords.length"
              layout="total, sizes, prev, pager, next"
              class="mt-md"
            />
          </el-card>
        </el-col>

        <el-col :xs="24" :lg="8">
          <el-card class="mb-lg">
            <template #header>
              <div class="card-header">
                <span class="card-title">快捷打卡</span>
              </div>
            </template>
            <div class="checkin-section">
              <el-button
                v-if="canCheckIn"
                type="success"
                size="large"
                :icon="Check"
                :loading="checkInLoading"
                @click="handleCheckIn"
                class="checkin-button"
              >
                立即打卡
              </el-button>
              <div v-else class="already-checkin">
                <el-icon color="#67C23A" :size="48"><CircleCheck /></el-icon>
                <span class="checkin-text">今日已打卡</span>
              </div>
              <el-button
                v-if="!canCheckIn"
                type="warning"
                plain
                size="default"
                :icon="Edit"
                @click="openRetroDialog"
                class="retro-button"
              >
                补卡
              </el-button>
            </div>
          </el-card>

          <el-card class="mb-lg">
            <template #header>
              <div class="card-header">
                <span class="card-title">统计概览</span>
              </div>
            </template>
            <div class="stats-overview">
              <div class="stat-circle">
                <el-progress
                  type="circle"
                  :percentage="statistics.completionRate"
                  :stroke-width="12"
                  :width="140"
                  :color="completionRateColor"
                >
                  <template #default>
                    <div class="progress-content">
                      <span class="progress-text">{{ statistics.completionRate }}%</span>
                      <span class="progress-label">完成率</span>
                    </div>
                  </template>
                </el-progress>
              </div>
              <div class="stats-grid">
                <div class="stat-item">
                  <div class="stat-value">{{ statistics.expectedCount }}</div>
                  <div class="stat-label">应打卡</div>
                </div>
                <div class="stat-item">
                  <div class="stat-value">{{ statistics.actualCount }}</div>
                  <div class="stat-label">实打卡</div>
                </div>
                <div class="stat-item">
                  <div class="stat-value">{{ statistics.currentStreak }}</div>
                  <div class="stat-label">连续天数</div>
                </div>
                <div class="stat-item">
                  <div class="stat-value">{{ statistics.longestStreak }}</div>
                  <div class="stat-label">最长连续</div>
                </div>
              </div>
            </div>
          </el-card>

          <el-card class="mb-lg">
            <template #header>
              <div class="card-header">
                <span class="card-title">打卡日历</span>
                <div class="calendar-nav">
                  <el-button
                    text
                    size="small"
                    :icon="ArrowLeft"
                    @click="prevMonth"
                  />
                  <span class="calendar-month">{{ currentMonthLabel }}</span>
                  <el-button
                    text
                    size="small"
                    :icon="ArrowRight"
                    @click="nextMonth"
                  />
                </div>
              </div>
            </template>
            <div class="mini-calendar">
              <div class="calendar-header">
                <span v-for="day in weekDays" :key="day" class="calendar-day-header">{{ day }}</span>
              </div>
              <div class="calendar-body">
                <div
                  v-for="(day, index) in calendarDays"
                  :key="index"
                  class="calendar-day"
                  :class="{
                    'is-empty': !day.date,
                    'is-checked': day.checked,
                    'is-today': day.isToday,
                    'is-future': day.isFuture
                  }"
                >
                  <span v-if="day.date">{{ day.dayNumber }}</span>
                  <el-icon v-if="day.checked" class="check-icon" :size="14"><Check /></el-icon>
                </div>
              </div>
              <div class="calendar-legend">
                <div class="legend-item">
                  <div class="legend-dot checked"></div>
                  <span>已打卡</span>
                </div>
                <div class="legend-item">
                  <div class="legend-dot today"></div>
                  <span>今日</span>
                </div>
              </div>
            </div>
          </el-card>

          <el-card class="mb-lg">
            <template #header>
              <div class="card-header">
                <span class="card-title">关联标签</span>
              </div>
            </template>
            <div v-if="planTags.length > 0" class="tag-list">
              <el-tag
                v-for="tag in planTags"
                :key="tag.id"
                :color="tag.color"
                size="small"
              >
                {{ tag.name }}
              </el-tag>
            </div>
            <el-empty v-else description="暂无关联标签" :image-size="60" />
          </el-card>

          <el-card>
            <template #header>
              <div class="card-header">
                <span class="card-title">操作</span>
              </div>
            </template>
            <div class="action-buttons">
              <el-button
                :type="plan.status === 'active' ? 'warning' : 'success'"
                :icon="plan.status === 'active' ? 'VideoPause' : 'VideoPlay'"
                @click="togglePlanStatus"
                :loading="actionLoading"
              >
                {{ plan.status === 'active' ? '暂停计划' : '恢复计划' }}
              </el-button>
              <el-button
                type="danger"
                plain
                icon="Delete"
                @click="handleDelete"
                :loading="actionLoading"
              >
                删除计划
              </el-button>
            </div>
          </el-card>
        </el-col>
      </el-row>
    </div>

    <el-empty v-else description="计划不存在" />

    <RetroactiveDialog
      v-model="showRetroDialog"
      :preselected-plan-id="planId"
      @success="handleRetroSuccess"
    />

    <el-dialog
      v-model="checkInDialogVisible"
      title="打卡"
      width="400px"
    >
      <el-form :model="checkInForm" label-width="80px">
        <el-form-item label="打卡内容">
          <el-input
            v-model="checkInForm.content"
            type="textarea"
            :rows="3"
            placeholder="记录一下今天的打卡内容..."
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="checkInDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="checkInLoading" @click="confirmCheckIn">
          确认打卡
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  ArrowLeft,
  ArrowRight,
  Edit,
  CircleCheck,
  Check,
  Loading,
  VideoPause,
  VideoPlay,
  Delete
} from '@element-plus/icons-vue'
import { usePlanStore } from '@/stores/planStore'
import { useRecordStore } from '@/stores/recordStore'
import { useTagStore } from '@/stores/tagStore'
import RetroactiveDialog from '@/components/checkin/RetroactiveDialog.vue'

const router = useRouter()
const route = useRoute()
const planStore = usePlanStore()
const recordStore = useRecordStore()
const tagStore = useTagStore()

const planId = computed(() => route.params.id)
const plan = ref(null)
const planRecords = ref([])
const allTags = ref([])
const loading = ref(true)
const actionLoading = ref(false)
const checkInLoading = ref(false)
const checkInDialogVisible = ref(false)
const showRetroDialog = ref(false)
const checkInForm = ref({
  content: ''
})

const currentPage = ref(1)
const pageSize = ref(10)

const currentMonth = ref(new Date())

const weekDays = ['日', '一', '二', '三', '四', '五', '六']

const planTags = computed(() => {
  if (!plan.value) return []
  return allTags.value.filter(tag => plan.value.tagIds?.includes(tag.id))
})

const statistics = computed(() => {
  if (!plan.value) {
    return {
      expectedCount: 0,
      actualCount: 0,
      completionRate: 0,
      currentStreak: 0,
      longestStreak: 0
    }
  }
  return recordStore.getPlanStatistics(plan.value.id)
})

const completionRateColor = computed(() => {
  const rate = statistics.value.completionRate
  if (rate >= 80) return '#67C23A'
  if (rate >= 50) return '#E6A23C'
  return '#F56C6C'
})

const canCheckIn = computed(() => {
  if (!plan.value || plan.value.status !== 'active') return false
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  return !planRecords.value.some(record => {
    const recordDate = new Date(record.checkInDate)
    recordDate.setHours(0, 0, 0, 0)
    return recordDate.getTime() === today.getTime()
  })
})

const paginatedRecords = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value
  const end = start + pageSize.value
  return [...planRecords.value]
    .sort((a, b) => new Date(b.checkInTime) - new Date(a.checkInTime))
    .slice(start, end)
})

const currentMonthLabel = computed(() => {
  const date = currentMonth.value
  return `${date.getFullYear()}年${date.getMonth() + 1}月`
})

const calendarDays = computed(() => {
  const days = []
  const year = currentMonth.value.getFullYear()
  const month = currentMonth.value.getMonth()

  const firstDay = new Date(year, month, 1)
  const lastDay = new Date(year, month + 1, 0)
  const startDayOfWeek = firstDay.getDay()

  for (let i = 0; i < startDayOfWeek; i++) {
    days.push({ date: null, checked: false, isToday: false, isFuture: false })
  }

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  for (let day = 1; day <= lastDay.getDate(); day++) {
    const date = new Date(year, month, day)
    date.setHours(0, 0, 0, 0)

    const checked = planRecords.value.some(record => {
      const recordDate = new Date(record.checkInDate)
      recordDate.setHours(0, 0, 0, 0)
      return recordDate.getTime() === date.getTime()
    })

    const isToday = date.getTime() === today.getTime()
    const isFuture = date > today

    days.push({
      date,
      dayNumber: day,
      checked,
      isToday,
      isFuture
    })
  }

  return days
})

const loadData = async () => {
  loading.value = true
  try {
    await Promise.all([
      planStore.loadPlans(),
      recordStore.loadRecords(),
      tagStore.loadTags()
    ])

    plan.value = planStore.getPlanById(planId.value)
    planRecords.value = recordStore.getRecordsByPlanId(planId.value)
    allTags.value = tagStore.tags
  } catch (error) {
    ElMessage.error('加载数据失败')
    console.error(error)
  } finally {
    loading.value = false
  }
}

const prevMonth = () => {
  const date = new Date(currentMonth.value)
  date.setMonth(date.getMonth() - 1)
  currentMonth.value = date
}

const nextMonth = () => {
  const date = new Date(currentMonth.value)
  date.setMonth(date.getMonth() + 1)
  currentMonth.value = date
}

const handleCheckIn = () => {
  checkInDialogVisible.value = true
}

const openRetroDialog = () => {
  showRetroDialog.value = true
}

const handleRetroSuccess = () => {
  ElMessage.success('补卡成功')
  planRecords.value = recordStore.getRecordsByPlanId(planId.value)
}

const confirmCheckIn = async () => {
  checkInLoading.value = true
  try {
    const result = await recordStore.checkIn(planId.value, {
      content: checkInForm.value.content,
      images: []
    })

    if (result) {
      ElMessage.success('打卡成功')
      checkInDialogVisible.value = false
      checkInForm.value.content = ''
      planRecords.value = recordStore.getRecordsByPlanId(planId.value)
    } else {
      ElMessage.error(recordStore.error || '打卡失败')
    }
  } finally {
    checkInLoading.value = false
  }
}

const handleDeleteRecord = async (recordId) => {
  try {
    await ElMessageBox.confirm('确定要删除该打卡记录吗？', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })

    const success = await recordStore.deleteRecord(recordId)
    if (success) {
      ElMessage.success('删除成功')
      planRecords.value = recordStore.getRecordsByPlanId(planId.value)
    }
  } catch {
    // 用户取消
  }
}

const togglePlanStatus = async () => {
  actionLoading.value = true
  try {
    let success
    if (plan.value.status === 'active') {
      success = await planStore.pausePlan(plan.value.id)
    } else {
      success = await planStore.resumePlan(plan.value.id)
    }

    if (success) {
      plan.value.status = plan.value.status === 'active' ? 'paused' : 'active'
      ElMessage.success(`${plan.value.status === 'active' ? '恢复' : '暂停'}成功`)
    } else {
      ElMessage.error(planStore.error || '操作失败')
    }
  } finally {
    actionLoading.value = false
  }
}

const handleDelete = async () => {
  try {
    await ElMessageBox.confirm('确定要删除该计划吗？删除后不可恢复，所有打卡记录也将被删除。', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })

    actionLoading.value = true
    await recordStore.deleteRecordsByPlanId(plan.value.id)
    const success = await planStore.deletePlan(plan.value.id)

    if (success) {
      ElMessage.success('删除成功')
      router.push('/plans')
    } else {
      ElMessage.error(planStore.error || '删除失败')
    }
  } catch {
    // 用户取消
  } finally {
    actionLoading.value = false
  }
}

const getFrequencyType = (frequency) => {
  const types = {
    daily: '',
    weekly: 'success',
    workdays: 'warning',
    weekends: 'info',
    custom: 'danger'
  }
  return types[frequency] || ''
}

const getFrequencyLabel = (frequency) => {
  const labels = {
    daily: '每日',
    weekly: '每周',
    workdays: '工作日',
    weekends: '周末',
    custom: '自定义'
  }
  return labels[frequency] || frequency
}

const getStatusType = (status) => {
  const types = {
    active: 'success',
    paused: 'warning',
    archived: 'info'
  }
  return types[status] || ''
}

const getStatusLabel = (status) => {
  const labels = {
    active: '进行中',
    paused: '已暂停',
    archived: '已归档'
  }
  return labels[status] || status
}

const formatDate = (date) => {
  if (!date) return '-'
  return new Date(date).toLocaleDateString('zh-CN')
}

const formatDateTime = (datetime) => {
  if (!datetime) return '-'
  const date = new Date(datetime)
  return `${date.toLocaleDateString('zh-CN')} ${date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}`
}

onMounted(() => {
  loadData()
})

watch(planId, () => {
  loadData()
})
</script>

<style lang="scss" scoped>
.plan-detail-container {
  max-width: 1400px;
  margin: 0 auto;
  padding: var(--spacing-lg);
}

.page-header {
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
  margin-bottom: var(--spacing-xl);
  padding: var(--spacing-md);
  background: white;
  border-radius: var(--radius-medium);
  box-shadow: var(--shadow-light);

  .page-title {
    flex: 1;
    font-size: 24px;
    font-weight: bold;
    margin: 0;
    color: var(--text-primary);
  }
}

.loading-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px;
  color: var(--text-secondary);

  .el-icon {
    font-size: 32px;
    margin-bottom: 16px;
  }
}

.card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;

  .card-title {
    font-size: 16px;
    font-weight: 600;
    color: var(--text-primary);
  }

  .record-count {
    font-size: 12px;
    color: var(--text-secondary);
  }
}

.info-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: var(--spacing-lg);
}

.info-item {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xs);
}

.info-label {
  font-size: 12px;
  color: var(--text-secondary);
}

.info-value {
  font-size: 14px;
  color: var(--text-primary);
}

.record-list {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-md);
}

.record-item {
  display: flex;
  align-items: flex-start;
  gap: var(--spacing-md);
  padding: var(--spacing-md);
  background: var(--bg-page);
  border-radius: var(--radius-medium);
  transition: all 0.3s;

  &:hover {
    background: var(--bg-hover);
    box-shadow: var(--shadow-light);
  }
}

.record-icon {
  flex-shrink: 0;
}

.record-content {
  flex: 1;
}

.record-text {
  margin: 0 0 var(--spacing-xs);
  font-size: 14px;
  color: var(--text-primary);
}

.record-meta {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
}

.record-date {
  font-size: 12px;
  color: var(--text-secondary);
}

.record-actions {
  flex-shrink: 0;
}

.checkin-section {
  text-align: center;
  padding: var(--spacing-lg);
  display: flex;
  flex-direction: column;
  gap: var(--spacing-md);
}

.retro-button {
  width: 100%;
}

.checkin-button {
  width: 100%;
  height: 60px;
  font-size: 18px;
}

.already-checkin {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--spacing-md);
  padding: var(--spacing-lg);

  .checkin-text {
    font-size: 16px;
    color: #67C23A;
    font-weight: 500;
  }
}

.stats-overview {
  text-align: center;
}

.stat-circle {
  margin-bottom: var(--spacing-xl);
}

.progress-content {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.progress-text {
  font-size: 28px;
  font-weight: bold;
  color: var(--text-primary);
}

.progress-label {
  font-size: 12px;
  color: var(--text-secondary);
  margin-top: var(--spacing-xs);
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: var(--spacing-md);
}

.stat-item {
  text-align: center;
  padding: var(--spacing-md);
  background: var(--bg-page);
  border-radius: var(--radius-small);
}

.stat-value {
  font-size: 24px;
  font-weight: bold;
  color: var(--text-primary);
}

.stat-label {
  font-size: 12px;
  color: var(--text-secondary);
  margin-top: var(--spacing-xs);
}

.mini-calendar {
  .calendar-header {
    display: grid;
    grid-template-columns: repeat(7, 1fr);
    gap: 2px;
    margin-bottom: var(--spacing-sm);
  }

  .calendar-day-header {
    text-align: center;
    font-size: 12px;
    color: var(--text-secondary);
    padding: var(--spacing-xs);
  }

  .calendar-body {
    display: grid;
    grid-template-columns: repeat(7, 1fr);
    gap: 2px;
  }

  .calendar-day {
    aspect-ratio: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    position: relative;
    font-size: 12px;
    border-radius: var(--radius-small);
    background: var(--bg-page);

    &.is-empty {
      background: transparent;
    }

    &.is-checked {
      background: #f0f9eb;
      color: #67C23A;

      .check-icon {
        position: absolute;
        bottom: 2px;
        right: 2px;
        color: #67C23A;
      }
    }

    &.is-today {
      font-weight: bold;
      background: #ecf5ff;
      color: #409eff;
    }

    &.is-future {
      color: var(--text-disabled);
    }
  }

  .calendar-legend {
    display: flex;
    justify-content: center;
    gap: var(--spacing-lg);
    margin-top: var(--spacing-md);
    padding-top: var(--spacing-md);
    border-top: 1px solid var(--border-color);
  }

  .legend-item {
    display: flex;
    align-items: center;
    gap: var(--spacing-xs);
    font-size: 12px;
    color: var(--text-secondary);
  }

  .legend-dot {
    width: 12px;
    height: 12px;
    border-radius: 50%;

    &.checked {
      background: #67C23A;
    }

    &.today {
      background: #409eff;
    }
  }
}

.calendar-nav {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);

  .calendar-month {
    font-size: 14px;
    color: var(--text-primary);
    min-width: 80px;
    text-align: center;
  }
}

.tag-list {
  display: flex;
  flex-wrap: wrap;
  gap: var(--spacing-sm);
}

.action-buttons {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm);

  .el-button {
    width: 100%;
  }
}

.mt-md {
  margin-top: var(--spacing-md);
}

.mb-lg {
  margin-bottom: var(--spacing-lg);
}

@media (max-width: 768px) {
  .plan-detail-container {
    padding: var(--spacing-sm);
  }

  .page-header {
    flex-wrap: wrap;

    .page-title {
      font-size: 18px;
      order: -1;
      width: 100%;
      margin-bottom: var(--spacing-sm);
    }
  }

  .info-grid {
    grid-template-columns: repeat(2, 1fr);
  }

  .stats-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}
</style>
