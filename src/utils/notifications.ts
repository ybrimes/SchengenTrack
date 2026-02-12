import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import { Trip } from '../types';
import { getDaysRemaining, toUTCDate, formatDate } from './schengenCalculator';

const TRIP_REMINDER_DAYS_BEFORE = 2;
const WEEKLY_HOUR = 9; // 9 AM
const WEEKLY_DAY = 2; // Monday = 2 in expo-notifications (1=Sun, 2=Mon, ...)

// Configure how notifications appear when app is in foreground
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
});

export async function requestPermissions(): Promise<boolean> {
  if (!Device.isDevice) {
    // Notifications don't work in simulators/emulators reliably
    return false;
  }

  const { status: existing } = await Notifications.getPermissionsAsync();
  if (existing === 'granted') return true;

  const { status } = await Notifications.requestPermissionsAsync();
  return status === 'granted';
}

export async function cancelAllScheduled(): Promise<void> {
  await Notifications.cancelAllScheduledNotificationsAsync();
}

export async function scheduleTripReminders(trips: Trip[]): Promise<void> {
  const now = new Date();
  const todayStr = formatDate(
    new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()))
  );

  for (const trip of trips) {
    if (!trip.isPlanned) continue;
    if (trip.entryDate <= todayStr) continue;

    // Schedule reminder TRIP_REMINDER_DAYS_BEFORE days before entry
    const entryDate = toUTCDate(trip.entryDate);
    const reminderDate = new Date(entryDate);
    reminderDate.setUTCDate(reminderDate.getUTCDate() - TRIP_REMINDER_DAYS_BEFORE);

    // Set to 9 AM local time
    const trigger = new Date(
      reminderDate.getUTCFullYear(),
      reminderDate.getUTCMonth(),
      reminderDate.getUTCDate(),
      WEEKLY_HOUR,
      0,
      0
    );

    // Don't schedule if the reminder date is in the past
    if (trigger <= now) continue;

    const label = trip.name || trip.country || 'Schengen trip';

    await Notifications.scheduleNotificationAsync({
      content: {
        title: 'Upcoming Trip',
        body: `Your ${label} starts in ${TRIP_REMINDER_DAYS_BEFORE} days. Check your Schengen allowance.`,
        data: { tripId: trip.id },
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DATE,
        date: trigger,
      },
    });
  }
}

export async function scheduleWeeklySummary(
  trips: Trip[]
): Promise<void> {
  const now = new Date();
  const todayDate = new Date(
    Date.UTC(now.getFullYear(), now.getMonth(), now.getDate())
  );
  const remaining = getDaysRemaining(trips, todayDate);

  let body: string;
  if (remaining >= 60) {
    body = `You have ${remaining} Schengen days remaining. You're in good shape.`;
  } else if (remaining >= 30) {
    body = `You have ${remaining} Schengen days remaining. Plan your upcoming trips carefully.`;
  } else if (remaining > 0) {
    body = `Only ${remaining} Schengen days remaining! Check your calendar before booking travel.`;
  } else {
    body = `You have exceeded your Schengen allowance by ${Math.abs(remaining)} day(s). Avoid further travel until days free up.`;
  }

  await Notifications.scheduleNotificationAsync({
    content: {
      title: 'Weekly Schengen Summary',
      body,
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.WEEKLY,
      weekday: WEEKLY_DAY,
      hour: WEEKLY_HOUR,
      minute: 0,
    },
  });
}

export async function rescheduleAll(
  trips: Trip[],
  settings: {
    notificationsEnabled: boolean;
    tripApproachingReminder: boolean;
    weeklyReminder: boolean;
  }
): Promise<void> {
  // Always clear first
  await cancelAllScheduled();

  if (!settings.notificationsEnabled) return;

  const hasPermission = await requestPermissions();
  if (!hasPermission) return;

  if (settings.tripApproachingReminder) {
    await scheduleTripReminders(trips);
  }

  if (settings.weeklyReminder) {
    await scheduleWeeklySummary(trips);
  }
}
