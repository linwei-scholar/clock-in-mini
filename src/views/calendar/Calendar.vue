<template>
  <div class="calendar-container">
    <div class="page-header">
      <h1 class="page-title">日历视图</h1>
      <div class="header-actions">
        <el-radio-group v-model="viewMode" size="default" @change="handleViewChange">
          <el-radio-button label="month">月视图</el-radio-button>
          <el-radio-button label="week">周视图</el-radio-button>
        </el-radio-group>
      </div>
    </div>

    <div class="calendar-toolbar">
      <el-button :icon="ArrowLeft" circle @click="prevPeriod" />
      <el-button @click="goToToday">今天</el-button>
      <el-button :icon="ArrowRight" circle @click="nextPeriod" />
      <h2 class="current-period">{{ currentPeriodLabel }}</h2>

      <div class="plan-filter">
        <el-select v-model="selectedPlans" multiple placeholder="筛选计划" style="width: 200px" @change="refreshCalendar">
          <el-option
            v-for="plan in plans"
            :key="plan.id"
            :label="plan.name"
            :value="plan.id"
          />
        </el-select>
      </div>

      <div class="keyboard-hints">
        <el-tooltip content="上一周期 (←)" placement="bottom">
          <kbd>←</kbd>
        </el-tooltip>
        <el-tooltip content="下一周期 (→)" placement="bottom">
          <kbd>→</kbd>
        </el-tooltip>
        <el-tooltip content="切换周/月视图 (M)" placement="bottom">
          <kbd>M</kbd>
        </el-tooltip>
        <el-tooltip content="回到今天 (T)" placement="bottom">
          <kbd>T</kbd>
        </el-tooltip>
      </div>
    </div>

    <div class="calendar-wrapper">
      <div class="calendar-grid">
        <div class="calendar-header">
          <div v-for="day in weekDays" :key="day" class="header-cell">{{ day }}</div>
        </div>

        <div v-if="viewMode === 'month'" class="month-grid">
          <div
            v-for="(day, index) in monthDays"
            :key="index"
            class="day-cell"
            :class="{
              'other-month': !day.isCurrentMonth,
              'today': day.isToday,
              'has-tasks': day.tasks.length > 0,
              'can-retro': canRetroDay(day.fullDate),
              'is-retro-day': isRetroDay(day.fullDate)
            }"
            @click="handleDayClick(day)"
            @dblclick="handleDayDoubleClick(day)"
            @contextmenu.prevent="handleDayRightClick($event, day)"
          >
            <span class="day-number">{{ day.date }}</span>
            <div v-if="day.tasks.length > 0" class="task-indicators">
              <div
                v-for="(task, taskIndex) in day.tasks.slice(0, 3)"
                :key="taskIndex"
                class="task-dot"
                :style="{ background: task.color }"
                :title="task.name"
              />
              <span v-if="day.tasks.length > 3" class="more-count">+{{ day.tasks.length - 3 }}</span>
            </div>
            <div v-if="day.completedCount > 0" class="completed-indicator">
              <el-icon color="#67C23A"><Check /></el-icon>
              <span class="completed-count">{{ day.completedCount }}</span>
            </div>
          </div>
        </div>

        <div v-else class="week-grid">
          <div
            v-for="day in weekDaysData"
            :key="day.date"
            class="week-day-column"
            :class="{
              'can-retro': canRetroDay(day.date),
              'is-retro-day': isRetroDay(day.date)
            }"
          >
            <div class="week-day-header" :class="{ 'today': day.isToday }">
              <span class="week-day-name">{{ day.dayName }}</span>
              <span class="week-day-number">{{ day.dayNumber }}</span>
            </div>
            <div class="week-day-content" @click="handleDayClick(day)">
              <div
                v-for="task in day.tasks"
                :key="task.id"
                class="week-task-item"
                :class="{ 'is-completed': task.completed }"
                :style="{ borderLeftColor: task.color }"
                @click.stop="handleTaskClick(task)"
                @dblclick.stop="handleTaskDoubleClick(task)"
                @contextmenu.prevent.stop="handleTaskRightClick($event, task)"
              >
                <span class="task-name">{{ task.name }}</span>
                <el-icon v-if="task.completed" color="#67C23A"><Check /></el-icon>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <CheckInDialog
      v-model="showCheckInDialog"
      :selected-date="selectedDate"
      :is-retro="isRetroMode"
      @checkin-success="handleCheckInSuccess"
    />

    <div v-if="contextMenuVisible" class="context-menu" :style="contextMenuStyle">
      <div class="context-menu-item" @click="handleContextMenuCheckIn">
        <el-icon><Edit /></el-icon>
        <span>{{ isRetroMode ? '补卡' : '打卡' }}</span>
      </div>
      <div class="context-menu-item" @click="handleContextMenuViewRecords">
        <el-icon><Document /></el-icon>
        <span>查看记录</span>
      </div>
      <div v-if="isRetroMode" class="context-menu-item disabled">
        <el-icon><Clock /></el-icon>
        <span>超出7天</span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { ElMessage } from 'element-plus'
