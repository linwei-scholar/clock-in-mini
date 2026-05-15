import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import type { CheckInRecord, CheckInPlan, RecordFormData } from '@/types';
import { RecordDAL, PlanDAL } from '@/database/dal';
import { useAuthStore } from './authStore';
import { usePlanStore } from './planStore';

export interface DateRangeFilter {
  type: 'today' | 'week' | 'month' | 'year' | 'custom';
  customStart?: Date;
  customEnd?: Date;
}

export interface WeekendVsWeekdayStats {
  weekend: {
    totalRecords: number;
    expectedCount: number;
    completionRate: number;
    averagePerDay: number;
  };
  weekday: {
    totalRecords: number;
    expectedCount: number;
    completionRate: number;
    averagePerDay: number;
  };
  comparison: {
    weekendBetter: boolean;
    difference: number;
    percentageDiff: number;
  };
}

export interface TimePeriodStats {
  period: 'earlyMorning' | 'morning' | 'afternoon' | 'evening' | 'night';
  periodName: string;
  recordCount: number;
  percentage: number;
  averagePerDay: number;
}

export interface TrendGrowthStats {
  currentPeriod: {
    count: number;
    rate: number;
  };
  previousPeriod: {
    count: number;
    rate: number;
  };
  weekOverWeek: {
    growth: number;
    growthRate: number;
    isPositive: boolean;
  };
  yearOverYear: {
    growth: number;
    growthRate: number;
    isPositive: boolean;
  };
}

