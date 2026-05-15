import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import type { User, LoginCredentials, RegisterData, UserSettings } from '@/types';
import { UserDAL } from '@/database/dal';
import { useTagStore } from './tagStore';

const ADMIN_TOKEN = 'checkin-admin-token-2024';

const DEFAULT_SETTINGS: UserSettings = {
  theme: 'light',
  defaultCalendarView: 'month',
  reminderEnabled: true,
  quietHoursStart: '22:00',
  quietHoursEnd: '08:00'
};

export const useAuthStore = defineStore('auth', () => {
  const user = ref<User | null>(null);
  const token = ref<string | null>(null);
  const isLoading = ref(false);
  const error = ref<string | null>(null);
  const loginAttempts = ref(0);
  const lastLoginAttempt = ref<number | null>(null);

  const isAuthenticated = computed(() => !!user.value && !!token.value);
  const userId = computed(() => user.value?.id || null);
  const username = computed(() => user.value?.username || null);
  const settings = computed(() => user.value?.settings || DEFAULT_SETTINGS);

  async function hashPassword(password: string): Promise<string> {
    return CryptoJS.SHA256(password).toString();
  }

  function generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  function generateToken(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 16)}`;
  }

  async function register(data: RegisterData): Promise<boolean> {
    try {
      isLoading.value = true;
      error.value = null;

      if (data.username.length < 4 || data.username.length > 20) {
        error.value = '用户名长度必须在4-20个字符之间';
        return false;
      }

      if (!/^[a-zA-Z0-9_]+$/.test(data.username)) {
        error.value = '用户名只能包含字母、数字和下划线';
        return false;
      }

      if (data.password.length < 6 || data.password.length > 20) {
        error.value = '密码长度必须在6-20个字符之间';
        return false;
      }

      if (!/[a-zA-Z]/.test(data.password) || !/[0-9]/.test(data.password)) {
        error.value = '密码必须包含字母和数字';
        return false;
      }

      if (data.password !== data.confirmPassword) {
        error.value = '两次输入的密码不一致';
        return false;
      }

      const existingUser = await UserDAL.getByUsername(data.username);
      if (existingUser) {
        error.value = '用户名已存在';
        return false;
      }

      const passwordHash = await hashPassword(data.password);
      const now = new Date();

      const newUser: User = {
        id: generateId(),
        username: data.username,
        passwordHash,
        createdAt: now,
        lastLoginAt: now,
        settings: { ...DEFAULT_SETTINGS }
      };

      await UserDAL.create(newUser);

      await initializeDefaultTags(newUser.id);

      user.value = newUser;
      token.value = generateToken();
      localStorage.setItem('auth_token', token.value);

      return true;
    } catch (err) {
      error.value = '注册失败，请稍后重试';
      console.error('Register error:', err);
      return false;
    } finally {
      isLoading.value = false;
    }
  }

  async function login(credentials: LoginCredentials): Promise<boolean> {
    try {
      if (lastLoginAttempt.value && loginAttempts.value >= 3) {
        const timeSinceLastAttempt = Date.now() - lastLoginAttempt.value;
        if (timeSinceLastAttempt < 30000) {
          const remainingTime = Math.ceil((30000 - timeSinceLastAttempt) / 1000);
          error.value = `登录失败次数过多，请等待${remainingTime}秒后再试`;
          return false;
        } else {
          loginAttempts.value = 0;
        }
      }

      isLoading.value = true;
      error.value = null;

      const foundUser = await UserDAL.getByUsername(credentials.username);
      if (!foundUser) {
        error.value = '用户名或密码错误';
        loginAttempts.value++;
        lastLoginAttempt.value = Date.now();
        return false;
      }

      const passwordHash = await hashPassword(credentials.password);
      if (passwordHash !== foundUser.passwordHash) {
        error.value = '用户名或密码错误';
        loginAttempts.value++;
        lastLoginAttempt.value = Date.now();
        return false;
      }

      foundUser.lastLoginAt = new Date();
      await UserDAL.update(foundUser.id, { lastLoginAt: foundUser.lastLoginAt });

      user.value = foundUser;
      token.value = generateToken();
      localStorage.setItem('auth_token', token.value);
      loginAttempts.value = 0;

      return true;
    } catch (err) {
      error.value = '登录失败，请稍后重试';
      console.error('Login error:', err);
      return false;
    } finally {
      isLoading.value = false;
    }
  }

  async function logout(): Promise<void> {
    user.value = null;
    token.value = null;
    isLoading.value = false;
    error.value = null;
    loginAttempts.value = 0;
    lastLoginAttempt.value = null;
    
    localStorage.removeItem('auth_token');
    localStorage.removeItem('isLoggedIn');
    localStorage.removeItem('username');
    localStorage.removeItem('isAdmin');
    localStorage.removeItem('userId');
  }

  async function initializeDefaultTags(userId: string): Promise<void> {
    const defaultTags = [
      { name: '运动健身', icon: 'Running', color: '#409EFF', isDefault: true },
      { name: '合理膳食', icon: 'Food', color: '#67C23A', isDefault: true },
      { name: '阅读学习', icon: 'Reading', color: '#E6A23C', isDefault: true },
      { name: '习惯养成', icon: 'Star', color: '#909399', isDefault: true },
      { name: '工作任务', icon: 'Briefcase', color: '#F56C6C', isDefault: true },
      { name: '兴趣爱好', icon: 'Heart', color: '#9B59B6', isDefault: true }
    ];

    for (const tagData of defaultTags) {
      const tag = {
        id: generateId(),
        userId,
        name: tagData.name,
        icon: tagData.icon,
        color: tagData.color,
        isDefault: tagData.isDefault,
        createdAt: new Date()
      };
      await TagDAL.create(tag);
    }
  }

  async function updateSettings(newSettings: Partial<UserSettings>): Promise<boolean> {
    try {
      if (!user.value) {
        error.value = '用户未登录';
        return false;
      }

      const updatedSettings = { ...user.value.settings, ...newSettings };
      await UserDAL.update(user.value.id, { settings: updatedSettings });
      user.value.settings = updatedSettings;
      return true;
    } catch (err) {
      error.value = '更新设置失败';
      console.error('Update settings error:', err);
      return false;
    }
  }

  async function loadUser(): Promise<boolean> {
    try {
      const savedToken = localStorage.getItem('auth_token');
      if (!savedToken) {
        return false;
      }

      const users = await UserDAL.getAll();
      if (users.length > 0) {
        const lastUser = users.sort((a, b) => 
          new Date(b.lastLoginAt).getTime() - new Date(a.lastLoginAt).getTime()
        )[0];
        
        user.value = lastUser;
        token.value = savedToken;
        return true;
      }

      return false;
    } catch (err) {
      console.error('Load user error:', err);
      return false;
    }
  }

  async function resetPassword(username: string, adminToken: string): Promise<boolean> {
    try {
      if (adminToken !== ADMIN_TOKEN) {
        error.value = '管理员Token无效';
        return false;
      }

      const foundUser = await UserDAL.getByUsername(username);
      if (!foundUser) {
        error.value = '用户不存在';
        return false;
      }

      const defaultPassword = 'AaBb@123456';
      const newPasswordHash = await hashPassword(defaultPassword);
      await UserDAL.update(foundUser.id, { passwordHash: newPasswordHash });

      return true;
    } catch (err) {
      error.value = '密码重置失败';
      console.error('Reset password error:', err);
      return false;
    }
  }

  async function deleteUser(username: string, adminToken: string): Promise<boolean> {
    try {
      if (adminToken !== ADMIN_TOKEN) {
        error.value = '管理员Token无效';
        return false;
      }

      const foundUser = await UserDAL.getByUsername(username);
      if (!foundUser) {
        error.value = '用户不存在';
        return false;
      }

      if (user.value?.id === foundUser.id) {
        error.value = '不能删除当前登录用户';
        return false;
      }

      await UserDAL.delete(foundUser.id);

      return true;
    } catch (err) {
      error.value = '删除用户失败';
      console.error('Delete user error:', err);
      return false;
    }
  }

  function clearError(): void {
    error.value = null;
  }

  return {
    user,
    token,
    isLoading,
    error,
    isAuthenticated,
    userId,
    username,
    settings,
    checkUsernameExists,
    register,
    login,
    logout,
    updateSettings,
    loadUser,
    resetPassword,
    deleteUser,
    clearError
  };
});
