<template>
  <ResponsiveLayout>
    <div class="statistics-container">
      <el-card>
        <template #header>
          <span class="card-title">统计分析</span>
        </template>

        <el-row :gutter="20" class="stat-row">
          <el-col :xs="12" :sm="12" :md="6">
            <el-card class="stat-card">
              <div class="stat-content">
                <div class="stat-icon" style="background-color: #409EFF;">
                  <el-icon><Check /></el-icon>
                </div>
                <div class="stat-info">
                  <div class="stat-label">总打卡次数</div>
                  <div class="stat-value">{{ totalCheckins }}</div>
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
                  <div class="stat-label">总打卡天数</div>
                  <div class="stat-value">{{ totalDays }}</div>
                </div>
              </div>
            </el-card>
          </el-col>

          <el-col :xs="12" :sm="12" :md="6" class="hidden-sm-and-down">
            <el-card class="stat-card">
              <div class="stat-content">
                <div class="stat-icon" style="background-color: #E6A23C;">
                  <el-icon><Trophy /></el-icon>
                </div>
                <div class="stat-info">
                  <div class="stat-label">最长连续</div>
                  <div class="stat-value">{{ longestStreak }} 天</div>
                </div>
              </div>
            </el-card>
          </el-col>

          <el-col :xs="12" :sm="12" :md="6" class="hidden-sm-and-down">
            <el-card class="stat-card">
              <div class="stat-content">
                <div class="stat-icon" style="background-color: #F56C6C;">
                  <el-icon><Clock /></el-icon>
                </div>
                <div class="stat-info">
                  <div class="stat-label">平均完成率</div>
                  <div class="stat-value">{{ avgCompletionRate }}%</div>
                </div>
              </div>
            </el-card>
          </el-col>
        </el-row>

        <el-row :gutter="20" class="mt-lg">
          <el-col :span="24">
            <el-card>
              <template #header>
                <span class="card-title-sm">打卡趋势</span>
              </template>
              <div ref="trendChartRef" class="chart-container"></div>
            </el-card>
          </el-col>
        </el-row>

        <el-row :gutter="20" class="mt-lg">
          <el-col :xs="24" :lg="12">
            <el-card>
              <template #header>
                <span class="card-title-sm">计划完成率分布</span>
              </template>
              <div ref="pieChartRef" class="chart-container"></div>
            </el-card>
          </el-col>

          <el-col :xs="24" :lg="12" class="mt-lg-mobile">
            <el-card>
              <template #header>
                <span class="card-title-sm">周打卡统计</span>
              </template>
              <div ref="barChartRef" class="chart-container"></div>
            </el-card>
          </el-col>
        </el-row>
      </el-card>
    </div>
  </ResponsiveLayout>
</template>

<script setup>
import { ref, computed, onMounted, nextTick } from 'vue'
import * as echarts from 'echarts'
import { Check, List, Trophy, Clock } from '@element-plus/icons-vue'
import { usePlanStore } from '@/stores/planStore'
import { useRecordStore } from '@/stores/recordStore'
import ResponsiveLayout from '@/components/ResponsiveLayout.vue'

const planStore = usePlanStore()
const recordStore = useRecordStore()

const trendChartRef = ref(null)
const pieChartRef = ref(null)
const barChartRef = ref(null)

const totalCheckins = computed(() => recordStore.records.length)

const totalDays = computed(() => {
  const dates = new Set(
    recordStore.records.map(r => new Date(r.checkInDate).toDateString())
  )
  return dates.size
})

const longestStreak = computed(() => {
  if (recordStore.records.length === 0) return 0

  const dates = [...new Set(
    recordStore.records.map(r => new Date(r.checkInDate).toDateString())
  )].sort((a, b) => new Date(a) - new Date(b))

  let maxStreak = 1
  let currentStreak = 1

  for (let i = 1; i < dates.length; i++) {
    const prevDate = new Date(dates[i - 1])
    const currDate = new Date(dates[i])
    const diffDays = (currDate - prevDate) / (1000 * 60 * 60 * 24)

    if (diffDays === 1) {
      currentStreak++
      maxStreak = Math.max(maxStreak, currentStreak)
    } else {
      currentStreak = 1
    }
  }

  return maxStreak
})

