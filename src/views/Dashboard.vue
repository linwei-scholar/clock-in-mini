<template>
  <div class="dashboard-container">
    <div v-if="isLoading" class="loading-container">
      <el-icon class="is-loading" :size="40"><Loading /></el-icon>
      <p>加载中...</p>
    </div>

    <template v-else>
      <div class="page-header">
        <div class="header-left">
          <h1 class="page-title">{{ greeting }}，{{ username }}！</h1>
          <p class="page-subtitle">{{ currentDate }}</p>
        </div>
        <div class="header-right">
          <el-button type="primary" size="large" @click="openCheckInDialog">
            <el-icon><Check /></el-icon>
            快速打卡
          </el-button>
        </div>
      </div>

      <el-row :gutter="20" class="overview-row">
        <el-col :xs="12" :sm="6">
          <div class="overview-card">
            <div class="overview-icon" style="background: linear-gradient(135deg, #409EFF 0%, #66B1FF 100%);">
              <el-icon :size="28"><List /></el-icon>
            </div>
            <div class="overview-content">
              <div class="overview-value">{{ todayStats.pendingCount }}</div>
              <div class="overview-label">今日待打卡</div>
            </div>
          </div>
        </el-col>

        <el-col :xs="12" :sm="6">
          <div class="overview-card">
            <div class="overview-icon" style="background: linear-gradient(135deg, #67C23A 0%, #85CE61 100%);">
              <el-icon :size="28"><CircleCheck /></el-icon>
            </div>
            <div class="overview-content">
              <div class="overview-value">{{ todayStats.completedCount }}</div>
              <div class="overview-label">今日已完成</div>
            </div>
          </div>
        </el-col>

        <el-col :xs="12" :sm="6">
          <div class="overview-card">
            <div class="overview-icon" style="background: linear-gradient(135deg, #E6A23C 0%, #F0AF49 100%);">
              <el-icon :size="28"><DataLine /></el-icon>
            </div>
            <div class="overview-content">
              <div class="overview-value">{{ todayStats.completionRate }}%</div>
              <div class="overview-label">今日完成率</div>
            </div>
          </div>
        </el-col>

        <el-col :xs="12" :sm="6">
          <div class="overview-card">
            <div class="overview-icon" style="background: linear-gradient(135deg, #9B59B6 0%, #BB79D1 100%);">
              <el-icon :size="28"><Timer /></el-icon>
            </div>
            <div class="overview-content">
              <div class="overview-value">{{ globalStats.currentStreak }}</div>
              <div class="overview-label">连续打卡天数</div>
            </div>
          </div>
        </el-col>
      </el-row>

      <el-row :gutter="20">
        <el-col :xs="24" :lg="16">
          <div class="card-container mb-lg">
            <div class="card-header">
              <h3>今日待打卡</h3>
              <router-link to="/plans" class="more-link">
                查看全部
                <el-icon><ArrowRight /></el-icon>
              </router-link>
            </div>

            <div v-if="todayPlans.length > 0" class="plan-list">
              <div
                v-for="plan in todayPlans"
                :key="plan.id"
                class="plan-item"
                :class="{ 'is-completed': plan.completed }"
              >
                <div class="plan-left">
                  <el-tag :color="plan.tagColor" size="small" effect="dark">
                    {{ plan.tagName }}
                  </el-tag>
                  <div class="plan-info">
                    <span class="plan-name">{{ plan.name }}</span>
                    <span class="plan-frequency">{{ getFrequencyLabel(plan.frequency) }}</span>
                  </div>
                </div>
                <div class="plan-right">
                  <el-tag v-if="plan.completed" type="success" size="small" effect="plain">
                    <el-icon><Check /></el-icon>
                    已完成
                  </el-tag>
                  <el-tag v-else type="info" size="small" effect="plain">
                    待打卡
                  </el-tag>
                  <el-button
                    :type="plan.completed ? 'info' : 'primary'"
                    size="small"
                    :disabled="plan.completed"
                    @click="handleCheckIn(plan)"
                  >
                    {{ plan.completed ? '已打卡' : '去打卡' }}
                  </el-button>
                </div>
              </div>
            </div>

            <el-empty v-else description="今日暂无待打卡计划" :image-size="100">
              <template #image>
                <el-icon :size="60" color="#C0C4CC"><Calendar /></el-icon>
              </template>
              <el-button type="primary" @click="$router.push('/plans/create')">
                创建打卡计划
              </el-button>
            </el-empty>
          </div>

          <div class="card-container">
            <div class="card-header">
              <h3>最近打卡记录</h3>
              <router-link to="/records" class="more-link">
                查看全部
                <el-icon><ArrowRight /></el-icon>
              </router-link>
            </div>

            <div v-if="recentRecords.length > 0" class="record-list">
              <div
                v-for="record in recentRecords"
                :key="record.id"
                class="record-item"
                @click="viewRecordDetail(record)"
              >
                <div class="record-left">
                  <div class="record-icon">
                    <el-icon color="#67C23A" :size="20"><CircleCheck /></el-icon>
                  </div>
                  <div class="record-info">
                    <div class="record-header">
                      <span class="record-plan">{{ record.planName }}</span>
                      <el-tag v-if="record.isLate" type="warning" size="small" effect="plain">
                        补卡
                      </el-tag>
                    </div>
                    <span class="record-content">{{ record.content || '无内容' }}</span>
                  </div>
                </div>
                <div class="record-right">
                  <span class="record-time">{{ formatTimeAgo(record.checkInTime) }}</span>
                  <el-icon class="record-arrow" color="#C0C4CC"><ArrowRight /></el-icon>
                </div>
              </div>
            </div>

            <el-empty v-else description="暂无打卡记录" :image-size="100">
              <template #image>
                <el-icon :size="60" color="#C0C4CC"><Document /></el-icon>
              </template>
            </el-empty>
          </div>
        </el-col>

        <el-col :xs="24" :lg="8">
          <div class="card-container mb-lg">
            <div class="card-header">
              <h3>本周进度</h3>
            </div>
            <div class="week-progress">
              <div
                v-for="day in weekProgress"
                :key="day.date"
                class="day-item"
              >
                <div class="day-circle"
                  :class="{
                    'is-completed': day.completed,
                    'is-today': day.isToday,
                    'is-future': day.isFuture
                  }"
                >
                  <el-icon v-if="day.completed" :size="16"><Check /></el-icon>
                  <span v-else class="day-dot"></span>
                </div>
                <div class="day-label">{{ day.label }}</div>
                <div class="day-date">{{ day.dateStr }}</div>
              </div>
            </div>

            <el-divider />

            <div class="week-summary">
              <div class="summary-item">
                <span class="summary-label">本周打卡</span>
                <span class="summary-value">{{ weekStats.totalCount }}次</span>
              </div>
              <div class="summary-item">
                <span class="summary-label">本周完成率</span>
                <span class="summary-value">{{ weekStats.completionRate }}%</span>
              </div>
              <div class="summary-item">
                <span class="summary-label">与上周对比</span>
                <span class="summary-value" :class="weekStats.comparisonClass">
                  <el-icon v-if="weekStats.comparisonValue > 0"><Top /></el-icon>
                  <el-icon v-else-if="weekStats.comparisonValue < 0"><Bottom /></el-icon>
                  {{ weekStats.comparisonText }}
                </span>
              </div>
            </div>
          </div>

          <div class="card-container mb-lg">
            <div class="card-header">
              <h3>数据统计</h3>
            </div>
            <div class="stats-grid">
              <div class="stat-item">
                <div class="stat-value">{{ globalStats.actualCount }}</div>
                <div class="stat-label">累计打卡次数</div>
              </div>
              <div class="stat-item">
                <div class="stat-value">{{ globalStats.completionRate }}%</div>
                <div class="stat-label">总完成率</div>
              </div>
              <div class="stat-item">
                <div class="stat-value">{{ globalStats.longestStreak }}</div>
                <div class="stat-label">最长连续天数</div>
              </div>
              <div class="stat-item">
                <div class="stat-value">{{ globalStats.totalDays }}</div>
                <div class="stat-label">累计打卡天数</div>
              </div>
            </div>
          </div>

          <div class="card-container">
            <div class="card-header">
              <h3>快捷操作</h3>
            </div>
            <div class="quick-actions">
              <router-link to="/plans/create" class="action-item">
                <div class="action-icon" style="background: linear-gradient(135deg, #409EFF 0%, #66B1FF 100%);">
                  <el-icon><Plus /></el-icon>
                </div>
                <span>新建计划</span>
              </router-link>
              <router-link to="/calendar" class="action-item">
                <div class="action-icon" style="background: linear-gradient(135deg, #67C23A 0%, #85CE61 100%);">
                  <el-icon><Calendar /></el-icon>
                </div>
                <span>查看日历</span>
              </router-link>
              <router-link to="/statistics" class="action-item">
                <div class="action-icon" style="background: linear-gradient(135deg, #E6A23C 0%, #F0AF49 100%);">
                  <el-icon><DataAnalysis /></el-icon>
                </div>
                <span>数据统计</span>
              </router-link>
              <router-link to="/export" class="action-item">
                <div class="action-icon" style="background: linear-gradient(135deg, #9B59B6 0%, #BB79D1 100%);">
                  <el-icon><Download /></el-icon>
                </div>
                <span>导出数据</span>
              </router-link>
            </div>
          </div>
        </el-col>
      </el-row>
    </template>

    <CheckInDialog
      v-model="showCheckInDialog"
      :selected-date="new Date()"
      @checkin-success="handleCheckInSuccess"
    />

    <el-dialog
      v-model="showRecordDetail"
      title="打卡详情"
      width="500px"
    >
      <div v-if="selectedRecord" class="record-detail">
        <el-descriptions :column="1" border>
          <el-descriptions-item label="打卡计划">
            {{ selectedRecord.planName }}
          </el-descriptions-item>
          <el-descriptions-item label="打卡日期">
            {{ formatDetailDate(selectedRecord.checkInDate) }}
          </el-descriptions-item>
          <el-descriptions-item label="打卡时间">
            {{ formatDetailTime(selectedRecord.checkInTime) }}
          </el-descriptions-item>
          <el-descriptions-item label="打卡状态">
            <el-tag v-if="selectedRecord.isLate" type="warning">补卡</el-tag>
            <el-tag v-else type="success">正常</el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="打卡内容">
            {{ selectedRecord.content || '无' }}
          </el-descriptions-item>
        </el-descriptions>
      </div>
      <template #footer>
        <el-button @click="showRecordDetail = false">关闭</el-button>
        <el-button type="primary" @click="viewPlanDetail">
          查看计划
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import {
  Check,
  List,
  CircleCheck,
  Timer,
  DataLine,
  Calendar,
  Document,
  Plus,
  DataAnalysis,
  Download,
  ArrowRight,
  Top,
  Bottom,
  Loading
} from '@element-plus/icons-vue'
import { useAuthStore } from '@/stores/authStore'
import { usePlanStore } from '@/stores/planStore'
import { useRecordStore } from '@/stores/recordStore'
import { useTagStore } from '@/stores/tagStore'
import CheckInDialog from '@/components/checkin/CheckInDialog.vue'
import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'
import 'dayjs/locale/zh-cn'

