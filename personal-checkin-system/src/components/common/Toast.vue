<template>
  <Teleport to="body">
    <Transition name="toast-fade">
      <div v-if="visible" :class="['toast-container', position]">
        <div :class="['toast', `toast--${type}`]">
          <el-icon v-if="showIcon" :class="['toast-icon', `icon-${type}`]">
            <component :is="iconComponent" />
          </el-icon>
          <span class="toast-message">{{ message }}</span>
          <button v-if="closable" class="toast-close" @click="close">
            <el-icon><Close /></el-icon>
          </button>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue';
import { SuccessFilled, ErrorFilled, WarningFilled, InfoFilled, Close } from '@element-plus/icons-vue';

const props = defineProps({
  message: {
    type: String,
    required: true
  },
  type: {
    type: String,
    default: 'success',
    validator: (value) => ['success', 'error', 'warning', 'info'].includes(value)
  },
  duration: {
    type: Number,
    default: 3000
  },
  closable: {
    type: Boolean,
    default: true
  },
  showIcon: {
    type: Boolean,
    default: true
  },
  position: {
    type: String,
    default: 'top-center',
    validator: (value) => 
      ['top-left', 'top-center', 'top-right', 
       'bottom-left', 'bottom-center', 'bottom-right'].includes(value)
  },
  onClose: {
    type: Function,
    default: null
  }
});

const emit = defineEmits(['close']);

const visible = ref(false);

const iconComponent = computed(() => {
  const icons = {
    success: SuccessFilled,
    error: ErrorFilled,
    warning: WarningFilled,
    info: InfoFilled
  };
  return icons[props.type];
});

let timer = null;

const show = () => {
  visible.value = true;
  
  if (props.duration > 0) {
    timer = setTimeout(() => {
      close();
    }, props.duration);
  }
};

const close = () => {
  if (timer) {
    clearTimeout(timer);
    timer = null;
  }
  
  visible.value = false;
  emit('close');
  
  if (props.onClose) {
    props.onClose();
  }
};

watch(() => props.message, (newVal) => {
  if (newVal && !visible.value) {
    show();
  }
}, { immediate: true });

onMounted(() => {
  if (props.message) {
    show();
  }
});

defineExpose({
  show,
  close
});
</script>

<style scoped lang="scss">
.toast-container {
  position: fixed;
  z-index: 9999;
  display: flex;
  flex-direction: column;
  gap: 8px;

  &.top-left {
    top: 20px;
    left: 20px;
  }

  &.top-center {
    top: 20px;
    left: 50%;
    transform: translateX(-50%);
  }

  &.top-right {
    top: 20px;
    right: 20px;
  }

  &.bottom-left {
    bottom: 20px;
    left: 20px;
  }

  &.bottom-center {
    bottom: 20px;
    left: 50%;
    transform: translateX(-50%);
  }

  &.bottom-right {
    bottom: 20px;
    right: 20px;
  }
}

.toast {
  display: flex;
  align-items: center;
  padding: 12px 16px;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  min-width: 280px;
  max-width: 400px;

  &--success {
    background: #f0f9eb;
    border-left: 4px solid #67c23a;
    .toast-icon {
      color: #67c23a;
    }
  }

  &--error {
    background: #fef0f0;
    border-left: 4px solid #f56c6c;
    .toast-icon {
      color: #f56c6c;
    }
  }

  &--warning {
    background: #fdf6ec;
    border-left: 4px solid #e6a23c;
    .toast-icon {
      color: #e6a23c;
    }
  }

  &--info {
    background: #f4f4f5;
    border-left: 4px solid #909399;
    .toast-icon {
      color: #909399;
    }
  }
}

.toast-icon {
  margin-right: 12px;
  font-size: 20px;
}

.toast-message {
  flex: 1;
  font-size: 14px;
  color: #303133;
  line-height: 1.5;
}

.toast-close {
  background: transparent;
  border: none;
  cursor: pointer;
  padding: 4px;
  margin-left: 8px;
  color: #909399;
  display: flex;
  align-items: center;
  justify-content: center;

  &:hover {
    color: #606266;
  }
}

.toast-fade-enter-active,
.toast-fade-leave-active {
  transition: all 0.3s ease;
}

.toast-fade-enter-from,
.toast-fade-leave-to {
  opacity: 0;
  transform: translateY(-20px);
}
</style>
