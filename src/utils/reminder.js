let reminderTimer = null;
let reminderConfig = null;
let reminderRules = [];
let checkInPlans = [];

export function initReminderEngine(config, plans, callback) {
  reminderConfig = config;
  checkInPlans = plans || [];
  
  updateReminderRules();
  
  if (reminderTimer) {
    clearInterval(reminderTimer);
  }
  
  reminderTimer = setInterval(() => {
    checkAndTriggerReminders(callback);
  }, 60000);
  
  checkAndTriggerReminders(callback);
  
  return () => {
    if (reminderTimer) {
      clearInterval(reminderTimer);
      reminderTimer = null;
    }
  };
}

export function updateReminderConfig(config) {
  reminderConfig = config;
}

export function updateReminderPlans(plans) {
  checkInPlans = plans || [];
  updateReminderRules();
}

function updateReminderRules() {
  if (!reminderConfig || !checkInPlans) return;
  
  reminderRules = checkInPlans
    .filter(plan => plan.status === 'active' && plan.reminderEnabled)
    .map(plan => ({
      planId: plan.id,
      planName: plan.name,
      reminderTime: plan.reminderTime || reminderConfig.defaultTime,
      frequency: plan.frequency,
      customDays: getCustomDays(plan),
      advanceNotice: plan.advanceNotice || reminderConfig.advanceNotice,
      quietHoursEnabled: plan.quietHoursEnabled !== false
    }));
}

function getCustomDays(plan) {
  if (!plan.customRules || plan.customRules.length === 0) return [];
  
  const days = [];
  plan.customRules.forEach(rule => {
    if (rule.days && Array.isArray(rule.days)) {
      days.push(...rule.days);
    }
  });
  
  return [...new Set(days)];
}

function checkAndTriggerReminders(callback) {
  if (!reminderConfig || !reminderConfig.enabled) return;
  
  const now = new Date();
  const currentTime = formatTimeString(now.getHours(), now.getMinutes());
  const currentDayOfWeek = now.getDay();
  const isWorkday = currentDayOfWeek >= 1 && currentDayOfWeek <= 5;
  const isWeekend = currentDayOfWeek === 0 || currentDayOfWeek === 6;
  
  reminderRules.forEach(rule => {
    const reminderTimeWithAdvance = addMinutesToTime(rule.reminderTime, -rule.advanceNotice);
    
    if (shouldRemind(rule, currentTime, reminderTimeWithAdvance, currentDayOfWeek, isWorkday, isWeekend)) {
      if (isInQuietHours(now)) {
        if (!rule.quietHoursEnabled) {
          scheduleQuietHoursEndReminder(rule, now);
        }
        return;
      }
      
      if (callback && typeof callback === 'function') {
        callback({
          planId: rule.planId,
          planName: rule.planName,
          reminderTime: rule.reminderTime,
          advanceNotice: rule.advanceNotice
        });
      }
    }
  });
}

function shouldRemind(rule, currentTime, reminderTimeWithAdvance, dayOfWeek, isWorkday, isWeekend) {
  if (!isTimeInRange(currentTime, reminderTimeWithAdvance, rule.reminderTime)) {
    return false;
  }
  
  switch (rule.frequency) {
    case 'daily':
      return true;
    case 'workdays':
      return isWorkday;
    case 'weekends':
      return isWeekend;
    case 'weekly':
      return rule.customDays && rule.customDays.includes(dayOfWeek);
    case 'custom':
      return rule.customDays && rule.customDays.includes(dayOfWeek);
    default:
      return false;
  }
}

function isTimeInRange(current, start, end) {
  const currentMinutes = timeToMinutes(current);
  const startMinutes = timeToMinutes(start);
  const endMinutes = timeToMinutes(end);
  
  if (startMinutes <= endMinutes) {
    return currentMinutes >= startMinutes && currentMinutes <= endMinutes;
  } else {
    return currentMinutes >= startMinutes || currentMinutes <= endMinutes;
  }
}