const avgCompletionRate = computed(() => {
  if (planStore.plans.length === 0) return 0

  let totalRate = 0
  planStore.plans.forEach(plan => {
    const records = recordStore.getRecordsByPlan(plan.id)
    const startDate = new Date(plan.startDate)
    const endDate = plan.endDate ? new Date(plan.endDate) : new Date()
    const totalDays = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24)) + 1

    const rate = Math.round((records.length / totalDays) * 100)
    totalRate += Math.min(rate, 100)
  })

  return Math.round(totalRate / planStore.plans.length)
})

const initTrendChart = () => {
  if (!trendChartRef.value) return

  const chart = echarts.init(trendChartRef.value)

  const last30Days = []
  const checkinCounts = []

  for (let i = 29; i >= 0; i--) {
    const date = new Date()
    date.setDate(date.getDate() - i)
    const dateStr = date.toISOString().split('T')[0]

    last30Days.push(dateStr.slice(5))

    const count = recordStore.records.filter(
      r => r.checkInDate === dateStr
    ).length

    checkinCounts.push(count)
  }

  const option = {
    tooltip: {
      trigger: 'axis'
    },
    xAxis: {
      type: 'category',
      data: last30Days
    },
    yAxis: {
      type: 'value'
    },
    series: [
      {
        name: '打卡次数',
        type: 'line',
        data: checkinCounts,
        smooth: true,
        areaStyle: {
          color: 'rgba(64, 158, 255, 0.2)'
        },
        lineStyle: {
          color: '#409EFF'
        },
        itemStyle: {
          color: '#409EFF'
        }
      }
    ]
  }

  chart.setOption(option)
}

const initPieChart = () => {
  if (!pieChartRef.value) return

  const chart = echarts.init(pieChartRef.value)

  const completionData = planStore.plans.map(plan => {
    const records = recordStore.getRecordsByPlan(plan.id)
    const startDate = new Date(plan.startDate)
    const endDate = plan.endDate ? new Date(plan.endDate) : new Date()
    const totalDays = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24)) + 1

    const rate = Math.min(Math.round((records.length / totalDays) * 100), 100)

    return {
      name: plan.name,
      value: rate
    }
  })

  const option = {
    tooltip: {
      trigger: 'item'
    },
    legend: {
      orient: 'vertical',
      left: 'left'
    },
    series: [
      {
        name: '完成率',
        type: 'pie',
        radius: '50%',
        data: completionData,
        emphasis: {
          itemStyle: {
            shadowBlur: 10,
            shadowOffsetX: 0,
            shadowColor: 'rgba(0, 0, 0, 0.5)'
          }
        }
      }
    ]
  }

  chart.setOption(option)
}

const initBarChart = () => {
  if (!barChartRef.value) return

  const chart = echarts.init(barChartRef.value)

  const weekdays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']
  const weekdayCounts = [0, 0, 0, 0, 0, 0, 0]

  recordStore.records.forEach(record => {
    const date = new Date(record.checkInDate)
    const weekday = date.getDay()
    weekdayCounts[weekday]++
  })

  const option = {
    tooltip: {
      trigger: 'axis'
    },
    xAxis: {
      type: 'category',
      data: weekdays
    },
    yAxis: {
      type: 'value'
    },
    series: [
      {
        name: '打卡次数',
        type: 'bar',
        data: weekdayCounts,
        itemStyle: {
          color: '#409EFF'
        }
      }
    ]
  }

  chart.setOption(option)
}

onMounted(() => {
  nextTick(() => {
    initTrendChart()
    initPieChart()
    initBarChart()
  })
})
</script>

<style scoped>
.statistics-container {
  width: 100%;
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

.card-title-sm {
  font-size: var(--font-size-sm);
  font-weight: bold;
}

@media (min-width: 768px) {
  .card-title-sm {
    font-size: var(--font-size-md);
  }
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

.chart-container {
  width: 100%;
  height: 300px;
}

@media (min-width: 768px) {
  .chart-container {
    height: 400px;
  }
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
</style>
