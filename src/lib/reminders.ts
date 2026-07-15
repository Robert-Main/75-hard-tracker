import { dayTaskLabel, getMissingTasks, isDayComplete } from './challenge'
import { dayTaskLabelFromSettings } from './taskSettings'
import { toDateString } from './dates'
import type { AppState, DayLog, ReminderSettings, TaskSettings } from '../types'

const IDB_NAME = 'seventy-five-hard-reminders'
const IDB_STORE = 'snapshot'

export type ReminderSnapshot = {
  enabled: boolean
  hourly: true
  today: string
  dayComplete: boolean
  hasActiveChallenge: boolean
  lastFiredHour: string | null
}

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(IDB_NAME, 1)
    request.onupgradeneeded = () => {
      const db = request.result
      if (!db.objectStoreNames.contains(IDB_STORE)) {
        db.createObjectStore(IDB_STORE)
      }
    }
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
}

export async function syncReminderSnapshot(
  snapshot: ReminderSnapshot,
): Promise<void> {
  try {
    const db = await openDb()
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(IDB_STORE, 'readwrite')
      tx.objectStore(IDB_STORE).put(snapshot, 'current')
      tx.oncomplete = () => resolve()
      tx.onerror = () => reject(tx.error)
    })
    db.close()
  } catch {
    // IndexedDB may be unavailable; foreground reminders still work.
  }
}

export function currentHourKey(date: Date = new Date()): string {
  return String(date.getHours()).padStart(2, '0')
}

export function firedKey(date: string, hour: string): string {
  return `${date}|${hour}`
}

export function buildReminderSnapshot(
  state: AppState,
  todayLog: DayLog | null,
  today: string = toDateString(),
): ReminderSnapshot {
  const hour = currentHourKey()
  const key = firedKey(today, hour)
  return {
    enabled: state.reminders.enabled,
    hourly: true,
    today,
    dayComplete: todayLog
      ? isDayComplete(todayLog, state.taskSettings)
      : false,
    hasActiveChallenge: state.activeChallenge?.status === 'active',
    lastFiredHour: state.reminders.firedKeys.includes(key) ? hour : null,
  }
}

/** Returns the hour slot to notify now, or null if not due. */
export function dueHourlyReminder(
  reminders: ReminderSettings,
  now: Date = new Date(),
): string | null {
  if (!reminders.enabled) return null
  const hour = currentHourKey(now)
  const today = toDateString(now)
  const key = firedKey(today, hour)
  if (reminders.firedKeys.includes(key)) return null
  return hour
}

export function msUntilNextHour(now: Date = new Date()): number {
  const next = new Date(now)
  next.setHours(now.getHours() + 1, 0, 0, 0)
  return Math.max(1_000, next.getTime() - now.getTime())
}

export async function ensureNotificationPermission(): Promise<NotificationPermission> {
  if (!('Notification' in window)) return 'denied'
  if (Notification.permission === 'granted') return 'granted'
  if (Notification.permission === 'denied') return 'denied'
  return Notification.requestPermission()
}

export async function showWorkoutReminder(body: string): Promise<boolean> {
  if (!('Notification' in window) || Notification.permission !== 'granted') {
    return false
  }

  const title = '75 Hard'
  const options: NotificationOptions & { renotify?: boolean } = {
    body,
    icon: '/icon.svg',
    badge: '/icon.svg',
    tag: '75-hard-workout-reminder',
    renotify: true,
    data: { url: '/' },
  }

  try {
    const reg = await navigator.serviceWorker?.ready
    if (reg?.showNotification) {
      await reg.showNotification(title, options)
      return true
    }
  } catch {
    // Fall through to page Notification
  }

  try {
    new Notification(title, options)
    return true
  } catch {
    return false
  }
}

export async function registerPeriodicReminderSync(): Promise<void> {
  try {
    const reg = await navigator.serviceWorker?.ready
    if (!reg || !('periodicSync' in reg)) return
    const status = await navigator.permissions.query({
      name: 'periodic-background-sync' as PermissionName,
    })
    if (status.state !== 'granted') return
    // @ts-expect-error periodicSync is not in all TS lib DOM typings
    await reg.periodicSync.register('75-hard-reminders', {
      minInterval: 60 * 60 * 1000,
    })
  } catch {
    // Unsupported — foreground scheduler still runs.
  }
}

export function reminderBodyForDay(
  todayLog: DayLog | null,
  taskSettings?: TaskSettings,
): string {
  const missing = getMissingTasks(todayLog ?? undefined, taskSettings)
  if (missing.length === 0) {
    return 'Nice work — today’s 75 Hard list is complete.'
  }
  if (missing.length >= 4) {
    return 'Hourly check-in: workouts, diet, water, reading, or photo still open.'
  }
  const labels = missing
    .slice(0, 3)
    .map((id) =>
      taskSettings ? dayTaskLabelFromSettings(id, taskSettings) : dayTaskLabel(id),
    )
    .join(', ')
  return `Hourly reminder — still left: ${labels}.`
}
