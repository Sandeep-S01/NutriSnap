import Dexie, { type Table } from 'dexie';
import { FoodEntry } from '../supabase';
import { WeightLog } from '@/app/api/weight/route';

export interface WaterLog {
  id?: string;
  user_id?: string;
  amount_ml: number;
  logged_at: string;
  created_at?: string;
}

export interface UserGoals {
  user_id?: string;
  daily_calories: number;
  daily_protein: number;
  daily_carbs: number;
  daily_fat: number;
  daily_fiber: number;
  target_weight: number;
  daily_water?: number;
  updated_at?: string;
}

export interface NotificationLog {
  id: string;
  user_id?: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning';
  read: boolean;
  created_at: string;
}

export interface OfflineAction {
  id?: number;
  action: 'CREATE_ENTRY' | 'DELETE_ENTRY' | 'CREATE_WEIGHT' | 'DELETE_WEIGHT' | 'UPDATE_GOALS' | 'CREATE_WATER' | 'DELETE_WATER' | 'MARK_NOTIFICATION_READ' | 'DELETE_NOTIFICATION' | 'CLEAR_ALL_NOTIFICATIONS';
  payload: any; // Contains the food entry/weight log object, ID, user goals object, water log object, or notification log details
  timestamp: string;
}

export class ScanFoodDatabase extends Dexie {
  cached_entries!: Table<FoodEntry, string>;
  cached_weights!: Table<WeightLog, string>;
  cached_goals!: Table<UserGoals, string>;
  cached_water!: Table<WaterLog, string>;
  cached_notifications!: Table<NotificationLog, string>;
  offline_actions!: Table<OfflineAction, number>;

  constructor() {
    super('ScanFoodDB');
    this.version(3).stores({
      cached_entries: 'id, scanned_at',
      cached_weights: 'id, logged_at',
      cached_goals: 'user_id',
      cached_water: 'id, logged_at',
      offline_actions: '++id, action, timestamp',
    });
    this.version(4).stores({
      cached_entries: 'id, scanned_at',
      cached_weights: 'id, logged_at',
      cached_goals: 'user_id',
      cached_water: 'id, logged_at',
      cached_notifications: 'id, created_at',
      offline_actions: '++id, action, timestamp',
    });
  }
}

export const db = new ScanFoodDatabase();
