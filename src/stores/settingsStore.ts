import { defineStore } from 'pinia';
import { ref, watch } from 'vue';
import type { UserSettings } from '@/types';
import { useAuthStore } from './authStore';

export const useSettingsStore = defineStore('settings', () => {
  const theme = ref<'light' | 'dark'>('light');
  const defaultCalendarView = ref<'day' | 'week' | 'month' | 'year'>('month');
  const reminderEnabled = ref(true);
  const quietHoursStart = ref('22:00');
  const quietHoursEnd = ref('08:00');
  const isLoading = ref(false);
  const error = ref<string | null>(null);

  const authStore = useAuthStore();

  function loadSettings(): void {
    const settings = authStore.settings;
    
    theme.value = settings.theme;
    defaultCalendarView.value = settings.defaultCalendarView;
    reminderEnabled.value = settings.reminderEnabled;
    quietHoursStart.value = settings.quietHoursStart;
    quietHoursEnd.value = settings.quietHoursEnd;

    applyTheme(theme.value);
  }

  function applyTheme(newTheme: 'light' | 'dark'): void {
    document.documentElement.setAttribute('data-theme', newTheme);
    
    if (newTheme === 'dark') {
      document.body.classList.add('dark-theme');
      document.body.classList.remove('light-theme');
    } else {
      document.body.classList.add('light-theme');
      document.body.classList.remove('dark-theme');
    }
  }

  watch(theme, (newValue) => {
    applyTheme(newValue);
  });

  async function updateTheme(newTheme: 'light' | 'dark'): Promise<boolean> {
    try {
      isLoading.value = true;
      error.value = null;

      theme.value = newTheme;
      
      const success = await authStore.updateSettings({ theme: newTheme });
      if (!success) {
        error.value = authStore.error || '更新主题失败';
        return false;
      }

      return true;
    } catch (err) {
      error.value = '更新主题失败';
      console.error('Update theme error:', err);
      return false;
    } finally {
      isLoading.value = false;
    }
  }

  async function updateCalendarView(view: 'day' | 'week' | 'month' | 'year'): Promise<boolean> {
    try {
      isLoading.value = true;
      error.value = null;

      defaultCalendarView.value = view;
      
      const success = await authStore.updateSettings({ defaultCalendarView: view });
      if (!success) {
        error.value = authStore.error || '更新默认视图失败';
        return false;
      }

      return true;
    } catch (err) {
      error.value = '更新默认视图失败';
      console.error('Update calendar view error:', err);
      return false;
    } finally {
      isLoading.value = false;
    }
  }

  async function updateReminderEnabled(enabled: boolean): Promise<boolean> {
    try {
      isLoading.value = true;
      error.value = null;

      reminderEnabled.value = enabled;
      
      const success = await authStore.updateSettings({ reminderEnabled: enabled });
      if (!success) {
        error.value = authStore.error || '更新提醒设置失败';
        return false;
      }

      return true;
    } catch (err) {
      error.value = '更新提醒设置失败';
      console.error('Update reminder enabled error:', err);
      return false;
    } finally {
      isLoading.value = false;
    }
  }

  async function updateQuietHours(start: string, end: string): Promise<boolean> {
    try {
      isLoading.value = true;
      error.value = null;

      quietHoursStart.value = start;
      quietHoursEnd.value = end;
      
      const success = await authStore.updateSettings({
        quietHoursStart: start,
        quietHoursEnd: end
      });
      
      if (!success) {
        error.value = authStore.error || '更新勿扰时段失败';
        return false;
      }

      return true;
    } catch (err) {
      error.value = '更新勿扰时段失败';
      console.error('Update quiet hours error:', err);
      return false;
    } finally {
      isLoading.value = false;
    }
  }

  async function updateSettings(settings: Partial<UserSettings>): Promise<boolean> {
    try {
      isLoading.value = true;
      error.value = null;

      if (settings.theme !== undefined) theme.value = settings.theme;
      if (settings.defaultCalendarView !== undefined) defaultCalendarView.value = settings.defaultCalendarView;
      if (settings.reminderEnabled !== undefined) reminderEnabled.value = settings.reminderEnabled;
      if (settings.quietHoursStart !== undefined) quietHoursStart.value = settings.quietHoursStart;
      if (settings.quietHoursEnd !== undefined) quietHoursEnd.value = settings.quietHoursEnd;
      
      const success = await authStore.updateSettings(settings);
      if (!success) {
        error.value = authStore.error || '更新设置失败';
        return false;
      }

      return true;
    } catch (err) {
      error.value = '更新设置失败';
      console.error('Update settings error:', err);
      return false;
    } finally {
      isLoading.value = false;
    }
  }

  function getSettings(): UserSettings {
    return {
      theme: theme.value,
      defaultCalendarView: defaultCalendarView.value,
      reminderEnabled: reminderEnabled.value,
      quietHoursStart: quietHoursStart.value,
      quietHoursEnd: quietHoursEnd.value
    };
  }

  function clearError(): void {
    error.value = null;
  }

  function resetSettings(): void {
    theme.value = 'light';
    defaultCalendarView.value = 'month';
    reminderEnabled.value = true;
    quietHoursStart.value = '22:00';
    quietHoursEnd.value = '08:00';
    error.value = null;
  }

  return {
    theme,
    defaultCalendarView,
    reminderEnabled,
    quietHoursStart,
    quietHoursEnd,
    isLoading,
    error,
    loadSettings,
    updateTheme,
    updateCalendarView,
    updateReminderEnabled,
    updateQuietHours,
    updateSettings,
    getSettings,
    clearError,
    resetSettings
  };
});