import { ArrowLeft, ArrowRight, Check, Edit, Document, Clock } from '@element-plus/icons-vue'
import { useRecordStore } from '@/stores/recordStore'
import { usePlanStore } from '@/stores/planStore'
import { useTagStore } from '@/stores/tagStore'
import CheckInDialog from '@/components/checkin/CheckInDialog.vue'
import dayjs from 'dayjs'

const recordStore = useRecordStore()
const planStore = usePlanStore()
const tagStore = useTagStore()

const viewMode = ref('month')
const currentDate = ref(new Date())
const selectedPlans = ref([])
const showCheckInDialog = ref(false)
const selectedDate = ref(null)
const isRetroMode = ref(false)

const contextMenuVisible = ref(false)
const contextMenuStyle = ref({})
const contextMenuTarget = ref(null)

const weekDays = ['周一', '周二', '周三', '周四', '周五', '周六', '周日']

const plans = computed(() => planStore.userPlans)
const records = computed(() => recordStore.userRecords)

const currentPeriodLabel = computed(() => {
  const year = currentDate.value.getFullYear()
  const month = currentDate.value.getMonth() + 1

  if (viewMode.value === 'month') {
    return `${year}年${month}月`
  } else {
    const weekStart = getWeekStart(currentDate.value)
    const weekEnd = new Date(weekStart)
    weekEnd.setDate(weekEnd.getDate() + 6)

    const startMonth = weekStart.getMonth() + 1
    const startDay = weekStart.getDate()
    const endMonth = weekEnd.getMonth() + 1
    const endDay = weekEnd.getDate()

    if (startMonth === endMonth) {
      return `${year}年${startMonth}月${startDay}-${endDay}日`
    } else {
      return `${year}年${startMonth}月${startDay}日 - ${endMonth}月${endDay}日`
    }
  }
})

const getWeekStart = (date) => {
  const d = new Date(date)
  const day = d.getDay()
  const diff = d.getDate() - day + (day === 0 ? -6 : 1)
  return new Date(d.setDate(diff))
}

const monthDays = computed(() => {
  const year = currentDate.value.getFullYear()
  const month = currentDate.value.getMonth()

  const firstDay = new Date(year, month, 1)
  const lastDay = new Date(year, month + 1, 0)

  const days = []
  const startDayOfWeek = (firstDay.getDay() + 6) % 7

  for (let i = startDayOfWeek - 1; i >= 0; i--) {
    const date = new Date(year, month, -i)
    days.push({
      date: date.getDate(),
      fullDate: dayjs(date).format('YYYY-MM-DD'),
      isCurrentMonth: false,
      isToday: false,
      tasks: [],
      completedCount: 0
    })
  }

  for (let i = 1; i <= lastDay.getDate(); i++) {
    const date = new Date(year, month, i)
    const today = new Date()
    const tasks = getTasksForDate(date)
    const completedCount = getCompletedCountForDate(date)

    days.push({
      date: i,
      fullDate: dayjs(date).format('YYYY-MM-DD'),
      isCurrentMonth: true,
      isToday: date.toDateString() === today.toDateString(),
      tasks,
      completedCount
    })
  }

  const remainingDays = 42 - days.length
  for (let i = 1; i <= remainingDays; i++) {
    const date = new Date(year, month + 1, i)
    days.push({
      date: i,
      fullDate: dayjs(date).format('YYYY-MM-DD'),
      isCurrentMonth: false,
      isToday: false,
      tasks: [],
      completedCount: 0
    })
  }

  return days
})

