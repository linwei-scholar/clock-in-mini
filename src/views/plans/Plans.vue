<template>
  <div class="plans-container">
    <div class="page-header">
      <h1 class="page-title">打卡计划</h1>
      <el-button type="primary" @click="router.push('/plans/create')">
        <el-icon><Plus /></el-icon>
        新建计划
      </el-button>
    </div>

    <div class="filter-section">
      <el-tabs v-model="activeStatus" @tab-change="handleStatusChange" class="status-tabs">
        <el-tab-pane label="全部" name="all" />
        <el-tab-pane label="进行中" name="active" />
        <el-tab-pane label="已暂停" name="paused" />
        <el-tab-pane label="已归档" name="archived" />
      </el-tabs>

      <div class="filter-controls">
        <el-input
          v-model="searchQuery"
          placeholder="搜索计划名称..."
          :prefix-icon="Search"
          clearable
          class="search-input"
          @input="handleSearch"
        />

        <el-select
          v-model="selectedSort"
          placeholder="排序方式"
          class="sort-select"
        >
          <el-option label="按名称排序" value="name" />
          <el-option label="按创建时间" value="createdAt" />
          <el-option label="按完成率" value="completionRate" />
          <el-option label="按连续天数" value="streak" />
        </el-select>

        <el-select
          v-model="selectedTags"
          multiple
          placeholder="按标签筛选"
          clearable
          collapse-tags
          collapse-tags-tooltip
          class="tag-select"
        >
          <el-option
            v-for="tag in tagStore.userTags"
            :key="tag.id"
            :label="tag.name"
            :value="tag.id"
          >
            <div class="tag-option">
              <span class="tag-color" :style="{ background: tag.color }"></span>
              <span>{{ tag.name }}</span>
            </div>
          </el-option>
        </el-select>
      </div>
    </div>

    <div v-loading="planStore.isLoading" class="plans-content">
      <div v-if="filteredPlans.length > 0" class="plans-grid">
        <el-card
          v-for="plan in filteredPlans"
          :key="plan.id"
          class="plan-card"
          shadow="hover"
        >
          <template #header>
            <div class="card-header">
              <div class="header-left">
                <el-tag
                  v-for="tagId in plan.tagIds.slice(0, 3)"
                  :key="tagId"
                  size="small"
                  :style="{ backgroundColor: getTagColor(tagId), border: 'none', color: '#fff' }"
                >
                  {{ getTagName(tagId) }}
                </el-tag>
              </div>
              <div class="header-right">
                <el-tag :type="getStatusType(plan.status)" size="small">
                  {{ getStatusLabel(plan.status) }}
                </el-tag>
              </div>
            </div>
          </template>

          <div class="card-body" @click="router.push(`/plans/${plan.id}`)">
            <h3 class="plan-name">{{ plan.name }}</h3>
            <p class="plan-description">{{ plan.description || '暂无描述' }}</p>

            <div class="plan-frequency">
              <el-tag :type="getFrequencyType(plan.frequency)" size="small">
                {{ getFrequencyLabel(plan.frequency) }}
              </el-tag>
              <span class="start-date">开始于 {{ formatDate(plan.startDate) }}</span>
            </div>

            <div class="completion-section">
              <div class="completion-header">
                <span class="completion-label">完成率</span>
                <span class="completion-value">{{ getCompletionRate(plan) }}%</span>
              </div>
              <el-progress
                :percentage="getCompletionRate(plan)"
                :stroke-width="8"
                :show-text="false"
                :color="getProgressColor(getCompletionRate(plan))"
              />
            </div>

            <div class="stats-grid">
              <div class="stat-item">
                <span class="stat-value">{{ plan.completedCount || 0 }}</span>
                <span class="stat-label">已完成</span>
              </div>
              <div class="stat-item">
                <span class="stat-value">{{ plan.targetCount || '-' }}</span>
                <span class="stat-label">目标次数</span>
              </div>
              <div class="stat-item highlight">
                <span class="stat-value">{{ getPlanStreak(plan.id) }}</span>
                <span class="stat-label">连续天数</span>
              </div>
            </div>
          </div>

          <template #footer>
            <div class="card-footer">
              <el-button
                v-if="plan.status === 'active'"
                type="success"
                size="small"
                @click.stop="handleQuickCheckIn(plan)"
              >
                <el-icon><Check /></el-icon>
                打卡
              </el-button>
              <el-button
                size="small"
                @click.stop="router.push(`/plans/${plan.id}/edit`)"
              >
                <el-icon><Edit /></el-icon>
                编辑
              </el-button>
              <el-dropdown trigger="click" @command="handleCommand($event, plan)">
                <el-button size="small">
                  <el-icon><MoreFilled /></el-icon>
                </el-button>
                <template #dropdown>
                  <el-dropdown-menu>
                    <el-dropdown-item command="toggle">
                      <el-icon><VideoPause v-if="plan.status === 'active'" /><VideoPlay v-else /></el-icon>
                      {{ plan.status === 'active' ? '暂停' : '恢复' }}
                    </el-dropdown-item>
                    <el-dropdown-item command="archive" v-if="plan.status !== 'archived'">
                      <el-icon><Box /></el-icon>
                      归档
                    </el-dropdown-item>
                    <el-dropdown-item command="delete" divided>
                      <el-icon><Delete /></el-icon>
                      删除
                    </el-dropdown-item>
                  </el-dropdown-menu>
                </template>
              </el-dropdown>
            </div>
          </template>
        </el-card>
      </div>

      <el-empty
        v-else
        :image-size="200"
      >
        <template #image>
          <el-icon :size="80" color="#C0C4CC"><DocumentAdd /></el-icon>
        </template>
        <template #description>
          <div class="empty-description">
            <p v-if="searchQuery">未找到匹配"{{ searchQuery }}"的计划</p>
            <p v-else-if="activeStatus !== 'all'">暂无{{ getStatusLabel(activeStatus) }}的计划</p>
            <p v-else>还没有创建任何打卡计划</p>
          </div>
        </template>
        <el-button type="primary" @click="router.push('/plans/create')">
          <el-icon><Plus /></el-icon>
          创建第一个计划
        </el-button>
      </el-empty>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, h } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  Plus,
  Search,
  MoreFilled,
  Edit,
  Delete,
  Box,
  VideoPause,
  VideoPlay,
  Check,
  DocumentAdd
} from '@element-plus/icons-vue'
import { useTagStore } from '@/stores/tagStore'
import { usePlanStore } from '@/stores/planStore'
import { useRecordStore } from '@/stores/recordStore'

