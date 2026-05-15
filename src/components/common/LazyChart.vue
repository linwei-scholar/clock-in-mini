<template>
  <div ref="containerRef" class="lazy-chart-container">
    <div v-if="!isVisible" class="chart-placeholder">
      <div class="placeholder-content">
        <el-icon class="placeholder-icon"><DataAnalysis /></el-icon>
        <span>图表加载中...</span>
      </div>
    </div>
    <div v-else class="chart-content">
      <slot></slot>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue'
import { DataAnalysis } from '@element-plus/icons-vue'

const props = defineProps({
  rootMargin: {
    type: String,
    default: '100px'
  },
  threshold: {
    type: Number,
    default: 0.1
  },
  once: {
    type: Boolean,
    default: true
  }
})

const emit = defineEmits(['visible', 'hidden'])

const containerRef = ref(null)
const isVisible = ref(false)
let observer = null

onMounted(() => {
  if ('IntersectionObserver' in window) {
    observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            isVisible.value = true
            emit('visible')
            if (props.once && observer) {
              observer.disconnect()
            }
          } else {
            if (!props.once) {
              isVisible.value = false
              emit('hidden')
            }
          }
        })
      },
      {
        rootMargin: props.rootMargin,
        threshold: props.threshold
      }
    )

    if (containerRef.value) {
      observer.observe(containerRef.value)
    }
  } else {
    isVisible.value = true
    emit('visible')
  }
})

onBeforeUnmount(() => {
  if (observer) {
    observer.disconnect()
    observer = null
  }
})
</script>

<style scoped>
.lazy-chart-container {
  width: 100%;
  min-height: 200px;
}

.chart-placeholder {
  width: 100%;
  height: 300px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(90deg, #f5f7fa 25%, #e4e7ed 50%, #f5f7fa 75%);
  background-size: 200% 100%;
  border-radius: 8px;
  animation: shimmer 1.5s infinite;
}

@keyframes shimmer {
  0% {
    background-position: 200% 0;
  }
  100% {
    background-position: -200% 0;
  }
}

.placeholder-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  color: #909399;
}

.placeholder-icon {
  font-size: 48px;
}

.placeholder-content span {
  font-size: 14px;
}

.chart-content {
  width: 100%;
  animation: fadeIn 0.3s ease-in-out;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>
