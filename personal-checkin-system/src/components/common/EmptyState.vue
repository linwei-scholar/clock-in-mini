<template>
  <div class="empty-state">
    <div class="empty-state__icon">
      <el-icon :size="iconSize">
        <component :is="currentIcon" />
      </el-icon>
    </div>
    <h3 class="empty-state__title">{{ message }}</h3>
    <p v-if="description" class="empty-state__description">{{ description }}</p>
    <el-button
      v-if="actionText"
      type="primary"
      @click="handleAction"
      class="empty-state__action"
    >
      {{ actionText }}
    </el-button>
  </div>
</template>

<script setup>
import { computed } from 'vue';

const props = defineProps({
  type: {
    type: String,
    default: 'no-data',
    validator: (value) => [
      'no-data',
      'no-plan',
      'no-record',
      'no-result',
      'no-permission',
      'loading-failed'
    ].includes(value)
  },
  message: {
    type: String,
    default: '暂无数据'
  },
  description: {
    type: String,
    default: ''
  },
  actionText: {
    type: String,
    default: ''
  },
  iconSize: {
    type: Number,
    default: 64
  }
});

const emit = defineEmits(['action']);

const iconMap = {
  'no-data': 'Document',
  'no-plan': 'FolderAdd',
  'no-record': 'Calendar',
  'no-result': 'Search',
  'no-permission': 'Lock',
  'loading-failed': 'WarningFilled'
};

const defaultMessages = {
  'no-data': '暂无数据',
  'no-plan': '暂无打卡计划',
  'no-record': '暂无打卡记录',
  'no-result': '搜索无结果',
  'no-permission': '暂无权限访问',
  'loading-failed': '加载失败'
};

const currentIcon = computed(() => {
  return iconMap[props.type] || 'Document';
});

const message = computed(() => {
  return props.message || defaultMessages[props.type];
});

const handleAction = () => {
  emit('action');
};
</script>

<style scoped lang="scss">
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 48px 24px;
  text-align: center;

  &__icon {
    margin-bottom: 24px;
    color: #909399;
    opacity: 0.6;
  }

  &__title {
    margin: 0 0 12px;
    font-size: 18px;
    font-weight: 500;
    color: #303133;
  }

  &__description {
    margin: 0 0 24px;
    font-size: 14px;
    color: #909399;
    max-width: 320px;
    line-height: 1.6;
  }

  &__action {
    margin-top: 8px;
  }
}
</style>
