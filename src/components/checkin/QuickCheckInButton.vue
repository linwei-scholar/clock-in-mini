<template>
  <el-button
    :type="buttonType"
    :size="buttonSize"
    :circle="circle"
    @click="handleClick"
    :loading="isLoading"
  >
    <template #icon>
      <el-icon><Check /></el-icon>
    </template>
    <span v-if="!circle">{{ buttonText }}</span>
  </el-button>
</template>

<script setup>
import { ref, computed } from 'vue'
import { Check } from '@element-plus/icons-vue'

const props = defineProps({
  buttonType: {
    type: String,
    default: 'primary',
    validator: (value) => ['primary', 'success', 'warning', 'danger', 'info', ''].includes(value)
  },
  buttonSize: {
    type: String,
    default: 'default',
    validator: (value) => ['large', 'default', 'small'].includes(value)
  },
  circle: {
    type: Boolean,
    default: false
  },
  autoLoad: {
    type: Boolean,
    default: true
  }
})

const emit = defineEmits(['click', 'open-dialog'])

const isLoading = ref(false)

const buttonText = computed(() => '快速打卡')

const handleClick = () => {
  emit('click')
  emit('open-dialog')
}

defineExpose({
  setLoading: (loading) => {
    isLoading.value = loading
  }
})
</script>

<style lang="scss" scoped>
.el-button {
  display: inline-flex;
  align-items: center;
  gap: var(--spacing-xs);

  .el-icon {
    margin: 0;
  }
}
</style>
