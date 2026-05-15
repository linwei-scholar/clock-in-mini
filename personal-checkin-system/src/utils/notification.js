const PERMISSION_KEY = 'notification_permission';

export const PermissionStatus = {
  GRANTED: 'granted',
  DENIED: 'denied',
  DEFAULT: 'default'
};

export const checkPermission = () => {
  if (!('Notification' in window)) {
    return { 
      status: 'unsupported',
      isSupported: false,
      canRequest: false,
      message: '您的浏览器不支持桌面通知功能'
    };
  }
  
  const status = Notification.permission;
  return {
    status,
    isSupported: true,
    canRequest: status === PermissionStatus.DEFAULT,
    message: getStatusMessage(status)
  };
};

export const getStatusMessage = (status) => {
  switch (status) {
    case PermissionStatus.GRANTED:
      return '已授权';
    case PermissionStatus.DENIED:
      return '已拒绝';
    case PermissionStatus.DEFAULT:
      return '未决定';
    default:
      return '不支持';
  }
};

export const getStatusDescription = (status) => {
  switch (status) {
    case PermissionStatus.GRANTED:
      return '您已开启通知权限，系统可以在需要时向您发送提醒。';
    case PermissionStatus.DENIED:
      return '通知权限已被拒绝。如需开启，请按照以下步骤在浏览器设置中手动开启。';
    case PermissionStatus.DEFAULT:
      return '通知权限尚未确定。点击"申请权限"按钮即可开启通知提醒功能。';
    default:
      return '您的浏览器不支持通知功能。';
  }
};

export const requestPermission = async () => {
  if (!('Notification' in window)) {
    return {
      success: false,
      permission: 'unsupported',
      message: '您的浏览器不支持桌面通知功能'
    };
  }

  try {
    const permission = await Notification.requestPermission();
    
    savePermissionStatus(permission);
    
    return {
      success: permission === PermissionStatus.GRANTED,
      permission,
      message: permission === PermissionStatus.GRANTED 
        ? '通知权限申请成功！'
        : permission === PermissionStatus.DENIED
        ? '通知权限被拒绝'
        : '用户未做选择'
    };
  } catch (error) {
    return {
      success: false,
      permission: 'error',
      message: '申请通知权限时发生错误'
    };
  }
};

export const savePermissionStatus = (status) => {
  try {
    localStorage.setItem(PERMISSION_KEY, JSON.stringify({
      status,
      updatedAt: new Date().toISOString()
    }));
  } catch (error) {
    console.error('保存通知权限状态失败:', error);
  }
};

export const getSavedPermissionStatus = () => {
  try {
    const saved = localStorage.getItem(PERMISSION_KEY);
    if (saved) {
      return JSON.parse(saved);
    }
  } catch (error) {
    console.error('读取通知权限状态失败:', error);
  }
  return null;
};

export const showNotification = (title, options = {}) => {
  const permission = Notification.permission;
  
  if (permission !== PermissionStatus.GRANTED) {
    console.warn('通知权限未授权，无法显示通知');
    return null;
  }

  const defaultOptions = {
    icon: '/icons.svg',
    badge: '/icons.svg',
    tag: 'checkin-notification',
    renotify: true,
    requireInteraction: false,
    silent: false
  };

  const notificationOptions = { ...defaultOptions, ...options };

  try {
    const notification = new Notification(title, notificationOptions);
    
    notification.onclick = () => {
      window.focus();
      notification.close();
      if (options.onClick) {
        options.onClick();
      }
    };

    notification.onclose = () => {
      if (options.onClose) {
        options.onClose();
      }
    };

    setTimeout(() => {
      notification.close();
    }, options.duration || 5000);

    return notification;
  } catch (error) {
    console.error('显示通知失败:', error);
    return null;
  }
};

export const showReminderNotification = (planName, message = '') => {
  const title = `📋 ${planName}`;
  const body = message || '该打卡了！';
  
  return showNotification(title, {
    body,
    tag: `reminder-${planName}`,
    requireInteraction: true,
    duration: 8000
  });
};

