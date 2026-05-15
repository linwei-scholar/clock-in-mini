import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import type { CheckInPlan, PlanFormData } from '@/types';
import { PlanDAL } from '@/database/dal';
import { useAuthStore } from './authStore';

export const usePlanStore = defineStore('plan', () => {
  const plans = ref<CheckInPlan[]>([]);
  const isLoading = ref(false);
  const error = ref<string | null>(null);

  const authStore = useAuthStore();

  const userPlans = computed(() => {
    const userId = authStore.userId;
    if (!userId) return [];
    return plans.value.filter(plan => plan.userId === userId);
  });

  const activePlans = computed(() => {
    return userPlans.value.filter(plan => plan.status === 'active');
  });

  const pausedPlans = computed(() => {
    return userPlans.value.filter(plan => plan.status === 'paused');
  });

  const archivedPlans = computed(() => {
    return userPlans.value.filter(plan => plan.status === 'archived');
  });

  const planCount = computed(() => userPlans.value.length);
  const activePlanCount = computed(() => activePlans.value.length);

  function generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  async function loadPlans(): Promise<void> {
    try {
      isLoading.value = true;
      error.value = null;

      const userId = authStore.userId;
      if (!userId) {
        plans.value = [];
        return;
      }

      plans.value = await PlanDAL.getByUserId(userId);
    } catch (err) {
      error.value = '加载打卡计划失败';
      console.error('Load plans error:', err);
    } finally {
      isLoading.value = false;
    }
  }

  async function createPlan(formData: PlanFormData): Promise<CheckInPlan | null> {
    try {
      isLoading.value = true;
      error.value = null;

      const userId = authStore.userId;
      if (!userId) {
        error.value = '用户未登录';
        return null;
      }

      if (formData.name.length < 4 || formData.name.length > 30) {
        error.value = '计划名称长度必须在4-30个字符之间';
        return null;
      }

      if (formData.description && formData.description.length > 200) {
        error.value = '计划描述不能超过200个字符';
        return null;
      }

      if (formData.tagIds.length > 3) {
        error.value = '最多只能关联3个标签';
        return null;
      }

      const now = new Date();

      const newPlan: CheckInPlan = {
        id: generateId(),
        userId,
        name: formData.name,
        description: formData.description,
        tagIds: formData.tagIds,
        frequency: formData.frequency,
        customRules: formData.customRules,
        startDate: new Date(formData.startDate),
        endDate: formData.endDate ? new Date(formData.endDate) : undefined,
        targetCount: formData.targetCount,
        reminderTime: formData.reminderTime,
        reminderEnabled: formData.reminderEnabled,
        advanceNotice: formData.advanceNotice || 0,
        quietHoursEnabled: formData.quietHoursEnabled !== false,
        status: 'active',
        createdAt: now,
        updatedAt: now
      };

      await PlanDAL.create(newPlan);
      plans.value.push(newPlan);

      return newPlan;
    } catch (err) {
      error.value = '创建打卡计划失败';
      console.error('Create plan error:', err);
      return null;
    } finally {
      isLoading.value = false;
    }
  }

  async function updatePlan(id: string, formData: Partial<PlanFormData>): Promise<boolean> {
    try {
      isLoading.value = true;
      error.value = null;

      const userId = authStore.userId;
      if (!userId) {
        error.value = '用户未登录';
        return false;
      }

      const plan = plans.value.find(p => p.id === id && p.userId === userId);
      if (!plan) {
        error.value = '打卡计划不存在';
        return false;
      }

      if (formData.name !== undefined && (formData.name.length < 4 || formData.name.length > 30)) {
        error.value = '计划名称长度必须在4-30个字符之间';
        return false;
      }

      if (formData.description !== undefined && formData.description.length > 200) {
        error.value = '计划描述不能超过200个字符';
        return false;
      }

      if (formData.tagIds && formData.tagIds.length > 3) {
        error.value = '最多只能关联3个标签';
        return false;
      }

      const updateData: Partial<CheckInPlan> = {
        updatedAt: new Date()
      };

      if (formData.name !== undefined) updateData.name = formData.name;
      if (formData.description !== undefined) updateData.description = formData.description;
      if (formData.tagIds !== undefined) updateData.tagIds = formData.tagIds;
      if (formData.frequency !== undefined) updateData.frequency = formData.frequency;
      if (formData.customRules !== undefined) updateData.customRules = formData.customRules;
      if (formData.startDate !== undefined) updateData.startDate = new Date(formData.startDate);
      if (formData.endDate !== undefined) updateData.endDate = formData.endDate ? new Date(formData.endDate) : undefined;
      if (formData.targetCount !== undefined) updateData.targetCount = formData.targetCount;
      if (formData.reminderTime !== undefined) updateData.reminderTime = formData.reminderTime;
      if (formData.reminderEnabled !== undefined) updateData.reminderEnabled = formData.reminderEnabled;
      if (formData.advanceNotice !== undefined) updateData.advanceNotice = formData.advanceNotice;
      if (formData.quietHoursEnabled !== undefined) updateData.quietHoursEnabled = formData.quietHoursEnabled;

      await PlanDAL.update(id, updateData);

      const index = plans.value.findIndex(p => p.id === id);
      if (index !== -1) {
        plans.value[index] = { ...plans.value[index], ...updateData };
      }

      return true;
    } catch (err) {
      error.value = '更新打卡计划失败';
      console.error('Update plan error:', err);
      return false;
    } finally {
      isLoading.value = false;
    }
  }

  async function deletePlan(id: string): Promise<boolean> {
    try {
      isLoading.value = true;
      error.value = null;

      const userId = authStore.userId;
      if (!userId) {
        error.value = '用户未登录';
        return false;
      }

      const plan = plans.value.find(p => p.id === id && p.userId === userId);
      if (!plan) {
        error.value = '打卡计划不存在';
        return false;
      }

      await PlanDAL.delete(id);
      plans.value = plans.value.filter(p => p.id !== id);

      return true;
    } catch (err) {
      error.value = '删除打卡计划失败';
      console.error('Delete plan error:', err);
      return false;
    } finally {
      isLoading.value = false;
    }
  }

  async function pausePlan(id: string): Promise<boolean> {
    return await updatePlan(id, {}).then(async () => {
      if (error.value) return false;
      
      try {
        const userId = authStore.userId;
        if (!userId) return false;

        await PlanDAL.update(id, { status: 'paused', updatedAt: new Date() });
        
        const index = plans.value.findIndex(p => p.id === id);
        if (index !== -1) {
          plans.value[index].status = 'paused';
        }

        return true;
      } catch (err) {
        error.value = '暂停计划失败';
        console.error('Pause plan error:', err);
        return false;
      }
    });
  }

  async function resumePlan(id: string): Promise<boolean> {
    try {
      const userId = authStore.userId;
      if (!userId) {
        error.value = '用户未登录';
        return false;
      }

      await PlanDAL.update(id, { status: 'active', updatedAt: new Date() });

      const index = plans.value.findIndex(p => p.id === id);
      if (index !== -1) {
        plans.value[index].status = 'active';
      }

      return true;
    } catch (err) {
      error.value = '恢复计划失败';
      console.error('Resume plan error:', err);
      return false;
    }
  }

  async function archivePlan(id: string): Promise<boolean> {
    try {
      const userId = authStore.userId;
      if (!userId) {
        error.value = '用户未登录';
        return false;
      }

      await PlanDAL.update(id, { status: 'archived', updatedAt: new Date() });

      const index = plans.value.findIndex(p => p.id === id);
      if (index !== -1) {
        plans.value[index].status = 'archived';
      }

      return true;
    } catch (err) {
      error.value = '归档计划失败';
      console.error('Archive plan error:', err);
      return false;
    }
  }

  function getPlanById(id: string): CheckInPlan | undefined {
    return plans.value.find(p => p.id === id);
  }

  function getPlansByTagId(tagId: string): CheckInPlan[] {
    return userPlans.value.filter(plan => plan.tagIds.includes(tagId));
  }

  function getPlansByTagIds(tagIds: string[]): CheckInPlan[] {
    if (tagIds.length === 0) return userPlans.value;
    return userPlans.value.filter(plan =>
      tagIds.some(tagId => plan.tagIds.includes(tagId))
    );
  }

  function getPlansByStatus(status: 'active' | 'paused' | 'archived'): CheckInPlan[] {
    return userPlans.value.filter(plan => plan.status === status);
  }

  function getTodayPlans(): CheckInPlan[] {
    const today = new Date();
    const dayOfWeek = today.getDay();
    const isWorkday = dayOfWeek >= 1 && dayOfWeek <= 5;
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

    return activePlans.value.filter(plan => {
      const startDate = new Date(plan.startDate);
      if (startDate > today) return false;

      if (plan.endDate) {
        const endDate = new Date(plan.endDate);
        if (endDate < today) return false;
      }

      switch (plan.frequency) {
        case 'daily':
          return true;
        case 'workdays':
          return isWorkday;
        case 'weekends':
          return isWeekend;
        case 'weekly':
          if (plan.customRules && plan.customRules.length > 0) {
            return plan.customRules.some(rule => rule.days?.includes(dayOfWeek));
          }
          return false;
        case 'custom':
          if (plan.customRules && plan.customRules.length > 0) {
            for (const rule of plan.customRules) {
              if (rule.type === 'interval') {
                const daysSinceStart = Math.floor((today.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
                return daysSinceStart % rule.value === 0;
              }
            }
          }
          return false;
        default:
          return false;
      }
    });
  }

  function clearError(): void {
    error.value = null;
  }

  function clearPlans(): void {
    plans.value = [];
  }

  return {
    plans,
    isLoading,
    error,
    userPlans,
    activePlans,
    pausedPlans,
    archivedPlans,
    planCount,
    activePlanCount,
    loadPlans,
    createPlan,
    updatePlan,
    deletePlan,
    pausePlan,
    resumePlan,
    archivePlan,
    getPlanById,
    getPlansByTagId,
    getPlansByTagIds,
    getPlansByStatus,
    getTodayPlans,
    clearError,
    clearPlans
  };
});
