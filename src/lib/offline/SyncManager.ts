import { db, OfflineAction, UserGoals, WaterLog, NotificationLog } from './db';
import { FoodEntry } from '../supabase';
import { WeightLog } from '@/app/api/weight/route';
import { logTracker } from '../logger';

export class SyncManager {
  private static isSyncing = false;

  /**
   * Helper to check if client is online.
   */
  public static isOnline(): boolean {
    if (typeof window === 'undefined') return false;
    return window.navigator.onLine;
  }

  /**
   * Enqueues an action to be processed when online.
   * Includes conflict resolution (e.g. discard create+delete cycles).
   */
  public static async queueAction(
    action: OfflineAction['action'],
    payload: any
  ): Promise<void> {
    const timestamp = new Date().toISOString();

    // 1. Conflict resolution
    if (action === 'UPDATE_GOALS') {
      const pendingGoalUpdates = await db.offline_actions
        .filter((act) => act.action === 'UPDATE_GOALS')
        .toArray();
      for (const item of pendingGoalUpdates) {
        if (item.id !== undefined) await db.offline_actions.delete(item.id);
      }
    }

    if (action === 'DELETE_ENTRY') {
      const entryId = payload.id;
      // Search for any offline CREATE_ENTRY that hasn't been uploaded yet
      const pendingCreates = await db.offline_actions
        .filter((act) => act.action === 'CREATE_ENTRY' && act.payload.id === entryId)
        .toArray();

      if (pendingCreates.length > 0) {
        logTracker.info(`Optimizing offline actions: discarding local CREATE+DELETE cycle for entry ${entryId}`);
        // Discard the create action from the queue
        for (const item of pendingCreates) {
          if (item.id !== undefined) await db.offline_actions.delete(item.id);
        }
        // Remove entry from local cache
        await db.cached_entries.delete(entryId);
        return;
      }
    }

    if (action === 'DELETE_WEIGHT') {
      const weightId = payload.id;
      // Search for any offline CREATE_WEIGHT that hasn't been uploaded yet
      const pendingCreates = await db.offline_actions
        .filter((act) => act.action === 'CREATE_WEIGHT' && act.payload.id === weightId)
        .toArray();

      if (pendingCreates.length > 0) {
        logTracker.info(`Optimizing offline actions: discarding local CREATE+DELETE cycle for weight ${weightId}`);
        // Discard the create action from the queue
        for (const item of pendingCreates) {
          if (item.id !== undefined) await db.offline_actions.delete(item.id);
        }
        // Remove weight from local cache
        await db.cached_weights.delete(weightId);
        return;
      }
    }

    if (action === 'DELETE_WATER') {
      const waterId = payload.id;
      // Search for any offline CREATE_WATER that hasn't been uploaded yet
      const pendingCreates = await db.offline_actions
        .filter((act) => act.action === 'CREATE_WATER' && act.payload.id === waterId)
        .toArray();

      if (pendingCreates.length > 0) {
        logTracker.info(`Optimizing offline actions: discarding local CREATE+DELETE cycle for water ${waterId}`);
        // Discard the create action from the queue
        for (const item of pendingCreates) {
          if (item.id !== undefined) await db.offline_actions.delete(item.id);
        }
        // Remove water log from local cache
        await db.cached_water.delete(waterId);
        return;
      }
    }

    // 2. Optimistically update IndexedDB cache
    if (action === 'CREATE_ENTRY') {
      await db.cached_entries.put(payload);
    } else if (action === 'DELETE_ENTRY') {
      await db.cached_entries.delete(payload.id);
    } else if (action === 'CREATE_WEIGHT') {
      await db.cached_weights.put(payload);
    } else if (action === 'DELETE_WEIGHT') {
      await db.cached_weights.delete(payload.id);
    } else if (action === 'CREATE_WATER') {
      await db.cached_water.put(payload);
    } else if (action === 'DELETE_WATER') {
      await db.cached_water.delete(payload.id);
    } else if (action === 'UPDATE_GOALS') {
      await db.cached_goals.clear();
      await db.cached_goals.put(payload);
    } else if (action === 'MARK_NOTIFICATION_READ') {
      const notif = await db.cached_notifications.get(payload.id);
      if (notif) {
        notif.read = true;
        await db.cached_notifications.put(notif);
      }
    } else if (action === 'DELETE_NOTIFICATION') {
      await db.cached_notifications.delete(payload.id);
    } else if (action === 'CLEAR_ALL_NOTIFICATIONS') {
      await db.cached_notifications.clear();
    }

    // 3. Queue the action
    await db.offline_actions.add({
      action,
      payload,
      timestamp,
    });

    logTracker.info(`Offline action queued: ${action}`);
  }

