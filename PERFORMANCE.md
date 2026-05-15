# 个人打卡系统性能优化指南

## 概述

本文档介绍个人打卡系统已实现的性能优化功能，帮助开发者了解和使用这些优化措施。

## 已实现的性能优化

### 1. 首屏加载优化

#### 1.1 路由懒加载
- 所有页面组件使用 `() => import()` 语法实现按需加载
- 路由配置示例：
```javascript
{
  path: '/dashboard',
  component: () => import('@/views/Dashboard.vue')
}
```

#### 1.2 骨架屏
- 提供了 `Skeleton` 和 `SkeletonList` 组件
- 用于在数据加载时显示占位动画
```vue
<SkeletonList :count="3" />
```

#### 1.3 组件懒加载
- 使用 `LazyChart` 组件实现图表的懒加载渲染
- 图表仅在进入视口时才开始渲染

### 2. 数据加载优化

#### 2.1 分页加载
- 记录列表支持分页加载
- 默认每页 20 条数据
- 支持配置每页条数：`[10, 15, 20, 50]`

#### 2.2 虚拟滚动
- 当记录数量超过 50 条时自动启用虚拟滚动
- 使用 `VirtualScroll` 组件实现
- 只渲染可见区域的 DOM 节点

```vue
<VirtualScroll
  :items="filteredRecords"
  :item-height="80"
  :height="600"
  @load-more="handleLoadMore"
>
  <template #default="{ item }">
    <!-- 渲染内容 -->
  </template>
</VirtualScroll>
```

#### 2.3 数据缓存
- 提供了 `useMemoCache` composable
- 支持 TTL（过期时间）配置
- 自动缓存计算结果

```javascript
import { useMemoCache } from '@/composables/useMemoCache'

const { get, set, has, clear } = useMemoCache({ ttl: 5 * 60 * 1000 })
```

### 3. 渲染优化

#### 3.1 Keep-Alive 页面缓存
- Dashboard、Plans、Records、Calendar、Statistics 页面会被缓存
- 编辑类页面（PlanDetail、PlanCreate 等）不会被缓存
- 配置位于 `Layout.vue`

#### 3.2 图片懒加载
- 使用 `LazyImage` 组件实现图片懒加载
- 使用 Intersection Observer API
- 支持加载占位和错误占位

```vue
<LazyImage
  :src="imageUrl"
  :width="200"
  :height="200"
  fit="cover"
/>
```

#### 3.3 图表按需渲染
- 使用 `LazyChart` 组件包装图表
- 图表仅在可视区域时渲染

```vue
<LazyChart root-margin="200px" threshold="0.1">
  <PieChart :data="chartData" />
</LazyChart>
```

### 4. 代码优化

#### 4.1 Vite 构建优化
- 代码分割：将依赖库分离为独立 chunk
  - `vue-core`: Vue 核心库
  - `element-plus`: UI 组件库
  - `echarts`: 图表库
  - `fullcalendar`: 日历组件
  - `utils`: 工具函数
- 压缩混淆：移除 console 和 debugger
- Tree shaking：自动移除未使用代码

#### 4.2 预加载优化
- 常用依赖预编译：`vue`, `vue-router`, `pinia`, `element-plus`, `dayjs`, `echarts`

### 5. 性能监控

#### 5.1 Performance Monitor
- 提供了性能监控工具
- 支持自定义性能标记和测量

```javascript
import { perfMonitor } from '@/utils/performance'

perfMonitor.mark('operation-start')
// 执行操作
const duration = perfMonitor.measure('operation', 'operation-start')
```

#### 5.2 导航时间监控
```javascript
const timing = PerformanceMonitor.getNavigationTiming()
// 返回 DNS、TCP、TTFB、DOM 解析等时间
```

## 使用建议

### 1. 图片优化
- 上传图片前进行压缩
- 使用 WebP 格式
- 合理设置图片尺寸

### 2. 数据加载
- 避免一次性加载大量数据
- 使用分页或虚拟滚动
- 合理使用缓存

### 3. 组件开发
- 大列表使用虚拟滚动
- 图表组件使用 LazyChart 包装
- 图片使用 LazyImage 组件

### 4. 状态管理
- 合理使用 computed 缓存
- 及时清理不需要的数据
- 使用缓存机制减少重复计算

## 性能指标

### 目标
- 首屏加载时间：< 2秒
- 页面切换响应：< 200ms
- 大量数据无卡顿

### 监控指标
- DNS 查询时间
- TCP 连接时间
- TTFB（首字节时间）
- DOM 解析时间
- 资源加载时间

## 注意事项

1. 缓存设置要合理，避免内存泄漏
2. 虚拟滚动适合大数据列表，不适合小数据
3. 懒加载要设置合理的阈值
4. 定期清理不需要的缓存数据
