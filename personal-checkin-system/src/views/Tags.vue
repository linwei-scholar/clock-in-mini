<template>
  <ResponsiveLayout>
    <div class="tags-container">
      <el-card>
        <template #header>
          <div class="card-header">
            <span class="card-title">标签管理</span>
            <el-button type="primary" size="small" @click="showDialog('create')" class="touch-button">
              <el-icon><Plus /></el-icon>
              <span class="hidden-xs-only">新建标签</span>
            </el-button>
          </div>
        </template>

        <el-row :gutter="20">
          <el-col
            v-for="tag in tagStore.tags"
            :key="tag.id"
            :xs="24"
            :sm="12"
            :md="8"
            :lg="6"
          >
            <el-card class="tag-card" shadow="hover">
              <div class="tag-content">
                <div class="tag-icon" :style="{ backgroundColor: tag.color }">
                  <el-icon><component :is="tag.icon" /></el-icon>
                </div>
                <div class="tag-info">
                  <h3 class="tag-name">{{ tag.name }}</h3>
                  <div class="tag-meta">
                    <el-tag v-if="tag.isDefault" size="small" type="info">
                      默认标签
                    </el-tag>
                    <span class="plan-count">
                      {{ getPlanCount(tag.id) }} 个计划
                    </span>
                  </div>
                </div>
              </div>
              <div class="tag-actions">
                <el-button size="small" class="touch-button" @click="showDialog('edit', tag)">
                  编辑
                </el-button>
                <el-button
                  size="small"
                  type="danger"
                  class="touch-button"
                  @click="handleDelete(tag)"
                  :disabled="tag.isDefault"
                >
                  删除
                </el-button>
              </div>
            </el-card>
          </el-col>
        </el-row>

        <el-empty
          v-if="tagStore.tags.length === 0"
          description="暂无标签"
        />
      </el-card>

      <el-dialog
        v-model="dialogVisible"
        :title="dialogType === 'create' ? '新建标签' : '编辑标签'"
        width="90%"
        class="mobile-dialog"
      >
        <el-form :model="form" :rules="rules" ref="formRef" label-position="top">
          <el-form-item label="标签名称" prop="name">
            <el-input
              v-model="form.name"
              placeholder="请输入标签名称（2-10个字符）"
              maxlength="10"
            />
          </el-form-item>

          <el-form-item label="选择图标" prop="icon">
            <el-select
              v-model="form.icon"
              placeholder="请选择图标"
              style="width: 100%"
            >
              <el-option
                v-for="icon in iconOptions"
                :key="icon.value"
                :label="icon.label"
                :value="icon.value"
              >
                <div class="icon-option">
                  <el-icon><component :is="icon.value" /></el-icon>
                  <span>{{ icon.label }}</span>
                </div>
              </el-option>
            </el-select>
          </el-form-item>

          <el-form-item label="选择颜色" prop="color">
            <el-color-picker v-model="form.color" />
          </el-form-item>
        </el-form>

        <template #footer>
          <el-button @click="dialogVisible = false" class="touch-button">取消</el-button>
          <el-button type="primary" @click="handleSubmit" class="touch-button">
            确定
          </el-button>
        </template>
      </el-dialog>
    </div>
  </ResponsiveLayout>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus } from '@element-plus/icons-vue'
import { useTagStore } from '@/stores/tagStore'
import { usePlanStore } from '@/stores/planStore'
import { useAuthStore } from '@/stores/authStore'
import ResponsiveLayout from '@/components/ResponsiveLayout.vue'

const tagStore = useTagStore()
const planStore = usePlanStore()
const authStore = useAuthStore()

const dialogVisible = ref(false)
const dialogType = ref('create')
const editingTag = ref(null)
const formRef = ref(null)

const form = reactive({
  name: '',
  icon: 'PriceTag',
  color: '#409EFF'
})

