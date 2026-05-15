<template>
  <div class="record-list-container">
    <div v-if="loading" class="loading-container">
      <el-icon class="is-loading"><Loading /></el-icon>
      <span>加载中...</span>
    </div>

    <div v-else-if="records.length === 0" class="empty-container">
      <el-empty :description="emptyText" :image-size="80" />
    </div>

    <div v-else class="record-list">
      <div
        v-for="record in paginatedRecords"
        :key="record.id"
        class="record-card"
      >
        <div class="record-header">
          <div class="record-plan">
            <el-icon><Document /></el-icon>
            <span class="plan-name" @click="handleViewPlan(record.planId)">
              {{ getPlanName(record.planId) }}
            </span>
          </div>
          <div class="record-actions" v-if="showActions">
            <el-button
              type="primary"
              size="small"
              text
              @click="handleEdit(record)"
            >
              编辑
            </el-button>
            <el-button
              type="danger"
              size="small"
              text
              @click="handleDelete(record)"
            >
              删除
            </el-button>
          </div>
        </div>

        <div class="record-content" @click="handleViewDetail(record)">
          <div class="record-text" v-if="record.content">
            {{ record.content }}
          </div>
          <div class="record-images" v-if="record.images && record.images.length > 0">
            <div
              v-for="(image, index) in record.images"
              :key="index"
              class="image-wrapper"
              @click.stop="handlePreviewImage(image)"
            >
              <el-image
                :src="image"
                fit="cover"
                class="record-image"
                :preview-src-list="record.images"
                :initial-index="index"
                preview-teleported
              />
            </div>
          </div>
        </div>

        <div class="record-footer">
          <div class="record-time">
            <el-icon><Clock /></el-icon>
            <span>{{ formatTimeAgo(record.checkInTime) }}</span>
            <el-tag v-if="record.isLate" type="warning" size="small" class="ml-sm">
              迟到
            </el-tag>
          </div>
        </div>

        <el-image-viewer
          v-if="previewVisible"
          :url-list="[previewImage]"
          @close="previewVisible = false"
        />
      </div>
    </div>

    <el-pagination
      v-if="records.length > 0 && showPagination"
      v-model:current-page="currentPage"
      :page-size="currentPageSize"
      :page-sizes="pageSizeOptions"
      :total="records.length"
      :layout="paginationLayout"
      @size-change="handleSizeChange"
      @current-change="handleCurrentChange"
      class="pagination-wrapper"
    />

    <el-dialog
      v-model="detailVisible"
      :title="'打卡记录详情'"
      width="600px"
      class="detail-dialog"
    >
      <div v-if="currentRecord" class="detail-content">
        <div class="detail-header">
          <div class="detail-plan">
            <span class="detail-label">关联计划：</span>
            <span class="detail-value" @click="handleViewPlan(currentRecord.planId)">
              {{ getPlanName(currentRecord.planId) }}
            </span>
          </div>
          <div class="detail-status">
            <el-tag v-if="currentRecord.isLate" type="warning" size="small">迟到</el-tag>
          </div>
        </div>

        <div class="detail-body">
          <div class="detail-text" v-if="currentRecord.content">
            <div class="detail-label">打卡内容</div>
            <div class="detail-value">{{ currentRecord.content }}</div>
          </div>

          <div class="detail-images" v-if="currentRecord.images && currentRecord.images.length > 0">
            <div class="detail-label">打卡图片</div>
            <div class="image-gallery">
              <div
                v-for="(image, index) in currentRecord.images"
                :key="index"
                class="gallery-item"
              >
                <el-image
                  :src="image"
                  fit="cover"
                  class="gallery-image"
                  :preview-src-list="currentRecord.images"
                  :initial-index="index"
                  preview-teleported
                />
              </div>
            </div>
          </div>
        </div>

        <div class="detail-footer">
          <div class="detail-time-item">
            <span class="detail-label">打卡日期：</span>
            <span class="detail-value">{{ formatDate(currentRecord.checkInDate) }}</span>
          </div>
          <div class="detail-time-item">
            <span class="detail-label">打卡时间：</span>
            <span class="detail-value">{{ formatTime(currentRecord.checkInTime) }}</span>
          </div>
          <div class="detail-time-item">
            <span class="detail-label">创建时间：</span>
            <span class="detail-value">{{ formatDateTime(currentRecord.createdAt) }}</span>
          </div>
          <div class="detail-time-item" v-if="currentRecord.updatedAt">
            <span class="detail-label">更新时间：</span>
            <span class="detail-value">{{ formatDateTime(currentRecord.updatedAt) }}</span>
          </div>
        </div>
      </div>

      <template #footer>
        <div class="dialog-footer">
          <el-button @click="detailVisible = false">关闭</el-button>
          <el-button type="primary" @click="handleEdit(currentRecord)">编辑</el-button>
        </div>
      </template>
    </el-dialog>

    <el-dialog
      v-model="deleteConfirmVisible"
      title="确认删除"
      width="400px"
    >
      <div class="delete-confirm-content">
        <el-icon class="delete-icon"><WarningFilled /></el-icon>
        <p>确定要删除该打卡记录吗？</p>
        <p class="delete-warning">删除后不可恢复</p>
      </div>
      <template #footer>
        <el-button @click="deleteConfirmVisible = false">取消</el-button>
        <el-button type="danger" @click="confirmDelete">确认删除</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Loading, Document, Clock, WarningFilled } from '@element-plus/icons-vue'
