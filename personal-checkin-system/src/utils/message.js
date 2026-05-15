import { ElMessage } from 'element-plus';

export const showSuccess = (message, duration = 3000) => {
  ElMessage({
    message,
    type: 'success',
    duration,
    showClose: true,
    grouping: true
  });
};

export const showError = (message, duration = 4000) => {
  ElMessage({
    message,
    type: 'error',
    duration,
    showClose: true,
    grouping: true
  });
};

export const showWarning = (message, duration = 3500) => {
  ElMessage({
    message,
    type: 'warning',
    duration,
    showClose: true,
    grouping: true
  });
};

export const showInfo = (message, duration = 3000) => {
  ElMessage({
    message,
    type: 'info',
    duration,
    showClose: true,
    grouping: true
  });
};

export default {
  showSuccess,
  showError,
  showWarning,
  showInfo
};
