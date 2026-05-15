<template>
  <ResponsiveLayout>
    <div class="plans-container">
      <el-card>
        <template #header>
          <div class="card-header">
            <span class="card-title">打卡计划列表</span>
            <el-button type="primary" size="small" @click="$router.push('/plans/create')" class="touch-button">
              <el-icon><Plus /></el-icon>
              <span class="hidden-xs-only">新建计划</span>
            </el-button>
          </div>
        </template>

        <el-row :gutter="20" class="filter-bar">
          <el-col :xs="24" :sm="12" class="filter-search">
            <el-input
              v-model="searchKeyword"
              placeholder="搜索计划名称"
              :prefix-icon="Search"
              clearable
              size="small"
            />
          </el-col>
          <el-col :xs="24" :sm="12" class="filter-buttons">
            <el-radio-group v-model="statusFilter" size="small">
              <el-radio-button label="all">全部</el-radio-button>
              <el-radio-button label="active">进行中</el-radio-button>
              <el-radio-button label="paused">已暂停</el-radio-button>
            </el-radio-group>
          </el-col>
        </el-row>

        <el-row :gutter="20" v-loading="loading">
          <el-col
            v-for="plan in filteredPlans"
            :key="plan.id"
            :xs="24"
            :sm="12"
            :md="8"
            :lg="6"
          >
            <el-card class="plan-card" shadow="hover">
              <div class="plan-header">
                <h3 class="plan-name">{{ plan.name }}</h3>
                <el-tag :type="getStatusType(plan.status)" size="small">
                  {{ getStatusText(plan.status) }}
                </el-tag>
              </div>

              <p class="plan-description" v-if="plan.description">
                {{ plan.description }}
              </p>

              <div class="plan-tags" v-if="plan.tagIds && plan.tagIds.length">
                <el-tag
                  v-for="tagId in plan.tagIds.slice(0, 2)"
                  :key="tagId"
                  size="small"
                  :color="getTagColor(tagId)"
                >
                  {{ getTagName(tagId) }}
                </el-tag>
                <span v-if="plan.tagIds.length > 2" class="more-tags">
                  +{{ plan.tagIds.length - 2 }}
                </span>
              </div>

              <div class="plan-stats">
                <div class="stat-item">
                  <span class="label">完成率</span>
                  <span class="value">{{ getCompletionRate(plan) }}%</span>
                </div>
                <div class="stat-item">
                  <span class="label">已打卡</span>
                  <span class="value">{{ getRecordCount(plan.id) }}次</span>
                </div>
              </div>

              <div class="plan-actions">
                <el-button
                  size="small"
                  class="touch-button"
                  @click="$router.push(`/plans/${plan.id}/edit`)"
                >
                  编辑
                </el-button>
                <el-button
                  size="small"
                  type="success"
                  class="touch-button"
                  @click="handleCheckin(plan)"
                >
                  打卡
                </el-button>
                <el-dropdown @command="(cmd) => handleCommand(cmd, plan)" trigger="click">
                  <el-button size="small" class="touch-button">
                    更多
                  </el-button>
                  <template #dropdown>
                    <el-dropdown-menu>
                      <el-dropdown-item command="pause" v-if="plan.status === 'active'">
                        暂停
                      </el-dropdown-item>
                      <el-dropdown-item command="resume" v-if="plan.status === 'paused'">
                        恢复
                      </el-dropdown-item>
                      <el-dropdown-item command="archive" v-if="plan.status === 'active'">
                        归档
                      </el-dropdown-item>
                      <el-dropdown-item command="delete" divided>
                        删除
                      </el-dropdown-item>
                    </el-dropdown-menu>
                  </template>
                </el-dropdown>
              </div>
            </el-card>
          </el-col>
        </el-row>

        <el-empty
          v-if="filteredPlans.length === 0 && !loading"
          description="暂无计划"
        />
      </el-card>
    </div>
  </ResponsiveLayout>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus, Search } from '@element-plus/icons-vue'
import { usePlanStore } from '@/stores/planStore'
import { useTagStore } from '@/stores/tagStore'
import { useRecordStore } from '@/stores/recordStore'
import ResponsiveLayout from '@/components/ResponsiveLayout.vue'

const planStore = usePlanStore()
const tagStore = useTagStore()
const recordStore = useRecordStore()

const loading = ref(false)
const searchKeyword = ref('')
const statusFilter = ref('all')

const filteredPlans = computed(() => {
  let plans = planStore.plans

  if (statusFilter.value !== 'all') {
    plans = plans.filter(p => p.status === statusFilter.value)
  }

  if (searchKeyword.value) {
    plans = plans.filter(p =>
      p.name.toLowerCase().includes(searchKeyword.value.toLowerCase())
    )
  }

  return plans
})

