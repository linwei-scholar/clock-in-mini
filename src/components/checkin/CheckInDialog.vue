<template>
  <el-dialog
    v-model="visible"
    :title="dialogTitle"
    width="600px"
    :close-on-click-modal="false"
    @closed="handleClosed"
  >
    <div class="checkin-dialog-content">
      <div class="selected-date-info">
        <el-icon><Calendar /></el-icon>
        <span class="date-label">{{ formattedDate }}</span>
        <el-tag v-if="isRetroMode" type="warning" size="small" effect="dark">
          补卡
        </el-tag>
      </div>

      <el-divider />

      <div v-if="loading" class="loading-state">
        <el-icon class="is-loading"><Loading /></el-icon>
        <span>加载中...</span>
      </div>

      <div v-else-if="availablePlans.length === 0" class="empty-state">
        <el-empty description="该日期暂无待打卡计划" />
      </div>

      <div v-else class="plan-list">
        <div
          v-for="plan in availablePlans"
          :key="plan.id"
          class="plan-item"
          :class="{
            'is-completed': isPlanCompleted(plan.id),
            'is-disabled': isPlanCompleted(plan.id)
          }"
        >
          <div class="plan-info">
            <div class="plan-header">
              <el-tag
                v-if="plan.tagIds && plan.tagIds.length > 0"
                size="small"
                :color="getTagColor(plan.tagIds[0])"
              >
                {{ getTagName(plan.tagIds[0]) }}
              </el-tag>
              <span class="plan-name">{{ plan.name }}</span>
            </div>
            <div v-if="plan.description" class="plan-description">
              {{ plan.description }}
            </div>
            <div class="plan-meta">
              <span class="frequency-tag">
                {{ getFrequencyLabel(plan.frequency) }}
              </span>
            </div>
          </div>

          <div class="plan-action">
            <template v-if="isPlanCompleted(plan.id)">
              <el-tag type="success" size="small">
                <el-icon><Check /></el-icon>
                已打卡
              </el-tag>
            </template>
            <template v-else>
              <el-button
                type="primary"
                size="small"
                @click="handleCheckIn(plan)"
              >
                <el-icon><Check /></el-icon>
                打卡
              </el-button>
            </template>
          </div>
        </div>
      </div>

      <el-divider />

      <div class="checkin-form">
        <h4 class="form-title">
          <el-icon><Edit /></el-icon>
          打卡内容（可选）
        </h4>

        <el-input
          v-model="checkinContent"
          type="textarea"
          :rows="3"
          placeholder="记录一下今天的打卡心得..."
          maxlength="500"
          show-word-limit
        />

        <div class="quick-tags">
          <span class="quick-tags-label">快捷标签：</span>
          <el-tag
            v-for="tag in quickTags"
            :key="tag"
            class="quick-tag"
            :type="selectedQuickTags.includes(tag) ? 'primary' : 'info'"
            @click="toggleQuickTag(tag)"
          >
            {{ tag }}
          </el-tag>
        </div>
      </div>
    </div>

    <template #footer>
      <div class="dialog-footer">
        <el-button @click="handleClose">取消</el-button>
        <el-button type="primary" @click="handleQuickCheckIn">
          快速打卡
        </el-button>
      </div>
    </template>
  </el-dialog>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Calendar, Check, Edit, Loading } from '@element-plus/icons-vue'
import { useRecordStore } from '@/stores/recordStore'
import { usePlanStore } from '@/stores/planStore'
import { useTagStore } from '@/stores/tagStore'
import dayjs from 'dayjs'

const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false
  },
  selectedDate: {
    type: [Date, String],
    default: null
  },
  isRetro: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['update:modelValue', 'checkin-success'])

const recordStore = useRecordStore()
const planStore = usePlanStore()
const tagStore = useTagStore()

const visible = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value)
})

const loading = ref(false)
const checkinContent = ref('')
const selectedQuickTags = ref([])
const quickTags = ['坚持', '加油', '完成', '继续努力', '突破']

const isRetroMode = computed(() => props.isRetro)

const dialogTitle = computed(() => {
  if (isRetroMode.value) {
    return '补卡'
  }
  return '快速打卡'
})