dayjs.extend(relativeTime)
dayjs.locale('zh-cn')

const router = useRouter()
const authStore = useAuthStore()
const planStore = usePlanStore()
const recordStore = useRecordStore()
const tagStore = useTagStore()

const showCheckInDialog = ref(false)
const showRecordDetail = ref(false)
const selectedRecord = ref(null)
const isLoading = ref(true)

const username = computed(() => {
  return authStore.user?.username || localStorage.getItem('username') || '用户'
})

const greeting = computed(() => {
  const hour = new Date().getHours()
  if (hour < 6) return '凌晨好'
  if (hour < 9) return '早上好'
  if (hour < 12) return '上午好'
  if (hour < 14) return '中午好'
  if (hour < 18) return '下午好'
  if (hour < 22) return '晚上好'
  return '夜深了'
})

const currentDate = computed(() => {
  return dayjs().format('YYYY年MM月DD日 dddd')
})

const todayStats = computed(() => {
  const today = dayjs().format('YYYY-MM-DD')
  const todayPlans = getTodayPlans()
  const todayRecords = recordStore.todayRecords
  const completedCount = todayPlans.filter(plan => {
    return todayRecords.some(record => record.planId === plan.id)
  }).length
  const pendingCount = todayPlans.length - completedCount
  const completionRate = todayPlans.length > 0
    ? Math.round((completedCount / todayPlans.length) * 100)
    : 0

  return {
    pendingCount,
    completedCount,
    completionRate
  }
})

