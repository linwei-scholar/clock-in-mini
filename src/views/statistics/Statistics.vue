<template>
  <div class="statistics-container">
    <div class="page-header">
      <h1 class="page-title">统计分析</h1>
      <div class="date-range-picker">
        <el-date-picker
          v-model="dateRange"
          type="daterange"
          range-separator="至"
          start-placeholder="开始日期"
          end-placeholder="结束日期"
          @change="handleDateRangeChange"
        />
      </div>
    </div>

    <el-row :gutter="20" class="stats-overview">
      <el-col :xs="12" :sm="6">
        <div class="stat-card">
          <div class="stat-icon" style="background: #409EFF20; color: #409EFF">
            <el-icon :size="28"><Calendar /></el-icon>
          </div>
          <div class="stat-info">
            <div class="stat-value">{{ stats.totalDays }}</div>
            <div class="stat-label">总打卡天数</div>
          </div>
        </div>
      </el-col>

      <el-col :xs="12" :sm="6">
        <div class="stat-card">
          <div class="stat-icon" style="background: #67C23A20; color: #67C23A">
            <el-icon :size="28"><CircleCheck /></el-icon>
          </div>
          <div class="stat-info">
            <div class="stat-value">{{ stats.completedCount }}</div>
            <div class="stat-label">已完成次数</div>
          </div>
        </div>
      </el-col>

      <el-col :xs="12" :sm="6">
        <div class="stat-card">
          <div class="stat-icon" style="background: #E6A23C20; color: #E6A23C">
            <el-icon :size="28"><TrendCharts /></el-icon>
          </div>
          <div class="stat-info">
            <div class="stat-value">{{ stats.completionRate }}%</div>
            <div class="stat-label">完成率</div>
          </div>
        </div>
      </el-col>

      <el-col :xs="12" :sm="6">
        <div class="stat-card">
          <div class="stat-icon" style="background: #9B59B620; color: #9B59B6">
            <el-icon :size="28"><Timer /></el-icon>
          </div>
          <div class="stat-info">
            <div class="stat-value">{{ stats.currentStreak }}</div>
            <div class="stat-label">连续打卡天数</div>
          </div>
        </div>
      </el-col>
    </el-row>

    <el-row :gutter="20" class="stats-details">
      <el-col :xs="12" :sm="6">
        <div class="stat-mini-card">
          <div class="stat-mini-label">应打卡次数</div>
          <div class="stat-mini-value">{{ stats.totalTasks }}</div>
        </div>
      </el-col>
      <el-col :xs="12" :sm="6">
        <div class="stat-mini-card">
          <div class="stat-mini-label">实际打卡次数</div>
          <div class="stat-mini-value">{{ stats.completedCount }}</div>
        </div>
      </el-col>
      <el-col :xs="12" :sm="6">
        <div class="stat-mini-card">
          <div class="stat-mini-label">完成率</div>
          <div class="stat-mini-value">{{ stats.completionRate }}%</div>
        </div>
      </el-col>
      <el-col :xs="12" :sm="6">
        <div class="stat-mini-card">
          <div class="stat-mini-label">活跃计划数</div>
          <div class="stat-mini-value">{{ activePlansCount }}</div>
        </div>
      </el-col>
    </el-row>

    <el-row :gutter="20" class="charts-row">
      <el-col :xs="24" :lg="12">
        <div class="card-container mb-lg">
          <h3 class="card-title">完成率分布</h3>
          <div class="chart-container">
            <LazyChart root-margin="200px" threshold="0.1">
              <PieChart
                :completed="stats.completedCount"
                :total="stats.totalTasks"
                width="280px"
                height="280px"
                :loading="isLoading"
                @click="handlePieClick"
                @select="handlePieSelect"
              />
            </LazyChart>
          </div>
        </div>
      </el-col>

      <el-col :xs="24" :lg="12">
        <div class="card-container mb-lg">
          <h3 class="card-title">各计划完成情况</h3>
          <LazyChart root-margin="200px" threshold="0.1">
            <BarChart
              :data="barChartData"
              height="280px"
              :loading="isLoading"
              :plans="plans"
              @click="handleBarClick"
              @rangeChange="handleBarRangeChange"
            />
          </LazyChart>
        </div>
      </el-col>
    </el-row>

    <el-row :gutter="20">
      <el-col :xs="24">
        <div class="card-container mb-lg">
          <LazyChart root-margin="200px" threshold="0.1">
            <HeatmapChart
              :data="heatmapData"
              title="打卡热力图"
              height="180px"
              :loading="isLoading"
              :plans="plans"
              :records="records"
              @dateClick="handleHeatmapClick"
            />
          </LazyChart>
        </div>
      </el-col>
    </el-row>

    <el-row :gutter="20">
      <el-col :xs="24" :lg="16">
        <div class="card-container mb-lg">
          <h3 class="card-title">打卡趋势</h3>
          <LazyChart root-margin="200px" threshold="0.1">
            <LineChart
              :data="lineChartData"
              height="300px"
              :loading="isLoading"
              :smooth="true"
              :showMarkPoint="true"
              :showMarkLine="true"
              @click="handleLineClick"
              @rangeChange="handleLineRangeChange"
            />
          </LazyChart>
        </div>
      </el-col>

      <el-col :xs="24" :lg="8">
        <div class="card-container">
          <h3 class="card-title">本周统计</h3>
          <div class="week-stats">
            <div class="week-stat-item">
              <span class="week-stat-label">本周打卡次数</span>
              <span class="week-stat-value">{{ weekStats.total }}</span>
            </div>
            <div class="week-stat-item">
              <span class="week-stat-label">本周完成率</span>
              <span class="week-stat-value">{{ weekStats.rate }}%</span>
            </div>
            <div class="week-stat-item">
              <span class="week-stat-label">最佳打卡日</span>
              <span class="week-stat-value">{{ weekStats.bestDay }}</span>
            </div>
            <div class="week-stat-item">
              <span class="week-stat-label">本周参与计划</span>
              <span class="week-stat-value">{{ weekStats.activePlans }}个</span>
            </div>
          </div>

          <h3 class="card-title mt-lg">热门标签</h3>
          <div class="tag-stats">
            <div v-for="tag in tagStats" :key="tag.id" class="tag-stat-item">
              <span class="tag-name">{{ tag.name }}</span>
              <span class="tag-count">{{ tag.count }}次</span>
            </div>
            <el-empty v-if="tagStats.length === 0" description="暂无标签数据" />
          </div>
        </div>
      </el-col>
    </el-row>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import {
  Calendar,
  CircleCheck,
  TrendCharts,
  Timer
} from '@element-plus/icons-vue'
import { useRecordStore } from '@/stores/recordStore'
import { usePlanStore } from '@/stores/planStore'
import PieChart from '@/components/charts/PieChart.vue'
import BarChart from '@/components/charts/BarChart.vue'
import LineChart from '@/components/charts/LineChart.vue'
import HeatmapChart from '@/components/charts/HeatmapChart.vue'
import LazyChart from '@/components/common/LazyChart.vue'

