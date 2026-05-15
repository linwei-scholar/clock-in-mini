<template>
  <el-button
    :type="type"
    :size="size"
    :disabled="disabled || loading"
    :loading="loading"
    :icon="loading ? 'Loading' : ''"
    @click="handleClick"
    :native-type="nativeType"
    :class="['btn-loading', { 'btn-loading--block': block }]"
  >
    <slot>{{ text }}</slot>
  </el-button>
</template>

<script setup>
defineProps({
  type: {
    type: String,
    default: 'primary'
  },
  size: {
    type: String,
    default: 'default'
  },
  loading: {
    type: Boolean,
    default: false
  },
  disabled: {
    type: Boolean,
    default: false
  },
  text: {
    type: String,
    default: '提交'
  },
  nativeType: {
    type: String,
    default: 'button'
  },
  block: {
    type: Boolean,
    default: false
  }
});

const emit = defineEmits(['click']);

const handleClick = (event) => {
  emit('click', event);
};
</script>

<style scoped lang="scss">
.btn-loading {
  position: relative;

  &--block {
    width: 100%;
    display: block;
  }

  :deep(.el-icon) {
    font-size: inherit;
  }
}
</style>
