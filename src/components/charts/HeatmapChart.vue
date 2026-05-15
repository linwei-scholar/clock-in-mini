<template>
  <div class="heatmap-wrapper">
    <div class="chart-header">
      <div class="heatmap-title">
        <span class="title-text">{{ title }}</span>
        <span class="total-count">{{ totalCheckins }} 次打卡</span>
      </div>
      <div class="heatmap-legend">
        <span class="legend-label">少</span>
        <div class="legend-squares">
          <div
            v-for="(color, index) in colorScale"
            :key="index"
            class="legend-square"
            :style="{ backgroundColor: color }"
          ></div>
        </div>
        <span class="legend-label">多</span>
      </div>
    </div>
    <div ref="chartRef" :style="{ width: width, height: height }">
      <v-chart :option="chartOption" autoresize @click="handleClick" />
    </div>
    <div v-if="loading" class="chart-loading">
      <el-icon class="is-loading"><Loading /></el-icon>
    </div>
    <el-dialog v-model="detailDialogVisible" title="打卡详情" width="500px">
      <div v-if="selectedDateData" class="detail-content">
        <div class="detail-date">{{ selectedDateData.date }}</div>
        <div class="detail-stats">
          <div class="detail-stat-item">
            <span class="detail-stat-label">打卡次数</span>
            <span class="detail-stat-value">{{ selectedDateData.count }} 次</span>
          </div>
          <div class="detail-stat-item">
            <span class="detail-stat-label">参与计划</span>
            <span class="detail-stat-value">{{ selectedDateData.plans?.length || 0 }} 个</span>
          </div>
        </div>
        <div v-if="selectedDateData.plans && selectedDateData.plans.length > 0" class="detail-plans">
          <div class="detail-plans-title">打卡计划</div>
          <div
            v-for="plan in selectedDateData.plans"
            :key="plan.id"
            class="detail-plan-item"
          >
            <span class="plan-name">{{ plan.name }}</span>
            <el-tag size="small" :color="plan.color">已完成</el-tag>
          </div>
        </div>
      </div>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { use } from 'echarts/core'
import { HeatmapChart } from 'echarts/charts'
import {
  TitleComponent,
  TooltipComponent,
  GridComponent,
  CalendarComponent,
  VisualMapComponent
} from 'echarts/components'
import { CanvasRenderer } from 'echarts/renderers'
import VChart from 'vue-echarts'
import { Loading } from '@element-plus/icons-vue'
import dayjs from 'dayjs'

use([
  HeatmapChart,
  TitleComponent,
  TooltipComponent,
  GridComponent,
  CalendarComponent,
  VisualMapComponent,
  CanvasRenderer
])

const props = defineProps({
  data: {
    type: Array,
    default: () => []
  },
  title: {
    type: String,
    default: '打卡热力图'
  },
  width: {
    type: String,
    default: '100%'
  },
  height: {
    type: String,
    default: '180px'
  },
  loading: {
    type: Boolean,
    default: false
  },
  startDate: {
    type: String,
    default: null
  },
  endDate: {
    type: String,
    default: null
  },
  plans: {
    type: Array,
    default: () => []
  },
  records: {
    type: Array,
    default: () => []
  }
})

const emit = defineEmits(['click', 'dateClick'])

const chartRef = ref(null)
const detailDialogVisible = ref(false)
const selectedDateData = ref(null)

const colorScale = [
  '#EBEDF0',
  '#9BE9A8',
  '#40C463',
  '#30A14E',
  '#216E39'
]

const totalCheckins = computed(() => {
  return props.data.reduce((sum, item) => sum + item.value, 0)
})

const chartOption = computed(() => {
  const processedData = processData()

  if (processedData.length === 0) {
    return {
      title: {
        text: '暂无数据',
        left: 'center',
        top: 'center',
        textStyle: {
          color: '#999',
          fontSize: 14
        }
      }
    }
  }

  const calendarStart = props.startDate || dayjs().subtract(1, 'year').format('YYYY-MM-DD')
  const calendarEnd = props.endDate || dayjs().format('YYYY-MM-DD')

  const months = []
  const current = dayjs(calendarStart)
  const end = dayjs(calendarEnd)

  while (current.isBefore(end) || current.isSame(end, 'month')) {
    months.push(current.format('YYYY-MM'))
    current.add(1, 'month')
  }

  return {
    tooltip: {
      formatter: (params) => {
        const date = dayjs(params.value[0]).format('YYYY-MM-DD')
        const value = params.value[1]
        const dayNames = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']
        const dayName = dayNames[dayjs(date).day()]

        return `
          <div style="font-weight:bold;margin-bottom:5px;">${date} (${dayName})</div>
          <div style="display:flex;align-items:center;gap:8px;">
            <span style="display:inline-block;margin-right:5px;border-radius:2px;width:10px;height:10px;background:${getColorByValue(value)};"></span>
            <span><strong>${value}</strong> 次打卡</span>
          </div>
        `
      },
      backgroundColor: 'rgba(50, 50, 50, 0.9)',
      borderColor: '#333',
      borderWidth: 1,
      textStyle: {
        color: '#fff'
      }
    },
    visualMap: {
      min: 0,
      max: Math.max(...processedData.map(d => d[1]), 1),
      calculable: false,
      orient: 'horizontal',
      left: 'center',
      bottom: 0,
      inRange: {
        color: colorScale
      },
      itemWidth: 12,
      itemHeight: 12,
      textStyle: {
        color: '#666'
      }
    },
    calendar: {
      top: 20,
      left: 50,
      right: 30,
      cellSize: ['auto', 13],
      range: [calendarStart, calendarEnd],
      itemStyle: {
        borderWidth: 2,
        borderColor: '#fff'
      },
      yearLabel: {
        show: false
      },
      monthLabel: {
        show: true,
        color: '#666',
        fontSize: 10,
        nameMap: ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月']
      },
      dayLabel: {
        firstDay: 1,
        nameMap: ['日', '一', '二', '三', '四', '五', '六'],
        color: '#999',
        fontSize: 10
      },
      splitLine: {
        show: false
      }
    },
    series: [
      {
        type: 'heatmap',
        coordinateSystem: 'calendar',
        data: processedData,
        label: {
          show: false
        },
        emphasis: {
          itemStyle: {
            shadowBlur: 10,
            shadowColor: 'rgba(0, 0, 0, 0.3)'
          }
        }
      }
    ],
    animationDuration: 1000,
    animationEasing: 'cubicOut'
  }
})

