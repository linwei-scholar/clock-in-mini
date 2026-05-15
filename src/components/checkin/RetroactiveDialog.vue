<template>
  <el-dialog
    v-model="dialogVisible"
    title="补卡"
    width="500px"
    @close="handleClose"
  >
    <el-form
      ref="formRef"
      :model="formData"
      :rules="formRules"
      label-width="100px"
    >
      <el-form-item label="选择日期" prop="date">
        <el-date-picker
          v-model="formData.date"
          type="date"
          placeholder="选择补卡日期"
          :disabled-date="disabledDate"
          format="YYYY-MM-DD"
          value-format="YYYY-MM-DD"
          style="width: 100%"
        />
        <div class="form-tip">
          <el-icon><InfoFilled /></el-icon>
          只能补最近7天的打卡
        </div>
      </el-form-item>

      <el-form-item label="选择计划" prop="planId">
        <el-select
          v-model="formData.planId"
          placeholder="请选择打卡计划"
          style="width: 100%"
          :disabled="!!preselectedPlanId"
        >
          <el-option
            v-for="plan in availablePlans"
            :key="plan.id"
            :label="plan.name"
            :value="plan.id"
          />
        </el-select>
      </el-form-item>

      <el-form-item label="打卡内容" prop="content">
        <el-input
          v-model="formData.content"
          type="textarea"
          :rows="4"
          placeholder="记录一下今天的打卡内容..."
          maxlength="500"
          show-word-limit
        />
      </el-form-item>

      <el-form-item label="上传图片">
        <el-upload
          v-model:file-list="fileList"
          action="#"
          list-type="picture-card"
          :auto-upload="false"
          :on-change="handleFileChange"
          :on-remove="handleFileRemove"
          :limit="9"
          accept="image/*"
        >
          <el-icon><Plus /></el-icon>
        </el-upload>
      </el-form-item>

      <el-alert
        title="补卡须知"
        type="warning"
        :closable="false"
        show-icon
        class="mb-md"
      >
        <template #default>
          <ul class="retro-tip-list">
            <li>补卡将标记为迟到</li>
            <li>补卡会计入当日统计</li>
            <li>每个计划每天只能补卡一次</li>
          </ul>
        </template>
      </el-alert>
    </el-form>

    <template #footer>
      <el-button @click="handleClose">取消</el-button>
      <el-button type="primary" :loading="loading" @click="handleSubmit">
        确认补卡
      </el-button>
    </template>
  </el-dialog>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { ElMessage } from 'element-plus'
import { InfoFilled, Plus } from '@element-plus/icons-vue'
import { useRecordStore } from '@/stores/recordStore'
import { usePlanStore } from '@/stores/planStore'

const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false
  },
  preselectedPlanId: {
    type: String,
    default: ''
  },
  preselectedDate: {
    type: String,
    default: ''
  }
})

const emit = defineEmits(['update:modelValue', 'success'])

const recordStore = useRecordStore()
const planStore = usePlanStore()

const dialogVisible = computed({
  get: () => props.modelValue,
  set: (val) => emit('update:modelValue', val)
})

const formRef = ref(null)
const loading = ref(false)
const fileList = ref([])

const formData = ref({
  date: '',
  planId: '',
  content: ''
})

const formRules = {
  date: [
    { required: true, message: '请选择补卡日期', trigger: 'change' }
  ],
  planId: [
    { required: true, message: '请选择打卡计划', trigger: 'change' }
  ],
  content: [
    { required: true, message: '请填写打卡内容', trigger: 'blur' },
    { min: 1, max: 500, message: '打卡内容长度在 1 到 500 个字符', trigger: 'blur' }
  ]
}

const availablePlans = computed(() => {
  return planStore.plans.filter(plan => {
    return plan.status === 'active' && plan.userId === recordStore.userRecords[0]?.userId
  })
})

const disabledDate = (time) => {
  const now = new Date()
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
  sevenDaysAgo.setHours(0, 0, 0, 0)
  
  return time.getTime() > now.getTime() || time.getTime() < sevenDaysAgo.getTime()
}

const handleFileChange = (file, files) => {
  fileList.value = files
}

const handleFileRemove = (file, files) => {
  fileList.value = files
}

const handleClose = () => {
  formRef.value?.resetFields()
  fileList.value = []
  loading.value = false
}

const handleSubmit = async () => {
  try {
    await formRef.value?.validate()
    
    loading.value = true
    
    const selectedDate = new Date(formData.value.date)
    selectedDate.setHours(0, 0, 0, 0)
    
    const result = await recordStore.retroCheckIn(
      formData.value.planId,
      selectedDate,
      {
        content: formData.value.content,
        images: fileList.value.map(f => f.url || f.name)
      }
    )
    
    if (result) {
      ElMessage.success('补卡成功')
      emit('success', result)
      handleClose()
      dialogVisible.value = false
    } else {
      ElMessage.error(recordStore.error || '补卡失败')
    }
  } catch (error) {
    if (error !== false) {
      ElMessage.error('请完善表单信息')
    }
  } finally {
    loading.value = false
  }
}

watch(() => props.modelValue, (newVal) => {
  if (newVal) {
    if (props.preselectedPlanId) {
      formData.value.planId = props.preselectedPlanId
    }
    if (props.preselectedDate) {
      formData.value.date = props.preselectedDate
    }
  }
})
</script>

<style lang="scss" scoped>
.form-tip {
  display: flex;
  align-items: center;
  gap: var(--spacing-xs);
  margin-top: var(--spacing-xs);
  font-size: 12px;
  color: var(--text-secondary);
  
  .el-icon {
    color: var(--primary-color);
  }
}

.retro-tip-list {
  margin: 0;
  padding-left: var(--spacing-lg);
  font-size: 13px;
  
  li {
    margin: var(--spacing-xs) 0;
  }
}

.mb-md {
  margin-bottom: var(--spacing-md);
}
</style>
