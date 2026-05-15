<template>
  <div class="export-container">
    <div class="page-header">
      <h1 class="page-title">数据导出</h1>
    </div>

    <el-row :gutter="20">
      <el-col :xs="24" :lg="12">
        <div class="card-container mb-lg">
          <h3 class="card-title">导出数据</h3>
          <p class="card-description">将您的打卡数据导出为不同格式，方便备份和分析</p>

          <div class="export-options">
            <div class="export-item" @click="handleExport('json')">
              <div class="export-icon" style="background: #409EFF20; color: #409EFF">
                <el-icon :size="32"><Document /></el-icon>
              </div>
              <div class="export-info">
                <h4>JSON 格式</h4>
                <p>完整数据备份，包含所有记录和配置</p>
              </div>
              <el-icon :size="20"><Download /></el-icon>
            </div>

            <div class="export-item" @click="handleExport('csv')">
              <div class="export-icon" style="background: #67C23A20; color: #67C23A">
                <el-icon :size="32"><Grid /></el-icon>
              </div>
              <div class="export-info">
                <h4>CSV 格式</h4>
                <p>适合Excel分析，包含打卡记录详情</p>
              </div>
              <el-icon :size="20"><Download /></el-icon>
            </div>

            <div class="export-item" @click="handleExport('xlsx')">
              <div class="export-icon" style="background: #E6A23C20; color: #E6A23C">
                <el-icon :size="32"><TrendCharts /></el-icon>
              </div>
              <div class="export-info">
                <h4>Excel 格式</h4>
                <p>格式美化的报表，包含统计汇总</p>
              </div>
              <el-icon :size="20"><Download /></el-icon>
            </div>
          </div>
        </div>

        <div class="card-container">
          <h3 class="card-title">筛选条件</h3>
          <p class="card-description">选择导出的数据范围和字段</p>

          <el-form label-position="top">
            <el-form-item label="时间范围">
              <el-date-picker
                v-model="dateRange"
                type="daterange"
                range-separator="至"
                start-placeholder="开始日期"
                end-placeholder="结束日期"
                value-format="YYYY-MM-DD"
                style="width: 100%"
              />
            </el-form-item>

            <el-form-item label="计划筛选">
              <el-select
                v-model="selectedPlans"
                multiple
                placeholder="选择计划（不选则导出全部）"
                style="width: 100%"
                collapse-tags
                collapse-tags-tooltip
              >
                <el-option
                  v-for="plan in plans"
                  :key="plan.id"
                  :label="plan.name"
                  :value="plan.id"
                />
              </el-select>
            </el-form-item>

            <el-form-item label="标签筛选">
              <el-select
                v-model="selectedTags"
                multiple
                placeholder="选择标签（不选则导出全部）"
                style="width: 100%"
                collapse-tags
                collapse-tags-tooltip
              >
                <el-option
                  v-for="tag in tags"
                  :key="tag.id"
                  :label="tag.name"
                  :value="tag.id"
                >
                  <span :style="{ color: tag.color }">●</span> {{ tag.name }}
                </el-option>
              </el-select>
            </el-form-item>

            <el-form-item label="导出字段">
              <el-checkbox-group v-model="selectedFields">
                <el-checkbox label="checkInDate">打卡日期</el-checkbox>
                <el-checkbox label="checkInTime">打卡时间</el-checkbox>
                <el-checkbox label="planName">计划名称</el-checkbox>
                <el-checkbox label="content">打卡内容</el-checkbox>
                <el-checkbox label="isLate">是否迟到</el-checkbox>
                <el-checkbox label="tags">标签</el-checkbox>
              </el-checkbox-group>
            </el-form-item>
          </el-form>

          <div v-if="filteredRecords.length > 0" class="preview-section">
            <h4>预览（共 {{ filteredRecords.length }} 条记录）</h4>
            <el-table :data="previewData" size="small" border>
              <el-table-column
                v-for="field in previewFields"
                :key="field.key"
                :prop="field.key"
                :label="field.label"
                width="120"
                show-overflow-tooltip
              />
            </el-table>
          </div>

          <div class="export-actions">
            <el-button @click="resetFilters">重置筛选</el-button>
            <el-button type="primary" @click="handleExport('csv')">
              <el-icon><Download /></el-icon>
              导出 CSV
            </el-button>
            <el-button type="success" @click="handleExport('xlsx')">
              <el-icon><TrendCharts /></el-icon>
              导出 Excel
            </el-button>
          </div>
        </div>
      </el-col>

      <el-col :xs="24" :lg="12">
        <div class="card-container mb-lg">
          <h3 class="card-title">导入数据</h3>
          <p class="card-description">从JSON备份文件恢复您的数据</p>

          <el-upload
            ref="uploadRef"
            :auto-upload="false"
            :limit="1"
            accept=".json"
            :on-change="handleFileChange"
            :on-remove="handleFileRemove"
            drag
          >
            <el-icon class="el-icon--upload"><UploadFilled /></el-icon>
            <div class="el-upload__text">
              拖拽JSON文件到此处，或 <em>点击上传</em>
            </div>
            <template #tip>
              <div class="el-upload__tip">仅支持JSON格式的文件</div>
            </template>
          </el-upload>

          <div v-if="uploadFile" class="import-preview">
            <el-icon :size="20"><Document /></el-icon>
            <span>{{ uploadFile.name }}</span>
            <el-button type="primary" size="small" @click="handleImport">
              确认导入
            </el-button>
          </div>
        </div>

        <div class="card-container">
          <h3 class="card-title">数据统计</h3>
          <div class="data-stats">
            <div class="stat-item">
              <span class="stat-label">用户名称</span>
              <span class="stat-value">{{ userInfo.username }}</span>
            </div>
            <div class="stat-item">
              <span class="stat-label">创建时间</span>
              <span class="stat-value">{{ formatDate(userInfo.createdAt) }}</span>
            </div>
            <div class="stat-item">
              <span class="stat-label">打卡计划</span>
              <span class="stat-value">{{ stats.planCount }} 个</span>
            </div>
            <div class="stat-item">
              <span class="stat-label">打卡记录</span>
              <span class="stat-value">{{ stats.recordCount }} 条</span>
            </div>
            <div class="stat-item">
              <span class="stat-label">标签数量</span>
              <span class="stat-value">{{ stats.tagCount }} 个</span>
            </div>
          </div>
        </div>
      </el-col>
    </el-row>

    <el-dialog v-model="importDialogVisible" title="导入确认" width="500px">
      <p>导入将覆盖您现有的所有数据，是否继续？</p>
      <p style="color: var(--danger-color); font-size: 12px; margin-top: var(--spacing-sm);">
        建议：导入前先导出当前数据作为备份
      </p>
      <template #footer>
        <el-button @click="importDialogVisible = false">取消</el-button>
        <el-button type="danger" @click="confirmImport">确认导入</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, computed } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  Document,
  Download,
  UploadFilled
} from '@element-plus/icons-vue'
import { usePlanStore } from '@/stores/planStore'
import { useRecordStore } from '@/stores/recordStore'
import { useTagStore } from '@/stores/tagStore'
import { useAuthStore } from '@/stores/authStore'
import { PlanDAL, RecordDAL, TagDAL } from '@/database/dal'

