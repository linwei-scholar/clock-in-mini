<template>
  <div class="plan-edit-container">
    <el-card>
      <template #header>
        <div class="card-header">
          <el-button @click="$router.back()">
            <el-icon><ArrowLeft /></el-icon>
            返回
          </el-button>
          <span>编辑打卡计划</span>
        </div>
      </template>

      <el-form
        ref="formRef"
        :model="form"
        :rules="rules"
        label-position="top"
        size="large"
        v-loading="loading"
      >
        <el-form-item label="计划名称" prop="name">
          <el-input
            v-model="form.name"
            placeholder="请输入计划名称（4-30个字符）"
            maxlength="30"
            show-word-limit
          />
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

        <el-form-item label="打卡频率" prop="frequency">
          <el-radio-group v-model="form.frequency">
            <el-radio label="daily">每日</el-radio>
            <el-radio label="weekly">每周</el-radio>
            <el-radio label="workdays">工作日</el-radio>
            <el-radio label="weekends">周末</el-radio>
            <el-radio label="custom">自定义</el-radio>
          </el-radio-group>
        </el-form-item>

        <el-form-item
          label="选择周几"
          prop="weekDays"
          v-if="form.frequency === 'weekly'"
        >
          <el-checkbox-group v-model="form.weekDays">
            <el-checkbox label="1">周一</el-checkbox>
            <el-checkbox label="2">周二</el-checkbox>
            <el-checkbox label="3">周三</el-checkbox>
            <el-checkbox label="4">周四</el-checkbox>
            <el-checkbox label="5">周五</el-checkbox>
            <el-checkbox label="6">周六</el-checkbox>
            <el-checkbox label="0">周日</el-checkbox>
          </el-checkbox-group>
        </el-form-item>

        <el-form-item label="标签关联" prop="tagIds">
          <el-select
            v-model="form.tagIds"
            multiple
            placeholder="请选择标签（最多3个）"
            style="width: 100%"
          >
            <el-option
              v-for="tag in tagStore.tags"
              :key="tag.id"
              :label="tag.name"
              :value="tag.id"
            >
              <div class="tag-option">
                <el-icon><component :is="tag.icon" /></el-icon>
                <span>{{ tag.name }}</span>
              </div>
            </el-option>
          </el-select>
        </el-form-item>

        <el-form-item label="开始日期" prop="startDate">
          <el-date-picker
            v-model="form.startDate"
            type="date"
            placeholder="选择开始日期"
            style="width: 100%"
            format="YYYY-MM-DD"
            value-format="YYYY-MM-DD"
          />
        </el-form-item>

        <el-form-item label="结束日期" prop="endDate">
          <el-date-picker
            v-model="form.endDate"
            type="date"
            placeholder="选择结束日期（可选，留空为永久有效）"
            style="width: 100%"
            format="YYYY-MM-DD"
            value-format="YYYY-MM-DD"
          />
        </el-form-item>

        <el-form-item label="提醒时间" prop="reminderEnabled">
          <el-switch v-model="form.reminderEnabled" active-text="启用提醒" />
        </el-form-item>

        <el-form-item
          label="提醒时间点"
          prop="reminderTime"
          v-if="form.reminderEnabled"
        >
          <el-time-picker
            v-model="form.reminderTime"
            placeholder="选择提醒时间"
            style="width: 100%"
            format="HH:mm"
            value-format="HH:mm"
          />
        </el-form-item>

        <el-form-item>
          <el-button type="primary" @click="handleSubmit" :loading="saving">
            保存修改
          </el-button>
          <el-button @click="$router.back()">取消</el-button>
        </el-form-item>
      </el-form>
    </el-card>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { ElMessage } from 'element-plus'
import { ArrowLeft } from '@element-plus/icons-vue'
import { usePlanStore } from '@/stores/planStore'
import { useTagStore } from '@/stores/tagStore'

const router = useRouter()
const route = useRoute()
const planStore = usePlanStore()
const tagStore = useTagStore()

const formRef = ref(null)
const loading = ref(true)
const saving = ref(false)

const form = reactive({
  name: '',
  description: '',
  frequency: 'daily',
  weekDays: [],
  tagIds: [],
  startDate: '',
  endDate: '',
  reminderEnabled: false,
  reminderTime: ''
})

const rules = {
  name: [
    { required: true, message: '请输入计划名称', trigger: 'blur' },
    { min: 4, max: 30, message: '计划名称应在4-30个字符之间', trigger: 'blur' }
  ],
  frequency: [
    { required: true, message: '请选择打卡频率', trigger: 'change' }
  ],
  startDate: [
    { required: true, message: '请选择开始日期', trigger: 'change' }
  ]
}

const loadPlan = () => {
  const planId = route.params.id
  const plan = planStore.getPlanById(planId)

  if (!plan) {
    ElMessage.error('计划不存在')
    router.push('/plans')
    return
  }

  form.name = plan.name
  form.description = plan.description || ''
  form.frequency = plan.frequency || 'daily'
  form.weekDays = plan.weekDays || []
  form.tagIds = plan.tagIds || []
  form.startDate = plan.startDate || ''
  form.endDate = plan.endDate || ''
  form.reminderEnabled = plan.reminderEnabled || false
  form.reminderTime = plan.reminderTime || ''

  loading.value = false
}

const handleSubmit = async () => {
  if (!formRef.value) return

  await formRef.value.validate(async (valid) => {
    if (valid) {
      saving.value = true

      try {
        planStore.updatePlan(route.params.id, {
          name: form.name,
          description: form.description,
          frequency: form.frequency,
          weekDays: form.weekDays,
          tagIds: form.tagIds,
          startDate: form.startDate,
          endDate: form.endDate || null,
          reminderEnabled: form.reminderEnabled,
          reminderTime: form.reminderTime
        })

        ElMessage.success('计划修改成功')
        router.push('/plans')
      } catch (error) {
        ElMessage.error(error.message || '保存失败')
      } finally {
        saving.value = false
      }
    }
  })
}

onMounted(() => {
  loadPlan()
})
</script>

<style scoped>
.plan-edit-container {
  padding: var(--spacing-lg);
  max-width: 800px;
  margin: 0 auto;
}

.card-header {
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
}

.tag-option {
  display: flex;
  align-items: center;
  gap: var(--spacing-xs);
}
</style>
