<template>
  <div class="record-edit-container">
    <div class="page-header">
      <el-button :icon="ArrowLeft" @click="handleBack">返回</el-button>
      <h1 class="page-title">编辑打卡记录</h1>
    </div>

    <div v-if="loading" class="loading-container">
      <el-icon class="is-loading"><Loading /></el-icon>
      <span>加载中...</span>
    </div>

    <div v-else-if="record" class="edit-content">
      <el-card class="edit-card">
        <template #header>
          <div class="card-header">
            <span class="card-title">打卡信息</span>
            <el-tag v-if="record.isLate" type="warning" size="small">迟到</el-tag>
          </div>
        </template>

        <div class="info-section">
          <div class="info-item">
            <span class="info-label">关联计划</span>
            <span class="info-value plan-link" @click="handleViewPlan">
              {{ planName }}
            </span>
          </div>
          <div class="info-item">
            <span class="info-label">打卡日期</span>
            <span class="info-value">{{ formatDate(record.checkInDate) }}</span>
          </div>
          <div class="info-item">
            <span class="info-label">打卡时间</span>
            <span class="info-value">{{ formatTime(record.checkInTime) }}</span>
          </div>
        </div>
      </el-card>

      <el-card class="edit-card mt-lg">
        <template #header>
          <div class="card-header">
            <span class="card-title">修改内容</span>
          </div>
        </template>

        <el-form
          ref="formRef"
          :model="formData"
          :rules="formRules"
          label-width="80px"
        >
          <el-form-item label="打卡内容" prop="content">
            <el-input
              v-model="formData.content"
              type="textarea"
              :rows="6"
              placeholder="请输入打卡内容..."
              maxlength="2000"
              show-word-limit
            />
          </el-form-item>

          <el-form-item label="打卡图片">
            <div class="image-upload-section">
              <div class="image-list">
                <div
                  v-for="(image, index) in formData.images"
                  :key="index"
                  class="image-item"
                >
                  <el-image
                    :src="image"
                    fit="cover"
                    class="preview-image"
                    :preview-src-list="formData.images"
                    :initial-index="index"
                    preview-teleported
                  />
                  <div class="image-actions">
                    <el-button
                      type="danger"
                      size="small"
                      circle
                      :icon="Delete"
                      @click="handleRemoveImage(index)"
                    />
                  </div>
                </div>

                <div class="upload-item" v-if="formData.images.length < 9">
                  <el-upload
                    ref="uploadRef"
                    class="image-uploader"
                    :show-file-list="false"
                    :before-upload="handleBeforeUpload"
                    :http-request="handleUpload"
                    accept="image/*"
                  >
                    <el-icon class="upload-icon"><Plus /></el-icon>
                    <span class="upload-text">添加图片</span>
                  </el-upload>
                </div>
              </div>
              <div class="upload-tip">
                最多上传9张图片，支持 JPG、PNG 格式
              </div>
            </div>
          </el-form-item>
        </el-form>

        <div class="form-actions">
          <el-button @click="handleBack">取消</el-button>
          <el-button type="primary" :loading="saving" @click="handleSave">
            保存修改
          </el-button>
        </div>
      </el-card>
    </div>

    <el-empty v-else description="打卡记录不存在" />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { ElMessage } from 'element-plus'
import { ArrowLeft, Loading, Delete, Plus } from '@element-plus/icons-vue'
import { usePlanStore } from '@/stores/planStore'
import { useRecordStore } from '@/stores/recordStore'
import { formatDate, formatTime } from '@/utils/timeFormat'

const router = useRouter()
const route = useRoute()
const planStore = usePlanStore()
const recordStore = useRecordStore()

const recordId = computed(() => route.params.id)
const record = ref(null)
const loading = ref(true)
const saving = ref(false)
const formRef = ref(null)
const uploadRef = ref(null)

const formData = ref({
  content: '',
  images: []
})

const formRules = {
  content: [
    { max: 2000, message: '内容不能超过2000字符', trigger: 'blur' }
  ]
}

const planName = computed(() => {
  if (!record.value) return ''
  const plan = planStore.getPlanById(record.value.planId)
  return plan ? plan.name : '未知计划'
})

const loadData = async () => {
  loading.value = true
  try {
    await planStore.loadPlans()
    await recordStore.loadRecords()
    
    record.value = recordStore.getRecordById(recordId.value)
    
    if (record.value) {
      formData.value = {
        content: record.value.content || '',
        images: [...(record.value.images || [])]
      }
    }
  } catch (error) {
    ElMessage.error('加载数据失败')
    console.error(error)
  } finally {
    loading.value = false
  }
}

const handleBack = () => {
  if (record.value) {
    router.push(`/plans/${record.value.planId}`)
  } else {
    router.back()
  }
}