export const showSuccessNotification = (message) => {
  return showNotification('✅ 打卡成功', {
    body: message || '您的打卡记录已保存',
    tag: 'checkin-success',
    duration: 4000
  });
};

export const showMissedNotification = (planName, date) => {
  const dateStr = new Date(date).toLocaleDateString('zh-CN');
  return showNotification(`⚠️ 打卡提醒`, {
    body: `${planName} 在 ${dateStr} 尚未打卡`,
    tag: `missed-${planName}-${date}`,
    duration: 10000
  });
};

export const getBrowserInstructions = () => {
  const userAgent = navigator.userAgent.toLowerCase();
  let browser = 'unknown';

  if (userAgent.includes('chrome')) {
    browser = 'chrome';
  } else if (userAgent.includes('firefox')) {
    browser = 'firefox';
  } else if (userAgent.includes('safari')) {
    browser = 'safari';
  } else if (userAgent.includes('edge')) {
    browser = 'edge';
  }

  const instructions = {
    chrome: {
      browserName: 'Chrome 浏览器',
      steps: [
        '在浏览器右上角点击"⋮"（三个点）',
        '选择"设置"',
        '点击左侧菜单中的"隐私和安全"',
        '选择"网站设置"',
        '在"权限"部分找到"通知"',
        '找到本网站的地址，确保权限为"允许"',
        '如果没有看到网站，点击"添加"按钮手动添加'
      ],
      screenshot: 'https://support.google.com/chrome/static/images/chrome/help/notification-permissions.png'
    },
    firefox: {
      browserName: 'Firefox 浏览器',
      steps: [
        '在浏览器右上角点击"☰"（三横线）',
        '选择"设置"',
        '点击左侧菜单中的"隐私与安全"',
        '向下滚动到"权限"部分',
        '点击"通知"旁边的"设置"按钮',
        '找到本网站的地址，选择"允许"',
        '如果没有看到网站，点击"添加网站"按钮手动添加'
      ],
      screenshot: ''
    },
    safari: {
      browserName: 'Safari 浏览器',
      steps: [
        '在浏览器菜单栏点击"Safari"',
        '选择"偏好设置"',
        '点击"网站"标签',
        '在左侧菜单中选择"通知"',
        '找到本网站的地址，确保权限为"允许"',
        '如果没有看到网站，可能需要在网站发送通知请求后才会显示'
      ],
      screenshot: ''
    },
    edge: {
      browserName: 'Edge 浏览器',
      steps: [
        '在浏览器右上角点击"···"（三个点）',
        '选择"设置"',
        '点击左侧菜单中的"Cookie 和网站权限"',
        '在"所有权限"部分找到"通知"',
        '找到本网站的地址，确保权限为"允许"',
        '如果没有看到网站，点击"添加"按钮手动添加'
      ],
      screenshot: ''
    },
    unknown: {
      browserName: '您的浏览器',
      steps: [
        '打开浏览器设置',
        '找到"通知"或"提醒"相关设置',
        '允许本网站的桌面通知权限',
        '刷新页面后重新尝试'
      ],
      screenshot: ''
    }
  };

  return instructions[browser] || instructions.unknown;
};

export const openBrowserSettings = () => {
  const userAgent = navigator.userAgent.toLowerCase();
  
  if (userAgent.includes('chrome')) {
    window.open('chrome://settings/content/notifications', '_blank');
  } else if (userAgent.includes('firefox')) {
    window.open('about:preferences#privacy', '_blank');
  } else if (userAgent.includes('edge')) {
    window.open('edge://settings/content/notifications', '_blank');
  }
};

export const isNotificationSupported = () => {
  return 'Notification' in window;
};

export default {
  checkPermission,
  requestPermission,
  showNotification,
  showReminderNotification,
  showSuccessNotification,
  showMissedNotification,
  getBrowserInstructions,
  openBrowserSettings,
  isNotificationSupported,
  PermissionStatus
};