import { usePlanStore } from '@/stores/planStore'
import { useRecordStore } from '@/stores/recordStore'
import { formatTimeAgo, formatDate, formatDateTime, formatTime } from '@/utils/timeFormat'

const router = useRouter()
const planStore = usePlanStore()
const recordStore = useRecordStore()

const props = defineProps({
  records: {
    type: Array,
    default: () => []
  },
  loading: {
    type: Boolean,
    default: false
  },
  emptyText: {
    type: String,
    default: '暂无打卡记录'
  },
  showActions: {
    type: Boolean,
    default: true
  },
  showPagination: {
    type: Boolean,
    default: true
  },
  pageSize: {
    type: Number,
    default: 10
  },
  pageSizeOptions: {
    type: Array,
    default: () => [10, 15, 20]
  },
  paginationLayout: {
    type: String,
    default: 'total, sizes, prev, pager, next'
  }
})

const emit = defineEmits(['edit', 'delete', 'view'])

const currentPage = ref(1)
const currentPageSize = ref(props.pageSize)
const currentRecord = ref(null)
const detailVisible = ref(false)
const deleteConfirmVisible = ref(false)
const previewVisible = ref(false)
const previewImage = ref('')

const paginatedRecords = computed(() => {
  const start = (currentPage.value - 1) * currentPageSize.value
  const end = start + currentPageSize.value
  return [...props.records].sort((a, b) => {
    return new Date(b.checkInTime) - new Date(a.checkInTime)
  }).slice(start, end)
})

const getPlanName = (planId) => {
  const plan = planStore.getPlanById(planId)
  return plan ? plan.name : '未知计划'
}

const handleEdit = (record) => {
  emit('edit', record)
  router.push(`/records/${record.id}/edit`)
}

const handleDelete = async (record) => {
  try {
    await ElMessageBox.confirm(
      '确定要删除该打卡记录吗？删除后不可恢复。',
      '确认删除',
      {
        confirmButtonText: '确认删除',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
    
    deleteConfirmVisible.value = true
    currentRecord.value = record
  } catch {
    // 用户取消
  }
}

const confirmDelete = async () => {
  try {
    const success = await recordStore.deleteRecord(currentRecord.value.id)
    if (success) {
      ElMessage.success('删除成功')
      emit('delete', currentRecord.value.id)
    } else {
      ElMessage.error(recordStore.error || '删除失败')
    }
  } finally {
    deleteConfirmVisible.value = false
    currentRecord.value = null
  }
}

const handleViewDetail = (record) => {
  currentRecord.value = record
  detailVisible.value = true
  emit('view', record)
}

const handleViewPlan = (planId) => {
  router.push(`/plans/${planId}`)
}

const handlePreviewImage = (image) => {
  previewImage.value = image
  previewVisible.value = true
}

const handleSizeChange = (size) => {
  currentPageSize.value = size
  currentPage.value = 1
}

const handleCurrentChange = (page) => {
  currentPage.value = page
}

onMounted(() => {
  if (planStore.plans.length === 0) {
    planStore.loadPlans()
  }
})

watch(() => props.records, () => {
  currentPage.value = 1
})
</script>

<style lang="scss" scoped>
.record-list-container {
  width: 100%;
}

.loading-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px;
  color: var(--text-secondary);

  .el-icon {
    font-size: 32px;
    margin-bottom: 16px;
  }
}

.empty-container {
  padding: 40px 0;
}

.record-list {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-md);
}

.record-card {
  background: white;
  border-radius: var(--radius-medium);
  padding: var(--spacing-lg);
  box-shadow: var(--shadow-light);
  transition: all 0.3s;

  &:hover {
    box-shadow: var(--shadow-medium);
    transform: translateY(-2px);
  }
}