const handleViewPlan = () => {
  if (record.value) {
    router.push(`/plans/${record.value.planId}`)
  }
}

const handleBeforeUpload = (file) => {
  const isImage = file.type.startsWith('image/')
  const isLt5M = file.size / 1024 / 1024 < 5

  if (!isImage) {
    ElMessage.error('只能上传图片文件')
    return false
  }
  
  if (!isLt5M) {
    ElMessage.error('图片大小不能超过 5MB')
    return false
  }
  
  return true
}

const handleUpload = async (options) => {
  const { file } = options
  
  try {
    const reader = new FileReader()
    reader.onload = (e) => {
      formData.value.images.push(e.target.result)
      ElMessage.success('图片上传成功')
    }
    reader.readAsDataURL(file)
  } catch (error) {
    ElMessage.error('图片上传失败')
    console.error(error)
  }
}

const handleRemoveImage = (index) => {
  formData.value.images.splice(index, 1)
}

const handleSave = async () => {
  try {
    await formRef.value.validate()
    
    saving.value = true
    
    const success = await recordStore.updateRecord(recordId.value, {
      content: formData.value.content,
      images: formData.value.images
    })
    
    if (success) {
      ElMessage.success('保存成功')
      handleBack()
    } else {
      ElMessage.error(recordStore.error || '保存失败')
    }
  } catch (error) {
    if (error !== false) {
      ElMessage.error('表单验证失败')
    }
  } finally {
    saving.value = false
  }
}

onMounted(() => {
  loadData()
})
</script>

<style lang="scss" scoped>
.record-edit-container {
  max-width: 800px;
  margin: 0 auto;
  padding: var(--spacing-lg);
}

.page-header {
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
  margin-bottom: var(--spacing-xl);
  padding: var(--spacing-md);
  background: white;
  border-radius: var(--radius-medium);
  box-shadow: var(--shadow-light);

  .page-title {
    flex: 1;
    font-size: 24px;
    font-weight: bold;
    margin: 0;
    color: var(--text-primary);
  }
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

.edit-card {
  .card-header {
    display: flex;
    align-items: center;
    justify-content: space-between;

    .card-title {
      font-size: 16px;
      font-weight: 600;
      color: var(--text-primary);
    }
  }
}

.info-section {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: var(--spacing-lg);
}

.info-item {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xs);
}

.info-label {
  font-size: 12px;
  color: var(--text-secondary);
}

.info-value {
  font-size: 14px;
  color: var(--text-primary);

  &.plan-link {
    color: var(--color-primary);
    cursor: pointer;
    font-weight: 500;

    &:hover {
      text-decoration: underline;
    }
  }
}

.image-upload-section {
  width: 100%;
}

.image-list {
  display: flex;
  flex-wrap: wrap;
  gap: var(--spacing-md);
}

.image-item {
  position: relative;
  width: 150px;
  height: 150px;
  border-radius: var(--radius-small);
  overflow: hidden;
  box-shadow: var(--shadow-light);

  .preview-image {
    width: 100%;
    height: 100%;
  }

  .image-actions {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    opacity: 0;
    transition: opacity 0.3s;

    .el-button {
      background: rgba(0, 0, 0, 0.6);
      border: none;
    }
  }

  &:hover .image-actions {
    opacity: 1;
  }
}

.upload-item {
  width: 150px;
  height: 150px;
}

.image-uploader {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  border: 2px dashed var(--border-color);
  border-radius: var(--radius-small);
  cursor: pointer;
  transition: all 0.3s;

  &:hover {
    border-color: var(--color-primary);
    background: var(--bg-page);
  }

  .upload-icon {
    font-size: 32px;
    color: var(--text-secondary);
    margin-bottom: var(--spacing-sm);
  }

  .upload-text {
    font-size: 12px;
    color: var(--text-secondary);
  }
}

.upload-tip {
  margin-top: var(--spacing-md);
  font-size: 12px;
  color: var(--text-secondary);
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: var(--spacing-sm);
  margin-top: var(--spacing-xl);
  padding-top: var(--spacing-lg);
  border-top: 1px solid var(--border-color);
}

.mt-lg {
  margin-top: var(--spacing-lg);
}

@media (max-width: 768px) {
  .record-edit-container {
    padding: var(--spacing-sm);
  }

  .page-header {
    flex-wrap: wrap;

    .page-title {
      font-size: 18px;
      order: -1;
      width: 100%;
      margin-bottom: var(--spacing-sm);
    }
  }

  .info-section {
    grid-template-columns: repeat(2, 1fr);
  }

  .image-item,
  .upload-item {
    width: 100px;
    height: 100px;
  }
}
</style>
