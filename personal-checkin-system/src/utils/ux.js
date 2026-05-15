import { message, toast, loading, confirm, prompt, alert } from './userExperience.js';

export const ux = {
  message,
  toast,
  loading,
  confirm,
  prompt,
  alert,
  
  success(message, options = {}) {
    if (options.toast) {
      return toast.success(message, options);
    }
    return message.success(message, options.duration);
  },

  error(message, options = {}) {
    if (options.toast) {
      return toast.error(message, options);
    }
    return message.error(message, options.duration);
  },

  warning(message, options = {}) {
    if (options.toast) {
      return toast.warning(message, options);
    }
    return message.warning(message, options.duration);
  },

  info(message, options = {}) {
    if (options.toast) {
      return toast.info(message, options);
    }
    return message.info(message, options.duration);
  },

  async withFeedback(promise, successMessage, errorMessage) {
    try {
      const result = await promise;
      this.success(successMessage || '操作成功');
      return { success: true, data: result };
    } catch (error) {
      this.error(errorMessage || error.message || '操作失败');
      return { success: false, error };
    }
  },

  async withLoading(promise, loadingText = '加载中...') {
    const loadingInstance = loading.show(loadingText);
    try {
      const result = await promise;
      return { success: true, data: result };
    } catch (error) {
      this.error(error.message || '操作失败');
      return { success: false, error };
    } finally {
      loading.hide(loadingInstance);
    }
  }
};

export { message, toast, loading, confirm, prompt, alert };

export default ux;
