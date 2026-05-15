<template>
  <div class="plan-form-container">
    <div class="page-header">
      <el-button :icon="ArrowLeft" @click="router.push('/plans')">返回</el-button>
      <h1 class="page-title">{{ isEdit ? '编辑计划' : '创建计划' }}</h1>
    </div>

    <div class="form-content">
      <el-form
        ref="formRef"
        :model="form"
        :rules="rules"
        label-width="120px"
        class="plan-form"
      >
        <el-form-item label="计划名称" prop="name">
          <el-input v-model="form.name" placeholder="请输入计划名称" maxlength="30" show-word-limit />
        </el-form-item>

        <el-form-item label="计划描述" prop="description">
          <el-input
            v-model="form.description"
            type="textarea"
            placeholder="请输入计划描述（可选）"
            :rows="3"
            maxlength="200"
            show-word-limit
          />
        </el-form-item>

        <el-form-item label="关联标签" prop="tagIds">
          <div class="tag-selection">
            <el-select
              v-model="form.tagIds"
              multiple
              placeholder="请选择标签（最多3个）"
              style="width: 100%"
              :max-collapse-tags="3"
              @change="handleTagChange"
            >
              <el-option
                v-for="tag in tagStore.userTags"
                :key="tag.id"
                :label="tag.name"
                :value="tag.id"
                :disabled="isTagDisabled(tag.id)"
              >
                <div class="tag-option">
                  <span class="tag-color" :style="{ background: tag.color }"></span>
                  <span>{{ tag.name }}</span>
                  <el-icon v-if="form.tagIds.includes(tag.id)" class="tag-check"><Check /></el-icon>
                </div>
              </el-option>
            </el-select>
            <div class="tag-hint">
              已选择 {{ form.tagIds.length }}/3 个标签
            </div>
          </div>
        </el-form-item>

        <el-form-item label="打卡频率" prop="frequency">
          <el-radio-group v-model="form.frequency" @change="handleFrequencyChange">
            <el-radio label="daily">每日</el-radio>
            <el-radio label="weekly">每周</el-radio>
            <el-radio label="workdays">工作日</el-radio>
            <el-radio label="weekends">周末</el-radio>
            <el-radio label="custom">自定义</el-radio>
          </el-radio-group>
        </el-form-item>

        <el-form-item v-if="form.frequency === 'weekly'" label="选择周几" prop="customDays">
          <el-checkbox-group v-model="form.customDays">
            <el-checkbox :label="1">周一</el-checkbox>
            <el-checkbox :label="2">周二</el-checkbox>
            <el-checkbox :label="3">周三</el-checkbox>
            <el-checkbox :label="4">周四</el-checkbox>
            <el-checkbox :label="5">周五</el-checkbox>
            <el-checkbox :label="6">周六</el-checkbox>
            <el-checkbox :label="0">周日</el-checkbox>
          </el-checkbox-group>
        </el-form-item>

        <el-form-item v-if="form.frequency === 'custom'" label="间隔天数" prop="intervalDays">
          <el-input-number v-model="form.intervalDays" :min="1" :max="365" />
          <span class="form-tip">每隔 {{ form.intervalDays }} 天打卡一次</span>
        </el-form-item>

        <el-form-item label="开始日期" prop="startDate">
          <el-date-picker
            v-model="form.startDate"
            type="date"
            placeholder="选择开始日期"
            style="width: 100%"
          />
        </el-form-item>

        <el-form-item label="结束日期" prop="endDate">
          <el-date-picker
            v-model="form.endDate"
            type="date"
            placeholder="选择结束日期（可选，留空表示永久有效）"
            style="width: 100%"
            :disabled-date="disabledEndDate"
          />
        </el-form-item>

        <el-form-item label="目标次数" prop="targetCount">
          <el-input-number v-model="form.targetCount" :min="0" placeholder="目标打卡次数" />
          <span class="form-tip">留空或0表示不限制</span>
        </el-form-item>

        <el-form-item label="提醒设置">
          <el-switch v-model="form.reminderEnabled" />
        </el-form-item>

        <el-form-item v-if="form.reminderEnabled" label="提醒时间" prop="reminderTime">
          <el-time-picker
            v-model="form.reminderTime"
            placeholder="选择提醒时间"
            style="width: 100%"
          />
        </el-form-item>

        <el-form-item>
          <el-button type="primary" :loading="loading" @click="handleSubmit">
            {{ isEdit ? '保存修改' : '创建计划' }}
          </el-button>
          <el-button @click="router.push('/plans')">取消</el-button>
        </el-form-item>
      </el-form>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { ArrowLeft, Check } from '@element-plus/icons-vue'
