import { useEffect, useRef } from 'react'
import { isDayComplete } from '../lib/challenge'
import {
  buildReminderSnapshot,
  dueHourlyReminder,
  firedKey,
  msUntilNextHour,
  registerPeriodicReminderSync,
  reminderBodyForDay,
  showWorkoutReminder,
  syncReminderSnapshot,
} from '../lib/reminders'
import { toDateString } from '../lib/dates'
import type { AppState, DayLog, ReminderSettings } from '../types'

interface UseReminderSchedulerArgs {
  state: AppState
  todayLog: DayLog | null
  pendingAutoFailDay: number | null
  markRemindersFired: (keys: string[]) => void
}

export function useReminderScheduler({
  state,
  todayLog,
  pendingAutoFailDay,
  markRemindersFired,
}: UseReminderSchedulerArgs): void {
  const todayLogRef = useRef(todayLog)
  const stateRef = useRef(state)
  const pendingRef = useRef(pendingAutoFailDay)
  const markRef = useRef(markRemindersFired)

  todayLogRef.current = todayLog
  stateRef.current = state
  pendingRef.current = pendingAutoFailDay
  markRef.current = markRemindersFired

  useEffect(() => {
    void syncReminderSnapshot(buildReminderSnapshot(state, todayLog))
  }, [state, todayLog])

  useEffect(() => {
    if (!state.reminders.enabled) return
    void registerPeriodicReminderSync()
  }, [state.reminders.enabled])

  useEffect(() => {
    let timeoutId: number | undefined
    let intervalId: number | undefined
    let cancelled = false

    const tick = async () => {
      if (cancelled) return
      const current = stateRef.current
      const reminders = current.reminders
      if (!reminders.enabled) return
      if (Notification.permission !== 'granted') return
      if (!current.activeChallenge || current.activeChallenge.status !== 'active') {
        return
      }
      if (pendingRef.current !== null) return

      const log = todayLogRef.current
      if (log && isDayComplete(log, current.taskSettings)) return

      const hour = dueHourlyReminder(reminders)
      if (hour === null) return

      const today = toDateString()
      const body = reminderBodyForDay(log, current.taskSettings)
      const shown = await showWorkoutReminder(body)
      if (!shown || cancelled) return

      markRef.current([firedKey(today, hour)])
    }

    const scheduleNextHour = () => {
      if (timeoutId !== undefined) window.clearTimeout(timeoutId)
      if (!stateRef.current.reminders.enabled) return
      timeoutId = window.setTimeout(() => {
        void tick().then(scheduleNextHour)
      }, msUntilNextHour())
    }

    void tick()
    scheduleNextHour()
    // Backup poll so we still catch the hour if the timeout drifts
    intervalId = window.setInterval(() => {
      void tick()
    }, 60_000)

    const onVisible = () => {
      if (document.visibilityState === 'visible') void tick()
    }
    document.addEventListener('visibilitychange', onVisible)

    return () => {
      cancelled = true
      if (timeoutId !== undefined) window.clearTimeout(timeoutId)
      if (intervalId !== undefined) window.clearInterval(intervalId)
      document.removeEventListener('visibilitychange', onVisible)
    }
  }, [state.reminders.enabled])
}

export type { ReminderSettings }