const weekDaysData = computed(() => {
  const today = currentDate.value
  const dayOfWeek = (today.getDay() + 6) % 7
  const monday = new Date(today)
  monday.setDate(today.getDate() - dayOfWeek)

  return Array.from({ length: 7 }, (_, i) => {
    const date = new Date(monday)
    date.setDate(monday.getDate() + i)
    const now = new Date()
    const tasks = getTasksForDate(date)
    const completedCount = getCompletedCountForDate(date)

    return {
      date: dayjs(date).format('YYYY-MM-DD'),
      dayName: weekDays[i],
      dayNumber: date.getDate(),
      isToday: date.toDateString() === now.toDateString(),
      tasks,
      completedCount
    }
  })
})

const canRetroDay = (dateStr) => {
  const targetDate = dayjs(dateStr)
  const today = dayjs()
  const daysDiff = today.diff(targetDate, 'day')
  return daysDiff >= 0 && daysDiff <= 7
}

const isRetroDay = (dateStr) => {
  const targetDate = dayjs(dateStr)
  const today = dayjs()
  const daysDiff = today.diff(targetDate, 'day')
  return daysDiff > 0 && daysDiff <= 7
}

const getTasksForDate = (date) => {
  const dateStr = dayjs(date).format('YYYY-MM-DD')
  const dayOfWeek = date.getDay()
  const isWorkday = dayOfWeek >= 1 && dayOfWeek <= 5
  const isWeekend = dayOfWeek === 0 || dayOfWeek === 6

  return plans.value
    .filter(plan => {
      if (selectedPlans.value.length > 0 && !selectedPlans.value.includes(plan.id)) {
        return false
      }

      if (plan.status !== 'active') return false

      const startDate = new Date(plan.startDate)
      if (date < startDate) return false

      if (plan.endDate) {
        const endDate = new Date(plan.endDate)
        if (date > endDate) return false
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
                  (date.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)
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
    .map(plan => {
      const tag = plan.tagIds?.[0]
      const tagData = tagStore.tags.find(t => t.id === tag)
      const completed = records.value.some(record => {
        const recordDateStr = dayjs(new Date(record.checkInDate)).format('YYYY-MM-DD')
        return record.planId === plan.id && recordDateStr === dateStr
      })

      return {
        id: plan.id,
        name: plan.name,
        color: tagData?.color || '#409EFF',
        planName: plan.name,
        completed
      }
    })
}

const getCompletedCountForDate = (date) => {
  const dateStr = dayjs(date).format('YYYY-MM-DD')
  return records.value.filter(record => {
    const recordDateStr = dayjs(new Date(record.checkInDate)).format('YYYY-MM-DD')
    return recordDateStr === dateStr
  }).length
}

const prevPeriod = () => {
  const date = new Date(currentDate.value)
  if (viewMode.value === 'month') {
    date.setMonth(date.getMonth() - 1)
  } else {
    date.setDate(date.getDate() - 7)
  }
  currentDate.value = date
}

const nextPeriod = () => {
  const date = new Date(currentDate.value)
  if (viewMode.value === 'month') {
    date.setMonth(date.getMonth() + 1)
  } else {
    date.setDate(date.getDate() + 7)
  }
  currentDate.value = date
}

const goToToday = () => {
  currentDate.value = new Date()
}

const handleViewChange = () => {
  refreshCalendar()
}

const refreshCalendar = () => {
  currentDate.value = new Date(currentDate.value)
}

const handleDayClick = (day) => {
  selectedDate.value = day.fullDate
  isRetroMode.value = isRetroDay(day.fullDate)
  showCheckInDialog.value = true
}

const handleDayDoubleClick = (day) => {
  selectedDate.value = day.fullDate
  isRetroMode.value = isRetroDay(day.fullDate)
  showCheckInDialog.value = true
}

const handleTaskClick = (task) => {
  ElMessage.info(`点击了任务: ${task.name}`)
}

const handleTaskDoubleClick = (task) => {
  if (!task.completed) {
    selectedDate.value = dayjs().format('YYYY-MM-DD')
    isRetroMode.value = false
    showCheckInDialog.value = true
  }
}

const handleDayRightClick = (event, day) => {
  contextMenuTarget.value = day
  contextMenuStyle.value = {
    left: `${event.clientX}px`,
    top: `${event.clientY}px`
  }
  contextMenuVisible.value = true
}

const handleTaskRightClick = (event, task) => {
  contextMenuTarget.value = task
  contextMenuStyle.value = {
    left: `${event.clientX}px`,
    top: `${event.clientY}px`
  }
  contextMenuVisible.value = true
}

const hideContextMenu = () => {
  contextMenuVisible.value = false
  contextMenuTarget.value = null
}

const handleContextMenuCheckIn = () => {
  if (contextMenuTarget.value) {
    if (contextMenuTarget.value.fullDate) {
      selectedDate.value = contextMenuTarget.value.fullDate
    } else if (contextMenuTarget.value.date) {
      selectedDate.value = contextMenuTarget.value.date
    }

    isRetroMode.value = isRetroDay(selectedDate.value)

    if (!canRetroDay(selectedDate.value)) {
      ElMessage.warning('只能补最近7天的打卡')
      hideContextMenu()
      return
    }

    showCheckInDialog.value = true
  }
  hideContextMenu()
}

const handleContextMenuViewRecords = () => {
  if (contextMenuTarget.value) {
    let dateStr = ''
    if (contextMenuTarget.value.fullDate) {
      dateStr = contextMenuTarget.value.fullDate
    } else if (contextMenuTarget.value.date) {
      dateStr = contextMenuTarget.value.date
    }

    ElMessage.info(`查看 ${dateStr} 的打卡记录`)
  }
  hideContextMenu()
}

const handleCheckInSuccess = ({ plan, record, isRetro }) => {
  refreshCalendar()

  if (isRetro) {
    ElMessage.success(`补卡成功！记录已标记为迟到`)
  } else {
    ElMessage.success(`打卡成功！`)
  }
}

const handleKeyboardNavigation = (event) => {
  if (event.target.tagName === 'INPUT' || event.target.tagName === 'TEXTAREA') {
    return
  }

  switch (event.key) {
    case 'ArrowLeft':
      prevPeriod()
      event.preventDefault()
      break
    case 'ArrowRight':
      nextPeriod()
      event.preventDefault()
      break
    case 't':
    case 'T':
      goToToday()
      event.preventDefault()
      break
    case 'm':
    case 'M':
      viewMode.value = viewMode.value === 'month' ? 'week' : 'month'
      event.preventDefault()
      break
  }
}

onMounted(async () => {
  await planStore.loadPlans()
  await recordStore.loadRecords()
  await tagStore.loadTags()

  document.addEventListener('click', hideContextMenu)
  document.addEventListener('keydown', handleKeyboardNavigation)
})

onUnmounted(() => {
  document.removeEventListener('click', hideContextMenu)
  document.removeEventListener('keydown', handleKeyboardNavigation)
})
</script>

<style lang="scss" scoped>
.calendar-container {
  max-width: 1200px;
  margin: 0 auto;
  position: relative;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--spacing-lg);
}

.page-title {
  font-size: 28px;
  font-weight: bold;
  margin: 0;
}

.calendar-toolbar {
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
  margin-bottom: var(--spacing-lg);
  padding: var(--spacing-md);
  background: var(--bg-card);
  border-radius: var(--radius-medium);
  flex-wrap: wrap;
}

.current-period {
  font-size: 18px;
  font-weight: 600;
  margin: 0;
  flex: 1;
}

.plan-filter {
  margin-left: auto;
}

.keyboard-hints {
  display: flex;
  gap: var(--spacing-xs);
  align-items: center;

  kbd {
    display: inline-block;
    padding: 2px 6px;
    font-size: 11px;
    font-family: Arial, sans-serif;
    background: var(--bg-page);
    border: 1px solid var(--border-light);
    border-radius: 3px;
    color: var(--text-secondary);
    cursor: help;
  }
}

.calendar-wrapper {
  background: var(--bg-card);
  border-radius: var(--radius-medium);
  padding: var(--spacing-lg);
  box-shadow: var(--shadow-light);
}

.calendar-header {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 1px;
  margin-bottom: var(--spacing-sm);
}

.header-cell {
  text-align: center;
  font-size: 12px;
  font-weight: 600;
  color: var(--text-secondary);
  padding: var(--spacing-sm);
}

.month-grid {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 1px;
  background: var(--border-light);
}

.day-cell {
  min-height: 100px;
  background: var(--bg-card);
  padding: var(--spacing-sm);
  cursor: pointer;
  transition: background 0.2s ease;
  position: relative;

  &:hover {
    background: var(--bg-hover);
  }

  &.other-month {
    background: var(--bg-page);

    .day-number {
      color: var(--text-placeholder);
    }
  }

  &.today {
    .day-number {
      background: var(--primary-color);
      color: white;
      border-radius: 50%;
      width: 24px;
      height: 24px;
      display: flex;
      align-items: center;
      justify-content: center;
    }
  }

  &.can-retro:not(.other-month) {
    background: linear-gradient(135deg, var(--bg-card) 0%, rgba(230, 162, 60, 0.05) 100%);
    border: 1px dashed var(--warning-color);

    &:hover {
      background: rgba(230, 162, 60, 0.1);
    }
  }

  &.is-retro-day {
    background: rgba(230, 162, 60, 0.15);
    border: 2px solid var(--warning-color);
    border-radius: var(--radius-small);
  }
}

.day-number {
  font-size: 14px;
  font-weight: 500;
  color: var(--text-primary);
}

.task-indicators {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  margin-top: var(--spacing-xs);
}

.task-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
}

.more-count {
  font-size: 10px;
  color: var(--text-secondary);
}

.completed-indicator {
  position: absolute;
  bottom: var(--spacing-xs);
  right: var(--spacing-xs);
  display: flex;
  align-items: center;
  gap: 2px;
  font-size: 10px;
  color: #67C23A;
}

.completed-count {
  font-weight: 600;
}

.week-grid {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: var(--spacing-sm);
}

.week-day-column {
  min-height: 400px;
  border-radius: var(--radius-medium);
  transition: all 0.3s ease;

  &.can-retro {
    background: linear-gradient(135deg, var(--bg-card) 0%, rgba(230, 162, 60, 0.05) 100%);
    border: 1px dashed var(--warning-color);

    &:hover {
      background: rgba(230, 162, 60, 0.1);
    }
  }

  &.is-retro-day {
    background: rgba(230, 162, 60, 0.15);
    border: 2px solid var(--warning-color);
  }
}

.week-day-header {
  text-align: center;
  padding: var(--spacing-md);
  background: var(--bg-page);
  border-radius: var(--radius-medium);
  margin-bottom: var(--spacing-sm);

  &.today {
    background: var(--primary-color);
    color: white;
  }
}

.week-day-name {
  display: block;
  font-size: 12px;
  color: inherit;
}

.week-day-number {
  display: block;
  font-size: 20px;
  font-weight: bold;
  color: inherit;
}

.week-day-content {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xs);
  cursor: pointer;
}

