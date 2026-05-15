<template>
  <div class="line-chart-wrapper">
    <div class="chart-header">
      <div class="time-range-selector">
        <el-radio-group v-model="selectedRange" size="small" @change="handleRangeChange">
          <el-radio-button label="7">近7天</el-radio-button>
          <el-radio-button label="30">近30天</el-radio-button>
          <el-radio-button label="90">近90天</el-radio-button>
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
import { LineChart } from 'echarts/charts'
import {
  TitleComponent,
  TooltipComponent,
  LegendComponent,
  GridComponent,
  MarkPointComponent,
  MarkLineComponent
} from 'echarts/components'
import { CanvasRenderer } from 'echarts/renderers'
import VChart from 'vue-echarts'
import { Loading } from '@element-plus/icons-vue'
import dayjs from 'dayjs'

use([
  LineChart,
  TitleComponent,
  TooltipComponent,
  LegendComponent,
  GridComponent,
  MarkPointComponent,
  MarkLineComponent,
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
  smooth: {
    type: Boolean,
    default: true
  },
  showMarkPoint: {
    type: Boolean,
    default: true
  },
  showMarkLine: {
    type: Boolean,
    default: true
  }
})

const emit = defineEmits(['click', 'rangeChange'])

const chartRef = ref(null)
const selectedRange = ref('30')

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

  const dates = props.data.map(item => item.date)
  const values = props.data.map(item => item.value)
  const percentages = props.data.map(item => item.percentage)

  const average = values.length > 0
    ? (values.reduce((sum, val) => sum + val, 0) / values.length).toFixed(1)
    : 0

  const maxIndex = values.indexOf(Math.max(...values))
  const minIndex = values.indexOf(Math.min(...values))

  const markPointData = props.showMarkPoint ? [
    {
      type: 'max',
      name: '最大值',
      symbol: 'circle',
      symbolSize: 10,
      itemStyle: {
        color: '#67C23A',
        borderColor: '#fff',
        borderWidth: 2
      },
      label: {
        show: true,
        position: 'top',
        formatter: '{c}次',
        color: '#666'
      }
    },
    {
      type: 'min',
      name: '最小值',
      symbol: 'circle',
      symbolSize: 10,
      itemStyle: {
        color: '#F56C6C',
        borderColor: '#fff',
        borderWidth: 2
      },
      label: {
        show: true,
        position: 'bottom',
        formatter: '{c}次',
        color: '#666'
      }
    }
  ] : []

  return {
    tooltip: {
      trigger: 'axis',
      backgroundColor: 'rgba(50, 50, 50, 0.9)',
      borderColor: '#333',
      borderWidth: 1,
      textStyle: {
        color: '#fff'
      },
      formatter: (params) => {
        if (!params || params.length === 0) return ''
        const param = params[0]
        return `
          <div style="font-weight:bold;margin-bottom:5px;">${param.axisValue}</div>
          <div style="display:flex;align-items:center;gap:8px;">
            <span style="display:inline-block;margin-right:5px;border-radius:2px;width:10px;height:10px;background:#409EFF;"></span>
            <span>打卡次数: <strong>${param.value}</strong> 次</span>
          </div>
          <div style="margin-top:3px;color:#999;">完成率: ${percentages[param.dataIndex] || 0}%</div>
        `
      }
    },
    legend: {
      data: ['打卡次数'],
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
      bottom: '15%',
      top: '10%',
      containLabel: true
    },
    xAxis: {
      type: 'category',
      boundaryGap: false,
      data: dates,
      axisLine: {
        lineStyle: {
          color: '#E4E7ED'
        }
      },
      axisLabel: {
        color: '#666',
        formatter: (value) => {
          const date = dayjs(value)
          if (dates.length <= 7) {
            return date.format('MM-DD')
          } else if (dates.length <= 30) {
            return date.format('MM-DD')
          } else {
            return date.format('MM-DD')
          }
        },
        interval: Math.floor(dates.length / 10)
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
    series: [
      {
        name: '打卡次数',
        type: 'line',
        smooth: props.smooth,
        symbol: 'circle',
        symbolSize: 6,
        lineStyle: {
          width: 3,
          color: '#409EFF'
        },
        itemStyle: {
          color: '#409EFF',
          borderColor: '#fff',
          borderWidth: 2
        },
        areaStyle: {
          color: {
            type: 'linear',
            x: 0,
            y: 0,
            x2: 0,
            y2: 1,
            colorStops: [
              { offset: 0, color: 'rgba(64, 158, 255, 0.3)' },
              { offset: 1, color: 'rgba(64, 158, 255, 0.05)' }
            ]
          }
        },
        markPoint: {
          data: markPointData,
          label: {
            position: 'top'
          }
        },
        markLine: props.showMarkLine ? {
          silent: true,
          symbol: ['none', 'none'],
          lineStyle: {
            color: '#E6A23C',
            type: 'dashed',
            width: 1
          },
          data: [
            {
              type: 'average',
              name: '平均值',
              label: {
                show: true,
                position: 'end',
                formatter: `平均值: ${average}`
              }
            }
          ]
        } : undefined,
        data: values,
        animationDelay: (idx) => idx * 20
      }
    ],
    animationDuration: 1000,
    animationEasing: 'cubicOut'
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
.line-chart-wrapper {
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

.line-chart-wrapper :deep(.v-chart) {
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