const getStatusType = (status) => {
  const types = {
    active: 'success',
    paused: 'warning',
    archived: 'info'
  }
  return types[status] || 'info'
}

const getStatusText = (status) => {
  const texts = {
    active: '进行中',
    paused: '已暂停',
    archived: '已归档'
  }
  return texts[status] || status
}

const getTagName = (tagId) => {
  const tag = tagStore.getTagById(tagId)
  return tag ? tag.name : ''
}

const getTagColor = (tagId) => {
  const tag = tagStore.getTagById(tagId)
  return tag ? tag.color : '#909399'
}

const getRecordCount = (planId) => {
  return recordStore.getRecordsByPlan(planId).length
}

const getCompletionRate = (plan) => {
  const records = recordStore.getRecordsByPlan(plan.id)
  const startDate = new Date(plan.startDate)
  const endDate = plan.endDate ? new Date(plan.endDate) : new Date()
  const totalDays = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24)) + 1

  let targetDays = totalDays
  if (plan.frequency === 'workdays') {
    targetDays = Math.floor(totalDays * 5 / 7)
  } else if (plan.frequency === 'weekends') {
    targetDays = Math.floor(totalDays * 2 / 7)
  }

  const rate = Math.round((records.length / targetDays) * 100)
  return Math.min(rate, 100)
}

const handleCheckin = (plan) => {
  showSuccess(`开始打卡：${plan.name}`)
}

const handleCommand = async (command, plan) => {
  switch (command) {
    case 'pause':
      planStore.updatePlan(plan.id, { status: 'paused' })
      showSuccess('计划已暂停')
      break
    case 'resume':
      planStore.updatePlan(plan.id, { status: 'active' })
      showSuccess('计划已恢复')
      break
    case 'archive':
      planStore.updatePlan(plan.id, { status: 'archived' })
      showSuccess('计划已归档')
      break
    case 'delete':
      try {
        await ElMessageBox.confirm('确定要删除此计划吗？删除后不可恢复。', '提示', {
          confirmButtonText: '确定',
          cancelButtonText: '取消',
          type: 'warning'
        })
        planStore.deletePlan(plan.id)
        showSuccess('计划已删除')
      } catch (error) {
        if (error !== 'cancel') {
          showError('删除失败')
        }
      }
      break
  }
}

onMounted(() => {
  loading.value = true
  setTimeout(() => {
    loading.value = false
  }, 300)
})
</script>

<style scoped>
.plans-container {
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

.filter-bar {
  margin-bottom: var(--spacing-lg);
}

.filter-search {
  margin-bottom: var(--spacing-md);
}

@media (min-width: 768px) {
  .filter-search {
    margin-bottom: 0;
  }
}

.filter-buttons {
  display: flex;
  justify-content: flex-start;
  overflow-x: auto;
}

@media (min-width: 768px) {
  .filter-buttons {
    justify-content: flex-end;
  }
}

.plan-card {
  margin-bottom: var(--spacing-md);
  height: 100%;
  display: flex;
  flex-direction: column;
}

.plan-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: var(--spacing-sm);
  gap: var(--spacing-sm);
}

.plan-name {
  margin: 0;
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: var(--font-size-md);
}

@media (min-width: 768px) {
  .plan-name {
    font-size: var(--font-size-lg);
  }
}

.plan-description {
  color: var(--text-secondary);
  font-size: var(--font-size-xs);
  margin: var(--spacing-sm) 0;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  line-height: 1.4;
  flex-grow: 1;
}

.plan-tags {
  margin: var(--spacing-sm) 0;
  display: flex;
  flex-wrap: wrap;
  gap: var(--spacing-xs);
  align-items: center;
}

.plan-tags .el-tag {
  color: white;
  font-size: 11px;
}

.more-tags {
  font-size: var(--font-size-xs);
  color: var(--text-secondary);
  margin-left: var(--spacing-xs);
}

.plan-stats {
  display: flex;
  justify-content: space-around;
  margin: var(--spacing-md) 0;
  padding: var(--spacing-sm) 0;
  border-top: 1px solid var(--border-light);
  border-bottom: 1px solid var(--border-light);
}

.stat-item {
  text-align: center;
}

.stat-item .label {
  display: block;
  font-size: var(--font-size-xs);
  color: var(--text-secondary);
  margin-bottom: 2px;
}

.stat-item .value {
  display: block;
  font-size: var(--font-size-md);
  font-weight: bold;
  color: var(--text-primary);
}

.plan-actions {
  display: flex;
  justify-content: space-between;
  gap: var(--spacing-xs);
  margin-top: auto;
}

@media (max-width: 768px) {
  .plan-actions {
    flex-wrap: wrap;
  }

  .plan-actions > * {
    flex: 1;
    min-width: 44px;
  }
}

@media (min-width: 768px) {
  .plan-actions .el-button-group {
    flex: 1;
  }
}
</style>
