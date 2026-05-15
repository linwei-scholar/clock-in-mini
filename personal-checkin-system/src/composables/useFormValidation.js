import { ref, reactive } from 'vue';

export const useFormValidation = () => {
  const errors = reactive({});
  const touched = reactive({});

  const validateField = (fieldName, value, rules) => {
    if (!rules) return true;

    for (const rule of rules) {
      if (rule.required && (!value || (typeof value === 'string' && !value.trim()))) {
        errors[fieldName] = rule.message || `${fieldName}不能为空`;
        return false;
      }

      if (rule.minLength && value && value.length < rule.minLength) {
        errors[fieldName] = rule.message || `${fieldName}长度不能少于${rule.minLength}个字符`;
        return false;
      }

      if (rule.maxLength && value && value.length > rule.maxLength) {
        errors[fieldName] = rule.message || `${fieldName}长度不能超过${rule.maxLength}个字符`;
        return false;
      }

      if (rule.pattern && value && !rule.pattern.test(value)) {
        errors[fieldName] = rule.message || `${fieldName}格式不正确`;
        return false;
      }

      if (rule.validator && typeof rule.validator === 'function') {
        const result = rule.validator(value);
        if (!result) {
          errors[fieldName] = rule.message || `${fieldName}验证失败`;
          return false;
        }
      }
    }

    delete errors[fieldName];
    return true;
  };

  const validate = (formData, validationRules) => {
    let isValid = true;
    
    for (const fieldName in validationRules) {
      const value = formData[fieldName];
      const rules = validationRules[fieldName];
      touched[fieldName] = true;
      
      if (!validateField(fieldName, value, rules)) {
        isValid = false;
      }
    }

    return isValid;
  };

  const clearErrors = (fieldName = null) => {
    if (fieldName) {
      delete errors[fieldName];
      delete touched[fieldName];
    } else {
      Object.keys(errors).forEach(key => delete errors[key]);
      Object.keys(touched).forEach(key => delete touched[key]);
    }
  };

  const getError = (fieldName) => {
    return touched[fieldName] ? errors[fieldName] : null;
  };

  const hasError = (fieldName) => {
    return touched[fieldName] && !!errors[fieldName];
  };

  const isValid = (fieldName, value, rules) => {
    touched[fieldName] = true;
    return validateField(fieldName, value, rules);
  };

  return {
    errors,
    touched,
    validateField,
    validate,
    clearErrors,
    getError,
    hasError,
    isValid
  };
};

export default useFormValidation;
