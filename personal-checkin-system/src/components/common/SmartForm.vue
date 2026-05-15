<template>
  <el-form
    ref="formRef"
    :model="formData"
    :rules="validationRules"
    :label-position="labelPosition"
    :size="size"
    :status-icon="statusIcon"
    @submit.prevent="handleSubmit"
  >
    <slot :form="formData" :errors="errors" :validate="validateForm" :reset="resetForm"></slot>
  </el-form>
</template>

<script setup>
import { ref, reactive, watch } from 'vue';

const props = defineProps({
  modelValue: {
    type: Object,
    required: true
  },
  rules: {
    type: Object,
    default: () => ({})
  },
  labelPosition: {
    type: String,
    default: 'top'
  },
  size: {
    type: String,
    default: 'large'
  },
  statusIcon: {
    type: Boolean,
    default: true
  },
  validateOnChange: {
    type: Boolean,
    default: true
  },
  submitText: {
    type: String,
    default: '提交'
  }
});

const emit = defineEmits(['update:modelValue', 'submit', 'validate-error']);

const formRef = ref(null);
const formData = reactive({});
const errors = reactive({});
const isSubmitting = ref(false);

Object.keys(props.modelValue).forEach(key => {
  formData[key] = props.modelValue[key];
});

watch(() => props.modelValue, (newVal) => {
  Object.keys(newVal).forEach(key => {
    formData[key] = newVal[key];
  });
}, { deep: true });

const validationRules = {};

const validateField = async (fieldName) => {
  if (!formRef.value) return true;
  
  try {
    await formRef.value.validateField(fieldName);
    delete errors[fieldName];
    return true;
  } catch (error) {
    errors[fieldName] = error.message || '验证失败';
    return false;
  }
};

const validateForm = async () => {
  if (!formRef.value) return false;
  
  try {
    await formRef.value.validate();
    Object.keys(errors).forEach(key => delete errors[key]);
    return true;
  } catch (error) {
    return false;
  }
};

const resetForm = () => {
  if (formRef.value) {
    formRef.value.resetFields();
  }
  Object.keys(errors).forEach(key => delete errors[key]);
};

const clearValidate = (fields) => {
  if (formRef.value) {
    formRef.value.clearValidate(fields);
  }
};

const handleSubmit = async () => {
  if (isSubmitting.value) return;
  
  isSubmitting.value = true;
  
  try {
    const isValid = await validateForm();
    
    if (isValid) {
      emit('submit', { ...formData });
    } else {
      emit('validate-error', errors);
    }
  } finally {
    isSubmitting.value = false;
  }
};

defineExpose({
  formRef,
  validateForm,
  validateField,
  resetForm,
  clearValidate,
  isSubmitting
});
</script>

<style scoped>
</style>