const recordStore = useRecordStore()
const planStore = usePlanStore()

const dateRange = ref([])
const records = computed(() => recordStore.userRecords)
const plans = computed(() => planStore.userPlans)
const tags = ref([])

const dateRangeStats = computed(() => {
  let filteredRecords = records.value

  if (dateRange.value && dateRange.value.length === 2) {
    const start = new Date(dateRange.value[0])
    start.setHours(0, 0, 0, 0)
    const end = new Date(dateRange.value[1])
    end.setHours(23, 59, 59, 999)
    
    filteredRecords = records.value.filter(r => {
      const recordDate = new Date(r.checkInDate)
      return recordDate >= start && recordDate <= end
    })
  }

  return filteredRecords
})

const globalStats = computed(() => {
  return recordStore.getGlobalStatistics()
})

const stats = computed(() => {
  const filteredRecords = dateRangeStats.value
  
  const completedCount = filteredRecords.length
  
  const totalExpected = plans.value.reduce((sum, plan) => {
    return sum + recordStore.calculateExpectedCount(plan)
  }, 0)
  
  const totalTasks = totalExpected || completedCount || 0
  
  const completionRate = totalTasks > 0 
    ? Math.round((completedCount / totalTasks) * 100) 
    : (completedCount > 0 ? 100 : 0)
  
  let currentStreak = 0
  if (filteredRecords.length > 0) {
    const sortedRecords = [...filteredRecords].sort((a, b) =>
      new Date(b.checkInDate).getTime() - new Date(a.checkInDate).getTime()
    )
    
    let currentDate = new Date()
    currentDate.setHours(0, 0, 0, 0)
    
    for (const record of sortedRecords) {
      const recordDate = new Date(record.checkInDate)
      recordDate.setHours(0, 0, 0, 0)
      
      const diff = Math.floor((currentDate.getTime() - recordDate.getTime()) / (1000 * 60 * 60 * 24))
      
      if (diff === 0 || diff === 1) {
        currentStreak++
        currentDate = recordDate
      } else {
        break
      }
    }
  }
  
  const totalDays = recordStore.calculateTotalDays()

  return {
    totalDays,
    completedCount,
    totalTasks,
    completionRate,
    currentStreak
  }
})

