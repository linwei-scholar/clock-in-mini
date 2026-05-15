<template>
  <ResponsiveLayout>
    <div class="export-container">
      <el-card>
        <template #header>
          <span class="card-title">数据导出</span>
        </template>

        <el-row :gutter="20">
          <el-col :span="24">
            <el-alert
              title="数据安全提示"
              type="info"
              :closable="false"
              description="请定期导出您的打卡数据以防止浏览器数据丢失。导出的数据仅保存在您的本地设备中。"
            />
          </el-col>
        </el-row>

        <el-row :gutter="20" class="mt-lg">
          <el-col :xs="24" :lg="12">
            <el-card>
              <template #header>
                <span class="card-title-sm">完整数据备份</span>
              </template>
              <p class="description-text">导出所有数据为JSON格式，支持完整恢复。</p>
              <div class="action-buttons">
                <el-button type="primary" @click="exportJSON" class="touch-button">
                  <el-icon><Download /></el-icon>
                  <span class="hidden-xs-only">导出JSON</span>
                </el-button>
                <el-button @click="showImportDialog" class="touch-button">
                  <el-icon><Upload /></el-icon>
                  <span class="hidden-xs-only">导入JSON</span>
                </el-button>
              </div>
            </el-card>
          </el-col>

          <el-col :xs="24" :lg="12" class="mt-lg-mobile">
            <el-card>
              <template #header>
                <span class="card-title-sm">CSV报表导出</span>
              </template>
              <p class="description-text">导出打卡记录为CSV格式，方便在Excel中分析。</p>
              <div class="action-buttons">
                <el-button type="success" @click="exportCSV" class="touch-button">
                  <el-icon><Download /></el-icon>
                  <span class="hidden-xs-only">导出CSV</span>
                </el-button>
              </div>
            </el-card>
          </el-col>
        </el-row>

        <el-row :gutter="20" class="mt-lg">
          <el-col :span="24">
            <el-card>
              <template #header>
                <span class="card-title-sm">数据统计概览</span>
              </template>
              <div class="stats-grid">
                <div class="stat-item">
                  <span class="stat-label">用户信息</span>
                  <span class="stat-value">{{ authStore.userInfo?.username }}</span>
                </div>
                <div class="stat-item">
                  <span class="stat-label">打卡计划数</span>
                  <span class="stat-value">{{ planStore.plans.length }}</span>
                </div>
                <div class="stat-item">
                  <span class="stat-label">打卡记录数</span>
                  <span class="stat-value">{{ recordStore.records.length }}</span>
                </div>
                <div class="stat-item">
                  <span class="stat-label">标签数量</span>
                  <span class="stat-value">{{ tagStore.tags.length }}</span>
                </div>
                <div class="stat-item">
                  <span class="stat-label">数据创建时间</span>
                  <span class="stat-value">{{ formatDate(authStore.userInfo?.createdAt) }}</span>
                </div>
                <div class="stat-item">
                  <span class="stat-label">最近打卡时间</span>
                  <span class="stat-value">{{ lastCheckinTime }}</span>
                </div>
              </div>
            </el-card>
          </el-col>
        </el-row>
      </el-card>

      <el-dialog
        v-model="importDialogVisible"
        title="导入数据"
        width="90%"
        class="mobile-dialog"
      >
        <el-upload
          ref="uploadRef"
          :auto-upload="false"
          :limit="1"
          accept=".json"
          :on-change="handleFileChange"
        >
          <template #trigger>
            <el-button class="touch-button">选择JSON文件</el-button>
          </template>
          <template #tip>
            <div class="el-upload__tip">
              请选择之前导出的JSON格式备份文件。
            </div>
          </template>
        </el-upload>

        <el-alert
          v-if="importData"
          :title="`检测到 ${importDataCount} 条记录`"
          type="success"
          :closable="false"
          class="mt-md"
        />

        <template #footer>
          <el-button @click="importDialogVisible = false" class="touch-button">取消</el-button>
          <el-button
            type="primary"
            @click="handleImport"
            :disabled="!importData"
            class="touch-button"
          >
            确认导入
          </el-button>
        </template>
      </el-dialog>
    </div>
  </ResponsiveLayout>
</template>

<script setup>
import { ref, computed } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Download, Upload } from '@element-plus/icons-vue'
import { useAuthStore } from '@/stores/authStore'
import { usePlanStore } from '@/stores/planStore'
import { useRecordStore } from '@/stores/recordStore'
import { useTagStore } from '@/stores/tagStore'
import ResponsiveLayout from '@/components/ResponsiveLayout.vue'

const authStore = useAuthStore()
const planStore = usePlanStore()
const recordStore = useRecordStore()
const tagStore = useTagStore()

const importDialogVisible = ref(false)
const importData = ref(null)
const uploadRef = ref(null)

const lastCheckinTime = computed(() => {
  if (recordStore.records.length === 0) return '暂无'

  const sorted = recordStore.records
    .slice()
    .sort((a, b) => new Date(b.checkInTime) - new Date(a.checkInTime))

  return formatDate(sorted[0].checkInTime)
})

const importDataCount = computed(() => {
  if (!importData.value) return 0
  return (
    importData.value.plans?.length +
    importData.value.records?.length +
    importData.value.tags?.length
  )
})

