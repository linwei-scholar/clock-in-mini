<template>
  <div class="bar-chart-wrapper">
    <div class="chart-header">
      <div class="time-range-selector">
        <el-radio-group v-model="selectedRange" size="small" @change="handleRangeChange">
          <el-radio-button label="week">本周</el-radio-button>
          <el-radio-button label="month">本月</el-radio-button>
          <el-radio-button label="quarter">季度</el-radio-button>
        </el-radio-group>
      </div>
    </div>
    <div ref="chartRef" :style="{ width: width, height: height }">
      <v-chart :option="chartOption" autoresize @click="handleClick" />
    </div>
    <div v-if="loading" class="chart-loading">
      <el-icon class="is-loading"><Loading /></el-icon>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { use } from 'echarts/core'
import { BarChart } from 'echarts/charts'
import {
  TitleComponent,
  TooltipComponent,
  LegendComponent,
  GridComponent,
  DataZoomComponent
} from 'echarts/components'
import { CanvasRenderer } from 'echarts/renderers'
import VChart from 'vue-echarts'
import { Loading } from '@element-plus/icons-vue'
import { useResizeObserver } from '@vueuse/core'

use([
  BarChart,
  TitleComponent,
  TooltipComponent,
  LegendComponent,
  GridComponent,
  DataZoomComponent,
  CanvasRenderer
])

const props = defineProps({
  data: {
    type: Array,
    default: () => []
  },
  width: {
    type: String,
    default: '100%'
  },
  height: {
    type: String,
    default: '300px'
  },
  loading: {
    type: Boolean,
    default: false
  },
  showStack: {
    type: Boolean,
    default: true
  },
  plans: {
    type: Array,
    default: () => []
  }
})

const emit = defineEmits(['click', 'rangeChange'])

const chartRef = ref(null)
const selectedRange = ref('week')

const planColors = [
  '#409EFF',
  '#67C23A',
  '#E6A23C',
  '#F56C6C',
  '#909399',
  '#9B59B6',
  '#1ABC9C',
  '#3498DB'
]

const chartOption = computed(() => {
  if (!props.data || props.data.length === 0) {
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

  const planDataMap = {}
  const labels = []

  props.data.forEach((item, index) => {
    if (!labels.includes(item.label)) {
      labels.push(item.label)
    }

    if (Array.isArray(item.plans)) {
      item.plans.forEach((planItem) => {
        if (!planDataMap[planItem.name]) {
          planDataMap[planItem.name] = []
        }
        while (planDataMap[planItem.name].length < index) {
          planDataMap[planItem.name].push(0)
        }
        planDataMap[planItem.name].push(planItem.value)
      })
    }

    Object.keys(planDataMap).forEach((planName) => {
      if (planDataMap[planName].length <= index) {
        planDataMap[planName].push(0)
      }
    })
  })

  const series = Object.entries(planDataMap).map(([name, values], index) => ({
    name: name,
    type: 'bar',
    stack: props.showStack ? 'total' : undefined,
    barWidth: '60%',
    itemStyle: {
      color: planColors[index % planColors.length],
      borderRadius: props.showStack ? (index === Object.keys(planDataMap).length - 1 ? [4, 4, 0, 0] : 0) : [4, 4, 0, 0]
    },
    emphasis: {
      itemStyle: {
        shadowBlur: 10,
        shadowOffsetX: 0,
        shadowColor: 'rgba(0, 0, 0, 0.5)'
      }
    },
    data: values,
    animationDelay: (idx) => idx * 50 + index * 100
  }))

  return {
    tooltip: {
      trigger: 'axis',
      axisPointer: {
        type: 'shadow'
      },
      backgroundColor: 'rgba(50, 50, 50, 0.9)',
      borderColor: '#333',
      borderWidth: 1,
      textStyle: {
        color: '#fff'
      },
      formatter: (params) => {
        if (!params || params.length === 0) return ''
        let result = `<div style="font-weight:bold;margin-bottom:5px;">${params[0].axisValue}</div>`
        let total = 0
        params.forEach((param) => {
          total += param.value
          result += `<div style="display:flex;justify-content:space-between;gap:20px;">
            <span style="display:inline-block;margin-right:5px;border-radius:2px;width:10px;height:10px;background:${param.color};"></span>
            <span style="flex:1;">${param.seriesName}</span>
            <span style="font-weight:bold;">${param.value}次</span>
          </div>`
        })
        result += `<div style="border-top:1px solid #666;margin-top:5px;padding-top:5px;font-weight:bold;">
          总计: ${total}次
        </div>`
        return result
      }
    },
    legend: {
      data: Object.keys(planDataMap),
      bottom: 0,
      textStyle: {
        color: '#666'
      },
      itemWidth: 14,
      itemHeight: 14
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: props.showStack ? '15%' : '10%',
      top: '3%',
      containLabel: true
    },
    xAxis: {
      type: 'category',
      data: labels,
      axisLine: {
        lineStyle: {
          color: '#E4E7ED'
        }
      },
      axisLabel: {
        color: '#666'
      }
    },
    yAxis: {
      type: 'value',
      name: '打卡次数',
      nameTextStyle: {
        color: '#666'
      },
      axisLine: {
        show: false
      },
      axisTick: {
        show: false
      },
      axisLabel: {
        color: '#666'
      },
      splitLine: {
        lineStyle: {
          color: '#E4E7ED',
          type: 'dashed'
        }
      }
    },
    series: series,
    animationDuration: 1000,
    animationEasing: 'cubicOut',
    animationDurationUpdate: 500
  }
})

const handleClick = (params) => {
  emit('click', params)
}

const handleRangeChange = (value) => {
  emit('rangeChange', value)
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
.bar-chart-wrapper {
  position: relative;
  width: 100%;
}

.chart-header {
  display: flex;
  justify-content: flex-end;
  margin-bottom: var(--spacing-md);
}

.time-range-selector {
  display: flex;
  gap: var(--spacing-sm);
}

.bar-chart-wrapper :deep(.v-chart) {
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
</style>
