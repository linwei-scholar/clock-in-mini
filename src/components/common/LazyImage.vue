<template>
  <div class="lazy-image-wrapper" :style="wrapperStyle">
    <img
      v-if="isVisible"
      :src="src"
      :alt="alt"
      :style="imageStyle"
      :class="['lazy-image', { 'is-loaded': isLoaded, 'has-error': hasError }]"
      @load="handleLoad"
      @error="handleError"
    />
    <div v-else class="lazy-placeholder" :style="placeholderStyle">
      <slot name="placeholder">
        <div class="placeholder-bg"></div>
      </slot>
    </div>
    <div v-if="hasError" class="error-placeholder">
      <el-icon><Picture /></el-icon>
      <span>加载失败</span>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import { Picture } from '@element-plus/icons-vue'

const props = defineProps({
  src: {
    type: String,
    required: true
  },
  alt: {
    type: String,
    default: ''
  },
  width: {
    type: [String, Number],
    default: '100%'
  },
  height: {
    type: [String, Number],
    default: '200px'
  },
  fit: {
    type: String,
    default: 'cover'
  },
  lazy: {
    type: Boolean,
    default: true
  },
  rootMargin: {
    type: String,
    default: '50px'
  }
})

const emit = defineEmits(['load', 'error'])

const isVisible = ref(!props.lazy)
const isLoaded = ref(false)
const hasError = ref(false)
let observer = null

const wrapperStyle = computed(() => ({
  width: typeof props.width === 'number' ? `${props.width}px` : props.width,
  height: typeof props.height === 'number' ? `${props.height}px` : props.height
}))

const imageStyle = computed(() => ({
  width: '100%',
  height: '100%',
  objectFit: props.fit
}))

const placeholderStyle = computed(() => ({
  width: '100%',
  height: '100%'
}))

const handleLoad = () => {
  isLoaded.value = true
  emit('load')
}

const handleError = () => {
  hasError.value = true
  emit('error')
}

onMounted(() => {
  if (props.lazy && 'IntersectionObserver' in window) {
    observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            isVisible.value = true
            if (observer) {
              observer.disconnect()
            }
          }
        })
      },
      {
        rootMargin: props.rootMargin,
        threshold: 0
      }
    )

    const wrapper = document.querySelector('.lazy-image-wrapper')
    if (wrapper) {
      observer.observe(wrapper)
    }
  } else {
    isVisible.value = true
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
.lazy-image-wrapper {
  position: relative;
  overflow: hidden;
  background: #f5f7fa;
  border-radius: 4px;
}

.lazy-placeholder {
  width: 100%;
  height: 100%;
}

.placeholder-bg {
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, #f5f7fa 25%, #e4e7ed 50%, #f5f7fa 75%);
  background-size: 200% 100%;
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

.lazy-image {
  opacity: 0;
  transition: opacity 0.3s ease-in-out;
}

.lazy-image.is-loaded {
  opacity: 1;
}

.lazy-image.has-error {
  opacity: 0;
}

.error-placeholder {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: #f5f7fa;
  color: #909399;
  gap: 8px;
}

.error-placeholder .el-icon {
  font-size: 32px;
}

.error-placeholder span {
  font-size: 12px;
}
</style>