const formattedDate = computed(() => {
  if (!props.selectedDate) return ''
  const date = props.selectedDate instanceof Date ? props.selectedDate : new Date(props.selectedDate)
  return dayjs(date).format('YYYY年MM月DD日')
})

const isToday = computed(() => {
  if (!props.selectedDate) return false
  const date = props.selectedDate instanceof Date ? props.selectedDate : new Date(props.selectedDate)
  const today = new Date()
  return dayjs(date).format('YYYY-MM-DD') === dayjs(today).format('YYYY-MM-DD')
})

const availablePlans = computed(() => {
  if (!props.selectedDate) return []

  const selectedDateObj = props.selectedDate instanceof Date ? props.selectedDate : new Date(props.selectedDate)
  const dayOfWeek = selectedDateObj.getDay()
  const isWorkday = dayOfWeek >= 1 && dayOfWeek <= 5
  const isWeekend = dayOfWeek === 0 || dayOfWeek === 6

  return planStore.activePlans.filter(plan => {
    const startDate = new Date(plan.startDate)
    if (selectedDateObj < startDate) return false

    if (plan.endDate) {
      const endDate = new Date(plan.endDate)
      if (selectedDateObj > endDate) return false
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
                (selectedDateObj.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)
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
})

const isPlanCompleted = (planId) => {
  if (!props.selectedDate) return false

  const selectedDateStr = props.selectedDate instanceof Date
    ? dayjs(props.selectedDate).format('YYYY-MM-DD')
    : props.selectedDate

  return recordStore.records.some(record => {
    const recordDateStr = dayjs(new Date(record.checkInDate)).format('YYYY-MM-DD')
    return record.planId === planId && recordDateStr === selectedDateStr
  })
}

const getTagColor = (tagId) => {
  const tag = tagStore.tags.find(t => t.id === tagId)
  return tag?.color || '#409EFF'
}

const getTagName = (tagId) => {
  const tag = tagStore.tags.find(t => t.id === tagId)
  return tag?.name || ''
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

const toggleQuickTag = (tag) => {
  const index = selectedQuickTags.value.indexOf(tag)
  if (index > -1) {
    selectedQuickTags.value.splice(index, 1)
  } else {
    selectedQuickTags.value.push(tag)
  }

  if (selectedQuickTags.value.length > 0) {
    checkinContent.value = selectedQuickTags.value.join('，')
  }
}

const handleCheckIn = async (plan) => {
  try {
    loading.value = true

    let result
    const formData = {
      content: checkinContent.value,
      images: []
    }

    if (isRetroMode.value) {
      const targetDate = props.selectedDate instanceof Date
        ? props.selectedDate
        : new Date(props.selectedDate)

      const today = new Date()
      const daysDiff = Math.floor((today.getTime() - targetDate.getTime()) / (1000 * 60 * 60 * 24))

      if (daysDiff > 7) {
        ElMessage.warning('只能补最近7天的打卡')
        return
      }

      result = await recordStore.retroCheckIn(plan.id, targetDate, formData)
    } else {
      result = await recordStore.checkIn(plan.id, formData)
    }

    if (result) {
      const status = isRetroMode.value ? '补卡' : '打卡'
      ElMessage.success(`${status}成功！`)
      emit('checkin-success', { plan, record: result, isRetro: isRetroMode.value })

      if (plan.id === availablePlans.value[availablePlans.value.length - 1]?.id) {
        handleClose()
      }
    } else {
      ElMessage.error(recordStore.error || `${isRetroMode.value ? '补卡' : '打卡'}失败`)
    }
  } catch (error) {
    console.error('Check-in error:', error)
    ElMessage.error('操作失败，请重试')
  } finally {
    loading.value = false
  }
}

const handleQuickCheckIn = async () => {
  const uncompletedPlans = availablePlans.value.filter(plan => !isPlanCompleted(plan.id))

  if (uncompletedPlans.length === 0) {
    ElMessage.info('所有计划已完成打卡')
    return
  }

  if (uncompletedPlans.length === 1) {
    await handleCheckIn(uncompletedPlans[0])
    return
  }

  try {
    const planNames = uncompletedPlans.map(p => p.name).join('、')
    const confirmed = await ElMessageBox.confirm(
      `确定要对以下计划快速打卡吗？\n\n${planNames}`,
      '批量打卡确认',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'info'
      }
    )

    if (confirmed) {
      loading.value = true
      let successCount = 0

      for (const plan of uncompletedPlans) {
        let result
        const formData = {
          content: checkinContent.value,
          images: []
        }

        if (isRetroMode.value) {
          const targetDate = props.selectedDate instanceof Date
            ? props.selectedDate
            : new Date(props.selectedDate)
          result = await recordStore.retroCheckIn(plan.id, targetDate, formData)
        } else {
          result = await recordStore.checkIn(plan.id, formData)
        }

        if (result) {
          successCount++
          emit('checkin-success', { plan, record: result, isRetro: isRetroMode.value })
        }
      }

      if (successCount > 0) {
        ElMessage.success(`成功打卡 ${successCount} 个计划`)
        handleClose()
      } else {
        ElMessage.error('打卡失败')
      }
    }
  } catch (error) {
    if (error !== 'cancel') {
      console.error('Quick check-in error:', error)
      ElMessage.error('操作失败，请重试')
    }
  } finally {
    loading.value = false
  }
}

const handleClose = () => {
  visible.value = false
}

const handleClosed = () => {
  checkinContent.value = ''
  selectedQuickTags.value = []
}

watch(visible, (newVal) => {
  if (newVal) {
    checkinContent.value = ''
    selectedQuickTags.value = []
  }
})
</script>

<style lang="scss" scoped>
.checkin-dialog-content {
  max-height: 70vh;
  overflow-y: auto;
}

.selected-date-info {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  padding: var(--spacing-md);
  background: var(--bg-page);
  border-radius: var(--radius-medium);
  margin-bottom: var(--spacing-md);

  .date-label {
    font-size: 16px;
    font-weight: 600;
    color: var(--text-primary);
  }
}

.loading-state,
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: var(--spacing-xl);
  color: var(--text-secondary);
  gap: var(--spacing-md);
}

.plan-list {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-md);
}

.plan-item {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  padding: var(--spacing-md);
  background: var(--bg-page);
  border-radius: var(--radius-medium);
  border: 1px solid var(--border-light);
  transition: all 0.3s ease;

  &:hover:not(.is-disabled) {
    border-color: var(--primary-color);
    box-shadow: var(--shadow-light);
  }

  &.is-completed {
    opacity: 0.7;
    background: var(--bg-page);
  }
}

.plan-info {
  flex: 1;
  min-width: 0;
}

.plan-header {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  margin-bottom: var(--spacing-xs);
}

.plan-name {
  font-size: 14px;
  font-weight: 600;
  color: var(--text-primary);
}

.plan-description {
  font-size: 12px;
  color: var(--text-secondary);
  margin-bottom: var(--spacing-xs);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.plan-meta {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
}

.frequency-tag {
  font-size: 11px;
  color: var(--text-placeholder);
  background: var(--bg-hover);
  padding: 2px 8px;
  border-radius: var(--radius-small);
}

.plan-action {
  flex-shrink: 0;
  margin-left: var(--spacing-md);
}

.checkin-form {
  .form-title {
    display: flex;
    align-items: center;
    gap: var(--spacing-xs);
    font-size: 14px;
    font-weight: 600;
    color: var(--text-primary);
    margin-bottom: var(--spacing-md);
  }

  :deep(.el-textarea) {
    margin-bottom: var(--spacing-md);
  }
}

.quick-tags {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: var(--spacing-sm);

  .quick-tags-label {
    font-size: 12px;
    color: var(--text-secondary);
  }

  .quick-tag {
    cursor: pointer;
    transition: all 0.2s ease;

    &:hover {
      transform: scale(1.05);
    }
  }
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: var(--spacing-sm);
}

:deep(.el-divider) {
  margin: var(--spacing-md) 0;
}

:deep(.el-dialog__body) {
  padding: var(--spacing-lg);
}

:deep(.el-dialog__header) {
  padding: var(--spacing-lg);
  border-bottom: 1px solid var(--border-light);
}

:deep(.el-dialog__footer) {
  padding: var(--spacing-lg);
  border-top: 1px solid var(--border-light);
}
</style>
