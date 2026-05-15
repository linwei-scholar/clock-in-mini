<template>
  <div class="tags-container">
    <div class="page-header">
      <h1 class="page-title">标签管理</h1>
      <el-button type="primary" @click="handleCreate">
        <el-icon><Plus /></el-icon>
        新建标签
      </el-button>
    </div>

    <div v-if="tagStore.userTags.length > 0" class="tags-grid">
      <el-card
        v-for="tag in tagStore.userTags"
        :key="tag.id"
        class="tag-card"
        shadow="hover"
      >
        <div class="tag-header">
          <div class="tag-icon" :style="{ background: tag.color }">
            <el-icon><component :is="getIconComponent(tag.icon)" /></el-icon>
          </div>
          <el-dropdown trigger="click" @command="handleCommand($event, tag)">
            <el-icon :size="20" class="more-icon"><MoreFilled /></el-icon>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item command="edit">
                  <el-icon><Edit /></el-icon>
                  编辑
                </el-dropdown-item>
                <el-dropdown-item command="delete" divided>
                  <el-icon><Delete /></el-icon>
                  删除
                </el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </div>

        <div class="tag-body">
          <h3 class="tag-name">{{ tag.name }}</h3>
          <div class="tag-stats">
            <span>{{ getTagPlanCount(tag.id) }} 个计划</span>
          </div>
          <div class="tag-indicator" :style="{ background: tag.color }"></div>
        </div>
      </el-card>
    </div>

    <el-empty v-else description="暂无标签">
      <el-button type="primary" @click="handleCreate">创建第一个标签</el-button>
    </el-empty>

    <el-dialog
      v-model="dialogVisible"
      :title="isEdit ? '编辑标签' : '新建标签'"
      width="520px"
      @closed="handleDialogClosed"
    >
      <el-form
        ref="formRef"
        :model="form"
        :rules="rules"
        label-width="80px"
        status-icon
      >
        <el-form-item label="标签名称" prop="name">
          <el-input
            v-model="form.name"
            placeholder="请输入标签名称（2-10个字符）"
            maxlength="10"
            show-word-limit
            clearable
          />
        </el-form-item>

        <el-form-item label="标签图标" prop="icon">
          <div class="icon-selector">
            <div class="icon-preview" :style="{ background: form.color }">
              <el-icon><component :is="getIconComponent(form.icon)" /></el-icon>
            </div>
            <el-select
              v-model="form.icon"
              placeholder="请选择图标"
              style="width: 100%"
              @change="handleIconChange"
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
          </div>
        </el-form-item>

        <el-form-item label="标签颜色" prop="color">
          <div class="color-selector">
            <el-color-picker v-model="form.color" />
            <div class="color-presets">
              <div
                v-for="color in colorPresets"
                :key="color"
                class="color-preset"
                :style="{ background: color }"
                :class="{ active: form.color === color }"
                @click="form.color = color"
              />
            </div>
          </div>
        </el-form-item>

        <el-form-item label="预览">
          <div class="tag-preview">
            <div class="preview-icon" :style="{ background: form.color }">
              <el-icon><component :is="getIconComponent(form.icon)" /></el-icon>
            </div>
            <span class="preview-name">{{ form.name || '标签名称' }}</span>
          </div>
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSubmit" :loading="submitLoading">
          {{ isEdit ? '保存' : '创建' }}
        </el-button>
      </template>
    </el-dialog>

    <el-dialog
      v-model="deleteDialogVisible"
      title="删除标签"
      width="450px"
    >
      <div class="delete-content">
        <el-alert
          :title="'确定要删除标签' + deletingTag?.name + '吗？'"
          type="warning"
          :closable="false"
          show-icon
        />
        
        <template v-if="relatedPlans.length > 0">
          <div class="related-info">
            <p class="related-title">该标签关联了以下 {{ relatedPlans.length }} 个计划：</p>
            <ul class="related-list">
              <li v-for="plan in relatedPlans.slice(0, 5)" :key="plan.id">
                {{ plan.name }}
              </li>
              <li v-if="relatedPlans.length > 5" class="more">
                还有 {{ relatedPlans.length - 5 }} 个计划...
              </li>
            </ul>
          </div>

          <el-form label-width="100px" class="delete-options">
            <el-form-item label="关联计划处理">
              <el-radio-group v-model="deleteAction">
                <el-radio label="remove">移除该标签</el-radio>
                <el-radio label="clear" v-if="tagStore.userTags.length > 1">
                  设为无标签
                </el-radio>
              </el-radio-group>
            </el-form-item>
          </el-form>
        </template>
        <template v-else>
          <p class="no-related">该标签未关联任何计划，可以安全删除。</p>
        </template>
      </div>

      <template #footer>
        <el-button @click="deleteDialogVisible = false">取消</el-button>
        <el-button type="danger" @click="confirmDelete" :loading="deleteLoading">
          确认删除
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, computed } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  Plus,
  MoreFilled,
  Edit,
  Delete,
  Running,
  Food,
  Books,
  Star,
  Briefcase,
  Heart,
  Check,
  Coffee,
  SetUp,
  DataLine,
  Bell,
  Medal,
  Present,
  Promotion,
  Grid,
  Folder,
  Guide,
  Monitor,
  Reading,
  Shoot
} from '@element-plus/icons-vue'
import { useTagStore } from '@/stores/tagStore'
import { usePlanStore } from '@/stores/planStore'