const globalStats = computed(() => {
  return recordStore.getGlobalStatistics()
})

const todayPlans = computed(() => {
  const today = dayjs().format('YYYY-MM-DD')
  const plans = getTodayPlans()
  const todayRecords = recordStore.todayRecords

  return plans.map(plan => {
    const completed = todayRecords.some(record => record.planId === plan.id)
    const tag = tagStore.tags.find(t => t.id === plan.tagIds?.[0])

    return {
      ...plan,
      completed,
      tagName: tag?.name || '默认',
      tagColor: tag?.color || '#409EFF'
    }
  })
})

const recentRecords = computed(() => {
  const plans = planStore.plans
  return recordStore.userRecords
    .sort((a, b) => new Date(b.checkInTime) - new Date(a.checkInTime))
    .slice(0, 10)
    .map(record => {
      const plan = plans.find(p => p.id === record.planId)
      return {
        ...record,
        planName: plan ? plan.name : '已删除计划'
      }
    })
})

const weekProgress = computed(() => {
  const today = dayjs()
  const dayOfWeek = today.day()
  const monday = today.subtract((dayOfWeek + 6) % 7, 'day')

  const todayStr = today.format('YYYY-MM-DD')

  return Array.from({ length: 7 }, (_, i) => {
    const date = monday.add(i, 'day')
    const dateStr = date.format('YYYY-MM-DD')
    const dayRecords = recordStore.userRecords.filter(r => {
      return dayjs(new Date(r.checkInDate)).format('YYYY-MM-DD') === dateStr
    })

    return {
      label: ['一', '二', '三', '四', '五', '六', '日'][i],
      date: dateStr,
      dateStr: date.format('M/D'),
      completed: dayRecords.length > 0,
      isToday: dateStr === todayStr,
      isFuture: date.isAfter(today, 'day')
    }
  })
})