const processData = () => {
  const dataMap = new Map()

  props.data.forEach(item => {
    const dateStr = dayjs(item.date).format('YYYY-MM-DD')
    dataMap.set(dateStr, item.value)
  })

  const calendarStart = props.startDate || dayjs().subtract(1, 'year').format('YYYY-MM-DD')
  const calendarEnd = props.endDate || dayjs().format('YYYY-MM-DD')

  const result = []
  let current = dayjs(calendarStart)
  const end = dayjs(calendarEnd)

  while (current.isBefore(end) || current.isSame(end, 'day')) {
    const dateStr = current.format('YYYY-MM-DD')
    result.push([dateStr, dataMap.get(dateStr) || 0])
    current = current.add(1, 'day')
  }

  return result
}

const getColorByValue = (value) => {
  const max = Math.max(...props.data.map(d => d.value), 1)
  if (value === 0) return colorScale[0]
  if (value <= max * 0.25) return colorScale[1]
  if (value <= max * 0.5) return colorScale[2]
  if (value <= max * 0.75) return colorScale[3]
  return colorScale[4]
}

const handleClick = (params) => {
  if (params.value) {
    const date = dayjs(params.value[0]).format('YYYY-MM-DD')
    const count = params.value[1]

    const dayRecords = props.records.filter(r => {
      const recordDate = dayjs(r.checkInDate).format('YYYY-MM-DD')
      return recordDate === date
    })

    const plansMap = new Map()
    dayRecords.forEach(record => {
      const plan = props.plans.find(p => p.id === record.planId)
      if (plan && !plansMap.has(plan.id)) {
        plansMap.set(plan.id, plan)
      }
    })

    selectedDateData.value = {
      date,
      count,
      plans: Array.from(plansMap.values())
    }

    detailDialogVisible.value = true
    emit('dateClick', selectedDateData.value)
  }

  emit('click', params)
}

watch(() => props.data, () => {
  if (chartRef.value) {
    const chart = chartRef.value.__vue_app__?.config?.globalProperties?.$echarts
    if (chart) {
      chart.resize()
    }
  }
}, { deep: true })
</script>

<style scoped>
.heatmap-wrapper {
  position: relative;
  width: 100%;
}

.chart-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--spacing-md);
  padding: 0 var(--spacing-sm);
}

.heatmap-title {
  display: flex;
  align-items: baseline;
  gap: var(--spacing-sm);
}

.title-text {
  font-size: 16px;
  font-weight: 600;
  color: var(--text-primary);
}

.total-count {
  font-size: 14px;
  color: var(--text-secondary);
}

.heatmap-legend {
  display: flex;
  align-items: center;
  gap: var(--spacing-xs);
}

.legend-label {
  font-size: 12px;
  color: #999;
}

.legend-squares {
  display: flex;
  gap: 2px;
}

.legend-square {
  width: 12px;
  height: 12px;
  border-radius: 2px;
}

.heatmap-wrapper :deep(.v-chart) {
  width: 100%;
  height: 100%;
}

.chart-loading {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(255, 255, 255, 0.9);
  z-index: 10;
}

.chart-loading .el-icon {
  font-size: 32px;
  color: #409EFF;
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

.detail-content {
  padding: var(--spacing-md);
}

.detail-date {
  font-size: 18px;
  font-weight: bold;
  color: var(--text-primary);
  margin-bottom: var(--spacing-md);
  text-align: center;
}

.detail-stats {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: var(--spacing-md);
  margin-bottom: var(--spacing-lg);
}

.detail-stat-item {
  text-align: center;
  padding: var(--spacing-md);
  background: var(--bg-page);
  border-radius: var(--radius-small);
}

.detail-stat-label {
  display: block;
  font-size: 12px;
  color: var(--text-secondary);
  margin-bottom: var(--spacing-xs);
}

.detail-stat-value {
  display: block;
  font-size: 20px;
  font-weight: bold;
  color: var(--text-primary);
}

.detail-plans-title {
  font-size: 14px;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: var(--spacing-sm);
}

.detail-plan-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--spacing-sm) var(--spacing-md);
  background: var(--bg-page);
  border-radius: var(--radius-small);
  margin-bottom: var(--spacing-xs);
}

.plan-name {
  font-size: 14px;
  color: var(--text-primary);
}
</style>