const router = useRouter()
const tagStore = useTagStore()
const planStore = usePlanStore()
const recordStore = useRecordStore()

const activeStatus = ref('all')
const searchQuery = ref('')
const selectedTags = ref([])
const selectedSort = ref('createdAt')
const planStreaks = ref({})

const filteredPlans = computed(() => {
  let result = planStore.userPlans

  if (activeStatus.value !== 'all') {
    result = result.filter(p => p.status === activeStatus.value)
  }

  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    result = result.filter(p =>
      p.name.toLowerCase().includes(query)
    )
  }

  if (selectedTags.value.length > 0) {
    result = result.filter(plan =>
      selectedTags.value.some(tagId => plan.tagIds.includes(tagId))
    )
  }

  result = result.map(plan => ({
    ...plan,
    completionRate: getCompletionRate(plan)
  }))

  result.sort((a, b) => {
    switch (selectedSort.value) {
      case 'name':
        return a.name.localeCompare(b.name, 'zh-CN')
      case 'createdAt':
        return new Date(b.createdAt) - new Date(a.createdAt)
      case 'completionRate':
        return b.completionRate - a.completionRate
      case 'streak':
        return (planStreaks.value[b.id] || 0) - (planStreaks.value[a.id] || 0)
      default:
        return 0
    }
  })

  return result
})

const calculateStreak = (planId) => {
  const records = recordStore.getRecordsByPlanId(planId)
  if (!records.length) return 0

  const sortedRecords = [...records].sort((a, b) =>
    new Date(b.checkInDate) - new Date(a.checkInDate)
  )

  let streak = 0
  let currentDate = new Date()
  currentDate.setHours(0, 0, 0, 0)

  for (const record of sortedRecords) {
    const recordDate = new Date(record.checkInDate)
    recordDate.setHours(0, 0, 0, 0)

    const diff = Math.floor((currentDate - recordDate) / (1000 * 60 * 60 * 24))

    if (diff === 0 || diff === 1) {
      streak++
      currentDate = recordDate
    } else {
      break
    }
  }

  return streak
}

