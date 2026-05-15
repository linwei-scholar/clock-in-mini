import Dexie, { type Table } from 'dexie';
import type { User, Tag, CheckInPlan, CheckInRecord } from '@/types';

export class CheckInDB extends Dexie {
  users!: Table<User, string>;
  tags!: Table<Tag, string>;
  plans!: Table<CheckInPlan, string>;
  records!: Table<CheckInRecord, string>;

  constructor() {
    super('checkinDB');

    this.version(1).stores({
      users: 'id, username, createdAt',
      tags: 'id, userId, name, createdAt',
      plans: 'id, userId, name, status, frequency, createdAt, startDate, endDate',
      records: 'id, planId, userId, checkInDate, checkInTime, createdAt'
    });
  }
}

export const db = new CheckInDB();