import { useTagStore } from '@/stores/tagStore'
import { usePlanStore } from '@/stores/planStore'

const router = useRouter()
const route = useRoute()
const formRef = ref(null)
const loading = ref(false)
const tagStore = useTagStore()
const planStore = usePlanStore()

const isEdit = computed(() => !!route.params.id)

const form = reactive({
  name: '',
  description: '',
  tagIds: [],
  frequency: 'daily',
  customDays: [],
  intervalDays: 3,
  startDate: new Date(),
  endDate: null,
  targetCount: 0,
  reminderEnabled: false,
  reminderTime: null
})

const rules = {
  name: [
    { required: true, message: '请输入计划名称', trigger: 'blur' },
    { min: 4, max: 30, message: '计划名称需为4-30个字符', trigger: 'blur' }
  ],
  description: [
    { max: 200, message: '计划描述不能超过200个字符', trigger: 'blur' }
  ],
  frequency: [
    { required: true, message: '请选择打卡频率', trigger: 'change' }
  ],
  startDate: [
    { required: true, message: '请选择开始日期', trigger: 'change' }
  ],
  customDays: [
    {
      validator: (rule, value, callback) => {
        if (form.frequency === 'weekly' && form.customDays.length === 0) {
          callback(new Error('请选择至少一天'))
        } else {
          callback()
        }
      },
      trigger: 'change'
    }
  ],
  reminderTime: [
    {
      validator: (rule, value, callback) => {
        if (form.reminderEnabled && !form.reminderTime) {
          callback(new Error('请选择提醒时间'))
        } else {
          callback()
        }
      },
      trigger: 'change'
    }
  ]
}

const frequencyLabels = {
  daily: '每日',
  weekly: '每周',
  workdays: '工作日',
  weekends: '周末',
  custom: '自定义'
}

const getFrequencyDescription = () => {
  switch (form.frequency) {
    case 'daily':
      return '每天都需要打卡'
    case 'weekly':
      return form.customDays.length > 0 
        ? `每周${form.customDays.map(d => ['周日', '周一', '周二', '周三', '周四', '周五', '周六'][d]).join('、')}打卡`
        : '请选择打卡的星期'
    case 'workdays':
      return '周一至周五打卡'
    case 'weekends':
      return '周六、周日打卡'
    case 'custom':
      return `每隔${form.intervalDays}天打卡一次`
    default:
      return ''
  }
}

const handleFrequencyChange = () => {
  if (form.frequency !== 'weekly') {
    form.customDays = []
  }
}

const isTagDisabled = (tagId) => {
  return form.tagIds.length >= 3 && !form.tagIds.includes(tagId)
}

const handleTagChange = (selectedTags) => {
  if (selectedTags.length > 3) {
    form.tagIds = selectedTags.slice(0, 3)
    ElMessage.warning('最多只能关联3个标签')
  }
}

const disabledEndDate = (date) => {
  return date && date < new Date(form.startDate.getFullYear(), form.startDate.getMonth(), form.startDate.getDate())
}

