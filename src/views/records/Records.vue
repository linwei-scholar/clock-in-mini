<template>
  <div class="records-page-container">
    <div class="page-header">
      <h1 class="page-title">打卡记录</h1>
      <div class="header-actions">
        <el-select
          v-model="selectedPlanId"
          placeholder="筛选计划"
          clearable
          class="plan-filter"
        >
          <el-option
            v-for="plan in plans"
            :key="plan.id"
            :label="plan.name"
            :value="plan.id"
          />
        </el-select>
      </div>
    </div>

    <SkeletonList v-if="loading && records.length === 0" :count="3" />

    <VirtualScroll
      v-else-if="useVirtualScroll && filteredRecords.length > 50"
      :items="filteredRecords"
      :item-height="80"
      :height="600"
      :is-loading="isLoadingMore"
      :has-more="hasMore"
      @load-more="handleLoadMore"
    >
      <template #default="{ item }">
        <RecordCard
          :record="item"
          :plan="getPlanById(item.planId)"
          @edit="handleEdit"
          @delete="handleDelete"
          @view="handleView"
        />
      </template>
    </VirtualScroll>

    <div v-else>
      <RecordList
        :records="displayRecords"
        :loading="loading"
        empty-text="暂无打卡记录"
        :page-size="pageSize"
        :page-size-options="[10, 15, 20]"
        @edit="handleEdit"
        @delete="handleDelete"
        @view="handleView"
      />

      <div v-if="filteredRecords.length > pageSize" class="pagination-container">
        <el-pagination
          v-model:current-page="currentPage"
          :page-size="pageSize"
          :total="filteredRecords.length"
          :page-sizes="[10, 15, 20, 50]"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="handleSizeChange"
          @current-change="handlePageChange"
        />
      </div>
    </div>

    <div v-if="isLoadingMore" class="loading-more">
      <el-icon class="is-loading"><Loading /></el-icon>
      <span>加载更多...</span>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { Loading } from '@element-plus/icons-vue'
import { usePlanStore } from '@/stores/planStore'
import { useRecordStore } from '@/stores/recordStore'
import RecordList from '@/components/record/RecordList.vue'
import VirtualScroll from '@/components/common/VirtualScroll.vue'
import SkeletonList from '@/components/common/SkeletonList.vue'
import RecordCard from '@/components/record/RecordCard.vue'

const router = useRouter()
const planStore = usePlanStore()
const recordStore = useRecordStore()

const loading = ref(true)
const selectedPlanId = ref('')
const pageSize = ref(20)
const currentPage = ref(1)
const isLoadingMore = ref(false)
const useVirtualScroll = ref(true)

const plans = computed(() => {
  return planStore.plans.filter(plan => plan.status !== 'archived')
})

const filteredRecords = computed(() => {
  let records = recordStore.userRecords

  if (selectedPlanId.value) {
    records = records.filter(r => r.planId === selectedPlanId.value)
  }

  return records.sort((a, b) => {
    return new Date(b.checkInTime) - new Date(a.checkInTime)
  })
})

const displayRecords = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value
  const end = start + pageSize.value
  return filteredRecords.value.slice(start, end)
})

const hasMore = computed(() => {
  return displayRecords.value.length < filteredRecords.value.length
})

const getPlanById = (planId) => {
  return plans.value.find(p => p.id === planId)
}

const loadData = async () => {
  loading.value = true
  try {
    await Promise.all([
      planStore.loadPlans(),
      recordStore.loadRecords()
    ])
  } catch (error) {
    console.error('Failed to load data:', error)
  } finally {
    loading.value = false
  }
}

const handleLoadMore = async () => {
  if (isLoadingMore.value || !hasMore.value) return

  isLoadingMore.value = true
  await new Promise(resolve => setTimeout(resolve, 300))
  pageSize.value += 20
  isLoadingMore.value = false
}

const handlePageChange = (page) => {
  currentPage.value = page
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

const handleSizeChange = (size) => {
  pageSize.value = size
  currentPage.value = 1
}

const handleEdit = (record) => {
  router.push(`/records/${record.id}/edit`)
}

const handleDelete = (recordId) => {
  loadData()
}

const handleView = (record) => {
  // 可以在这里添加查看详情后的操作
}

watch(selectedPlanId, () => {
  currentPage.value = 1
})

onMounted(() => {
  loadData()
})
</script>

<style lang="scss" scoped>
.records-page-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: var(--spacing-lg);
}

.page-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: var(--spacing-xl);
  padding: var(--spacing-md);
  background: white;
  border-radius: var(--radius-medium);
  box-shadow: var(--shadow-light);

  .page-title {
    font-size: 24px;
    font-weight: bold;
    margin: 0;
    color: var(--text-primary);
  }

  .header-actions {
    display: flex;
    align-items: center;
    gap: var(--spacing-md);
  }

  .plan-filter {
    width: 200px;
  }
}

.pagination-container {
  display: flex;
  justify-content: center;
  padding: var(--spacing-xl);
}

.loading-more {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: var(--spacing-lg);
  color: var(--text-secondary);
  gap: var(--spacing-sm);

  .el-icon {
    font-size: 20px;
  }
}

.is-loading {
  animation: rotating 2s linear infinite;
}

@keyframes rotating {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

@media (max-width: 768px) {
  .records-page-container {
    padding: var(--spacing-sm);
  }

  .page-header {
    flex-direction: column;
    align-items: flex-start;
    gap: var(--spacing-md);

    .header-actions {
      width: 100%;
    }

    .plan-filter {
      width: 100%;
    }
  }
}
</style>