  /**
   * Refetches data from endpoints and overwrites local cache.
   */
  public static async fetchAndCacheAll(): Promise<{ entries: FoodEntry[]; weights: WeightLog[]; goals: UserGoals; waterLogs: WaterLog[]; notifications: NotificationLog[] }> {
    const DEFAULT_GOALS: UserGoals = {
      user_id: 'current_user',
      daily_calories: 2000,
      daily_protein: 150,
      daily_carbs: 250,
      daily_fat: 65,
      daily_fiber: 38,
      target_weight: 70,
      daily_water: 2500
    };

    let entries: FoodEntry[] = [];
    let weights: WeightLog[] = [];
    let goals: UserGoals = DEFAULT_GOALS;
    let waterLogs: WaterLog[] = [];
    let notifications: NotificationLog[] = [];

    if (!this.isOnline()) {
      // Offline: read from local cache
      entries = await db.cached_entries.orderBy('scanned_at').reverse().toArray();
      weights = await db.cached_weights.orderBy('logged_at').toArray();
      waterLogs = await db.cached_water.orderBy('logged_at').reverse().toArray();
      notifications = await db.cached_notifications.orderBy('created_at').reverse().toArray();
      const cachedGoalsList = await db.cached_goals.toArray();
      goals = cachedGoalsList[0] || DEFAULT_GOALS;
      return { entries, weights, goals, waterLogs, notifications };
    }

    try {
      // 1. Fetch entries
      const entriesRes = await fetch('/api/entries');
      if (entriesRes.ok) {
        entries = await entriesRes.json();
        await db.cached_entries.clear();
        if (entries.length > 0) {
          await db.cached_entries.bulkPut(entries);
        }
      }
    } catch (err) {
      logTracker.apiError('fetchAndCacheAll entries', err);
    }

    try {
      // 2. Fetch weights
      const weightsRes = await fetch('/api/weight');
      if (weightsRes.ok) {
        weights = await weightsRes.json();
        await db.cached_weights.clear();
        if (weights.length > 0) {
          await db.cached_weights.bulkPut(weights);
        }
      }
    } catch (err) {
      logTracker.apiError('fetchAndCacheAll weights', err);
    }

    try {
      // 3. Fetch goals
      const goalsRes = await fetch('/api/goals');
      if (goalsRes.ok) {
        goals = await goalsRes.json();
        await db.cached_goals.clear();
        await db.cached_goals.put(goals);
      } else {
        const cachedGoalsList = await db.cached_goals.toArray();
        goals = cachedGoalsList[0] || DEFAULT_GOALS;
      }
    } catch (err) {
      logTracker.apiError('fetchAndCacheAll goals', err);
      const cachedGoalsList = await db.cached_goals.toArray();
      goals = cachedGoalsList[0] || DEFAULT_GOALS;
    }

    try {
      // 4. Fetch water logs
      const waterRes = await fetch('/api/water');
      if (waterRes.ok) {
        waterLogs = await waterRes.json();
        await db.cached_water.clear();
        if (waterLogs.length > 0) {
          await db.cached_water.bulkPut(waterLogs);
        }
      }
    } catch (err) {
      logTracker.apiError('fetchAndCacheAll water', err);
      waterLogs = await db.cached_water.orderBy('logged_at').reverse().toArray();
    }

    try {
      // 5. Fetch notifications
      const notifRes = await fetch('/api/notifications');
      if (notifRes.ok) {
        notifications = await notifRes.json();
        await db.cached_notifications.clear();
        if (notifications.length > 0) {
          await db.cached_notifications.bulkPut(notifications);
        }
      }
    } catch (err) {
      logTracker.apiError('fetchAndCacheAll notifications', err);
      notifications = await db.cached_notifications.orderBy('created_at').reverse().toArray();
    }

    return { entries, weights, goals, waterLogs, notifications };
  }

