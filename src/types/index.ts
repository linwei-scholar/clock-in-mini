export interface User {
  id: string;
  username: string;
  passwordHash: string;
  createdAt: Date;
  lastLoginAt: Date;
  settings: UserSettings;
}

export interface ReminderConfig {
  enabled: boolean;
  defaultTime: string;
  quietHours: {
    enabled: boolean;
    start: string;
    end: string;
  };
  advanceNotice: number;
}

export interface ReminderRule {
  planId: string;
  planName: string;
  reminderTime: string;
  frequency: 'daily' | 'workdays' | 'weekends' | 'custom';
  customDays?: number[];
  advanceNotice: number;
  quietHoursEnabled: boolean;
}

export interface UserSettings {
  theme: 'light' | 'dark';
  defaultCalendarView: 'day' | 'week' | 'month' | 'year';
  reminderEnabled: boolean;
  quietHoursStart: string;
  quietHoursEnd: string;
  reminderConfig?: ReminderConfig;
}

export interface Tag {
  id: string;
  userId: string;
  name: string;
  icon: string;
  color: string;
  isDefault: boolean;
  createdAt: Date;
}

export interface CheckInPlan {
  id: string;
  userId: string;
  name: string;
  description?: string;
  tagIds: string[];
  frequency: 'daily' | 'weekly' | 'workdays' | 'weekends' | 'custom';
  customRules?: CustomRule[];
  startDate: Date;
  endDate?: Date;
  targetCount?: number;
  reminderTime?: string;
  reminderEnabled: boolean;
  advanceNotice?: number;
  quietHoursEnabled?: boolean;
  status: 'active' | 'paused' | 'archived';
  createdAt: Date;
  updatedAt: Date;
}

export interface CustomRule {
  type: 'interval' | 'monthly';
  value: number;
  days?: number[];
  week?: number;
}

export interface CheckInRecord {
  id: string;
  planId: string;
  userId: string;
  content?: string;
  images: string[];
  checkInDate: Date;
  checkInTime: Date;
  isLate: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface LoginCredentials {
  username: string;
  password: string;
}

export interface RegisterData {
  username: string;
  password: string;
  confirmPassword: string;
}

export interface TagFormData {
  name: string;
  icon: string;
  color: string;
}

export interface PlanFormData {
  name: string;
  description?: string;
  tagIds: string[];
  frequency: 'daily' | 'weekly' | 'workdays' | 'weekends' | 'custom';
  customRules?: CustomRule[];
  startDate: Date;
  endDate?: Date;
  targetCount?: number;
  reminderTime?: string;
  reminderEnabled: boolean;
  advanceNotice?: number;
  quietHoursEnabled?: boolean;
}

export interface RecordFormData {
  content?: string;
  images: string[];
}
