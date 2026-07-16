import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import { useAuth } from './AuthContext'
import { useReminderScheduler } from '../hooks/useReminderScheduler'
import {
  checkCompletion,
  createChallenge,
  createDayLog,
  dateForDayIndex,
  findDayLog,
  findMissedDay,
  getCurrentDayIndex,
  markFailed,
  normalizeDayLog,
} from '../lib/challenge'
import {
  fetchAppState,
  getDayPhotoPath,
  insertChallenge,
  migrateLocalIfEmpty,
  syncUserSettings,
  updateChallenge,
  upsertDayLog,
} from '../lib/cloud'
import { toDateString } from '../lib/dates'
import {
  ensureNotificationPermission,
  showWorkoutReminder,
} from '../lib/reminders'
import {
  createWorkoutPreference,
  defaultReminders,
  emptyState,
  loadState,
  saveState,
} from '../lib/storage'
import {
  createCustomTask,
  createReadingPreference,
} from '../lib/taskSettings'
import type {
  AppState,
  Challenge,
  CoreTaskOverride,
  CustomTaskDefinition,
  DayLog,
  DayTaskId,
  ReminderSettings,
  TaskGoals,
  TaskSettings,
  Workout,
  WorkoutPreference,
} from '../types'

interface ChallengeContextValue {
  state: AppState
  today: string
  currentDayIndex: number | null
  todayLog: DayLog | null
  loading: boolean
  syncError: string | null
  failedDay: number | null
  startChallenge: () => Promise<void>
  updateWorkout: (
    which: 'workout1' | 'workout2',
    patch: Partial<Workout>,
    dayIndex?: number,
  ) => Promise<void>
  updateDayLog: (patch: Partial<DayLog>, dayIndex?: number) => Promise<void>
  declareFailed: () => Promise<void>
  acknowledgeAutoFail: () => void
  updateReminders: (patch: Partial<ReminderSettings>) => Promise<boolean>
  markRemindersFired: (keys: string[]) => void
  sendTestReminder: () => Promise<boolean>
  addWorkoutPreference: (
    patch: Omit<WorkoutPreference, 'id'>,
  ) => Promise<void>
  updateWorkoutPreference: (
    id: string,
    patch: Partial<Omit<WorkoutPreference, 'id'>>,
  ) => Promise<void>
  removeWorkoutPreference: (id: string) => Promise<void>
  updateTaskSettings: (next: TaskSettings) => Promise<void>
  updateCoreTask: (id: DayTaskId, patch: CoreTaskOverride) => Promise<void>
  updateTaskGoals: (patch: Partial<TaskGoals>) => Promise<void>
  addReadingPreference: (patch: {
    title: string
    defaultPages?: number
  }) => Promise<void>
  updateReadingPreference: (
    id: string,
    patch: Partial<{ title: string; defaultPages: number }>,
  ) => Promise<void>
  removeReadingPreference: (id: string) => Promise<void>
  addCustomTask: (patch: {
    title: string
    subtitle?: string
    visible?: boolean
  }) => Promise<void>
  updateCustomTask: (
    id: string,
    patch: Partial<Omit<CustomTaskDefinition, 'id'>>,
  ) => Promise<void>
  removeCustomTask: (id: string) => Promise<void>
  setCoreTaskVisible: (id: DayTaskId, visible: boolean) => Promise<void>
  setCustomTaskVisible: (id: string, visible: boolean) => Promise<void>
}

const ChallengeContext = createContext<ChallengeContextValue | null>(null)

function pruneFiredKeys(keys: string[], today: string): string[] {
  return keys.filter((key) => key.startsWith(`${today}|`))
}

function applyDayUpdater(
  prev: AppState,
  challengeId: string,
  dayIndex: number,
  today: string,
  updater: (existing: DayLog) => DayLog,
): AppState {
  const challenge = prev.activeChallenge
  if (!challenge || challenge.status !== 'active') return prev

  const existing =
    findDayLog(prev.dayLogs, challengeId, dayIndex) ??
    createDayLog(challengeId, dayIndex, today)

  const updatedLog = normalizeDayLog(updater(existing))
  const otherLogs = prev.dayLogs.filter(
    (log) => !(log.challengeId === challengeId && log.dayIndex === dayIndex),
  )
  const nextLogs = [...otherLogs, updatedLog]
  const maybeCompleted = checkCompletion(
    challenge,
    nextLogs,
    today,
    prev.taskSettings,
  )

  if (maybeCompleted.status === 'completed') {
    return {
      ...prev,
      activeChallenge: null,
      dayLogs: nextLogs,
      pastChallenges: [maybeCompleted, ...prev.pastChallenges],
    }
  }

  return { ...prev, dayLogs: nextLogs }
}