const getPlanStreak = (planId) => {
  if (!(planId in planStreaks.value)) {
    planStreaks.value[planId] = calculateStreak(planId)
  }
  return planStreaks.value[planId]
}

const handleSearch = () => {
  console.log('Search query:', searchQuery.value)
}

const handleStatusChange = () => {
  console.log('Status changed:', activeStatus.value)
}

const handleTagFilterChange = () => {
  console.log('Tag filter changed:', selectedTags.value)
}

const getTagColor = (tagId) => {
  const tag = tagStore.getTagById(tagId)
  return tag ? tag.color : '#909399'
}

const getTagName = (tagId) => {
  const tag = tagStore.getTagById(tagId)
  return tag ? tag.name : '未分类'
}

const getCompletionRate = (plan) => {
  if (!plan.targetCount) return 0
  return Math.min(100, Math.round((plan.completedCount / plan.targetCount) * 100))
}

const getProgressColor = (percentage) => {
  if (percentage < 30) return '#F56C6C'
  if (percentage < 70) return '#E6A23C'
  return '#67C23A'
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

const handleQuickCheckIn = async (plan) => {
  try {
    const result = await recordStore.checkIn(plan.id)
    if (result) {
      ElMessage.success(`${plan.name} 打卡成功！`)
      planStore.userPlans.find(p => p.id === plan.id).completedCount++
      planStreaks.value[plan.id] = calculateStreak(plan.id)
    } else {
      ElMessage.error(recordStore.error || '打卡失败')
    }
  } catch (error) {
    ElMessage.error('打卡失败：' + (error.message || '未知错误'))
  }
}

const handleCommand = async (command, plan) => {
  switch (command) {
    case 'edit':
      router.push(`/plans/${plan.id}/edit`)
      break
    case 'toggle':
      try {
        const newStatus = plan.status === 'active' ? 'paused' : 'active'
        if (newStatus === 'paused') {
          await planStore.pausePlan(plan.id)
          ElMessage.success('计划已暂停')
        } else {
          await planStore.resumePlan(plan.id)
          ElMessage.success('计划已恢复')
        }
        await planStore.loadPlans()
      } catch (error) {
        ElMessage.error('操作失败')
      }
      break
    case 'archive':
      try {
        await ElMessageBox.confirm('归档后该计划将不再生成打卡任务，但历史记录保留。确定要归档该计划吗？', '归档确认', {
          confirmButtonText: '确定归档',
          cancelButtonText: '取消',
          type: 'info'
        })
        await planStore.archivePlan(plan.id)
        ElMessage.success('计划已归档')
        await planStore.loadPlans()
      } catch {
        // 用户取消
      }
      break
    case 'delete':
      try {
        const confirmInput = ref('')

        await ElMessageBox({
          title: '删除计划确认',
          message: h('div', [
            h('p', { style: 'margin-bottom: 10px; color: #E6A23C;' }, '警告：此操作不可恢复！'),
            h('p', { style: 'margin-bottom: 10px;' }, '该操作将删除计划及其所有打卡记录。'),
            h('p', { style: 'margin-bottom: 15px;' }, `请输入计划名称 "${plan.name}" 确认删除：`),
            h('input', {
              type: 'text',
              placeholder: '请输入计划名称',
              onInput: (e) => { confirmInput.value = e.target.value },
              style: 'width: 100%; padding: 8px; border: 1px solid #DCDFE6; border-radius: 4px;'
            })
          ]),
          confirmButtonText: '确认删除',
          cancelButtonText: '取消',
          type: 'warning',
          beforeClose: async (action, instance, done) => {
            if (action === 'confirm') {
              const inputEl = instance.$el.querySelector('input')
              const inputValue = inputEl ? inputEl.value : ''
              if (inputValue !== plan.name) {
                ElMessage.error('计划名称输入不正确')
                return
              }

              try {
                await recordStore.deleteRecordsByPlanId(plan.id)
                await planStore.deletePlan(plan.id)
                ElMessage.success('计划已删除')
                await planStore.loadPlans()
              } catch (error) {
                ElMessage.error('删除失败')
              }
            }
            done()
          }
        })
      } catch {
        // 用户取消
      }
      break
  }
}

onMounted(async () => {
  await Promise.all([
    tagStore.loadTags(),
    planStore.loadPlans(),
    recordStore.loadRecords()
  ])

  planStore.userPlans.forEach(plan => {
    planStreaks.value[plan.id] = calculateStreak(plan.id)
  })
})
</script>

<style lang="scss" scoped>
.plans-container {
  max-width: 1400px;
  margin: 0 auto;
  padding: var(--spacing-lg);
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--spacing-xl);
}