const weekStats = computed(() => {
  const today = dayjs()
  const dayOfWeek = today.day()
  const monday = today.subtract((dayOfWeek + 6) % 7, 'day')
  const sunday = monday.add(6, 'day')

  const thisWeekRecords = recordStore.userRecords.filter(r => {
    const date = dayjs(new Date(r.checkInDate))
    return date.isAfter(monday.subtract(1, 'day')) && date.isBefore(sunday.add(1, 'day'))
  })

  const lastWeekMonday = monday.subtract(7, 'day')
  const lastWeekSunday = sunday.subtract(7, 'day')

  const lastWeekRecords = recordStore.userRecords.filter(r => {
    const date = dayjs(new Date(r.checkInDate))
    return date.isAfter(lastWeekMonday.subtract(1, 'day')) && date.isBefore(lastWeekSunday.add(1, 'day'))
  })

  const totalCount = thisWeekRecords.length
  const expectedCount = planStore.activePlans.length * 7
  const completionRate = expectedCount > 0
    ? Math.min(Math.round((totalCount / expectedCount) * 100), 100)
    : 0

  const comparison = thisWeekRecords.length - lastWeekRecords.length
  let comparisonClass = ''
  let comparisonText = '持平'

  if (comparison > 0) {
    comparisonClass = 'is-positive'
    comparisonText = `+${comparison}次`
  } else if (comparison < 0) {
    comparisonClass = 'is-negative'
    comparisonText = `${comparison}次`
  }

  return {
    totalCount,
    completionRate,
    comparisonValue: comparison,
    comparisonClass,
    comparisonText
  }
})

function getTodayPlans() {
  const today = new Date()
  const dayOfWeek = today.getDay()
  const isWorkday = dayOfWeek >= 1 && dayOfWeek <= 5
  const isWeekend = dayOfWeek === 0 || dayOfWeek === 6

  return planStore.activePlans.filter(plan => {
    const startDate = new Date(plan.startDate)
    if (startDate > today) return false

    if (plan.endDate) {
      const endDate = new Date(plan.endDate)
      if (endDate < today) return false
    }

    switch (plan.frequency) {
      case 'daily':
        return true
      case 'workdays':
        return isWorkday
      case 'weekends':
        return isWeekend
      case 'weekly':
        if (plan.customRules && plan.customRules.length > 0) {
          const targetDay = dayOfWeek === 0 ? 7 : dayOfWeek
          return plan.customRules.some(rule => rule.days?.includes(targetDay))
        }
        return false
      case 'custom':
        if (plan.customRules && plan.customRules.length > 0) {
          for (const rule of plan.customRules) {
            if (rule.type === 'interval') {
              const daysSinceStart = Math.floor(
                (today.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)
              )
              return daysSinceStart % rule.value === 0
            }
          }
        }
        return false
      default:
        return false
    }
  })
}

function getFrequencyLabel(frequency) {
  const labels = {
    daily: '每日',
    weekly: '每周',
    workdays: '工作日',
    weekends: '周末',
    custom: '自定义'
  }
  return labels[frequency] || frequency
}

function formatTimeAgo(time) {
  return dayjs(new Date(time)).fromNow()
}