export function ChallengeProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth()
  const [state, setState] = useState<AppState>(() => loadState())
  const [loading, setLoading] = useState(true)
  const [syncError, setSyncError] = useState<string | null>(null)
  const [failedDay, setFailedDay] = useState<number | null>(null)
  const today = toDateString()
  const autoFailHandled = useRef<string | null>(null)
  const hydratedForUser = useRef<string | null>(null)
  const persistPending = useRef(new Map<string, DayLog>())
  const persistInflight = useRef(new Map<string, Promise<void>>())

  useEffect(() => {
    if (!user) {
      setState(emptyState())
      setLoading(false)
      setSyncError(null)
      hydratedForUser.current = null
      autoFailHandled.current = null
      setFailedDay(null)
      return
    }

    if (hydratedForUser.current === user.id) return

    let cancelled = false
    setLoading(true)
    setSyncError(null)

    void (async () => {
      try {
        const local = loadState()
        const next = await migrateLocalIfEmpty(user.id, local)
        if (!cancelled) {
          setState(next)
          hydratedForUser.current = user.id
          autoFailHandled.current = null
          setFailedDay(null)
          saveState(next)
          // Ensure prefs / task settings / reminders are written to the DB.
          try {
            await syncUserSettings(
              next.reminders,
              next.workoutPreferences,
              next.taskSettings,
              user.id,
            )
          } catch {
            setSyncError(
              'Loaded your data, but preference sync needs the latest database migration.',
            )
          }
        }
      } catch {
        if (!cancelled) {
          setSyncError('Could not load your cloud data.')
          try {
            setState(await fetchAppState(user.id))
          } catch {
            setState(loadState())
          }
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()

    return () => {
      cancelled = true
    }
  }, [user])

  useEffect(() => {
    if (loading) return
    saveState(state)
  }, [state, loading])

  const currentDayIndex = useMemo(() => {
    if (!state.activeChallenge || state.activeChallenge.status !== 'active') {
      return null
    }
    return getCurrentDayIndex(state.activeChallenge.startedAt, today)
  }, [state.activeChallenge, today])

  const pendingAutoFailDay = useMemo(() => {
    if (!state.activeChallenge || state.activeChallenge.status !== 'active') {
      return null
    }
    return findMissedDay(
      state.activeChallenge,
      state.dayLogs,
      today,
      state.taskSettings,
    )
  }, [state.activeChallenge, state.dayLogs, state.taskSettings, today])

  useEffect(() => {
    if (!state.activeChallenge || loading) return
    const missed = findMissedDay(
      state.activeChallenge,
      state.dayLogs,
      today,
      state.taskSettings,
    )
    if (missed === null) return

    const token = `${state.activeChallenge.id}:${missed}`
    if (autoFailHandled.current === token) return
    autoFailHandled.current = token

    setFailedDay(missed)
    const failed = markFailed(state.activeChallenge, today)
    setState((prev) => ({
      ...prev,
      activeChallenge: null,
      pastChallenges: [failed, ...prev.pastChallenges],
    }))

    if (user) {
      void updateChallenge(failed, user.id).catch(() => {
        setSyncError('Could not save challenge failure to the cloud.')
      })
    }
  }, [state.activeChallenge, state.dayLogs, state.taskSettings, today, loading, user])

  const acknowledgeAutoFail = useCallback(() => {
    setFailedDay(null)
  }, [])

  const todayLog = useMemo(() => {
    if (!state.activeChallenge || currentDayIndex === null) return null
    return (
      findDayLog(state.dayLogs, state.activeChallenge.id, currentDayIndex) ??
      null
    )
  }, [state.activeChallenge, state.dayLogs, currentDayIndex])

  const persistDayLog = useCallback(
    async (log: DayLog) => {
      if (!user) return

      const key = `${log.challengeId}:${log.dayIndex}`
      persistPending.current.set(key, log)

      const previous = persistInflight.current.get(key) ?? Promise.resolve()
      const next = previous
        .catch(() => undefined)
        .then(async () => {
          while (persistPending.current.has(key)) {
            const latest = persistPending.current.get(key)
            if (!latest) break
            persistPending.current.delete(key)
            const photoPath = latest.hasPhoto
              ? getDayPhotoPath(user.id, latest.challengeId, latest.dayIndex)
              : null
            await upsertDayLog(latest, user.id, photoPath)
          }
        })
        .finally(() => {
          if (persistInflight.current.get(key) === next) {
            persistInflight.current.delete(key)
          }
        })

      persistInflight.current.set(key, next)
      await next
    },
    [user],
  )

  const startChallenge = useCallback(async () => {
    setFailedDay(null)
    autoFailHandled.current = null
    setSyncError(null)

    const prevActive = state.activeChallenge
    const nextChallenge = createChallenge(today)
    let failedPrevious: Challenge | null = null

    if (prevActive) {
      failedPrevious = markFailed(prevActive, today)
    }

    setState((prev) => {
      let next: AppState = { ...prev, activeChallenge: nextChallenge }
      if (failedPrevious) {
        next = {
          ...next,
          pastChallenges: [failedPrevious, ...prev.pastChallenges],
        }
      }
      return next
    })

    if (!user) return

    try {
      if (failedPrevious) {
        await updateChallenge(failedPrevious, user.id)
      }
      await insertChallenge(nextChallenge, user.id)
    } catch {
      setSyncError('Could not save the new challenge to the cloud.')
    }
  }, [state.activeChallenge, today, user])

  const updateWorkout = useCallback(
    async (
      which: 'workout1' | 'workout2',
      patch: Partial<Workout>,
      targetDay?: number,
    ) => {
      if (failedDay !== null || pendingAutoFailDay !== null) return

      let nextLog: DayLog | null = null
      let completedChallenge: Challenge | null = null
      setState((prev) => {
        const challenge = prev.activeChallenge
        if (!challenge || challenge.status !== 'active') return prev

        const currentDay = getCurrentDayIndex(challenge.startedAt, today)
        const dayIndex = targetDay ?? currentDay
        if (dayIndex < 1 || dayIndex > 75 || dayIndex > currentDay) return prev

        const logDate = dateForDayIndex(challenge.startedAt, dayIndex)
        const next = applyDayUpdater(
          prev,
          challenge.id,
          dayIndex,
          logDate,
          (existing) => {
            const updatedWorkout: Workout = { ...existing[which], ...patch }
            if (patch.done === true && !updatedWorkout.location) {
              updatedWorkout.location = 'indoor'
            }
            if (patch.done === false) {
              updatedWorkout.location = null
            }
            return { ...existing, [which]: updatedWorkout }
          },
        )

        nextLog =
          findDayLog(next.dayLogs, challenge.id, dayIndex) ??
          createDayLog(challenge.id, dayIndex, logDate)

        if (prev.activeChallenge && !next.activeChallenge) {
          completedChallenge = next.pastChallenges[0] ?? null
        }

        return next
      })

      if (nextLog && user) {
        try {
          await persistDayLog(nextLog)
        } catch {
          setSyncError('Could not sync workout to the cloud.')
        }
      }

      if (completedChallenge && user) {
        try {
          await updateChallenge(completedChallenge, user.id)
        } catch {
          setSyncError('Could not save completed challenge to the cloud.')
        }
      }
    },
    [failedDay, pendingAutoFailDay, today, user, persistDayLog],
  )

  const updateDayLog = useCallback(
    async (patch: Partial<DayLog>, targetDay?: number) => {
      if (failedDay !== null || pendingAutoFailDay !== null) return

      let nextLog: DayLog | null = null
      let completedChallenge: Challenge | null = null
      setState((prev) => {
        const challenge = prev.activeChallenge
        if (!challenge || challenge.status !== 'active') return prev

        const currentDay = getCurrentDayIndex(challenge.startedAt, today)
        const dayIndex = targetDay ?? currentDay
        if (dayIndex < 1 || dayIndex > 75 || dayIndex > currentDay) return prev

        const logDate = dateForDayIndex(challenge.startedAt, dayIndex)
        const next = applyDayUpdater(
          prev,
          challenge.id,
          dayIndex,
          logDate,
          (existing) => ({
            ...existing,
            ...patch,
            challengeId: existing.challengeId,
            dayIndex: existing.dayIndex,
            date: existing.date,
          }),
        )

        nextLog =
          findDayLog(next.dayLogs, challenge.id, dayIndex) ??
          createDayLog(challenge.id, dayIndex, logDate)

        if (prev.activeChallenge && !next.activeChallenge) {
          completedChallenge = next.pastChallenges[0] ?? null
        }

        return next
      })

      if (nextLog && user) {
        try {
          await persistDayLog(nextLog)
        } catch {
          setSyncError('Could not sync day’s log to the cloud.')
        }
      }

      if (completedChallenge && user) {
        try {
          await updateChallenge(completedChallenge, user.id)
        } catch {
          setSyncError('Could not save completed challenge to the cloud.')
        }
      }
    },
    [failedDay, pendingAutoFailDay, today, user, persistDayLog],
  )

  const failActive = useCallback(async () => {
    if (!state.activeChallenge) return
    const failed = markFailed(state.activeChallenge, today)
    setState((prev) => ({
      ...prev,
      activeChallenge: null,
      pastChallenges: [failed, ...prev.pastChallenges],
    }))

    if (!user) return
    try {
      await updateChallenge(failed, user.id)
    } catch {
      setSyncError('Could not save failure to the cloud.')
    }
  }, [state.activeChallenge, today, user])

  const markRemindersFired = useCallback(
    (keys: string[]) => {
      setState((prev) => {
        const reminders = {
          ...prev.reminders,
          firedKeys: pruneFiredKeys(
            [...new Set([...prev.reminders.firedKeys, ...keys])],
            today,
          ),
        }

        if (user) {
          void syncUserSettings(
            reminders,
            prev.workoutPreferences,
            prev.taskSettings,
            user.id,
          ).catch(() => {
            setSyncError('Could not sync reminders to the cloud.')
          })
        }

        return { ...prev, reminders }
      })
    },
    [today, user],
  )

  const updateReminders = useCallback(
    async (patch: Partial<ReminderSettings>): Promise<boolean> => {
      const enabling = patch.enabled === true
      if (enabling || (patch.enabled === undefined && state.reminders.enabled)) {
        const permission = await ensureNotificationPermission()
        if (permission !== 'granted') {
          setState((prev) => ({
            ...prev,
            reminders: { ...prev.reminders, ...patch, enabled: false },
          }))
          return false
        }
      }

      const reminders = {
        ...defaultReminders(),
        ...state.reminders,
        ...patch,
      }

      setState((prev) => ({ ...prev, reminders }))

      if (user) {
        try {
          await syncUserSettings(
            reminders,
            state.workoutPreferences,
            state.taskSettings,
            user.id,
          )
        } catch {
          setSyncError('Could not sync reminders to the cloud.')
          return false
        }
      }

      return true
    },
    [state.reminders, state.workoutPreferences, state.taskSettings, user],
  )

  const sendTestReminder = useCallback(async () => {
    const permission = await ensureNotificationPermission()
    if (permission !== 'granted') return false
    return showWorkoutReminder(
      'Test reminder — your 75 Hard nudges are working.',
    )
  }, [])

  const persistWorkoutPreferences = useCallback(
    async (
      preferences: WorkoutPreference[],
      reminders: ReminderSettings,
      taskSettings: TaskSettings,
    ) => {
      if (!user) return
      try {
        await syncUserSettings(reminders, preferences, taskSettings, user.id)
      } catch {
        setSyncError('Could not sync workout preferences to the cloud.')
      }
    },
    [user],
  )

  const persistTaskSettings = useCallback(
    async (
      taskSettings: TaskSettings,
      reminders: ReminderSettings,
      workoutPreferences: WorkoutPreference[],
    ) => {
      if (!user) return
      try {
        await syncUserSettings(
          reminders,
          workoutPreferences,
          taskSettings,
          user.id,
        )
      } catch {
        setSyncError('Could not sync task settings to the cloud.')
      }
    },
    [user],
  )

  const updateTaskSettings = useCallback(
    async (next: TaskSettings) => {
      setState((prev) => ({ ...prev, taskSettings: next }))
      await persistTaskSettings(next, state.reminders, state.workoutPreferences)
    },
    [
      persistTaskSettings,
      state.reminders,
      state.workoutPreferences,
    ],
  )

  const updateCoreTask = useCallback(
    async (id: DayTaskId, patch: CoreTaskOverride) => {
      const next: TaskSettings = {
        ...state.taskSettings,
        core: {
          ...state.taskSettings.core,
          [id]: {
            ...state.taskSettings.core[id],
            ...patch,
            ...(patch.title !== undefined
              ? { title: patch.title.trim() }
              : {}),
            ...(patch.subtitle !== undefined
              ? { subtitle: patch.subtitle.trim() }
              : {}),
          },
        },
      }
      setState((prev) => ({ ...prev, taskSettings: next }))
      await persistTaskSettings(next, state.reminders, state.workoutPreferences)
    },
    [persistTaskSettings, state.reminders, state.taskSettings, state.workoutPreferences],
  )

  const updateTaskGoals = useCallback(
    async (patch: Partial<TaskGoals>) => {
      const next: TaskSettings = {
        ...state.taskSettings,
        goals: { ...state.taskSettings.goals, ...patch },
      }
      setState((prev) => ({ ...prev, taskSettings: next }))
      await persistTaskSettings(next, state.reminders, state.workoutPreferences)
    },
    [persistTaskSettings, state.reminders, state.taskSettings, state.workoutPreferences],
  )

  const addReadingPreference = useCallback(
    async (patch: { title: string; defaultPages?: number }) => {
      const next: TaskSettings = {
        ...state.taskSettings,
        readingPreferences: [
          ...state.taskSettings.readingPreferences,
          createReadingPreference(patch, state.taskSettings),
        ],
      }
      setState((prev) => ({ ...prev, taskSettings: next }))
      await persistTaskSettings(next, state.reminders, state.workoutPreferences)
    },
    [persistTaskSettings, state.reminders, state.taskSettings, state.workoutPreferences],
  )

  const updateReadingPreference = useCallback(
    async (
      id: string,
      patch: Partial<{ title: string; defaultPages: number }>,
    ) => {
      const next: TaskSettings = {
        ...state.taskSettings,
        readingPreferences: state.taskSettings.readingPreferences.map(
          (item) =>
            item.id === id
              ? {
                  ...item,
                  ...patch,
                  ...(patch.title !== undefined
                    ? { title: patch.title.trim() }
                    : {}),
                }
              : item,
        ),
      }
      setState((prev) => ({ ...prev, taskSettings: next }))
      await persistTaskSettings(next, state.reminders, state.workoutPreferences)
    },
    [persistTaskSettings, state.reminders, state.taskSettings, state.workoutPreferences],
  )

  const removeReadingPreference = useCallback(
    async (id: string) => {
      const next: TaskSettings = {
        ...state.taskSettings,
        readingPreferences: state.taskSettings.readingPreferences.filter(
          (item) => item.id !== id,
        ),
      }
      setState((prev) => ({ ...prev, taskSettings: next }))
      await persistTaskSettings(next, state.reminders, state.workoutPreferences)
    },
    [persistTaskSettings, state.reminders, state.taskSettings, state.workoutPreferences],
  )

  const addCustomTask = useCallback(
    async (patch: { title: string; subtitle?: string; visible?: boolean }) => {
      const next: TaskSettings = {
        ...state.taskSettings,
        customTasks: [
          ...state.taskSettings.customTasks,
          createCustomTask(patch),
        ],
      }
      setState((prev) => ({ ...prev, taskSettings: next }))
      await persistTaskSettings(next, state.reminders, state.workoutPreferences)
    },
    [persistTaskSettings, state.reminders, state.taskSettings, state.workoutPreferences],
  )

  const updateCustomTask = useCallback(
    async (
      id: string,
      patch: Partial<Omit<CustomTaskDefinition, 'id'>>,
    ) => {
      const next: TaskSettings = {
        ...state.taskSettings,
        customTasks: state.taskSettings.customTasks.map((item) =>
          item.id === id
            ? {
                ...item,
                ...patch,
                ...(patch.title !== undefined
                  ? { title: patch.title.trim() }
                  : {}),
                ...(patch.subtitle !== undefined
                  ? { subtitle: patch.subtitle.trim() }
                  : {}),
              }
            : item,
        ),
      }
      setState((prev) => ({ ...prev, taskSettings: next }))
      await persistTaskSettings(next, state.reminders, state.workoutPreferences)
    },
    [persistTaskSettings, state.reminders, state.taskSettings, state.workoutPreferences],
  )

  const removeCustomTask = useCallback(
    async (id: string) => {
      const next: TaskSettings = {
        ...state.taskSettings,
        customTasks: state.taskSettings.customTasks.filter(
          (item) => item.id !== id,
        ),
      }
      setState((prev) => ({ ...prev, taskSettings: next }))
      await persistTaskSettings(next, state.reminders, state.workoutPreferences)
    },
    [persistTaskSettings, state.reminders, state.taskSettings, state.workoutPreferences],
  )

  const setCoreTaskVisible = useCallback(
    async (id: DayTaskId, visible: boolean) => {
      const hidden = new Set(state.taskSettings.hiddenCore)
      if (visible) hidden.delete(id)
      else hidden.add(id)
      const next: TaskSettings = {
        ...state.taskSettings,
        hiddenCore: [...hidden],
      }
      setState((prev) => ({ ...prev, taskSettings: next }))
      await persistTaskSettings(next, state.reminders, state.workoutPreferences)
    },
    [persistTaskSettings, state.reminders, state.taskSettings, state.workoutPreferences],
  )

  const setCustomTaskVisible = useCallback(
    async (id: string, visible: boolean) => {
      const next: TaskSettings = {
        ...state.taskSettings,
        customTasks: state.taskSettings.customTasks.map((item) =>
          item.id === id ? { ...item, visible } : item,
        ),
      }
      setState((prev) => ({ ...prev, taskSettings: next }))
      await persistTaskSettings(next, state.reminders, state.workoutPreferences)
    },
    [persistTaskSettings, state.reminders, state.taskSettings, state.workoutPreferences],
  )

  const addWorkoutPreference = useCallback(
    async (patch: Omit<WorkoutPreference, 'id'>) => {
      const next = [
        ...state.workoutPreferences,
        createWorkoutPreference(patch),
      ]
      setState((prev) => ({ ...prev, workoutPreferences: next }))
      await persistWorkoutPreferences(
        next,
        state.reminders,
        state.taskSettings,
      )
    },
    [
      state.workoutPreferences,
      state.reminders,
      state.taskSettings,
      persistWorkoutPreferences,
    ],
  )

  const updateWorkoutPreference = useCallback(
    async (
      id: string,
      patch: Partial<Omit<WorkoutPreference, 'id'>>,
    ) => {
      const next = state.workoutPreferences.map((item) =>
        item.id === id
          ? {
              ...item,
              ...patch,
              name: patch.name !== undefined ? patch.name.trim() : item.name,
            }
          : item,
      )
      setState((prev) => ({ ...prev, workoutPreferences: next }))
      await persistWorkoutPreferences(
        next,
        state.reminders,
        state.taskSettings,
      )
    },
    [
      state.workoutPreferences,
      state.reminders,
      state.taskSettings,
      persistWorkoutPreferences,
    ],
  )

  const removeWorkoutPreference = useCallback(
    async (id: string) => {
      const next = state.workoutPreferences.filter((item) => item.id !== id)
      setState((prev) => ({ ...prev, workoutPreferences: next }))
      await persistWorkoutPreferences(
        next,
        state.reminders,
        state.taskSettings,
      )
    },
    [
      state.workoutPreferences,
      state.reminders,
      state.taskSettings,
      persistWorkoutPreferences,
    ],
  )

  useReminderScheduler({
    state,
    todayLog,
    pendingAutoFailDay: failedDay ?? pendingAutoFailDay,
    markRemindersFired,
  })

  const value = useMemo<ChallengeContextValue>(
    () => ({
      state,
      today,
      currentDayIndex,
      todayLog,
      loading,
      syncError,
      failedDay,
      startChallenge,
      updateWorkout,
      updateDayLog,
      declareFailed: failActive,
      acknowledgeAutoFail,
      updateReminders,
      markRemindersFired,
      sendTestReminder,
      addWorkoutPreference,
      updateWorkoutPreference,
      removeWorkoutPreference,
      updateTaskSettings,
      updateCoreTask,
      updateTaskGoals,
      addReadingPreference,
      updateReadingPreference,
      removeReadingPreference,
      addCustomTask,
      updateCustomTask,
      removeCustomTask,
      setCoreTaskVisible,
      setCustomTaskVisible,
    }),
    [
      state,
      today,
      currentDayIndex,
      todayLog,
      loading,
      syncError,
      failedDay,
      startChallenge,
      updateWorkout,
      updateDayLog,
      failActive,
      acknowledgeAutoFail,
      updateReminders,
      markRemindersFired,
      sendTestReminder,
      addWorkoutPreference,
      updateWorkoutPreference,
      removeWorkoutPreference,
      updateTaskSettings,
      updateCoreTask,
      updateTaskGoals,
      addReadingPreference,
      updateReadingPreference,
      removeReadingPreference,
      addCustomTask,
      updateCustomTask,
      removeCustomTask,
      setCoreTaskVisible,
      setCustomTaskVisible,
    ],
  )

  return (
    <ChallengeContext.Provider value={value}>
      {children}
    </ChallengeContext.Provider>
  )
}

export function useChallenge(): ChallengeContextValue {
  const ctx = useContext(ChallengeContext)
  if (!ctx) {
    throw new Error('useChallenge must be used within ChallengeProvider')
  }
  return ctx
}