const planStore = usePlanStore()
const recordStore = useRecordStore()
const tagStore = useTagStore()
const authStore = useAuthStore()

const uploadRef = ref(null)
const uploadFile = ref(null)
const previewDialogVisible = ref(false)
const finalConfirmVisible = ref(false)
const resultDialogVisible = ref(false)
const importMode = ref('full')
const importPreview = ref(null)
const importResult = reactive({
  success: false,
  message: '',
  plansImported: 0,
  recordsImported: 0,
  tagsImported: 0
})

const currentVersion = '1.0'

const userInfo = reactive({
  username: '',
  createdAt: ''
})

const stats = reactive({
  planCount: 0,
  recordCount: 0,
  tagCount: 0
})

const formatDate = (date) => {
  if (!date) return '-'
  return new Date(date).toLocaleDateString('zh-CN')
}

const formatDateTime = (date) => {
  if (!date) return '-'
  return new Date(date).toLocaleString('zh-CN')
}

const formatTimestamp = (timestamp) => {
  const now = new Date()
  const date = new Date(timestamp)
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  const hours = String(date.getHours()).padStart(2, '0')
  const minutes = String(date.getMinutes()).padStart(2, '0')
  const seconds = String(date.getSeconds()).padStart(2, '0')
  return `${year}${month}${day}_${hours}${minutes}${seconds}`
}

