import { db, NotificationLog, UserGoals, WaterLog } from '../offline/db';
import { FoodEntry } from '../supabase';
import { logTracker } from '../logger';
import { SyncManager } from '../offline/SyncManager';

export class NotificationService {
  /**
   * Generates a notification, stores it locally in Dexie, and syncs to server if online.
   */
  public static async triggerNotification(
    title: string,
    message: string,
    type: 'info' | 'success' | 'warning'
  ): Promise<NotificationLog> {
    logTracker.info(`Triggering notification: "${title}" (${type})`);

    const localNotif: NotificationLog = {
      id: crypto.randomUUID(),
      title,
      message,
      type,
      read: false,
      created_at: new Date().toISOString()
    };

    // Save optimistically to IndexedDB
    try {
      await db.cached_notifications.put(localNotif);
    } catch (dbErr) {
      logTracker.apiError('triggerNotification Dexie cache write', dbErr);
    }

    // If online, save to server
    if (SyncManager.isOnline()) {
      try {
        const res = await fetch('/api/notifications', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'create', title, message, type }),
        });

        if (res.ok) {
          const serverNotif = await res.json();
          // Replace temp UUID with server-generated ID
          await db.cached_notifications.delete(localNotif.id);
          await db.cached_notifications.put(serverNotif);
          return serverNotif;
        }
      } catch (err) {
        logTracker.apiError('triggerNotification server sync failed', err);
      }
    }

    return localNotif;
  }

  /**
   * Helper to check if a specific notification was already triggered today.
   */
  private static async wasTriggeredToday(title: string): Promise<boolean> {
    const todayStr = new Date().toISOString().split('T')[0];
    const matching = await db.cached_notifications
      .filter(n => n.title === title && n.created_at.startsWith(todayStr))
      .toArray();
    return matching.length > 0;
  }

  /**
   * Evaluates logged water logs against daily goal and triggers milestones.
   */
  public static async checkWaterGoals(waterLogs: WaterLog[], goals: UserGoals): Promise<void> {
    if (!goals.daily_water) return;

    // Filter water logs logged today
    const todayStr = new Date().toISOString().split('T')[0];
    const todayLogs = waterLogs.filter(log => log.logged_at.startsWith(todayStr));
    const totalWater = todayLogs.reduce((acc, log) => acc + log.amount_ml, 0);

    const title = 'Daily Hydration Completed! 💧';
    if (totalWater >= goals.daily_water) {
      const alreadyTriggered = await this.wasTriggeredToday(title);
      if (!alreadyTriggered) {
        await this.triggerNotification(
          title,
          `Superb! You reached your daily hydration target of ${goals.daily_water} ml. Current: ${totalWater} ml logged.`,
          'success'
        );
      }
    }
  }

  /**
   * Evaluates calorie and protein intake milestones.
   */
  public static async checkCalorieGoals(entries: FoodEntry[], goals: UserGoals): Promise<void> {
    const todayStr = new Date().toISOString().split('T')[0];
    const todayEntries = entries.filter(entry => entry.scanned_at?.startsWith(todayStr));

    const totalCalories = todayEntries.reduce((acc, entry) => acc + entry.calories, 0);
    const totalProtein = todayEntries.reduce((acc, entry) => acc + Number(entry.protein), 0);

    // 1. Calorie Check (trigger alert if user reaches or exceeds calorie goal)
    const calTitle = 'Calorie Goal Reached! 📊';
    if (totalCalories >= goals.daily_calories) {
      const alreadyTriggered = await this.wasTriggeredToday(calTitle);
      if (!alreadyTriggered) {
        await this.triggerNotification(
          calTitle,
          `You have logged ${totalCalories} kcal today, reaching your limit of ${goals.daily_calories} kcal.`,
          'warning'
        );
      }
    }

    // 2. Protein Check (trigger achievement when reaching target protein)
    const proteinTitle = 'Protein Goal Achieved! 🍗';
    if (totalProtein >= goals.daily_protein) {
      const alreadyTriggered = await this.wasTriggeredToday(proteinTitle);
      if (!alreadyTriggered) {
        await this.triggerNotification(
          proteinTitle,
          `Excellent work! You hit your protein goal of ${goals.daily_protein}g today. Current: ${Math.round(totalProtein)}g logged.`,
          'success'
        );
      }
    }
  }

  /**
   * Checks if user has logged water recently and triggers a reminder if they haven't.
   */
  public static async checkHydrationReminder(waterLogs: WaterLog[]): Promise<void> {
    // Check if within daytime (8 AM to 10 PM)
    const now = new Date();
    const hours = now.getHours();
    if (hours < 8 || hours > 22) return;

    // Filter logs for today
    const todayStr = now.toISOString().split('T')[0];
    const todayLogs = waterLogs.filter(log => log.logged_at.startsWith(todayStr));

    let lastLogTime = new Date(todayStr + 'T08:00:00.000Z'); // default to 8 AM today
    if (todayLogs.length > 0) {
      // Sort to find the latest log
      const sorted = [...todayLogs].sort((a, b) => new Date(b.logged_at).getTime() - new Date(a.logged_at).getTime());
      lastLogTime = new Date(sorted[0].logged_at);
    }

    const diffMs = now.getTime() - lastLogTime.getTime();
    const diffHours = diffMs / (1000 * 60 * 60);

    const reminderTitle = 'Stay Hydrated! 🥛';
    if (diffHours >= 3) {
      // Don't spam: check if reminder already triggered in last 3 hours
      const lastThreeHours = new Date(now.getTime() - 3 * 60 * 60 * 1000).toISOString();
      const recentReminders = await db.cached_notifications
        .filter(n => n.title === reminderTitle && n.created_at >= lastThreeHours)
        .toArray();

      if (recentReminders.length === 0) {
        await this.triggerNotification(
          reminderTitle,
          `It has been over 3 hours since your last drink. Remember to log a glass of water to stay on track!`,
          'info'
        );
      }
    }
  }
}