const activePlansCount = computed(() => {
  return plans.value.filter(p => p.status === 'active').length
})

const isLoading = computed(() => recordStore.isLoading)

const barChartData = computed(() => {
  const days = 7
  const today = new Date()
  const data = []

  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(today)
    date.setDate(today.getDate() - i)
    date.setHours(0, 0, 0, 0)
    const nextDate = new Date(date)
    nextDate.setDate(date.getDate() + 1)

    const dayRecords = records.value.filter(r => {
      const recordDate = new Date(r.checkInDate)
      return recordDate >= date && recordDate < nextDate
    })

    const planCounts = {}
    dayRecords.forEach(record => {
      const plan = plans.value.find(p => p.id === record.planId)
      if (plan) {
        if (!planCounts[plan.name]) {
          planCounts[plan.name] = 0
        }
        planCounts[plan.name]++
      }
    })

    const plansData = Object.entries(planCounts).map(([name, value]) => ({
      name,
      value
    }))

    data.push({
      label: `${date.getMonth() + 1}/${date.getDate()}`,
      plans: plansData
    })
  }

  return data
})

const lineChartData = computed(() => {
  const days = 30
  const today = new Date()
  const data = []

  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(today)
    date.setDate(today.getDate() - i)
    date.setHours(0, 0, 0, 0)
    const nextDate = new Date(date)
    nextDate.setDate(date.getDate() + 1)

    const dateStr = date.toISOString().split('T')[0]
    const dayRecords = records.value.filter(r => {
      const recordDate = new Date(r.checkInDate)
      return recordDate >= date && recordDate < nextDate
    })
    const maxPossible = plans.value.filter(p => p.status === 'active').length || 1

    data.push({
      date: dateStr,
      value: dayRecords.length,
      percentage: Math.round((dayRecords.length / maxPossible) * 100)
    })
  }

  return data
})

const heatmapData = computed(() => {
  const dataMap = new Map()

  records.value.forEach(record => {
    const dateStr = new Date(record.checkInDate).toISOString().split('T')[0]
    dataMap.set(dateStr, (dataMap.get(dateStr) || 0) + 1)
  })

  return Array.from(dataMap.entries()).map(([date, value]) => ({
    date,
    value
  }))
})

const planStats = computed(() => {
  return plans.value.map(plan => {
    const planRecords = dateRangeStats.value.filter(r => r.planId === plan.id)
    const totalDays = recordStore.calculateExpectedCount(plan)
    const tag = tags.value.find(t => plan.tagIds?.includes(t.id))

    return {
      id: plan.id,
      name: plan.name,
      color: tag?.color || '#409EFF',
      completed: planRecords.length,
      total: totalDays,
      percentage: totalDays > 0 ? Math.round((planRecords.length / totalDays) * 100) : 0
    }
  })
})

const weekStats = computed(() => {
  const today = new Date()
  const dayOfWeek = (today.getDay() + 6) % 7
  const monday = new Date(today)
  monday.setDate(today.getDate() - dayOfWeek)
  monday.setHours(0, 0, 0, 0)

  const weekRecords = records.value.filter(r => {
    const recordDate = new Date(r.checkInDate)
    return recordDate >= monday && recordDate <= today
  })

  const dayCounts = {}
  weekRecords.forEach(r => {
    const day = (new Date(r.checkInDate).getDay() + 6) % 7
    dayCounts[day] = (dayCounts[day] || 0) + 1
  })

  const maxDay = Object.entries(dayCounts).reduce((max, [day, count]) =>
    count > max.count ? { day: parseInt(day), count } : max,
    { day: 0, count: 0 }
  )

  const dayNames = ['周一', '周二', '周三', '周四', '周五', '周六', '周日']
  const activePlanCount = new Set(weekRecords.map(r => r.planId)).size
  
  const weekExpected = plans.value.reduce((sum, plan) => {
    return sum + recordStore.calculateExpectedCount(plan)
  }, 0)
  const weekRate = weekExpected > 0 
    ? Math.round((weekRecords.length / weekExpected) * 100) 
    : (weekRecords.length > 0 ? 100 : 0)

  return {
    total: weekRecords.length,
    rate: weekRate,
    bestDay: maxDay.count > 0 ? dayNames[maxDay.day] : '-',
    activePlans: activePlanCount
  }
})