const iconOptions = [
  { label: '价格标签', value: 'PriceTag' },
  { label: '跑步', value: 'Running' },
  { label: '食物', value: 'Food' },
  { label: '阅读', value: 'Reading' },
  { label: '星星', value: 'Star' },
  { label: '公文包', value: 'Briefcase' },
  { label: '心形', value: 'Heart' },
  { label: '音乐', value: 'Headphones' },
  { label: '相机', value: 'Camera' },
  { label: '画笔', value: 'Brush' }
]

const rules = {
  name: [
    { required: true, message: '请输入标签名称', trigger: 'blur' },
    { min: 2, max: 10, message: '标签名称应在2-10个字符之间', trigger: 'blur' }
  ],
  icon: [
    { required: true, message: '请选择图标', trigger: 'change' }
  ]
}

const showDialog = (type, tag = null) => {
  dialogType.value = type

  if (type === 'edit' && tag) {
    editingTag.value = tag
    form.name = tag.name
    form.icon = tag.icon
    form.color = tag.color
  } else {
    editingTag.value = null
    form.name = ''
    form.icon = 'PriceTag'
    form.color = '#409EFF'
  }

  dialogVisible.value = true
}

const getPlanCount = (tagId) => {
  return planStore.plans.filter(plan =>
    plan.tagIds && plan.tagIds.includes(tagId)
  ).length
}

const handleSubmit = async () => {
  if (!formRef.value) return

  await formRef.value.validate(async (valid) => {
    if (valid) {
      const isDuplicate = tagStore.tags.some(
        tag => tag.name === form.name && tag.id !== editingTag.value?.id
      )

      if (isDuplicate) {
        ElMessage.error('标签名称已存在')
        return
      }

      if (dialogType.value === 'create') {
        const tag = {
          id: Date.now().toString(),
          userId: authStore.userInfo.id,
          name: form.name,
          icon: form.icon,
          color: form.color,
          isDefault: false,
          createdAt: new Date().toISOString()
        }

        tagStore.addTag(tag)
        ElMessage.success('标签创建成功')
      } else {
        tagStore.updateTag(editingTag.value.id, {
          name: form.name,
          icon: form.icon,
          color: form.color
        })
        ElMessage.success('标签更新成功')
      }

      dialogVisible.value = false
    }
  })
}

const handleDelete = (tag) => {
  if (tag.isDefault) {
    ElMessage.warning('默认标签不能删除')
    return
  }

  const planCount = getPlanCount(tag.id)

  ElMessageBox.confirm(
    planCount > 0
      ? `该标签关联了 ${planCount} 个计划，删除后这些计划将不再显示该标签。确定要删除吗？`
      : '确定要删除该标签吗？',
    '提示',
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    }
  ).then(() => {
    tagStore.deleteTag(tag.id)
    ElMessage.success('标签已删除')
  }).catch(() => {})
}
</script>

<style scoped>
.tags-container {
  width: 100%;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: var(--spacing-sm);
  flex-wrap: wrap;
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

.tag-card {
  margin-bottom: var(--spacing-md);
}

.tag-content {
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
  margin-bottom: var(--spacing-md);
}

.tag-icon {
  width: 50px;
  height: 50px;
  border-radius: var(--border-radius-md);
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 24px;
  flex-shrink: 0;
}

@media (min-width: 768px) {
  .tag-icon {
    width: 60px;
    height: 60px;
    font-size: 28px;
  }
}

.tag-info {
  flex: 1;
  min-width: 0;
}

.tag-name {
  margin: 0 0 var(--spacing-xs) 0;
  font-size: var(--font-size-sm);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

@media (min-width: 768px) {
  .tag-name {
    font-size: var(--font-size-md);
  }
}

.tag-meta {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  flex-wrap: wrap;
}

.plan-count {
  font-size: var(--font-size-xs);
  color: var(--text-secondary);
}

.tag-actions {
  display: flex;
  justify-content: flex-end;
  gap: var(--spacing-xs);
}

.icon-option {
  display: flex;
  align-items: center;
  gap: var(--spacing-xs);
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
