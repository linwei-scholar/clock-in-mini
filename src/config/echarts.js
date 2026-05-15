import { use } from 'echarts/core'
import { CanvasRenderer } from 'echarts/renderers'
import {
  PieChart,
  BarChart,
  LineChart,
  HeatmapChart,
  GaugeChart,
  ScatterChart,
  MapChart,
  LinesChart
} from 'echarts/charts'
import {
  TitleComponent,
  TooltipComponent,
  LegendComponent,
  GridComponent,
  DataZoomComponent,
  CalendarComponent,
  VisualMapComponent,
  MarkPointComponent,
  MarkLineComponent,
  MarkAreaComponent,
  TimelineComponent,
  ToolboxComponent,
  GeoComponent
} from 'echarts/components'

export function registerEChartsComponents() {
  use([
    CanvasRenderer,
    PieChart,
    BarChart,
    LineChart,
    HeatmapChart,
    GaugeChart,
    ScatterChart,
    MapChart,
    LinesChart,
    TitleComponent,
    TooltipComponent,
    LegendComponent,
    GridComponent,
    DataZoomComponent,
    CalendarComponent,
    VisualMapComponent,
    MarkPointComponent,
    MarkLineComponent,
    MarkAreaComponent,
    TimelineComponent,
    ToolboxComponent,
    GeoComponent
  ])
}

export const defaultTheme = {
  color: [
    '#409EFF',
    '#67C23A',
    '#E6A23C',
    '#F56C6C',
    '#909399',
    '#9B59B6',
    '#1ABC9C',
    '#3498DB',
    '#2ECC71',
    '#E74C3C'
  ],
  backgroundColor: 'rgba(255, 255, 255, 0)',
  textStyle: {
    fontFamily: 'Inter, system-ui, -apple-system, sans-serif'
  },
  title: {
    textStyle: {
      color: '#303133',
      fontSize: 16,
      fontWeight: 'bold'
    },
    subtextStyle: {
      color: '#909399',
      fontSize: 12
    }
  },
  line: {
    itemStyle: {
      borderWidth: 2
    },
    lineStyle: {
      width: 3
    },
    symbolSize: 8,
    symbol: 'circle',
    smooth: true
  },
  categoryAxis: {
    axisLine: {
      show: true,
      lineStyle: {
        color: '#E4E7ED'
      }
    },
    axisTick: {
      show: false
    },
    axisLabel: {
      color: '#606266'
    },
    splitLine: {
      show: false,
      lineStyle: {
        color: '#F2F6FC'
      }
    }
  },
  valueAxis: {
    axisLine: {
      show: false
    },
    axisTick: {
      show: false
    },
    axisLabel: {
      color: '#606266'
    },
    splitLine: {
      lineStyle: {
        color: '#F2F6FC',
        type: 'dashed'
      }
    }
  },
  tooltip: {
    backgroundColor: 'rgba(50, 50, 50, 0.9)',
    borderColor: '#333',
    borderWidth: 1,
    textStyle: {
      color: '#fff',
      fontSize: 12
    },
    extraCssText: 'box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);'
  },
  legend: {
    textStyle: {
      color: '#606266',
      fontSize: 12
    }
  }
}

export function getChartColors() {
  return {
    completed: '#67C23A',
    uncompleted: '#909399',
    primary: '#409EFF',
    success: '#67C23A',
    warning: '#E6A23C',
    danger: '#F56C6C',
    info: '#909399'
  }
}
