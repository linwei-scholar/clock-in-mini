import { ElMessage, ElLoading } from 'element-plus';
import { nextTick } from 'vue';

const DEFAULT_DURATION = 3000;
const ERROR_DURATION = 4000;
const WARNING_DURATION = 3500;

export const message = {
  success(message, duration = DEFAULT_DURATION) {
    ElMessage({
      message,
      type: 'success',
      duration,
      showClose: true,
      grouping: true,
      appendTo: document.body
    });
  },

  error(message, duration = ERROR_DURATION) {
    ElMessage({
      message,
      type: 'error',
      duration,
      showClose: true,
      grouping: true,
      appendTo: document.body
    });
  },

  warning(message, duration = WARNING_DURATION) {
    ElMessage({
      message,
      type: 'warning',
      duration,
      showClose: true,
      grouping: true,
      appendTo: document.body
    });
  },

  info(message, duration = DEFAULT_DURATION) {
    ElMessage({
      message,
      type: 'info',
      duration,
      showClose: true,
      grouping: true,
      appendTo: document.body
    });
  },

  loading(message = '加载中...') {
    return ElLoading.service({
      lock: true,
      text: message,
      background: 'rgba(255, 255, 255, 0.9)'
    });
  }
};

export const toast = {
  success(message, options = {}) {
    const { duration = 3000, closable = true, position = 'top-center' } = options;
    return showToast(message, 'success', { duration, closable, position });
  },

  error(message, options = {}) {
    const { duration = 4000, closable = true, position = 'top-center' } = options;
    return showToast(message, 'error', { duration, closable, position });
  },

  warning(message, options = {}) {
    const { duration = 3500, closable = true, position = 'top-center' } = options;
    return showToast(message, 'warning', { duration, closable, position });
  },

  info(message, options = {}) {
    const { duration = 3000, closable = true, position = 'top-center' } = options;
    return showToast(message, 'info', { duration, closable, position });
  }
};

let toastContainer = null;
let toastInstance = null;

function showToast(message, type, options = {}) {
  if (!toastContainer) {
    toastContainer = document.createElement('div');
    toastContainer.className = 'ux-toast-container';
    toastContainer.style.cssText = `
      position: fixed;
      top: 20px;
      left: 50%;
      transform: translateX(-50%);
      z-index: 99999;
      display: flex;
      flex-direction: column;
      gap: 12px;
      pointer-events: none;
    `;
    document.body.appendChild(toastContainer);
  }

  if (toastInstance) {
    toastContainer.removeChild(toastInstance);
  }

  const toastEl = document.createElement('div');
  toastEl.className = `ux-toast ux-toast--${type}`;
  toastEl.style.cssText = `
    display: flex;
    align-items: center;
    padding: 14px 20px;
    border-radius: 8px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    min-width: 300px;
    max-width: 500px;
    background: ${getToastBackground(type)};
    border-left: 4px solid ${getToastColor(type)};
    color: #303133;
    font-size: 14px;
    line-height: 1.5;
    pointer-events: auto;
    animation: toastSlideIn 0.3s ease;
  `;

  const iconEl = document.createElement('span');
  iconEl.style.cssText = `
    margin-right: 12px;
    font-size: 20px;
    color: ${getToastColor(type)};
  `;
  iconEl.innerHTML = getToastIcon(type);

  const textEl = document.createElement('span');
  textEl.style.flex = '1';
  textEl.textContent = message;

  toastEl.appendChild(iconEl);
  toastEl.appendChild(textEl);

  if (options.closable !== false) {
    const closeBtn = document.createElement('button');
    closeBtn.style.cssText = `
      background: transparent;
      border: none;
      cursor: pointer;
      padding: 4px;
      margin-left: 12px;
      color: #909399;
      font-size: 16px;
      display: flex;
      align-items: center;
    `;
    closeBtn.innerHTML = '✕';
    closeBtn.onclick = () => {
      removeToast(toastEl);
    };
    toastEl.appendChild(closeBtn);
  }

  toastContainer.appendChild(toastEl);
  toastInstance = toastEl;

  const styleEl = document.createElement('style');
  styleEl.textContent = `
    @keyframes toastSlideIn {
      from {
        opacity: 0;
        transform: translateY(-20px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }
    @keyframes toastSlideOut {
      from {
        opacity: 1;
        transform: translateY(0);
      }
      to {
        opacity: 0;
        transform: translateY(-20px);
      }
    }
  `;
  if (!document.querySelector('style[data-ux-toast]')) {
    styleEl.setAttribute('data-ux-toast', 'true');
    document.head.appendChild(styleEl);
  }

  if (options.duration !== 0) {
    setTimeout(() => {
      removeToast(toastEl);
    }, options.duration || DEFAULT_DURATION);
  }

  return {
    close: () => removeToast(toastEl)
  };
}

function removeToast(toastEl) {
  if (toastEl && toastEl.parentNode) {
    toastEl.style.animation = 'toastSlideOut 0.3s ease forwards';
    setTimeout(() => {
      if (toastEl.parentNode) {
        toastEl.parentNode.removeChild(toastEl);
      }
    }, 300);
  }
}

function getToastColor(type) {
  const colors = {
    success: '#67c23a',
    error: '#f56c6c',
    warning: '#e6a23c',
    info: '#909399'
  };
  return colors[type] || colors.info;
}

function getToastBackground(type) {
  const backgrounds = {
    success: '#f0f9eb',
    error: '#fef0f0',
    warning: '#fdf6ec',
    info: '#f4f4f5'
  };
  return backgrounds[type] || backgrounds.info;
}

function getToastIcon(type) {
  const icons = {
    success: '✓',
    error: '✕',
    warning: '⚠',
    info: 'ℹ'
  };
  return icons[type] || icons.info;
}

export const loading = {
  show(text = '加载中...', options = {}) {
    return ElLoading.service({
      lock: options.lock !== false,
      text,
      background: options.background || 'rgba(255, 255, 255, 0.9)',
      customClass: options.customClass || ''
    });
  },

  hide(instance) {
    if (instance) {
      instance.close();
    }
  }
};

export const confirm = async (options = {}) => {
  const { 
    title = '确认操作', 
    message: msg = '确定要执行此操作吗？', 
    confirmText = '确定', 
    cancelText = '取消',
    type = 'warning'
  } = options;

  try {
    await ElMessageBox.confirm(msg, title, {
      confirmButtonText: confirmText,
      cancelButtonText: cancelText,
      type,
      confirmButtonClass: type === 'danger' ? 'el-button--danger' : ''
    });
    return true;
  } catch {
    return false;
  }
};

export const prompt = async (options = {}) => {
  const {
    title = '请输入',
    message = '请输入内容',
    confirmText = '确定',
    cancelText = '取消',
    inputPattern,
    inputErrorMessage = '输入格式不正确'
  } = options;

  try {
    const value = await ElMessageBox.prompt(message, title, {
      confirmButtonText: confirmText,
      cancelButtonText: cancelText,
      inputPattern,
      inputErrorMessage
    });
    return value.value;
  } catch {
    return null;
  }
};

export const alert = async (options = {}) => {
  const {
    title = '提示',
    message = '',
    type = 'info',
    confirmText = '确定'
  } = options;

  await ElMessageBox.alert(message, title, {
    confirmButtonText: confirmText,
    type,
    callback: () => {}
  });
};

export default {
  message,
  toast,
  loading,
  confirm,
  prompt,
  alert
};