.record-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: var(--spacing-md);
}

.record-plan {
  display: flex;
  align-items: center;
  gap: var(--spacing-xs);
  color: var(--text-secondary);
  font-size: 14px;

  .plan-name {
    cursor: pointer;
    color: var(--color-primary);
    font-weight: 500;

    &:hover {
      text-decoration: underline;
    }
  }
}

.record-actions {
  display: flex;
  gap: var(--spacing-xs);
}

.record-content {
  cursor: pointer;
  margin-bottom: var(--spacing-md);
}

.record-text {
  font-size: 14px;
  color: var(--text-primary);
  line-height: 1.6;
  margin-bottom: var(--spacing-md);
  word-break: break-word;
}

.record-images {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
  gap: var(--spacing-sm);

  .image-wrapper {
    width: 120px;
    height: 120px;
    border-radius: var(--radius-small);
    overflow: hidden;
    cursor: pointer;

    .record-image {
      width: 100%;
      height: 100%;
      transition: transform 0.3s;

      &:hover {
        transform: scale(1.05);
      }
    }
  }
}

.record-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-top: var(--spacing-md);
  border-top: 1px solid var(--border-color);
}

.record-time {
  display: flex;
  align-items: center;
  gap: var(--spacing-xs);
  color: var(--text-secondary);
  font-size: 12px;

  .el-icon {
    font-size: 14px;
  }
}

.ml-sm {
  margin-left: var(--spacing-sm);
}

.pagination-wrapper {
  margin-top: var(--spacing-xl);
  display: flex;
  justify-content: flex-end;
}

.detail-dialog {
  .detail-content {
    .detail-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding-bottom: var(--spacing-md);
      border-bottom: 1px solid var(--border-color);
      margin-bottom: var(--spacing-lg);
    }

    .detail-plan {
      .detail-label {
        color: var(--text-secondary);
        font-size: 14px;
      }

      .detail-value {
        color: var(--color-primary);
        font-weight: 500;
        cursor: pointer;

        &:hover {
          text-decoration: underline;
        }
      }
    }

    .detail-body {
      margin-bottom: var(--spacing-lg);

      .detail-text {
        margin-bottom: var(--spacing-lg);

        .detail-label {
          color: var(--text-secondary);
          font-size: 12px;
          margin-bottom: var(--spacing-sm);
        }

        .detail-value {
          color: var(--text-primary);
          font-size: 14px;
          line-height: 1.6;
          word-break: break-word;
        }
      }

      .detail-images {
        .detail-label {
          color: var(--text-secondary);
          font-size: 12px;
          margin-bottom: var(--spacing-sm);
        }

        .image-gallery {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
          gap: var(--spacing-md);

          .gallery-item {
            width: 150px;
            height: 150px;
            border-radius: var(--radius-small);
            overflow: hidden;

            .gallery-image {
              width: 100%;
              height: 100%;
              cursor: pointer;
              transition: transform 0.3s;

              &:hover {
                transform: scale(1.05);
              }
            }
          }
        }
      }
    }

    .detail-footer {
      background: var(--bg-page);
      padding: var(--spacing-md);
      border-radius: var(--radius-small);

      .detail-time-item {
        display: flex;
        align-items: center;
        margin-bottom: var(--spacing-sm);

        &:last-child {
          margin-bottom: 0;
        }

        .detail-label {
          color: var(--text-secondary);
          font-size: 12px;
          min-width: 80px;
        }

        .detail-value {
          color: var(--text-primary);
          font-size: 13px;
        }
      }
    }
  }

  .dialog-footer {
    display: flex;
    justify-content: flex-end;
    gap: var(--spacing-sm);
  }
}

.delete-confirm-content {
  text-align: center;
  padding: var(--spacing-lg) 0;

  .delete-icon {
    font-size: 48px;
    color: var(--color-danger);
    margin-bottom: var(--spacing-md);
  }

  p {
    margin: 0 0 var(--spacing-sm);
    font-size: 14px;
    color: var(--text-primary);
  }

  .delete-warning {
    color: var(--color-danger);
    font-size: 12px;
  }
}

@media (max-width: 768px) {
  .record-card {
    padding: var(--spacing-md);
  }

  .record-header {
    flex-direction: column;
    align-items: flex-start;
    gap: var(--spacing-sm);
  }

  .record-images {
    grid-template-columns: repeat(auto-fill, minmax(80px, 1fr));

    .image-wrapper {
      width: 80px;
      height: 80px;
    }
  }

  .pagination-wrapper {
    justify-content: center;
  }
}
</style>