.week-task-item {
  padding: var(--spacing-sm);
  background: var(--bg-page);
  border-radius: var(--radius-small);
  border-left: 3px solid;
  cursor: pointer;
  display: flex;
  justify-content: space-between;
  align-items: center;
  transition: all 0.2s ease;

  &:hover {
    background: var(--bg-hover);
    transform: translateX(2px);
  }

  &.is-completed {
    opacity: 0.6;

    .task-name {
      text-decoration: line-through;
    }
  }

  .task-name {
    font-size: 12px;
    color: var(--text-primary);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    flex: 1;
  }
}

.context-menu {
  position: fixed;
  background: var(--bg-card);
  border: 1px solid var(--border-light);
  border-radius: var(--radius-medium);
  box-shadow: var(--shadow-medium);
  padding: var(--spacing-xs);
  z-index: 9999;
  min-width: 150px;
}

.context-menu-item {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  padding: var(--spacing-sm) var(--spacing-md);
  font-size: 14px;
  color: var(--text-primary);
  cursor: pointer;
  border-radius: var(--radius-small);
  transition: background 0.2s ease;

  &:hover:not(.disabled) {
    background: var(--bg-hover);
  }

  &.disabled {
    color: var(--text-placeholder);
    cursor: not-allowed;
    opacity: 0.5;
  }
}

@media (max-width: 768px) {
  .calendar-toolbar {
    flex-direction: column;
    align-items: stretch;
  }

  .plan-filter {
    margin-left: 0;
  }

  .keyboard-hints {
    justify-content: center;
  }

  .month-grid {
    .day-cell {
      min-height: 80px;
    }
  }

  .week-grid {
    grid-template-columns: repeat(7, 1fr);
    gap: var(--spacing-xs);

    .week-day-column {
      min-height: 200px;
    }
  }
}
</style>