export const useRecordStore = defineStore('record', () => {
  const records = ref<CheckInRecord[]>([]);
  const isLoading = ref(false);
  const error = ref<string | null>(null);
  
  const dateRangeFilter = ref<DateRangeFilter>({ type: 'month' });
  const selectedPlanIds = ref<string[]>([]);
  const selectedTagIds = ref<string[]>([]);
  
  const cache = ref<{
    totalDays: Map<string, number>;
    lastUpdate: number;
  }>({
    totalDays: new Map(),
    lastUpdate: 0
  });
  
  const CACHE_DURATION = 5 * 60 * 1000; // 5分钟缓存
  
  const authStore = useAuthStore();
  
  let planStore: ReturnType<typeof usePlanStore> | null = null;
  
  const userPlans = computed(() => {
    if (!planStore) {
      planStore = usePlanStore();
    }
    const userId = authStore.userId;
    if (!userId) return [];
    return planStore.plans.filter(plan => plan.userId === userId);
  });

  const userRecords = computed(() => {
    const userId = authStore.userId;
    if (!userId) return [];
    return records.value.filter(record => record.userId === userId);
  });

  const todayRecords = computed(() => {
    const today = new Date();
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59, 999);

    return userRecords.value.filter(record => {
      const recordDate = new Date(record.checkInDate);
      return recordDate >= startOfDay && recordDate <= endOfDay;
    });
  });

  const recordCount = computed(() => userRecords.value.length);

  function generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  async function loadRecords(): Promise<void> {
    try {
      isLoading.value = true;
      error.value = null;

      const userId = authStore.userId;
      if (!userId) {
        records.value = [];
        return;
      }

      records.value = await RecordDAL.getByUserId(userId);
    } catch (err) {
      error.value = '加载打卡记录失败';
      console.error('Load records error:', err);
    } finally {
      isLoading.value = false;
    }
  }

  async function loadRecordsByPlanId(planId: string): Promise<CheckInRecord[]> {
    try {
      return await RecordDAL.getByPlanId(planId);
    } catch (err) {
      console.error('Load records by plan error:', err);
      return [];
    }
  }

  async function checkIn(planId: string, formData?: RecordFormData): Promise<CheckInRecord | null> {
    try {
      isLoading.value = true;
      error.value = null;

      const userId = authStore.userId;
      if (!userId) {
        error.value = '用户未登录';
        return null;
      }

      const plan = await PlanDAL.getById(planId);
      if (!plan) {
        error.value = '打卡计划不存在';
        return null;
      }

      if (plan.userId !== userId) {
        error.value = '无权操作该计划';
        return null;
      }

      if (plan.status !== 'active') {
        error.value = '该计划已暂停或归档';
        return null;
      }

      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

      const existingRecord = await RecordDAL.getByPlanAndDate(planId, today);
      if (existingRecord) {
        error.value = '今日已打卡';
        return null;
      }

      if (plan.reminderTime) {
        const [hours, minutes] = plan.reminderTime.split(':').map(Number);
        const reminderTime = new Date(today);
        reminderTime.setHours(hours, minutes, 0, 0);

        const lateThreshold = new Date(reminderTime);
        lateThreshold.setMinutes(lateThreshold.getMinutes() + 30);

        if (now > lateThreshold) {
          return await createRecord(planId, today, now, formData, true);
        }
      }

      return await createRecord(planId, today, now, formData, false);
    } catch (err) {
      error.value = '打卡失败';
      console.error('Check-in error:', err);
      return null;
    } finally {
      isLoading.value = false;
    }
  }

  async function createRecord(
    planId: string,
    checkInDate: Date,
    checkInTime: Date,
    formData?: RecordFormData,
    isLate: boolean = false
  ): Promise<CheckInRecord | null> {
    try {
      const userId = authStore.userId;
      if (!userId) {
        error.value = '用户未登录';
        return null;
      }

      const now = new Date();

      const newRecord: CheckInRecord = {
        id: generateId(),
        planId,
        userId,
        content: formData?.content,
        images: formData?.images || [],
        checkInDate,
        checkInTime,
        isLate,
        createdAt: now,
        updatedAt: now
      };

      await RecordDAL.create(newRecord);
      records.value.push(newRecord);

      return newRecord;
    } catch (err) {
      error.value = '创建打卡记录失败';
      console.error('Create record error:', err);
      return null;
    }
  }

  async function updateRecord(id: string, formData: Partial<RecordFormData>): Promise<boolean> {
    try {
      isLoading.value = true;
      error.value = null;

      const userId = authStore.userId;
      if (!userId) {
        error.value = '用户未登录';
        return false;
      }

      const record = records.value.find(r => r.id === id && r.userId === userId);
      if (!record) {
        error.value = '打卡记录不存在';
        return false;
      }

      const updateData: Partial<CheckInRecord> = {
        updatedAt: new Date()
      };

      if (formData.content !== undefined) updateData.content = formData.content;
      if (formData.images !== undefined) updateData.images = formData.images;

      await RecordDAL.update(id, updateData);

      const index = records.value.findIndex(r => r.id === id);
      if (index !== -1) {
        records.value[index] = { ...records.value[index], ...updateData };
      }

      return true;
    } catch (err) {
      error.value = '更新打卡记录失败';
      console.error('Update record error:', err);
      return false;
    } finally {
      isLoading.value = false;
    }
  }

  async function deleteRecord(id: string): Promise<boolean> {
    try {
      isLoading.value = true;
      error.value = null;

      const userId = authStore.userId;
      if (!userId) {
        error.value = '用户未登录';
        return false;
      }

      const record = records.value.find(r => r.id === id && r.userId === userId);
      if (!record) {
        error.value = '打卡记录不存在';
        return false;
      }

      await RecordDAL.delete(id);
      records.value = records.value.filter(r => r.id !== id);

      return true;
    } catch (err) {
      error.value = '删除打卡记录失败';
      console.error('Delete record error:', err);
      return false;
    } finally {
      isLoading.value = false;
    }
  }

  async function retroCheckIn(planId: string, date: Date, formData?: RecordFormData): Promise<CheckInRecord | null> {
    try {
      isLoading.value = true;
      error.value = null;

      const userId = authStore.userId;
      if (!userId) {
        error.value = '用户未登录';
        return null;
      }

      const plan = await PlanDAL.getById(planId);
      if (!plan) {
        error.value = '打卡计划不存在';
        return null;
      }

      if (plan.userId !== userId) {
        error.value = '无权操作该计划';
        return null;
      }

      const today = new Date();
      const targetDate = new Date(date);
      const daysDiff = Math.floor((today.getTime() - targetDate.getTime()) / (1000 * 60 * 60 * 24));

      if (daysDiff > 7) {
        error.value = '只能补最近7天的打卡';
        return null;
      }

      if (daysDiff < 0) {
        error.value = '不能补未来日期的打卡';
        return null;
      }

      const existingRecord = await RecordDAL.getByPlanAndDate(planId, targetDate);
      if (existingRecord) {
        error.value = '该日期已有打卡记录';
        return null;
      }

      const now = new Date();

      return await createRecord(planId, targetDate, now, formData, true);
    } catch (err) {
      error.value = '补卡失败';
      console.error('Retro check-in error:', err);
      return null;
    } finally {
      isLoading.value = false;
    }
  }

  function getRecordById(id: string): CheckInRecord | undefined {
    return records.value.find(r => r.id === id);
  }

  function getRecordsByPlanId(planId: string): CheckInRecord[] {
    return userRecords.value.filter(r => r.planId === planId);
  }

  function getRecordsByDate(date: Date): CheckInRecord[] {
    const startOfDay = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    const endOfDay = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 23, 59, 59, 999);

    return userRecords.value.filter(record => {
      const recordDate = new Date(record.checkInDate);
      return recordDate >= startOfDay && recordDate <= endOfDay;
    });
  }

  function getRecordsByDateRange(startDate: Date, endDate: Date): CheckInRecord[] {
    return userRecords.value.filter(record => {
      const recordDate = new Date(record.checkInDate);
      return recordDate >= startDate && recordDate <= endDate;
    });
  }

  async function deleteRecordsByPlanId(planId: string): Promise<boolean> {
    try {
      await RecordDAL.deleteByPlanId(planId);
      records.value = records.value.filter(r => r.planId !== planId);
      return true;
    } catch (err) {
      error.value = '删除计划记录失败';
      console.error('Delete records by plan error:', err);
      return false;
    }
  }

  function clearError(): void {
    error.value = null;
  }

  function clearRecords(): void {
    records.value = [];
    cache.value.totalDays.clear();
    cache.value.lastUpdate = 0;
  }
  
  function invalidateCache(): void {
    cache.value.lastUpdate = 0;
  }

  function calculateExpectedCount(plan: CheckInPlan): number {
    const startDate = new Date(plan.startDate);
    const endDate = plan.endDate ? new Date(plan.endDate) : new Date();
    const today = new Date();

    if (startDate > today) return 0;

    const effectiveEndDate = endDate > today ? today : endDate;

    let count = 0;
    const currentDate = new Date(startDate);

    while (currentDate <= effectiveEndDate) {
      const dayOfWeek = currentDate.getDay();

      switch (plan.frequency) {
        case 'daily':
          count++;
          break;
        case 'workdays':
          if (dayOfWeek >= 1 && dayOfWeek <= 5) count++;
          break;
        case 'weekends':
          if (dayOfWeek === 0 || dayOfWeek === 6) count++;
          break;
        case 'weekly':
          if (plan.customRules && plan.customRules.length > 0) {
            if (plan.customRules.some(rule => rule.days?.includes(dayOfWeek))) {
              count++;
            }
          }
          break;
        case 'custom':
          if (plan.customRules && plan.customRules.length > 0) {
            for (const rule of plan.customRules) {
              if (rule.type === 'interval') {
                const daysSinceStart = Math.floor((currentDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
                if (daysSinceStart % rule.value === 0) {
                  count++;
                  break;
                }
              }
            }
          }
          break;
      }

      currentDate.setDate(currentDate.getDate() + 1);
    }

    return count;
  }

  function calculateActualCount(planId: string): number {
    return userRecords.value.filter(r => r.planId === planId).length;
  }

  function calculateCompletionRate(planId: string, expectedCount: number): number {
    if (expectedCount === 0) return 0;
    const actualCount = calculateActualCount(planId);
    return Math.min(Math.round((actualCount / expectedCount) * 100), 100);
  }

  function calculateCurrentStreak(planId: string): number {
    const planRecords = userRecords.value
      .filter(r => r.planId === planId)
      .sort((a, b) => new Date(b.checkInDate).getTime() - new Date(a.checkInDate).getTime());

    if (planRecords.length === 0) return 0;

    let streak = 0;
    let currentDate = new Date();
    currentDate.setHours(0, 0, 0, 0);

    for (const record of planRecords) {
      const recordDate = new Date(record.checkInDate);
      recordDate.setHours(0, 0, 0, 0);

      const diff = Math.floor((currentDate.getTime() - recordDate.getTime()) / (1000 * 60 * 60 * 24));

      if (diff === 0 || diff === 1) {
        streak++;
        currentDate = recordDate;
      } else {
        break;
      }
    }

    return streak;
  }

  function calculateLongestStreak(planId: string): number {
    const planRecords = userRecords.value
      .filter(r => r.planId === planId)
      .sort((a, b) => new Date(a.checkInDate).getTime() - new Date(b.checkInDate).getTime());

    if (planRecords.length === 0) return 0;

    let longestStreak = 1;
    let currentStreak = 1;
    let prevDate = new Date(planRecords[0].checkInDate);
    prevDate.setHours(0, 0, 0, 0);

    for (let i = 1; i < planRecords.length; i++) {
      const currentDate = new Date(planRecords[i].checkInDate);
      currentDate.setHours(0, 0, 0, 0);

      const diff = Math.floor((currentDate.getTime() - prevDate.getTime()) / (1000 * 60 * 60 * 24));

      if (diff === 1) {
        currentStreak++;
        longestStreak = Math.max(longestStreak, currentStreak);
      } else if (diff > 1) {
        currentStreak = 1;
      }

      prevDate = currentDate;
    }

    return longestStreak;
  }

  function calculateTotalDays(planId?: string): number {
    const cacheKey = planId || 'all';
    const now = Date.now();
    
    if (cache.value.totalDays.has(cacheKey) && 
        (now - cache.value.lastUpdate) < CACHE_DURATION) {
      return cache.value.totalDays.get(cacheKey)!;
    }
    
    let targetRecords = userRecords.value;
    if (planId) {
      targetRecords = userRecords.value.filter(r => r.planId === planId);
    }
    
    const uniqueDates = new Set<string>();
    targetRecords.forEach(record => {
      const dateStr = new Date(record.checkInDate).toISOString().split('T')[0];
      uniqueDates.add(dateStr);
    });
    
    const totalDays = uniqueDates.size;
    
    cache.value.totalDays.set(cacheKey, totalDays);
    cache.value.lastUpdate = now;
    
    return totalDays;
  }

  function getPlanStatistics(planId: string) {
    const plan = plans.value.find(p => p.id === planId);
    if (!plan) {
      return {
        expectedCount: 0,
        actualCount: 0,
        completionRate: 0,
        currentStreak: 0,
        longestStreak: 0,
        totalDays: 0
      };
    }

    const expectedCount = calculateExpectedCount(plan);
    const actualCount = calculateActualCount(planId);
    const completionRate = calculateCompletionRate(planId, expectedCount);
    const currentStreak = calculateCurrentStreak(planId);
    const longestStreak = calculateLongestStreak(planId);
    const totalDays = calculateTotalDays(planId);

    return {
      expectedCount,
      actualCount,
      completionRate,
      currentStreak,
      longestStreak,
      totalDays
    };
  }
  
  function getGlobalStatistics() {
    const totalExpectedCount = userPlans.value.reduce((sum, plan) => {
      return sum + calculateExpectedCount(plan);
    }, 0);
    
    const totalActualCount = userRecords.value.length;
    const totalCompletionRate = totalExpectedCount > 0 
      ? Math.min(Math.round((totalActualCount / totalExpectedCount) * 100), 100) 
      : (totalActualCount > 0 ? 100 : 0);
    
    const allRecordsSorted = [...userRecords.value].sort((a, b) => 
      new Date(b.checkInDate).getTime() - new Date(a.checkInDate).getTime()
    );
    
    let globalCurrentStreak = 0;
    if (allRecordsSorted.length > 0) {
      let currentDate = new Date();
      currentDate.setHours(0, 0, 0, 0);
      
      for (const record of allRecordsSorted) {
        const recordDate = new Date(record.checkInDate);
        recordDate.setHours(0, 0, 0, 0);
        
        const diff = Math.floor((currentDate.getTime() - recordDate.getTime()) / (1000 * 60 * 60 * 24));
        
        if (diff === 0 || diff === 1) {
          globalCurrentStreak++;
          currentDate = recordDate;
        } else {
          break;
        }
      }
    }
    
    const totalDays = calculateTotalDays();
    
    return {
      expectedCount: totalExpectedCount,
      actualCount: totalActualCount,
      completionRate: totalCompletionRate,
      currentStreak: globalCurrentStreak,
      longestStreak: 0,
      totalDays: totalDays
    };
  }

  function getDateRange(filter: DateRangeFilter): { start: Date; end: Date } {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    switch (filter.type) {
      case 'today':
        return {
          start: new Date(today),
          end: new Date(today.getTime() + 24 * 60 * 60 * 1000 - 1)
        };
      
      case 'week': {
        const dayOfWeek = (today.getDay() + 6) % 7;
        const monday = new Date(today);
        monday.setDate(today.getDate() - dayOfWeek);
        const sunday = new Date(monday);
        sunday.setDate(monday.getDate() + 6);
        return {
          start: new Date(monday.setHours(0, 0, 0, 0)),
          end: new Date(sunday.setHours(23, 59, 59, 999))
        };
      }
      
      case 'month': {
        const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
        const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0, 23, 59, 59, 999);
        return { start: startOfMonth, end: endOfMonth };
      }
      
      case 'year': {
        const startOfYear = new Date(today.getFullYear(), 0, 1);
        const endOfYear = new Date(today.getFullYear(), 11, 31, 23, 59, 59, 999);
        return { start: startOfYear, end: endOfYear };
      }
      
      case 'custom':
        if (filter.customStart && filter.customEnd) {
          return {
            start: new Date(filter.customStart),
            end: new Date(filter.customEnd.setHours(23, 59, 59, 999))
          };
        }
        return { start: today, end: new Date(today.getTime() + 24 * 60 * 60 * 1000 - 1) };
      
      default:
        return { start: today, end: new Date(today.getTime() + 24 * 60 * 60 * 1000 - 1) };
    }
  }

  function getFilteredRecords(
    filter?: DateRangeFilter,
    planIds?: string[],
    tagIds?: string[]
  ): CheckInRecord[] {
    const effectiveFilter = filter || dateRangeFilter.value;
    const { start, end } = getDateRange(effectiveFilter);
    
    let filtered = userRecords.value.filter(record => {
      const recordDate = new Date(record.checkInDate);
      return recordDate >= start && recordDate <= end;
    });
    
    if (planIds && planIds.length > 0) {
      filtered = filtered.filter(r => planIds.includes(r.planId));
    } else if (selectedPlanIds.value.length > 0) {
      filtered = filtered.filter(r => selectedPlanIds.value.includes(r.planId));
    }
    
    if (tagIds && tagIds.length > 0) {
      filtered = filtered.filter(r => {
        const plan = planStore?.getPlanById(r.planId);
        return plan && tagIds.some(tagId => plan.tagIds.includes(tagId));
      });
    } else if (selectedTagIds.value.length > 0) {
      filtered = filtered.filter(r => {
        const plan = planStore?.getPlanById(r.planId);
        return plan && selectedTagIds.value.some(tagId => plan.tagIds.includes(tagId));
      });
    }
    
    return filtered;
  }

  function getWeekendVsWeekdayStats(filter?: DateRangeFilter): WeekendVsWeekdayStats {
    const effectiveFilter = filter || dateRangeFilter.value;
    const { start, end } = getDateRange(effectiveFilter);
    
    const records = getFilteredRecords(effectiveFilter);
    
    let weekendRecords: CheckInRecord[] = [];
    let weekdayRecords: CheckInRecord[] = [];
    
    records.forEach(record => {
      const date = new Date(record.checkInDate);
      const dayOfWeek = date.getDay();
      const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
      
      if (isWeekend) {
        weekendRecords.push(record);
      } else {
        weekdayRecords.push(record);
      }
    });
    
    const daysInRange = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
    const weekendDays = Math.ceil(daysInRange * 2 / 7);
    const weekdayDays = daysInRange - weekendDays;
    
    let weekendExpected = 0;
    let weekdayExpected = 0;
    
    const plans = planStore?.activePlans || [];
    plans.forEach(plan => {
      const planRecords = records.filter(r => r.planId === plan.id);
      
      if (plan.frequency === 'weekends' || plan.frequency === 'daily') {
        weekendExpected += planRecords.length;
      }
      if (plan.frequency === 'workdays' || plan.frequency === 'daily') {
        weekdayExpected += planRecords.length;
      }
    });
    
    const weekendRate = weekendExpected > 0 
      ? Math.round((weekendRecords.length / weekendExpected) * 100) 
      : (weekendRecords.length > 0 ? 100 : 0);
    
    const weekdayRate = weekdayExpected > 0 
      ? Math.round((weekdayRecords.length / weekdayExpected) * 100) 
      : (weekdayRecords.length > 0 ? 100 : 0);
    
    const weekendBetter = weekendRate > weekdayRate;
    const difference = Math.abs(weekendRate - weekdayRate);
    const percentageDiff = Math.round((difference / Math.max(weekendRate, weekdayRate || 1)) * 100);
    
    return {
      weekend: {
        totalRecords: weekendRecords.length,
        expectedCount: weekendExpected,
        completionRate: weekendRate,
        averagePerDay: weekendDays > 0 ? Math.round(weekendRecords.length / weekendDays * 10) / 10 : 0
      },
      weekday: {
        totalRecords: weekdayRecords.length,
        expectedCount: weekdayExpected,
        completionRate: weekdayRate,
        averagePerDay: weekdayDays > 0 ? Math.round(weekdayRecords.length / weekdayDays * 10) / 10 : 0
      },
      comparison: {
        weekendBetter,
        difference,
        percentageDiff
      }
    };
  }

  function getTimePeriodStats(filter?: DateRangeFilter): TimePeriodStats[] {
    const effectiveFilter = filter || dateRangeFilter.value;
    const records = getFilteredRecords(effectiveFilter);
    const { start, end } = getDateRange(effectiveFilter);
    const daysInRange = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
    
    const periods = [
      { period: 'earlyMorning' as const, periodName: '凌晨', startHour: 0, endHour: 6 },
      { period: 'morning' as const, periodName: '上午', startHour: 6, endHour: 12 },
      { period: 'afternoon' as const, periodName: '下午', startHour: 12, endHour: 18 },
      { period: 'evening' as const, periodName: '晚上', startHour: 18, endHour: 24 }
    ];
    
    const periodStats = periods.map(p => {
      const periodRecords = records.filter(record => {
        const hour = new Date(record.checkInTime).getHours();
        return hour >= p.startHour && hour < p.endHour;
      });
      
      return {
        period: p.period,
        periodName: p.periodName,
        recordCount: periodRecords.length,
        percentage: 0,
        averagePerDay: 0
      };
    });
    
    const totalRecords = periodStats.reduce((sum, p) => sum + p.recordCount, 0);
    
    periodStats.forEach(p => {
      p.percentage = totalRecords > 0 ? Math.round((p.recordCount / totalRecords) * 100) : 0;
      p.averagePerDay = daysInRange > 0 ? Math.round((p.recordCount / daysInRange) * 10) / 10 : 0;
    });
    
    return periodStats.sort((a, b) => b.recordCount - a.recordCount);
  }

  function getBestTimePeriod(filter?: DateRangeFilter): TimePeriodStats | null {
    const stats = getTimePeriodStats(filter);
    if (stats.length === 0) return null;
    return stats.reduce((best, current) => 
      current.recordCount > best.recordCount ? current : best
    );
  }

  function getTimePeriodComparisonByDayType(filter?: DateRangeFilter): {
    workday: TimePeriodStats[];
    weekend: TimePeriodStats[];
  } {
    const effectiveFilter = filter || dateRangeFilter.value;
    const records = getFilteredRecords(effectiveFilter);
    const { start, end } = getDateRange(effectiveFilter);
    const daysInRange = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
    
    const periods = [
      { period: 'earlyMorning' as const, periodName: '凌晨', startHour: 0, endHour: 6 },
      { period: 'morning' as const, periodName: '上午', startHour: 6, endHour: 12 },
      { period: 'afternoon' as const, periodName: '下午', startHour: 12, endHour: 18 },
      { period: 'evening' as const, periodName: '晚上', startHour: 18, endHour: 24 }
    ];
    
    let workdayRecords: CheckInRecord[] = [];
    let weekendRecords: CheckInRecord[] = [];
    
    records.forEach(record => {
      const date = new Date(record.checkInDate);
      const dayOfWeek = date.getDay();
      const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
      
      if (isWeekend) {
        weekendRecords.push(record);
      } else {
        workdayRecords.push(record);
      }
    });
    
    const workdayDays = Math.ceil(daysInRange * 5 / 7);
    const weekendDays = daysInRange - workdayDays;
    
    const getStats = (recs: CheckInRecord[], days: number) => {
      return periods.map(p => {
        const periodRecords = recs.filter(record => {
          const hour = new Date(record.checkInTime).getHours();
          return hour >= p.startHour && hour < p.endHour;
        });
        
        return {
          period: p.period,
          periodName: p.periodName,
          recordCount: periodRecords.length,
          percentage: 0,
          averagePerDay: days > 0 ? Math.round((periodRecords.length / days) * 10) / 10 : 0
        };
      });
    };
    
    const workdayStats = getStats(workdayRecords, workdayDays);
    const weekendStats = getStats(weekendRecords, weekendDays);
    
    const workdayTotal = workdayStats.reduce((sum, p) => sum + p.recordCount, 0);
    const weekendTotal = weekendStats.reduce((sum, p) => sum + p.recordCount, 0);
    
    workdayStats.forEach(p => {
      p.percentage = workdayTotal > 0 ? Math.round((p.recordCount / workdayTotal) * 100) : 0;
    });
    
    weekendStats.forEach(p => {
      p.percentage = weekendTotal > 0 ? Math.round((p.recordCount / weekendTotal) * 100) : 0;
    });
    
    return {
      workday: workdayStats,
      weekend: weekendStats
    };
  }

  function getTrendGrowthStats(filter?: DateRangeFilter): TrendGrowthStats {
    const effectiveFilter = filter || dateRangeFilter.value;
    const { start, end } = getDateRange(effectiveFilter);
    
    const currentRecords = getFilteredRecords(effectiveFilter);
    const periodDays = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
    
    const previousWeekStart = new Date(start.getTime() - 7 * 24 * 60 * 60 * 1000);
    const previousWeekEnd = new Date(end.getTime() - 7 * 24 * 60 * 60 * 1000);
    const previousYearStart = new Date(start.getTime() - 365 * 24 * 60 * 60 * 1000);
    const previousYearEnd = new Date(end.getTime() - 365 * 24 * 60 * 60 * 1000);
    
    const previousWeekFilter: DateRangeFilter = {
      type: 'custom',
      customStart: previousWeekStart,
      customEnd: previousWeekEnd
    };
    const previousYearFilter: DateRangeFilter = {
      type: 'custom',
      customStart: previousYearStart,
      customEnd: previousYearEnd
    };
    
    const previousWeekRecords = getFilteredRecords(previousWeekFilter);
    const previousYearRecords = getFilteredRecords(previousYearFilter);
    
    const currentPlans = planStore?.activePlans || [];
    const currentExpected = currentPlans.reduce((sum, plan) => {
      return sum + calculateExpectedCount(plan);
    }, 0);
    const previousWeekExpected = previousWeekFilter ? periodDays * currentPlans.length : 0;
    const previousYearExpected = previousYearFilter ? periodDays * currentPlans.length : 0;
    
    const currentRate = currentExpected > 0 
      ? Math.round((currentRecords.length / currentExpected) * 100) 
      : (currentRecords.length > 0 ? 100 : 0);
    const previousWeekRate = previousWeekExpected > 0 
      ? Math.round((previousWeekRecords.length / previousWeekExpected) * 100) 
      : (previousWeekRecords.length > 0 ? 100 : 0);
    const previousYearRate = previousYearExpected > 0 
      ? Math.round((previousYearRecords.length / previousYearExpected) * 100) 
      : (previousYearRecords.length > 0 ? 100 : 0);
    
    const weekGrowth = currentRecords.length - previousWeekRecords.length;
    const weekGrowthRate = previousWeekRecords.length > 0 
      ? Math.round((weekGrowth / previousWeekRecords.length) * 100) 
      : (currentRecords.length > 0 ? 100 : 0);
    
    const yearGrowth = currentRecords.length - previousYearRecords.length;
    const yearGrowthRate = previousYearRecords.length > 0 
      ? Math.round((yearGrowth / previousYearRecords.length) * 100) 
      : (currentRecords.length > 0 ? 100 : 0);
    
    return {
      currentPeriod: {
        count: currentRecords.length,
        rate: currentRate
      },
      previousPeriod: {
        count: previousWeekRecords.length,
        rate: previousWeekRate
      },
      weekOverWeek: {
        growth: weekGrowth,
        growthRate: weekGrowthRate,
        isPositive: weekGrowth >= 0
      },
      yearOverYear: {
        growth: yearGrowth,
        growthRate: yearGrowthRate,
        isPositive: yearGrowth >= 0
      }
    };
  }

  function getTrendData(days: number = 14, filter?: DateRangeFilter): Array<{
    date: string;
    label: string;
    count: number;
    percentage: number;
    dayOfWeek: string;
    isWeekend: boolean;
  }> {
    const effectiveFilter = filter || dateRangeFilter.value;
    const records = getFilteredRecords(effectiveFilter);
    const today = new Date();
    const dayNames = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
    const data = [];
    
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(today.getDate() - i);
      date.setHours(0, 0, 0, 0);
      const nextDate = new Date(date);
      nextDate.setDate(date.getDate() + 1);
      
      const dateStr = date.toISOString().split('T')[0];
      const dayRecords = records.filter(r => {
        const recordDate = new Date(r.checkInDate);
        return recordDate >= date && recordDate < nextDate;
      });
      
      const maxPossible = planStore?.activePlans.length || 1;
      const dayOfWeek = date.getDay();
      const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
      
      data.push({
        date: dateStr,
        label: `${date.getMonth() + 1}/${date.getDate()}`,
        count: dayRecords.length,
        percentage: Math.round((dayRecords.length / maxPossible) * 100),
        dayOfWeek: dayNames[dayOfWeek],
        isWeekend
      });
    }
    
    return data;
  }

  function getGrowthTrendData(periods: number = 4): Array<{
    period: string;
    count: number;
    growth: number;
    growthRate: number;
    isPositive: boolean;
  }> {
    const today = new Date();
    const data = [];
    
    for (let i = periods - 1; i >= 0; i--) {
      const periodStart = new Date(today);
      periodStart.setDate(today.getDate() - (i + 1) * 7);
      const periodEnd = new Date(today);
      periodEnd.setDate(today.getDate() - i * 7);
      
      const filter: DateRangeFilter = {
        type: 'custom',
        customStart: periodStart,
        customEnd: periodEnd
      };
      
      const records = getFilteredRecords(filter);
      const previousFilter: DateRangeFilter = {
        type: 'custom',
        customStart: new Date(periodStart.getTime() - 7 * 24 * 60 * 60 * 1000),
        customEnd: periodStart
      };
      const previousRecords = getFilteredRecords(previousFilter);
      
      const growth = records.length - previousRecords.length;
      const growthRate = previousRecords.length > 0 
        ? Math.round((growth / previousRecords.length) * 100) 
        : (records.length > 0 ? 100 : 0);
      
      data.push({
        period: `第${periods - i}周`,
        count: records.length,
        growth,
        growthRate,
        isPositive: growth >= 0
      });
    }
    
    return data;
  }

  function setDateRangeFilter(filter: DateRangeFilter): void {
    dateRangeFilter.value = filter;
    invalidateCache();
  }

  function setSelectedPlans(planIds: string[]): void {
    selectedPlanIds.value = planIds;
    invalidateCache();
  }

  function setSelectedTags(tagIds: string[]): void {
    selectedTagIds.value = tagIds;
    invalidateCache();
  }

  function clearFilters(): void {
    dateRangeFilter.value = { type: 'month' };
    selectedPlanIds.value = [];
    selectedTagIds.value = [];
    invalidateCache();
  }

  return {
    records,
    isLoading,
    error,
    cache,
    userRecords,
    todayRecords,
    recordCount,
    dateRangeFilter,
    selectedPlanIds,
    selectedTagIds,
    loadRecords,
    loadRecordsByPlanId,
    checkIn,
    updateRecord,
    deleteRecord,
    retroCheckIn,
    getRecordById,
    getRecordsByPlanId,
    getRecordsByDate,
    getRecordsByDateRange,
    deleteRecordsByPlanId,
    clearError,
    clearRecords,
    invalidateCache,
    calculateExpectedCount,
    calculateActualCount,
    calculateCompletionRate,
    calculateCurrentStreak,
    calculateLongestStreak,
    calculateTotalDays,
    getPlanStatistics,
    getGlobalStatistics,
    getDateRange,
    getFilteredRecords,
    getWeekendVsWeekdayStats,
    getTimePeriodStats,
    getBestTimePeriod,
    getTimePeriodComparisonByDayType,
    getTrendGrowthStats,
    getTrendData,
    getGrowthTrendData,
    setDateRangeFilter,
    setSelectedPlans,
    setSelectedTags,
    clearFilters
  };
});