function formatDetailDate(date) {
  return dayjs(new Date(date)).format('YYYY年MM月DD日')
}

function formatDetailTime(time) {
  return dayjs(new Date(time)).format('HH:mm:ss')
}

function openCheckInDialog() {
  showCheckInDialog.value = true
}

async function handleCheckIn(plan) {
  try {
    const result = await recordStore.checkIn(plan.id, { content: '', images: [] })
    if (result) {
      ElMessage.success('打卡成功！')
    } else {
      ElMessage.error(recordStore.error || '打卡失败')
    }
  } catch (error) {
    ElMessage.error('操作失败，请重试')
  }
}

function handleCheckInSuccess() {
  ElMessage.success('打卡成功！')
  showCheckInDialog.value = false
}

function viewRecordDetail(record) {
  selectedRecord.value = record
  showRecordDetail.value = true
}

function viewPlanDetail() {
  if (selectedRecord.value) {
    router.push(`/plans/${selectedRecord.value.planId}`)
  }
  showRecordDetail.value = false
}

async function loadData() {
  try {
    isLoading.value = true

    await Promise.all([
      authStore.loadUser(),
      planStore.loadPlans(),
      recordStore.loadRecords(),
      tagStore.loadTags()
    ])
  } catch (error) {
    console.error('Load data error:', error)
    ElMessage.error('加载数据失败')
  } finally {
    isLoading.value = false
  }
}

let refreshInterval = null

onMounted(async () => {
  await loadData()

  refreshInterval = setInterval(() => {
    if (authStore.isAuthenticated) {
      recordStore.loadRecords()
    }
  }, 60000)
})

onUnmounted(() => {
  if (refreshInterval) {
    clearInterval(refreshInterval)
  }
})
</script>

<style lang="scss" scoped>
.dashboard-container {
  max-width: 1400px;
  margin: 0 auto;
  padding: var(--spacing-lg);
}

.loading-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 400px;
  color: var(--text-secondary);

  p {
    margin-top: var(--spacing-md);
  }
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--spacing-xl);
  padding: var(--spacing-lg);
  background: linear-gradient(135deg, var(--primary-color) 0%, #66B1FF 100%);
  border-radius: var(--radius-large);
  color: white;

  .page-title {
    font-size: 28px;
    font-weight: bold;
    margin-bottom: var(--spacing-xs);
  }

  .page-subtitle {
    font-size: 14px;
    opacity: 0.9;
  }

  .header-right {
    :deep(.el-button) {
      background: white;
      color: var(--primary-color);
      border: none;
      font-weight: 600;

      &:hover {
        background: rgba(255, 255, 255, 0.9);
      }
    }
  }
}

.overview-row {
  margin-bottom: var(--spacing-lg);
}

.overview-card {
  background: var(--bg-card);
  border-radius: var(--radius-large);
  padding: var(--spacing-lg);
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
  box-shadow: var(--shadow-light);
  transition: all 0.3s ease;
  margin-bottom: var(--spacing-md);

  &:hover {
    transform: translateY(-2px);
    box-shadow: var(--shadow-medium);
  }
}

.overview-icon {
  width: 56px;
  height: 56px;
  border-radius: var(--radius-medium);
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  flex-shrink: 0;
}

.overview-content {
  flex: 1;
}

.overview-value {
  font-size: 28px;
  font-weight: bold;
  color: var(--text-primary);
  line-height: 1.2;
}

.overview-label {
  color: var(--text-secondary);
  font-size: 13px;
  margin-top: var(--spacing-xs);
}

.card-container {
  background: var(--bg-card);
  border-radius: var(--radius-large);
  padding: var(--spacing-lg);
  box-shadow: var(--shadow-light);

  &.mb-lg {
    margin-bottom: var(--spacing-lg);
  }
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--spacing-lg);

  h3 {
    font-size: 16px;
    font-weight: 600;
    color: var(--text-primary);
  }

  .more-link {
    display: flex;
    align-items: center;
    gap: var(--spacing-xs);
    color: var(--primary-color);
    font-size: 14px;
    text-decoration: none;

    &:hover {
      text-decoration: underline;
    }
  }
}

.plan-list {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-md);
}

.plan-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--spacing-md);
  background: var(--bg-page);
  border-radius: var(--radius-medium);
  border: 1px solid var(--border-light);
  transition: all 0.3s ease;

  &:hover:not(.is-completed) {
    border-color: var(--primary-color);
    box-shadow: var(--shadow-light);
  }

  &.is-completed {
    opacity: 0.7;
  }
}