  /**
   * Processes the queue sequentially.
   * Triggers a state update on status transitions.
   */
  public static async processQueue(
    onStatusChange?: (status: 'idle' | 'syncing' | 'error') => void,
    onDataUpdated?: () => void
  ): Promise<void> {
    if (this.isSyncing) return;
    if (!this.isOnline()) {
      if (onStatusChange) onStatusChange('idle');
      return;
    }

    const actions = await db.offline_actions.orderBy('id').toArray();
    if (actions.length === 0) {
      if (onStatusChange) onStatusChange('idle');
      return;
    }

    this.isSyncing = true;
    if (onStatusChange) onStatusChange('syncing');

    logTracker.info(`Starting sync queue processing. Actions count: ${actions.length}`);

    try {
      for (const actionItem of actions) {
        const { id, action, payload } = actionItem;
        let res: Response;

        if (action === 'CREATE_ENTRY') {
          // Exclude client-generated ID when sending to Supabase so that DB triggers standard UUID generator
          // unless Supabase is inactive (mock mode) which is handled inside API.
          // We send scanned_at to preserve original creation time.
          res = await fetch('/api/entries', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
          });
          if (res.ok) {
            const savedServerEntry = await res.json();
            // Update cache with real server ID/details
            await db.cached_entries.delete(payload.id);
            await db.cached_entries.put(savedServerEntry);
          }
        } else if (action === 'DELETE_ENTRY') {
          res = await fetch('/api/entries', {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json', 'Content-Length': JSON.stringify({ id: payload.id }).length.toString() },
            body: JSON.stringify({ id: payload.id }),
          });
        } else if (action === 'CREATE_WEIGHT') {
          res = await fetch('/api/weight', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
          });
          if (res.ok) {
            const savedServerWeight = await res.json();
            await db.cached_weights.delete(payload.id);
            await db.cached_weights.put(savedServerWeight);
          }
        } else if (action === 'DELETE_WEIGHT') {
          res = await fetch('/api/weight', {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json', 'Content-Length': JSON.stringify({ id: payload.id }).length.toString() },
            body: JSON.stringify({ id: payload.id }),
          });
        } else if (action === 'UPDATE_GOALS') {
          res = await fetch('/api/goals', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
          });
          if (res.ok) {
            const savedServerGoals = await res.json();
            await db.cached_goals.clear();
            await db.cached_goals.put(savedServerGoals);
          }
        } else if (action === 'CREATE_WATER') {
          res = await fetch('/api/water', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
          });
          if (res.ok) {
            const savedServerWater = await res.json();
            await db.cached_water.delete(payload.id);
            await db.cached_water.put(savedServerWater);
          }
        } else if (action === 'DELETE_WATER') {
          res = await fetch('/api/water', {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json', 'Content-Length': JSON.stringify({ id: payload.id }).length.toString() },
            body: JSON.stringify({ id: payload.id }),
          });
        } else if (action === 'MARK_NOTIFICATION_READ') {
          res = await fetch('/api/notifications', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id: payload.id, action: 'read' }),
          });
        } else if (action === 'DELETE_NOTIFICATION') {
          res = await fetch('/api/notifications', {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json', 'Content-Length': JSON.stringify({ id: payload.id }).length.toString() },
            body: JSON.stringify({ id: payload.id }),
          });
        } else if (action === 'CLEAR_ALL_NOTIFICATIONS') {
          res = await fetch('/api/notifications', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'clear_all' }),
          });
        } else {
          throw new Error(`Unsupported sync action type: ${action}`);
        }

        if (res.ok) {
          // Remove action from queue on success
          if (id !== undefined) await db.offline_actions.delete(id);
          logTracker.info(`Action ${action} synced successfully`);
        } else {
          // Stop queue execution on any failure to prevent out-of-order anomalies
          throw new Error(`Sync API returned non-200 response code: ${res.status}`);
        }
      }

      // Re-fetch fully consolidated records from server
      await this.fetchAndCacheAll();
      logTracker.info('Sync completed successfully');
      if (onStatusChange) onStatusChange('idle');
      if (onDataUpdated) onDataUpdated();
    } catch (err) {
      logTracker.apiError('processQueue execution halted', err);
      if (onStatusChange) onStatusChange('error');
    } finally {
      this.isSyncing = false;
    }
  }

  /**
   * Clear all cache tables (for logging out / user reset).
   */
  public static async resetLocalData(): Promise<void> {
    await db.cached_entries.clear();
    await db.cached_weights.clear();
    await db.cached_goals.clear();
    await db.cached_water.clear();
    await db.cached_notifications.clear();
    await db.offline_actions.clear();
  }
}