const tagStore = useTagStore()
const planStore = usePlanStore()

const dialogVisible = ref(false)
const deleteDialogVisible = ref(false)
const isEdit = ref(false)
const editingTag = ref(null)
const deletingTag = ref(null)
const formRef = ref(null)
const submitLoading = ref(false)
const deleteLoading = ref(false)
const relatedPlans = ref([])
const deleteAction = ref('remove')

const form = reactive({
  name: '',
  icon: 'Star',
  color: '#409EFF'
})

const rules = {
  name: [
    { required: true, message: '请输入标签名称', trigger: 'blur' },
    { min: 2, max: 10, message: '标签名称需为2-10个字符', trigger: 'blur' }
  ]
}

const iconOptions = [
  { label: '运动', value: 'Running' },
  { label: '饮食', value: 'Food' },
  { label: '阅读', value: 'Books' },
  { label: '习惯', value: 'Star' },
  { label: '工作', value: 'Briefcase' },
  { label: '爱好', value: 'Heart' },
  { label: '完成', value: 'Check' },
  { label: '咖啡', value: 'Coffee' },
  { label: '设置', value: 'SetUp' },
  { label: '图表', value: 'DataLine' },
  { label: '提醒', value: 'Bell' },
  { label: '奖章', value: 'Medal' },
  { label: '礼物', value: 'Present' },
  { label: '推广', value: 'Promotion' },
  { label: '网格', value: 'Grid' },
  { label: '文件夹', value: 'Folder' },
  { label: '指南', value: 'Guide' },
  { label: '显示器', value: 'Monitor' },
  { label: '学习', value: 'Reading' }
]

const colorPresets = [
  '#409EFF',
  '#67C23A',
  '#E6A23C',
  '#909399',
  '#F56C6C',
  '#9B59B6',
  '#00BCD4',
  '#FF5722'
]

const getIconComponent = (iconName) => {
  return iconName || 'Star'
}

const getTagPlanCount = (tagId) => {
  return planStore.plans.filter(plan => plan.tagIds?.includes(tagId)).length
}

const handleIconChange = (icon) => {
  form.icon = icon
}

const handleCreate = () => {
  isEdit.value = false
  editingTag.value = null
  form.name = ''
  form.icon = 'Star'
  form.color = '#409EFF'
  dialogVisible.value = true
}

const handleEdit = (tag) => {
  isEdit.value = true
  editingTag.value = tag
  form.name = tag.name
  form.icon = tag.icon
  form.color = tag.color
  dialogVisible.value = true
}

const handleDelete = async (tag) => {
  deletingTag.value = tag
  relatedPlans.value = planStore.plans.filter(plan => 
    plan.tagIds?.includes(tag.id)
  )
  deleteAction.value = 'remove'
  deleteDialogVisible.value = true
}

const confirmDelete = async () => {
  if (!deletingTag.value) return

  deleteLoading.value = true
  try {
    for (const plan of relatedPlans.value) {
      if (deleteAction.value === 'remove') {
        plan.tagIds = plan.tagIds.filter(id => id !== deletingTag.value.id)
        await planStore.updatePlan(plan.id, { tagIds: plan.tagIds })
      } else if (deleteAction.value === 'clear') {
        plan.tagIds = []
        await planStore.updatePlan(plan.id, { tagIds: [] })
      }
    }

    const success = await tagStore.deleteTag(deletingTag.value.id)
    if (success) {
      ElMessage.success('标签删除成功')
      deleteDialogVisible.value = false
    }
  } catch (error) {
    ElMessage.error('删除标签失败')
    console.error('Delete tag error:', error)
  } finally {
    deleteLoading.value = false
  }
}

