<template>
  <div class="loading-overlay" v-if="fullscreen">
    <div class="loading-spinner">
      <div class="spinner"></div>
      <p v-if="text" class="loading-text">{{ text }}</p>
    </div>
  </div>
  <div v-else class="skeleton-container">
    <template v-if="type === 'card'">
      <div v-for="i in rows" :key="i" class="skeleton-card">
        <el-skeleton :rows="3" animated />
      </div>
    </template>
    <template v-else-if="type === 'list'">
      <div v-for="i in rows" :key="i" class="skeleton-list-item">
        <el-skeleton :rows="2" animated />
      </div>
    </template>
    <template v-else-if="type === 'detail'">
      <div class="skeleton-detail">
        <el-skeleton :rows="5" animated />
      </div>
    </template>
    <template v-else>
      <el-skeleton :rows="rows" animated />
    </template>
  </div>
</template>

<script setup>
defineProps({
  type: {
    type: String,
    default: 'default',
    validator: (value) => ['default', 'card', 'list', 'detail'].includes(value)
  },
  rows: {
    type: Number,
    default: 3
  },
  text: {
    type: String,
    default: '加载中...'
  },
  fullscreen: {
    type: Boolean,
    default: false
  }
});
</script>

<style scoped lang="scss">
.loading-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(255, 255, 255, 0.9);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
}

.loading-spinner {
  text-align: center;
}

.spinner {
  width: 48px;
  height: 48px;
  border: 4px solid #f3f3f3;
  border-top: 4px solid #409eff;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto 16px;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.loading-text {
  color: #606266;
  font-size: 14px;
  margin: 0;
}

.skeleton-container {
  padding: 16px;
}

.skeleton-card {
  background: #fff;
  border-radius: 8px;
  padding: 16px;
  margin-bottom: 16px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.05);
}

.skeleton-list-item {
  padding: 16px;
  border-bottom: 1px solid #ebeef5;
}

.skeleton-detail {
  padding: 24px;
  background: #fff;
  border-radius: 8px;
}
</style>