.plan-left {
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
}

.plan-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.plan-name {
  font-size: 14px;
  font-weight: 500;
  color: var(--text-primary);
}

.plan-frequency {
  font-size: 12px;
  color: var(--text-secondary);
}

.plan-right {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
}

.record-list {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm);
}

.record-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--spacing-md);
  background: var(--bg-page);
  border-radius: var(--radius-medium);
  cursor: pointer;
  transition: all 0.3s ease;

  &:hover {
    background: var(--bg-hover);
    transform: translateX(4px);
  }
}

.record-left {
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
  flex: 1;
  min-width: 0;
}

.record-icon {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: rgba(103, 194, 58, 0.1);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.record-info {
  flex: 1;
  min-width: 0;
}

.record-header {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  margin-bottom: 2px;
}

.record-plan {
  font-size: 14px;
  font-weight: 500;
  color: var(--text-primary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.record-content {
  font-size: 12px;
  color: var(--text-secondary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  display: block;
}

.record-right {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  flex-shrink: 0;
}

.record-time {
  font-size: 12px;
  color: var(--text-placeholder);
  white-space: nowrap;
}

.record-arrow {
  font-size: 14px;
}

.week-progress {
  display: flex;
  justify-content: space-between;
  gap: var(--spacing-sm);
  margin-bottom: var(--spacing-lg);
}

.day-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--spacing-xs);
  flex: 1;
}

.day-circle {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: var(--bg-page);
  border: 2px solid var(--border-color);
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s ease;

  &.is-today {
    border-color: var(--primary-color);
    border-width: 3px;
  }

  &.is-completed {
    background: var(--success-color);
    border-color: var(--success-color);
    color: white;
  }

  &.is-future {
    opacity: 0.5;
  }

  .day-dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: var(--border-color);
  }
}

.day-label {
  font-size: 13px;
  font-weight: 500;
  color: var(--text-primary);
}

.day-date {
  font-size: 11px;
  color: var(--text-secondary);
}

.week-summary {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-md);
}

.summary-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--spacing-sm) 0;
  border-bottom: 1px solid var(--border-light);

  &:last-child {
    border-bottom: none;
  }
}

.summary-label {
  font-size: 14px;
  color: var(--text-secondary);
}

.summary-value {
  font-size: 14px;
  font-weight: 600;
  color: var(--text-primary);
  display: flex;
  align-items: center;
  gap: var(--spacing-xs);

  &.is-positive {
    color: var(--success-color);
  }

  &.is-negative {
    color: var(--danger-color);
  }
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
  border-radius: var(--radius-medium);
}

.stat-value {
  font-size: 24px;
  font-weight: bold;
  color: var(--primary-color);
  margin-bottom: var(--spacing-xs);
}

.stat-label {
  font-size: 12px;
  color: var(--text-secondary);
}

.quick-actions {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: var(--spacing-md);
}

.action-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--spacing-sm);
  padding: var(--spacing-lg);
  background: var(--bg-page);
  border-radius: var(--radius-medium);
  text-decoration: none;
  color: var(--text-primary);
  transition: all 0.3s ease;

  &:hover {
    transform: translateY(-2px);
    box-shadow: var(--shadow-light);
  }

  span {
    font-size: 13px;
    font-weight: 500;
  }
}

.action-icon {
  width: 48px;
  height: 48px;
  border-radius: var(--radius-medium);
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 24px;
}

.record-detail {
  padding: var(--spacing-md);
}

:deep(.el-divider) {
  margin: var(--spacing-md) 0;
}

@media (max-width: 768px) {
  .dashboard-container {
    padding: var(--spacing-md);
  }

  .page-header {
    flex-direction: column;
    align-items: flex-start;
    gap: var(--spacing-md);

    .header-right {
      width: 100%;

      :deep(.el-button) {
        width: 100%;
      }
    }
  }

  .overview-card {
    padding: var(--spacing-md);
  }

  .overview-value {
    font-size: 24px;
  }

  .plan-item {
    flex-direction: column;
    align-items: flex-start;
    gap: var(--spacing-md);
  }

  .plan-right {
    width: 100%;
    justify-content: space-between;
  }

  .record-item {
    flex-direction: column;
    align-items: flex-start;
    gap: var(--spacing-sm);
  }

  .record-right {
    width: 100%;
    justify-content: space-between;
  }

  .quick-actions {
    grid-template-columns: repeat(2, 1fr);
  }
}
</style>