const handleExport = async () => {
  const userId = authStore.userId
  if (!userId) {
    ElMessage.error('用户未登录')
    return
  }

  try {
    const plans = await PlanDAL.getByUserId(userId)
    const records = await RecordDAL.getByUserId(userId)
    const tags = await TagDAL.getByUserId(userId)
    const user = authStore.user

    const exportData = {
      version: currentVersion,
      exportTime: new Date().toISOString(),
      user: {
        username: user?.username || '',
        createdAt: user?.createdAt,
        settings: user?.settings || {}
      },
      tags: tags.map(tag => ({
        id: tag.id,
        userId: tag.userId,
        name: tag.name,
        icon: tag.icon,
        color: tag.color,
        isDefault: tag.isDefault,
        createdAt: tag.createdAt
      })),
      plans: plans.map(plan => ({
        id: plan.id,
        userId: plan.userId,
        name: plan.name,
        description: plan.description,
        tagIds: plan.tagIds,
        frequency: plan.frequency,
        customRules: plan.customRules,
        startDate: plan.startDate,
        endDate: plan.endDate,
        targetCount: plan.targetCount,
        reminderTime: plan.reminderTime,
        reminderEnabled: plan.reminderEnabled,
        status: plan.status,
        createdAt: plan.createdAt,
        updatedAt: plan.updatedAt
      })),
      records: records.map(record => ({
        id: record.id,
        planId: record.planId,
        userId: record.userId,
        content: record.content,
        images: record.images,
        checkInDate: record.checkInDate,
        checkInTime: record.checkInTime,
        isLate: record.isLate,
        createdAt: record.createdAt,
        updatedAt: record.updatedAt
      }))
    }

    const content = JSON.stringify(exportData, null, 2)
    const filename = `打卡数据备份_${formatTimestamp(new Date())}.json`

    const blob = new Blob([content], { type: 'application/json;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = filename
    link.click()
    URL.revokeObjectURL(url)

    ElMessage.success('导出成功')
  } catch (error) {
    console.error('Export error:', error)
    ElMessage.error('导出失败，请稍后重试')
  }
}

const validateImportData = (data) => {
  const errors = []

  if (!data) {
    errors.push('数据为空')
    return errors
  }

  if (!data.version) {
    errors.push('缺少version字段')
  }

  if (data.version && !['1.0'].includes(data.version)) {
    errors.push(`不支持的数据版本: ${data.version}`)
  }

  if (!data.plans || !Array.isArray(data.plans)) {
    errors.push('plans字段缺失或格式错误')
  } else {
    data.plans.forEach((plan, index) => {
      if (!plan.id) errors.push(`计划[${index + 1}]: 缺少id`)
      if (!plan.name) errors.push(`计划[${index + 1}]: 缺少name`)
      if (!plan.frequency) errors.push(`计划[${index + 1}]: 缺少frequency`)
    })
  }

  if (!data.records || !Array.isArray(data.records)) {
    errors.push('records字段缺失或格式错误')
  } else {
    data.records.forEach((record, index) => {
      if (!record.id) errors.push(`记录[${index + 1}]: 缺少id`)
      if (!record.planId) errors.push(`记录[${index + 1}]: 缺少planId`)
    })
  }

  if (!data.tags || !Array.isArray(data.tags)) {
    errors.push('tags字段缺失或格式错误')
  }

  return errors
}

const handleFileChange = (file) => {
  uploadFile.value = file.raw
}

const handleFileRemove = () => {
  uploadFile.value = null
}

const handleImport = () => {
  if (!uploadFile.value) {
    ElMessage.warning('请先选择文件')
    return
  }

  const reader = new FileReader()
  reader.onload = (e) => {
    try {
      const data = JSON.parse(e.target.result)
      const errors = validateImportData(data)

      if (errors.length > 0) {
        ElMessage.error({
          message: `数据校验失败:\n${errors.slice(0, 5).join('\n')}${errors.length > 5 ? '\n...' : ''}`,
          duration: 5000
        })
        return
      }

      importPreview.value = data
      previewDialogVisible.value = true
    } catch (error) {
      ElMessage.error('文件格式错误，请选择正确的JSON备份文件')
    }
  }
  reader.readAsText(uploadFile.value)
}

const confirmImport = () => {
  previewDialogVisible.value = false
  finalConfirmVisible.value = true
}

const executeImport = async () => {
  try {
    finalConfirmVisible.value = false
    const userId = authStore.userId

    if (!userId) {
      ElMessage.error('用户未登录')
      return
    }

    if (!importPreview.value) {
      ElMessage.error('导入数据无效')
      return
    }

    let plansImported = 0
    let recordsImported = 0
    let tagsImported = 0

    if (importMode.value === 'full') {
      await PlanDAL.deleteByUserId(userId)
      await RecordDAL.deleteByUserId(userId)
      await TagDAL.deleteByUserId(userId)

      planStore.clearPlans()
      recordStore.clearRecords()
      tagStore.clearTags()
    }

    if (importPreview.value.tags && Array.isArray(importPreview.value.tags)) {
      const existingTagIds = tagStore.tags.map(t => t.id)
      for (const tag of importPreview.value.tags) {
        if (importMode.value === 'partial' && existingTagIds.includes(tag.id)) {
          continue
        }
        await TagDAL.create({
          id: tag.id,
          userId: userId,
          name: tag.name,
          icon: tag.icon,
          color: tag.color,
          isDefault: tag.isDefault,
          createdAt: new Date(tag.createdAt)
        })
        tagsImported++
      }
    }

    if (importPreview.value.plans && Array.isArray(importPreview.value.plans)) {
      const existingPlanIds = planStore.plans.map(p => p.id)
      for (const plan of importPreview.value.plans) {
        if (importMode.value === 'partial' && existingPlanIds.includes(plan.id)) {
          continue
        }
        await PlanDAL.create({
          id: plan.id,
          userId: userId,
          name: plan.name,
          description: plan.description,
          tagIds: plan.tagIds || [],
          frequency: plan.frequency,
          customRules: plan.customRules,
          startDate: new Date(plan.startDate),
          endDate: plan.endDate ? new Date(plan.endDate) : undefined,
          targetCount: plan.targetCount,
          reminderTime: plan.reminderTime,
          reminderEnabled: plan.reminderEnabled,
          status: plan.status,
          createdAt: new Date(plan.createdAt),
          updatedAt: new Date(plan.updatedAt)
        })
        plansImported++
      }
    }

    if (importPreview.value.records && Array.isArray(importPreview.value.records)) {
      const existingRecordIds = recordStore.records.map(r => r.id)
      for (const record of importPreview.value.records) {
        if (importMode.value === 'partial' && existingRecordIds.includes(record.id)) {
          continue
        }
        await RecordDAL.create({
          id: record.id,
          planId: record.planId,
          userId: userId,
          content: record.content,
          images: record.images || [],
          checkInDate: new Date(record.checkInDate),
          checkInTime: new Date(record.checkInTime),
          isLate: record.isLate,
          createdAt: new Date(record.createdAt),
          updatedAt: new Date(record.updatedAt)
        })
        recordsImported++
      }
    }

    if (importPreview.value.user?.settings && importMode.value === 'full') {
      await authStore.updateSettings(importPreview.value.user.settings)
    }

    await planStore.loadPlans()
    await recordStore.loadRecords()
    await tagStore.loadTags()

    loadData()

    importResult.success = true
    importResult.message = ''
    importResult.plansImported = plansImported
    importResult.recordsImported = recordsImported
    importResult.tagsImported = tagsImported

    uploadFile.value = null
    if (uploadRef.value) {
      uploadRef.value.clearFiles()
    }

    ElMessage.success('导入成功')
    resultDialogVisible.value = true
  } catch (error) {
    console.error('Import error:', error)
    importResult.success = false
    importResult.message = '导入过程中发生错误，请稍后重试'
    importResult.plansImported = 0
    importResult.recordsImported = 0
    importResult.tagsImported = 0
    resultDialogVisible.value = true
  }
}

const loadData = async () => {
  const userId = authStore.userId
  if (userId) {
    const user = authStore.user
    if (user) {
      userInfo.username = user.username
      userInfo.createdAt = user.createdAt
    }

    await planStore.loadPlans()
    await recordStore.loadRecords()
    await tagStore.loadTags()

    stats.planCount = planStore.planCount
    stats.recordCount = recordStore.recordCount
    stats.tagCount = tagStore.tagCount
  }
}

onMounted(() => {
  loadData()
})
</script>

<style lang="scss" scoped>
.export-container {
  max-width: 1000px;
  margin: 0 auto;
}

.page-header {
  margin-bottom: var(--spacing-xl);
}

.page-title {
  font-size: 28px;
  font-weight: bold;
  margin: 0;
}

.card-title {
  font-size: 16px;
  font-weight: 600;
  margin-bottom: var(--spacing-sm);
  color: var(--text-primary);
}

.card-description {
  font-size: 14px;
  color: var(--text-secondary);
  margin-bottom: var(--spacing-lg);
}

.export-options {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-md);
}

.export-item {
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
  padding: var(--spacing-lg);
  background: var(--bg-page);
  border-radius: var(--radius-medium);
  cursor: pointer;
  transition: all 0.3s ease;

  &:hover {
    background: var(--bg-hover);
    transform: translateX(4px);
  }
}

.export-icon {
  width: 56px;
  height: 56px;
  border-radius: var(--radius-medium);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.export-info {
  flex: 1;

  h4 {
    margin: 0 0 var(--spacing-xs);
    font-size: 16px;
    font-weight: 600;
    color: var(--text-primary);
  }

  p {
    margin: 0;
    font-size: 12px;
    color: var(--text-secondary);
  }
}

.export-stats {
  margin-top: var(--spacing-lg);
}

.import-preview {
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
  padding: var(--spacing-md);
  background: var(--bg-page);
  border-radius: var(--radius-medium);
  margin-top: var(--spacing-lg);

  .file-name {
    flex: 1;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
}

.data-stats {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: var(--spacing-md);
}

.stat-item {
  padding: var(--spacing-md);
  background: var(--bg-page);
  border-radius: var(--radius-medium);
}

.stat-label {
  display: block;
  font-size: 12px;
  color: var(--text-secondary);
  margin-bottom: var(--spacing-xs);
}

.stat-value {
  display: block;
  font-size: 16px;
  font-weight: 600;
  color: var(--text-primary);
}

.preview-content {
  .mb-md {
    margin-bottom: var(--spacing-md);
  }

  .mt-md {
    margin-top: var(--spacing-md);
  }
}

.import-mode-group {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-md);

  :deep(.el-radio) {
    margin-right: 0;
    padding: var(--spacing-md);
    border: 1px solid var(--border-color);
    border-radius: var(--radius-medium);
    transition: all 0.3s;

    &:hover {
      border-color: var(--primary-color);
    }

    &.is-checked {
      border-color: var(--primary-color);
      background: var(--primary-color-light);
    }
  }
}

.radio-label {
  display: flex;
  flex-direction: column;
  align-items: flex-start;

  strong {
    font-size: 14px;
    margin-bottom: var(--spacing-xs);
  }

  .radio-desc {
    font-size: 12px;
    color: var(--text-secondary);
  }
}

.final-confirm {
  .confirm-list {
    margin: var(--spacing-md) 0;
    padding-left: var(--spacing-lg);

    li {
      line-height: 1.8;
      color: var(--text-secondary);
    }
  }

  .confirm-warning {
    color: var(--danger-color);
    font-weight: 500;
    margin-top: var(--spacing-md);
  }
}

.result-content {
  padding: var(--spacing-md);
}
</style>
