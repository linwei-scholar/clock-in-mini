<template>
  <ResponsiveLayout>
    <div class="calendar-container">
      <el-card>
        <template #header>
          <div class="card-header">
            <span class="card-title">打卡日历</span>
            <el-radio-group v-model="viewType" size="small">
              <el-radio-button label="dayGridMonth">月</el-radio-button>
              <el-radio-button label="timeGridWeek">周</el-radio-button>
            </el-radio-group>
          </div>
        </template>

        <el-row :gutter="20" class="filter-section">
          <el-col :xs="24" :sm="12" class="filter-select">
            <el-select
              v-model="selectedPlanId"
              placeholder="筛选计划"
              clearable
              size="small"
              style="width: 100%"
            >
              <el-option
                v-for="plan in planStore.plans"
                :key="plan.id"
                :label="plan.name"
                :value="plan.id"
              />
            </el-select>
          </el-col>
          <el-col :xs="24" :sm="12" class="date-navigation">
            <el-button @click="goToToday" size="small">
              今天
            </el-button>
            <el-button @click="changeDate(-1)" size="small" class="touch-button">
              <el-icon><ArrowLeft /></el-icon>
            </el-button>
            <el-button @click="changeDate(1)" size="small" class="touch-button">
              <el-icon><ArrowRight /></el-icon>
            </el-button>
          </el-col>
        </el-row>

        <div class="calendar-wrapper">
          <FullCalendar
            ref="fullCalendarRef"
            :options="calendarOptions"
          />
        </div>
      </el-card>
    </div>
  </ResponsiveLayout>
</template>

<script setup>
import { ref, reactive, computed, onMounted, watch } from 'vue'
import FullCalendar from '@fullcalendar/vue3'
import dayGridPlugin from '@fullcalendar/daygrid'
import timeGridPlugin from '@fullcalendar/timegrid'
import interactionPlugin from '@fullcalendar/interaction'
import { ElMessage } from 'element-plus'
import { ArrowLeft, ArrowRight } from '@element-plus/icons-vue'
import { usePlanStore } from '@/stores/planStore'
import { useRecordStore } from '@/stores/recordStore'
import ResponsiveLayout from '@/components/ResponsiveLayout.vue'

const planStore = usePlanStore()
const recordStore = useRecordStore()

const fullCalendarRef = ref(null)
const viewType = ref('dayGridMonth')
const selectedPlanId = ref('')

const calendarOptions = reactive({
  plugins: [dayGridPlugin, timeGridPlugin, interactionPlugin],
  initialView: 'dayGridMonth',
  headerToolbar: false,
  height: 'auto',
  events: [],
  eventClick: handleEventClick,
  dateClick: handleDateClick,
  locale: 'zh-cn'
})

const goToToday = () => {
  const api = fullCalendarRef.value?.getApi()
  if (api) {
    api.today()
    updateEvents()
  }
}

const changeDate = (direction) => {
  const api = fullCalendarRef.value?.getApi()
  if (api) {
    if (viewType.value === 'dayGridMonth') {
      api.next()
    } else if (viewType.value === 'timeGridWeek') {
      api.next()
    }
    updateEvents()
  }
}

const handleEventClick = (info) => {
  ElMessage.info(`查看打卡记录：${info.event.title}`)
}

const handleDateClick = (info) => {
  ElMessage.info(`选择日期：${info.dateStr}`)
}

const updateEvents = () => {
  const events = []
  let records = recordStore.records

  if (selectedPlanId.value) {
    records = records.filter(r => r.planId === selectedPlanId.value)
  }

  records.forEach(record => {
    const plan = planStore.getPlanById(record.planId)
    if (plan) {
      events.push({
        id: record.id,
        title: plan.name,
        date: record.checkInDate,
        backgroundColor: '#67C23A',
        borderColor: '#67C23A'
      })
    }
  })

  calendarOptions.events = events
}

const handleViewChange = () => {
  calendarOptions.initialView = viewType.value
  updateEvents()
}

watch(viewType, handleViewChange)
watch(selectedPlanId, updateEvents)

onMounted(() => {
  updateEvents()
})
</script>

<style scoped>
.calendar-container {
  width: 100%;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: var(--spacing-sm);
  flex-wrap: wrap;
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

.filter-section {
  margin-bottom: var(--spacing-lg);
}

.filter-select {
  margin-bottom: var(--spacing-md);
}

@media (min-width: 768px) {
  .filter-select {
    margin-bottom: 0;
  }
}

.date-navigation {
  display: flex;
  justify-content: flex-start;
  gap: var(--spacing-xs);
}

@media (min-width: 768px) {
  .date-navigation {
    justify-content: flex-end;
  }
}

.calendar-wrapper {
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
}

:deep(.fc) {
  font-family: var(--font-family);
  min-width: 600px;
}

:deep(.fc-button) {
  background-color: var(--primary-color) !important;
  border-color: var(--primary-color) !important;
  padding: 8px 16px;
  font-size: var(--font-size-sm);
}

:deep(.fc-button:hover) {
  background-color: var(--primary-dark) !important;
  border-color: var(--primary-dark) !important;
}

:deep(.fc-button-active) {
  background-color: var(--primary-dark) !important;
  border-color: var(--primary-dark) !important;
}

:deep(.fc-daygrid-day-number) {
  padding: 8px;
  font-size: var(--font-size-sm);
}

:deep(.fc-col-header-cell-cushion) {
  padding: 10px;
  font-size: var(--font-size-sm);
}

@media (max-width: 768px) {
  :deep(.fc-button) {
    padding: 6px 12px;
    font-size: var(--font-size-xs);
  }

  :deep(.fc-daygrid-day-number) {
    padding: 4px;
    font-size: var(--font-size-xs);
  }

  :deep(.fc-col-header-cell-cushion) {
    padding: 6px;
    font-size: var(--font-size-xs);
  }
}
</style>