const formatDate = (dateStr) => {
  if (!dateStr) return '-'
  return new Date(dateStr).toLocaleString()
}

const exportJSON = () => {
  const data = {
    user: authStore.userInfo,
    plans: planStore.plans,
    records: recordStore.records,
    tags: tagStore.tags,
    exportTime: new Date().toISOString()
  }

  const blob = new Blob([JSON.stringify(data, null, 2)], {
    type: 'application/json'
  })

  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `checkin-backup-${new Date().toISOString().split('T')[0]}.json`
  link.click()

  URL.revokeObjectURL(url)
  ElMessage.success('数据导出成功')
}

const exportCSV = () => {
  const headers = ['计划名称', '打卡日期', '打卡时间', '打卡内容']
  const rows = recordStore.records.map(record => {
    const plan = planStore.getPlanById(record.planId)
    return [
      plan ? plan.name : '未知计划',
      record.checkInDate,
      new Date(record.checkInTime).toLocaleTimeString(),
      record.content || ''
    ]
  })

  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
  ].join('\n')

  const BOM = '\uFEFF'
  const blob = new Blob([BOM + csvContent], {
    type: 'text/csv;charset=utf-8'
  })

  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `checkin-records-${new Date().toISOString().split('T')[0]}.csv`
  link.click()

  URL.revokeObjectURL(url)
  ElMessage.success('CSV导出成功')
}

const showImportDialog = () => {
  importData.value = null
  importDialogVisible.value = true
}

const handleFileChange = (file) => {
  const reader = new FileReader()
  reader.onload = (e) => {
    try {
      const data = JSON.parse(e.target.result)
      importData.value = data
    } catch (error) {
      ElMessage.error('文件格式错误')
      importData.value = null
    }
  }
  reader.readAsText(file.raw)
}

const handleImport = async () => {
  if (!importData.value) {
    ElMessage.warning('请选择要导入的文件')
    return
  }

  await ElMessageBox.confirm(
    '导入数据将覆盖现有数据，确定要继续吗？',
    '警告',
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    }
  )

  const userId = authStore.userInfo.id

  if (importData.value.plans) {
    localStorage.setItem(`plans_${userId}`, JSON.stringify(importData.value.plans))
    planStore.loadPlans(userId)
  }

  if (importData.value.records) {
    localStorage.setItem(`records_${userId}`, JSON.stringify(importData.value.records))
    recordStore.loadRecords(userId)
  }

  if (importData.value.tags) {
    localStorage.setItem(`tags_${userId}`, JSON.stringify(importData.value.tags))
    tagStore.loadTags(userId)
  }

  ElMessage.success('数据导入成功')
  importDialogVisible.value = false
}
</script>

<style scoped>
.export-container {
  width: 100%;
}

.card-title {
  font-size: var(--font-size-md);
  font-weight: bold;
}

@media (min-width: 768px) {
  .card-title {
    font-size: var(--font-size-lg);
  }
}

.card-title-sm {
  font-size: var(--font-size-sm);
  font-weight: bold;
}

@media (min-width: 768px) {
  .card-title-sm {
    font-size: var(--font-size-md);
  }
}

.description-text {
  font-size: var(--font-size-sm);
  color: var(--text-secondary);
  margin-bottom: var(--spacing-md);
}

.mt-lg {
  margin-top: var(--spacing-lg);
}

.mt-lg-mobile {
  margin-top: var(--spacing-lg);
}

@media (max-width: 767px) {
  .mt-lg-mobile {
    margin-top: var(--spacing-md);
  }
}

.mt-md {
  margin-top: var(--spacing-md);
}

.action-buttons {
  margin-top: var(--spacing-md);
  display: flex;
  gap: var(--spacing-sm);
  flex-wrap: wrap;
}

@media (max-width: 767px) {
  .action-buttons {
    flex-direction: column;
  }
  
  .action-buttons .el-button {
    width: 100%;
  }
}

.el-upload__tip {
  margin-top: var(--spacing-sm);
  color: var(--text-secondary);
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: var(--spacing-md);
}

@media (max-width: 767px) {
  .stats-grid {
    grid-template-columns: repeat(2, 1fr);
    gap: var(--spacing-sm);
  }
}

.stat-item {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xs);
  padding: var(--spacing-md);
  background-color: var(--bg-hover);
  border-radius: var(--border-radius-md);
}

@media (max-width: 767px) {
  .stat-item {
    padding: var(--spacing-sm);
  }
}

.stat-label {
  font-size: var(--font-size-xs);
  color: var(--text-secondary);
  font-weight: 500;
}

@media (min-width: 768px) {
  .stat-label {
    font-size: var(--font-size-sm);
  }
}

.stat-value {
  font-size: var(--font-size-sm);
  color: var(--text-primary);
  font-weight: bold;
  word-break: break-all;
}

@media (min-width: 768px) {
  .stat-value {
    font-size: var(--font-size-md);
  }
}

@media (max-width: 768px) {
  .mobile-dialog {
    margin: 10px;
  }
  
  .mobile-dialog :deep(.el-dialog) {
    width: calc(100% - 20px) !important;
    max-width: 500px;
  }
}
</style>
