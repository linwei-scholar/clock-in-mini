import { db } from './db';
import type { User, Tag, CheckInPlan, CheckInRecord } from '@/types';

export class UserDAL {
  static async create(user: User): Promise<string> {
    return await db.users.add(user);
  }

  static async getById(id: string): Promise<User | undefined> {
    return await db.users.get(id);
  }

  static async getByUsername(username: string): Promise<User | undefined> {
    return await db.users.where('username').equals(username).first();
  }

  static async update(id: string, user: Partial<User>): Promise<number> {
    return await db.users.update(id, user);
  }

  static async delete(id: string): Promise<void> {
    await db.users.delete(id);
  }

  static async getAll(): Promise<User[]> {
    return await db.users.toArray();
  }
}

export class TagDAL {
  static async create(tag: Tag): Promise<string> {
    return await db.tags.add(tag);
  }

  static async getById(id: string): Promise<Tag | undefined> {
    return await db.tags.get(id);
  }

  static async getByUserId(userId: string): Promise<Tag[]> {
    return await db.tags.where('userId').equals(userId).toArray();
  }

  static async getByIds(ids: string[]): Promise<Tag[]> {
    return await db.tags.where('id').anyOf(ids).toArray();
  }

  static async update(id: string, tag: Partial<Tag>): Promise<number> {
    return await db.tags.update(id, tag);
  }

  static async delete(id: string): Promise<void> {
    await db.tags.delete(id);
  }

  static async getByName(userId: string, name: string): Promise<Tag | undefined> {
    return await db.tags
      .where(['userId', 'name'])
      .equals([userId, name])
      .first();
  }

  static async getAll(): Promise<Tag[]> {
    return await db.tags.toArray();
  }

  static async deleteByUserId(userId: string): Promise<void> {
    await db.tags.where('userId').equals(userId).delete();
  }
}

export class PlanDAL {
  static async create(plan: CheckInPlan): Promise<string> {
    return await db.plans.add(plan);
  }

  static async getById(id: string): Promise<CheckInPlan | undefined> {
    return await db.plans.get(id);
  }

  static async getByUserId(userId: string): Promise<CheckInPlan[]> {
    return await db.plans.where('userId').equals(userId).toArray();
  }

  static async getByStatus(userId: string, status: 'active' | 'paused' | 'archived'): Promise<CheckInPlan[]> {
    return await db.plans
      .where(['userId', 'status'])
      .equals([userId, status])
      .toArray();
  }

  static async update(id: string, plan: Partial<CheckInPlan>): Promise<number> {
    return await db.plans.update(id, plan);
  }

  static async delete(id: string): Promise<void> {
    await db.plans.delete(id);
  }

  static async getByTagId(userId: string, tagId: string): Promise<CheckInPlan[]> {
    const allPlans = await this.getByUserId(userId);
    return allPlans.filter(plan => plan.tagIds.includes(tagId));
  }

  static async getActivePlans(userId: string): Promise<CheckInPlan[]> {
    return await this.getByStatus(userId, 'active');
  }

  static async deleteByUserId(userId: string): Promise<void> {
    await db.plans.where('userId').equals(userId).delete();
  }
}

export class RecordDAL {
  static async create(record: CheckInRecord): Promise<string> {
    return await db.records.add(record);
  }

  static async getById(id: string): Promise<CheckInRecord | undefined> {
    return await db.records.get(id);
  }

  static async getByPlanId(planId: string): Promise<CheckInRecord[]> {
    return await db.records.where('planId').equals(planId).toArray();
  }

  static async getByUserId(userId: string): Promise<CheckInRecord[]> {
    return await db.records.where('userId').equals(userId).toArray();
  }

  static async getByDateRange(userId: string, startDate: Date, endDate: Date): Promise<CheckInRecord[]> {
    return await db.records
      .where('checkInDate')
      .between(startDate, endDate)
      .and(record => record.userId === userId)
      .toArray();
  }

  static async getByDate(userId: string, date: Date): Promise<CheckInRecord[]> {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);
    
    return await this.getByDateRange(userId, startOfDay, endOfDay);
  }

  static async update(id: string, record: Partial<CheckInRecord>): Promise<number> {
    return await db.records.update(id, record);
  }

  static async delete(id: string): Promise<void> {
    await db.records.delete(id);
  }

  static async getByPlanAndDate(planId: string, date: Date): Promise<CheckInRecord | undefined> {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);
    
    return await db.records
      .where('planId')
      .equals(planId)
      .and(record => {
        const recordDate = new Date(record.checkInDate);
        return recordDate >= startOfDay && recordDate <= endOfDay;
      })
      .first();
  }

  static async deleteByPlanId(planId: string): Promise<void> {
    await db.records.where('planId').equals(planId).delete();
  }

  static async deleteByUserId(userId: string): Promise<void> {
    await db.records.where('userId').equals(userId).delete();
  }
}
