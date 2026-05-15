<template>
  <div class="record-card" @click="handleView">
    <div class="record-header">
      <div class="record-plan">
        <el-tag :color="plan?.tagColor || '#409EFF'" size="small">
          {{ plan?.name || '已删除计划' }}
        </el-tag>
      </div>
      <span class="record-time">{{ formatTime(record.checkInTime) }}</span>
    </div>

    <div class="record-content">
      <p v-if="record.content">{{ record.content }}</p>
      <p v-else class="no-content">无内容</p>
    </div>

    <div v-if="record.images && record.images.length > 0" class="record-images">
      <LazyImage
        v-for="(image, index) in record.images.slice(0, 3)"
        :key="index"
        :src="image"
        :width="80"
        :height="80"
        fit="cover"
      />
      <div v-if="record.images.length > 3" class="more-images">
        +{{ record.images.length - 3 }}
      </div>
    </div>

    <div class="record-footer">
      <div class="record-tags">
        <el-tag v-if="record.isLate" type="warning" size="small">补卡</el-tag>
      </div>
      <div class="record-actions" @click.stop>
        <el-button size="small" @click="handleEdit">编辑</el-button>
        <el-button size="small" type="danger" @click="handleDelete">删除</el-button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { ElMessageBox, ElMessage } from 'element-plus'
import { useRecordStore } from '@/stores/recordStore'
import LazyImage from '@/components/common/LazyImage.vue'

const props = defineProps({
  record: {
    type: Object,
    required: true
  },
  plan: {
    type: Object,
    default: null
  }
})

const emit = defineEmits(['edit', 'delete', 'view'])

const recordStore = useRecordStore()

const formatTime = (time) => {
  const date = new Date(time)
  const now = new Date()
  const diff = now - date
  const hours = Math.floor(diff / (1000 * 60 * 60))
  const minutes = Math.floor(diff / (1000 * 60))

  if (minutes < 1) return '刚刚'
  if (minutes < 60) return `${minutes}分钟前`
  if (hours < 24) return `${hours}小时前`

  const dayDiff = Math.floor(hours / 24)
  if (dayDiff === 1) return '昨天'

  const dateStr = date.toLocaleDateString('zh-CN', {
    month: 'short',
    day: 'numeric'
  })
  const timeStr = date.toLocaleTimeString('zh-CN', {
    hour: '2-digit',
    minute: '2-digit'
  })

  return `${dateStr} ${timeStr}`
}

const handleView = () => {
  emit('view', props.record)
}

const handleEdit = () => {
  emit('edit', props.record)
}

const handleDelete = async () => {
  try {
    await ElMessageBox.confirm('确定要删除这条打卡记录吗？删除后不可恢复。', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })

    const success = await recordStore.deleteRecord(props.record.id)
    if (success) {
      ElMessage.success('删除成功')
      emit('delete', props.record.id)
    } else {
      ElMessage.error(recordStore.error || '删除失败')
    }
  } catch {
    // 用户取消
  }
}
</script>

<style scoped>
.record-card {
  padding: var(--spacing-md);
  background: white;
  border-radius: var(--radius-medium);
  cursor: pointer;
  transition: all 0.3s ease;
  border: 1px solid var(--border-light);
}

.record-card:hover {
  box-shadow: var(--shadow-medium);
  transform: translateY(-2px);
}

.record-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--spacing-sm);
}

.record-time {
  font-size: 12px;
  color: var(--text-placeholder);
}

.record-content {
  margin-bottom: var(--spacing-sm);
}

.record-content p {
  margin: 0;
  font-size: 14px;
  color: var(--text-primary);
  line-height: 1.6;
}

.no-content {
  color: var(--text-placeholder);
  font-style: italic;
}

.record-images {
  display: flex;
  gap: var(--spacing-xs);
  margin-bottom: var(--spacing-sm);
  flex-wrap: wrap;
}

.more-images {
  width: 80px;
  height: 80px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--bg-page);
  border-radius: 4px;
  font-size: 14px;
  color: var(--text-secondary);
}

.record-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.record-tags {
  display: flex;
  gap: var(--spacing-xs);
}

.record-actions {
  display: flex;
  gap: var(--spacing-xs);
}
</style>