function timeToMinutes(timeStr) {
  const [hours, minutes] = timeStr.split(':').map(Number);
  return hours * 60 + minutes;
}

function formatTimeString(hours, minutes) {
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
}

function addMinutesToTime(timeStr, minutes) {
  const totalMinutes = timeToMinutes(timeStr) + minutes;
  const adjustedMinutes = ((totalMinutes % 1440) + 1440) % 1440;
  const hours = Math.floor(adjustedMinutes / 60);
  const mins = adjustedMinutes % 60;
  return formatTimeString(hours, mins);
}

function isInQuietHours(now) {
  if (!reminderConfig || !reminderConfig.quietHours || !reminderConfig.quietHours.enabled) {
    return false;
  }
  
  const currentTime = formatTimeString(now.getHours(), now.getMinutes());
  const quietStart = reminderConfig.quietHours.start;
  const quietEnd = reminderConfig.quietHours.end;
  
  return isTimeInRange(currentTime, quietStart, quietEnd);
}

function scheduleQuietHoursEndReminder(rule, now) {
  if (!reminderConfig || !reminderConfig.quietHours) return;
  
  const quietEnd = reminderConfig.quietHours.end;
  const [endHours, endMinutes] = quietEnd.split(':').map(Number);
  
  const endTimeToday = new Date(now);
  endTimeToday.setHours(endHours, endMinutes, 0, 0);
  
  if (endTimeToday <= now) {
    endTimeToday.setDate(endTimeToday.getDate() + 1);
  }
  
  const delay = endTimeToday.getTime() - now.getTime();
  
  setTimeout(() => {
    if (typeof reminderConfig !== 'undefined' && !isInQuietHours(new Date())) {
      return;
    }
  }, Math.min(delay, 86400000));
}

export function calculateNextReminderTime(plan, config) {
  const now = new Date();
  const reminderTime = plan.reminderTime || config.defaultTime;
  const advanceNotice = plan.advanceNotice || config.advanceNotice;
  
  const [hours, minutes] = reminderTime.split(':').map(Number);
  let nextTime = new Date(now);
  nextTime.setHours(hours, minutes, 0, 0);
  
  nextTime = new Date(nextTime.getTime() - advanceNotice * 60000);
  
  if (nextTime <= now) {
    nextTime.setDate(nextTime.getDate() + 1);
  }
  
  return nextTime;
}

export function requestNotificationPermission() {
  if (!('Notification' in window)) {
    console.warn('This browser does not support notifications');
    return Promise.resolve(false);
  }
  
  if (Notification.permission === 'granted') {
    return Promise.resolve(true);
  }
  
  if (Notification.permission !== 'denied') {
    return Notification.requestPermission();
  }
  
  return Promise.resolve(false);
}

export function showBrowserNotification(title, options = {}) {
  if (!('Notification' in window)) {
    console.warn('This browser does not support notifications');
    return null;
  }
  
  if (Notification.permission !== 'granted') {
    console.warn('Notification permission not granted');
    return null;
  }
  
  const notification = new Notification(title, {
    icon: '/favicon.svg',
    badge: '/favicon.svg',
    ...options
  });
  
  notification.onclick = () => {
    window.focus();
    notification.close();
  };
  
  return notification;
}

export function formatReminderTime(time) {
  if (!time) return '';
  
  const [hours, minutes] = time.split(':').map(Number);
  const period = hours >= 12 ? '下午' : '上午';
  const displayHours = hours % 12 || 12;
  
  return `${period} ${displayHours}:${minutes.toString().padStart(2, '0')}`;
}

export function getFrequencyText(frequency) {
  const frequencyMap = {
    daily: '每日',
    workdays: '工作日',
    weekends: '周末',
    weekly: '每周',
    custom: '自定义'
  };
  
  return frequencyMap[frequency] || '每日';
}

export function destroyReminderEngine() {
  if (reminderTimer) {
    clearInterval(reminderTimer);
    reminderTimer = null;
  }
  reminderConfig = null;
  reminderRules = [];
  checkInPlans = [];
}