const handleCommand = (command, tag) => {
  switch (command) {
    case 'edit':
      handleEdit(tag)
      break
    case 'delete':
      handleDelete(tag)
      break
  }
}

const handleSubmit = async () => {
  if (!formRef.value) return

  submitLoading.value = true
  try {
    await formRef.value.validate()

    const existingTag = tagStore.userTags.find(
      t => t.name === form.name && t.id !== editingTag.value?.id
    )
    if (existingTag) {
      ElMessage.error('标签名称已存在')
      return
    }

    if (isEdit.value && editingTag.value) {
      const success = await tagStore.updateTag(editingTag.value.id, {
        name: form.name,
        icon: form.icon,
        color: form.color
      })

      if (success) {
        ElMessage.success('修改成功')
        dialogVisible.value = false
      }
    } else {
      const newTag = await tagStore.createTag({
        name: form.name,
        icon: form.icon,
        color: form.color
      })

      if (newTag) {
        ElMessage.success('创建成功')
        dialogVisible.value = false
      }
    }
  } catch (error) {
    console.error('Submit error:', error)
  } finally {
    submitLoading.value = false
  }
}

const handleDialogClosed = () => {
  if (formRef.value) {
    formRef.value.resetFields()
  }
  tagStore.clearError()
}

onMounted(async () => {
  await Promise.all([
    tagStore.loadTags(),
    planStore.loadPlans()
  ])
})
</script>

<style lang="scss" scoped>
.tags-container {
  max-width: 1200px;
  margin: 0 auto;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--spacing-xl);
}

.page-title {
  font-size: 28px;
  font-weight: bold;
  margin: 0;
}

.tags-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
  gap: var(--spacing-lg);
}

.tag-card {
  cursor: pointer;
  transition: all 0.3s ease;

  &:hover {
    transform: translateY(-4px);
  }
}

.tag-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--spacing-md);
}

.tag-icon {
  width: 52px;
  height: 52px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 26px;
}

.more-icon {
  cursor: pointer;
  color: var(--text-secondary);
  transition: color 0.3s;

  &:hover {
    color: var(--text-primary);
  }
}

.tag-body {
  padding: 0 var(--spacing-xs);
}

.tag-name {
  font-size: 18px;
  font-weight: 600;
  margin: 0 0 var(--spacing-xs);
  color: var(--text-primary);
}

.tag-stats {
  font-size: 13px;
  color: var(--text-secondary);
  margin-bottom: var(--spacing-md);
}

.tag-indicator {
  height: 4px;
  border-radius: 2px;
}

.icon-option {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
}

.icon-selector {
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
  width: 100%;
}

.icon-preview {
  width: 48px;
  height: 48px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 24px;
  flex-shrink: 0;
}

.color-selector {
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
}

.color-presets {
  display: flex;
  gap: var(--spacing-sm);
  flex-wrap: wrap;
}

.color-preset {
  width: 32px;
  height: 32px;
  border-radius: 6px;
  cursor: pointer;
  border: 2px solid transparent;
  transition: all 0.2s;

  &:hover {
    transform: scale(1.1);
  }

  &.active {
    border-color: var(--text-primary);
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
  }
}

.tag-preview {
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
  padding: var(--spacing-sm) var(--spacing-md);
  background: var(--bg-page);
  border-radius: var(--radius-small);
}

.preview-icon {
  width: 40px;
  height: 40px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 20px;
}

.preview-name {
  font-weight: 500;
  color: var(--text-primary);
}

.delete-content {
  .el-alert {
    margin-bottom: var(--spacing-lg);
  }
}

.related-info {
  margin-top: var(--spacing-lg);
  padding: var(--spacing-md);
  background: var(--bg-page);
  border-radius: var(--radius-small);
}

.related-title {
  font-weight: 500;
  margin: 0 0 var(--spacing-sm);
  color: var(--text-primary);
}

.related-list {
  margin: 0;
  padding-left: 20px;
  
  li {
    margin: var(--spacing-xs) 0;
    color: var(--text-secondary);
    
    &.more {
      font-style: italic;
      color: var(--text-placeholder);
    }
  }
}

.no-related {
  margin-top: var(--spacing-lg);
  color: var(--text-secondary);
  text-align: center;
}

.delete-options {
  margin-top: var(--spacing-lg);
}
</style>