const handleSubmit = async () => {
  if (!formRef.value) return

  try {
    await formRef.value.validate()
    
    if (form.reminderEnabled && !form.reminderTime) {
      ElMessage.error('请选择提醒时间')
      return
    }

    const confirmMessage = isEdit.value
      ? `确定要修改打卡计划"${form.name}"吗？`
      : `确定要创建打卡计划"${form.name}"吗？\n\n计划详情：\n• 打卡频率：${getFrequencyDescription()}\n• 开始日期：${formatDate(form.startDate)}\n• ${form.endDate ? '结束日期：' + formatDate(form.endDate) : '结束日期：无限制'}`

    await ElMessageBox.confirm(confirmMessage, '确认提交', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'info',
      draggable: true
    })

    loading.value = true

    const customRules = []
    if (form.frequency === 'weekly' && form.customDays.length > 0) {
      customRules.push({
        type: 'monthly',
        value: 1,
        days: form.customDays,
        week: 1
      })
    } else if (form.frequency === 'custom') {
      customRules.push({
        type: 'interval',
        value: form.intervalDays
      })
    }

    const planData = {
      name: form.name,
      description: form.description,
      tagIds: form.tagIds,
      frequency: form.frequency,
      customRules,
      startDate: form.startDate,
      endDate: form.endDate,
      targetCount: form.targetCount || null,
      reminderEnabled: form.reminderEnabled,
      reminderTime: form.reminderTime ? form.reminderTime.toTimeString().slice(0, 5) : null
    }

    if (isEdit.value) {
      const success = await planStore.updatePlan(route.params.id, planData)
      if (success) {
        ElMessage.success('修改成功')
        router.push('/plans')
      } else {
        ElMessage.error(planStore.error || '修改失败')
      }
    } else {
      const newPlan = await planStore.createPlan(planData)
      if (newPlan) {
        ElMessage.success('创建成功')
        router.push('/plans')
      } else {
        ElMessage.error(planStore.error || '创建失败')
      }
    }
  } catch (error) {
    if (error !== 'cancel') {
      console.error('Submit error:', error)
    }
  } finally {
    loading.value = false
  }
}

const formatDate = (date) => {
  if (!date) return ''
  const d = new Date(date)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

onMounted(async () => {
  await Promise.all([
    tagStore.loadTags(),
    planStore.loadPlans()
  ])

  const userId = localStorage.getItem('userId')
  if (!userId) {
    ElMessage.error('用户未登录')
    return
  }

  if (isEdit.value) {
    const plan = planStore.getPlanById(route.params.id)
    if (plan) {
      form.name = plan.name
      form.description = plan.description || ''
      form.tagIds = plan.tagIds || []
      form.frequency = plan.frequency
      if (plan.customRules && plan.customRules.length > 0) {
        const weeklyRule = plan.customRules.find(r => r.type === 'monthly' && r.week !== undefined)
        if (weeklyRule) {
          form.customDays = weeklyRule.days || []
        } else {
          form.customDays = plan.customRules.flatMap(r => r.days || [])
        }
      }
      form.intervalDays = plan.customRules?.find(r => r.type === 'interval')?.value || 3
      form.startDate = new Date(plan.startDate)
      form.endDate = plan.endDate ? new Date(plan.endDate) : null
      form.targetCount = plan.targetCount || 0
      form.reminderEnabled = plan.reminderEnabled
      form.reminderTime = plan.reminderTime ? new Date(`2000-01-01 ${plan.reminderTime}`) : null
    } else {
      ElMessage.error('计划不存在')
      router.push('/plans')
    }
  }
})
</script>

<style lang="scss" scoped>
.plan-form-container {
  max-width: 800px;
  margin: 0 auto;
}

.page-header {
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
  margin-bottom: var(--spacing-xl);

  .page-title {
    font-size: 24px;
    font-weight: bold;
    margin: 0;
  }
}

.form-content {
  background: var(--bg-card);
  border-radius: var(--radius-medium);
  padding: var(--spacing-xl);
  box-shadow: var(--shadow-light);
}

.plan-form {
  max-width: 600px;
}

.tag-option {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
}

.tag-color {
  width: 12px;
  height: 12px;
  border-radius: 50%;
}

.tag-check {
  margin-left: auto;
  color: var(--color-primary);
}

.tag-hint {
  margin-top: var(--spacing-sm);
  font-size: 12px;
  color: var(--text-secondary);
}

.tag-selection {
  width: 100%;
}

.form-tip {
  margin-left: var(--spacing-md);
  color: var(--text-secondary);
  font-size: 12px;
}
</style>