const tagStats = computed(() => {
  const tagCounts = {}

  records.value.forEach(record => {
    const plan = plans.value.find(p => p.id === record.planId)
    if (plan?.tagIds) {
      plan.tagIds.forEach(tagId => {
        tagCounts[tagId] = (tagCounts[tagId] || 0) + 1
      })
    }
  })

  return Object.entries(tagCounts)
    .map(([tagId, count]) => {
      const tag = tags.value.find(t => t.id === tagId)
      return {
        id: tagId,
        name: tag?.name || '未分类',
        color: tag?.color,
        count
      }
    })
    .sort((a, b) => b.count - a.count)
    .slice(0, 5)
})

const handleDateRangeChange = () => {
  recordStore.invalidateCache()
}

watch(dateRange, () => {
  handleDateRangeChange()
}, { deep: true })

const handlePieClick = (params) => {
  console.log('Pie chart clicked:', params)
}

const handlePieSelect = (name) => {
  console.log('Pie section selected:', name)
}

const handleBarClick = (params) => {
  console.log('Bar chart clicked:', params)
}

const handleBarRangeChange = (range) => {
  console.log('Bar chart range changed:', range)
}

const handleLineClick = (params) => {
  console.log('Line chart clicked:', params)
}

const handleLineRangeChange = (range) => {
  console.log('Line chart range changed:', range)
}

const handleHeatmapClick = (data) => {
  console.log('Heatmap clicked:', data)
}

onMounted(async () => {
  await planStore.loadPlans()
  await recordStore.loadRecords()
  
  const userId = localStorage.getItem('userId')
  if (userId) {
    const users = JSON.parse(localStorage.getItem('users') || '[]')
    const user = users.find(u => u.id === userId)
    tags.value = user?.tags || []
  }
})
</script>

<style lang="scss" scoped>
.statistics-container {
  max-width: 1200px;
  margin: 0 auto;
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
  margin: 0;
}

.stats-overview {
  margin-bottom: var(--spacing-lg);
}

.stat-card {
  background: var(--bg-card);
  border-radius: var(--radius-medium);
  padding: var(--spacing-lg);
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
  box-shadow: var(--shadow-light);
  margin-bottom: var(--spacing-md);
  transition: transform 0.2s, box-shadow 0.2s;
}

.stat-card:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-medium);
}

.stat-mini-card {
  background: var(--bg-page);
  border-radius: var(--radius-small);
  padding: var(--spacing-md);
  margin-bottom: var(--spacing-sm);
  text-align: center;
  transition: background 0.2s;
}

.stat-mini-card:hover {
  background: var(--bg-card);
}

.stat-mini-label {
  font-size: 12px;
  color: var(--text-secondary);
  margin-bottom: var(--spacing-xs);
}

.stat-mini-value {
  font-size: 18px;
  font-weight: bold;
  color: var(--text-primary);
}

.stat-icon {
  width: 56px;
  height: 56px;
  border-radius: var(--radius-medium);
  display: flex;
  align-items: center;
  justify-content: center;
}

.stat-value {
  font-size: 28px;
  font-weight: bold;
  color: var(--text-primary);
}

.stat-label {
  color: var(--text-secondary);
  font-size: 12px;
}

.card-title {
  font-size: 16px;
  font-weight: 600;
  margin-bottom: var(--spacing-lg);
  color: var(--text-primary);
}

.chart-container {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: var(--spacing-xl);
  padding: var(--spacing-lg);
}

.week-stats {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: var(--spacing-md);
}

.week-stat-item {
  padding: var(--spacing-md);
  background: var(--bg-page);
  border-radius: var(--radius-medium);
}

.week-stat-label {
  display: block;
  font-size: 12px;
  color: var(--text-secondary);
  margin-bottom: var(--spacing-xs);
}

.week-stat-value {
  display: block;
  font-size: 18px;
  font-weight: bold;
  color: var(--text-primary);
}

.tag-stats {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm);
}

.tag-stat-item {
  display: flex;
  justify-content: space-between;
  padding: var(--spacing-sm) var(--spacing-md);
  background: var(--bg-page);
  border-radius: var(--radius-small);
}

.tag-name {
  font-size: 14px;
  color: var(--text-primary);
}

.tag-count {
  font-size: 14px;
  color: var(--text-secondary);
}
</style>