.page-title {
  font-size: 28px;
  font-weight: bold;
  color: var(--text-primary);
  margin: 0;
}

.filter-section {
  background: var(--bg-card);
  border-radius: var(--radius-medium);
  padding: var(--spacing-lg);
  margin-bottom: var(--spacing-lg);
  box-shadow: var(--shadow-light);
}

.status-tabs {
  margin-bottom: var(--spacing-lg);

  :deep(.el-tabs__header) {
    margin-bottom: 0;
  }
}

.filter-controls {
  display: flex;
  gap: var(--spacing-md);
  flex-wrap: wrap;
  align-items: center;
}

.search-input {
  width: 240px;
}

.sort-select {
  width: 150px;
}

.tag-select {
  width: 200px;
}

.tag-option {
  display: flex;
  align-items: center;
  gap: var(--spacing-xs);
}

.tag-color {
  width: 10px;
  height: 10px;
  border-radius: 50%;
}

.plans-content {
  min-height: 400px;
}

.plans-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(340px, 1fr));
  gap: var(--spacing-lg);
}

.plan-card {
  transition: all 0.3s ease;

  &:hover {
    transform: translateY(-4px);
  }

  :deep(.el-card__header) {
    padding: var(--spacing-md);
    border-bottom: 1px solid var(--border-light);
  }

  :deep(.el-card__body) {
    padding: 0;
  }

  :deep(.el-card__footer) {
    padding: var(--spacing-md);
    border-top: 1px solid var(--border-light);
  }
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.header-left {
  display: flex;
  gap: var(--spacing-xs);
  flex-wrap: wrap;
}

.header-right {
  display: flex;
  gap: var(--spacing-xs);
}

.card-body {
  padding: var(--spacing-lg);
  cursor: pointer;
  transition: background-color 0.3s ease;

  &:hover {
    background-color: var(--bg-page);
  }
}

.plan-name {
  font-size: 18px;
  font-weight: 600;
  color: var(--text-primary);
  margin: 0 0 var(--spacing-sm);
  display: -webkit-box;
  -webkit-line-clamp: 1;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.plan-description {
  font-size: 14px;
  color: var(--text-secondary);
  margin: 0 0 var(--spacing-md);
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  min-height: 42px;
}

.plan-frequency {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  margin-bottom: var(--spacing-lg);
}

.start-date {
  font-size: 12px;
  color: var(--text-placeholder);
}

.completion-section {
  margin-bottom: var(--spacing-lg);
}

.completion-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--spacing-xs);
}

.completion-label {
  font-size: 12px;
  color: var(--text-secondary);
}

.completion-value {
  font-size: 14px;
  font-weight: 600;
  color: var(--text-primary);
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: var(--spacing-md);
  padding: var(--spacing-md);
  background: var(--bg-page);
  border-radius: var(--radius-medium);
}

.stat-item {
  text-align: center;

  &.highlight {
    .stat-value {
      color: var(--primary-color);
    }
  }
}

.stat-value {
  display: block;
  font-size: 20px;
  font-weight: bold;
  color: var(--text-primary);
  margin-bottom: var(--spacing-xs);
}

.stat-label {
  font-size: 12px;
  color: var(--text-secondary);
}

.card-footer {
  display: flex;
  gap: var(--spacing-sm);
  justify-content: flex-end;
}

.empty-description {
  margin-bottom: var(--spacing-lg);
  color: var(--text-secondary);
  font-size: 14px;

  p {
    margin: var(--spacing-xs) 0;
  }
}

@media (max-width: 768px) {
  .plans-container {
    padding: var(--spacing-md);
  }

  .filter-controls {
    flex-direction: column;
    align-items: stretch;
  }

  .search-input,
  .sort-select,
  .tag-select {
    width: 100%;
  }

  .plans-grid {
    grid-template-columns: 1fr;
  }
}
</style>
