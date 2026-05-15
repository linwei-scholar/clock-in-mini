<template>
  <div class="pie-chart-wrapper" ref="chartRef" :style="{ width: width, height: height }">
    <v-chart :option="chartOption" autoresize @click="handleClick" />
    <div v-if="loading" class="chart-loading">
      <el-icon class="is-loading"><Loading /></el-icon>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { use } from 'echarts/core'
import { PieChart } from 'echarts/charts'
import { TitleComponent, TooltipComponent, LegendComponent } from 'echarts/components'
import { CanvasRenderer } from 'echarts/renderers'
import VChart, { THEME_KEY } from 'vue-echarts'
import { Loading } from '@element-plus/icons-vue'
import { useResizeObserver } from '@vueuse/core'

use([PieChart, TitleComponent, TooltipComponent, LegendComponent, CanvasRenderer])

const props = defineProps({
  completed: {
    type: Number,
    default: 0
  },
  total: {
    type: Number,
    default: 0
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
  showLegend: {
    type: Boolean,
    default: true
  },
  selectedName: {
    type: String,
    default: null
  }
})

const emit = defineEmits(['click', 'select'])

const chartRef = ref(null)

const completed = computed(() => props.completed)
const uncompleted = computed(() => Math.max(0, props.total - props.completed))

const chartOption = computed(() => {
  const data = [
    {
      value: completed.value,
      name: '已完成',
      itemStyle: { color: '#67C23A' }
    },
    {
      value: uncompleted.value,
      name: '未完成',
      itemStyle: { color: '#909399' }
    }
  ]

  const selectedMap = {}
  if (props.selectedName) {
    data.forEach((item, index) => {
      selectedMap[item.name] = item.name === props.selectedName
    })
  }

  return {
    tooltip: {
      trigger: 'item',
      formatter: '{b}: {c} ({d}%)',
      backgroundColor: 'rgba(50, 50, 50, 0.9)',
      borderColor: '#333',
      borderWidth: 1,
      textStyle: {
        color: '#fff'
      }
    },
    legend: props.showLegend ? {
      orient: 'vertical',
      right: '10%',
      top: 'center',
      itemWidth: 14,
      itemHeight: 14,
      textStyle: {
        color: '#666'
      },
      selectedMode: true
    } : undefined,
    series: [
      {
        name: '完成情况',
        type: 'pie',
        radius: ['40%', '70%'],
        center: props.showLegend ? ['40%', '50%'] : ['50%', '50%'],
        avoidLabelOverlap: true,
        itemStyle: {
          borderRadius: 4,
          borderColor: '#fff',
          borderWidth: 2
        },
        label: {
          show: true,
          position: 'outside',
          formatter: '{b}\n{d}%',
          color: '#666'
        },
        emphasis: {
          itemStyle: {
            shadowBlur: 10,
            shadowOffsetX: 0,
            shadowColor: 'rgba(0, 0, 0, 0.5)'
          },
          label: {
            show: true,
            fontSize: 14,
            fontWeight: 'bold'
          }
        },
        labelLine: {
          show: true,
          length: 15,
          length2: 10,
          smooth: true
        },
        data: data,
        selectedMode: 'single',
        selectedOffset: 10,
        animationType: 'scale',
        animationEasing: 'elasticOut',
        animationDelay: function (idx) {
          return Math.random() * 200
        }
      }
    ],
    animationDuration: 1000,
    animationEasing: 'cubicOut'
  }
})

const handleClick = (params) => {
  emit('click', params)
  emit('select', params.name)
}

watch(() => props.selectedName, (newVal) => {
  if (chartRef.value) {
    const chart = chartRef.value.__vue_app__?.config?.globalProperties?.$echarts
    if (chart) {
      chart.dispatchAction({
        type: 'pie',
        seriesName: '完成情况',
        dataIndex: newVal === '已完成' ? 0 : 1
      })
    }
  }
})
</script>

<style scoped>
.pie-chart-wrapper {
  position: relative;
  min-height: 200px;
}

.pie-chart-wrapper :deep(.v-chart) {
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
