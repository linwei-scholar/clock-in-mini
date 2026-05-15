<template>
  <div ref="containerRef" class="virtual-scroll-container" :style="containerStyle" @scroll="handleScroll">
    <div class="virtual-scroll-spacer" :style="spacerStyle">
      <div
        class="virtual-scroll-content"
        :style="contentStyle"
      >
        <div
          v-for="(item, index) in visibleItems"
          :key="getItemKey(item, startIndex + index)"
          class="virtual-scroll-item"
          :style="itemStyle"
        >
          <slot :item="item" :index="startIndex + index"></slot>
        </div>
      </div>
    </div>

    <div v-if="isLoading" class="virtual-scroll-loading">
      <el-icon class="is-loading"><Loading /></el-icon>
      <span>加载中...</span>
    </div>

    <div v-if="!hasMore && showEndMessage" class="virtual-scroll-end">
      <span>{{ endMessage }}</span>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount, watch } from 'vue'
import { Loading } from '@element-plus/icons-vue'

const props = defineProps({
  items: {
    type: Array,
    required: true,
    default: () => []
  },
  itemHeight: {
    type: Number,
    default: 60
  },
  bufferSize: {
    type: Number,
    default: 5
  },
  height: {
    type: [String, Number],
    default: '400px'
  },
  isLoading: {
    type: Boolean,
    default: false
  },
  hasMore: {
    type: Boolean,
    default: true
  },
  showEndMessage: {
    type: Boolean,
    default: true
  },
  endMessage: {
    type: String,
    default: '没有更多数据了'
  },
  keyField: {
    type: String,
    default: 'id'
  }
})

const emit = defineEmits(['loadMore'])

const containerRef = ref(null)
const scrollTop = ref(0)
const containerHeight = ref(0)

const totalHeight = computed(() => {
  return props.items.length * props.itemHeight
})

const startIndex = computed(() => {
  const start = Math.floor(scrollTop.value / props.itemHeight) - props.bufferSize
  return Math.max(0, start)
})

const endIndex = computed(() => {
  const visibleCount = Math.ceil(containerHeight.value / props.itemHeight)
  const end = startIndex.value + visibleCount + props.bufferSize * 2
  return Math.min(props.items.length, end)
})

const visibleItems = computed(() => {
  return props.items.slice(startIndex.value, endIndex.value)
})

const offsetY = computed(() => {
  return startIndex.value * props.itemHeight
})

const containerStyle = computed(() => ({
  height: typeof props.height === 'number' ? `${props.height}px` : props.height,
  overflow: 'auto'
}))

const spacerStyle = computed(() => ({
  height: `${totalHeight.value}px`,
  position: 'relative'
}))

const contentStyle = computed(() => ({
  position: 'absolute',
  top: 0,
  left: 0,
  right: 0,
  transform: `translateY(${offsetY.value}px)`
}))

const itemStyle = computed(() => ({
  height: `${props.itemHeight}px`
}))

const getItemKey = (item, index) => {
  return item[props.keyField] || index
}

let ticking = false

const handleScroll = (event) => {
  if (!ticking) {
    requestAnimationFrame(() => {
      scrollTop.value = event.target.scrollTop
      containerHeight.value = event.target.clientHeight

      const scrollBottom = event.target.scrollHeight - event.target.scrollTop - containerHeight.value
      if (scrollBottom < 200 && !props.isLoading && props.hasMore) {
        emit('loadMore')
      }

      ticking = false
    })
    ticking = true
  }
}

const scrollToIndex = (index, behavior = 'smooth') => {
  if (containerRef.value) {
    const top = index * props.itemHeight
    containerRef.value.scrollTo({
      top,
      behavior
    })
  }
}

const scrollToTop = (behavior = 'smooth') => {
  if (containerRef.value) {
    containerRef.value.scrollTo({
      top: 0,
      behavior
    })
  }
}

const updateContainerHeight = () => {
  if (containerRef.value) {
    containerHeight.value = containerRef.value.clientHeight
  }
}

onMounted(() => {
  updateContainerHeight()
  window.addEventListener('resize', updateContainerHeight)
})

onBeforeUnmount(() => {
  window.removeEventListener('resize', updateContainerHeight)
})

watch(() => props.items.length, () => {
  if (containerRef.value) {
    containerHeight.value = containerRef.value.clientHeight
  }
})
</script>

<style scoped>
.virtual-scroll-container {
  position: relative;
  will-change: scroll-position;
}

.virtual-scroll-spacer {
  width: 100%;
}

.virtual-scroll-content {
  width: 100%;
  will-change: transform;
}

.virtual-scroll-item {
  box-sizing: border-box;
}

.virtual-scroll-loading,
.virtual-scroll-end {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
  color: #909399;
  font-size: 14px;
  gap: 8px;
}

.virtual-scroll-loading .el-icon {
  font-size: 20px;
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
