import { emptyWorkout, normalizeDayLog } from './challenge'
import { loadProgressPhoto } from './photos'
import { supabase } from './supabase'
import type {
  AppState,
  Challenge,
  DayLog,
  ReminderSettings,
  TaskSettings,
  Workout,
  WorkoutPreference,
} from '../types'
import {
  defaultReminders,
  emptyState,
  normalizeWorkoutPreferences,
} from './storage'
import { normalizeTaskSettings } from './taskSettings'

const PHOTO_BUCKET = 'hard75-photos'

interface ChallengeRow {
  id: string
  user_id: string
  started_at: string
  status: Challenge['status']
  failed_at: string | null
  completed_at: string | null
}

interface DayLogRow {
  challenge_id: string
  day_index: number
  log_date: string
  workout1: unknown
  workout2: unknown
  diet: boolean
  water_oz: number
  reading_pages: number
  reading_title: string
  has_photo: boolean
  photo_path: string | null
  custom_tasks?: unknown
}

function asWorkout(value: unknown): Workout {
  if (!value || typeof value !== 'object') return emptyWorkout()
  const v = value as Partial<Workout>
  return {
    done: Boolean(v.done),
    location:
      v.location === 'indoor' || v.location === 'outdoor' ? v.location : null,
    note: typeof v.note === 'string' ? v.note : '',
    durationMins: typeof v.durationMins === 'number' ? v.durationMins : null,
  }
}

function rowToChallenge(row: ChallengeRow): Challenge {
  return {
    id: row.id,
    startedAt: row.started_at,
    status: row.status,
    failedAt: row.failed_at ?? undefined,
    completedAt: row.completed_at ?? undefined,
  }
}

function asCustomTasks(value: unknown): Record<string, boolean> {
  if (!value || typeof value !== 'object') return {}
  return Object.fromEntries(
    Object.entries(value as Record<string, unknown>).filter(
      (entry): entry is [string, boolean] => typeof entry[1] === 'boolean',
    ),
  )
}

function rowToDayLog(row: DayLogRow): DayLog {
  return normalizeDayLog({
    challengeId: row.challenge_id,
    dayIndex: row.day_index,
    date: row.log_date,
    workout1: asWorkout(row.workout1),
    workout2: asWorkout(row.workout2),
    diet: row.diet,
    waterOz: row.water_oz,
    readingPages: row.reading_pages,
    readingTitle: row.reading_title,
    hasPhoto: row.has_photo,
    customTasks: asCustomTasks(row.custom_tasks),
  })
}

function hasCloudData(state: AppState): boolean {
  return Boolean(
    state.activeChallenge ||
      state.pastChallenges.length > 0 ||
      state.dayLogs.length > 0,
  )
}

function dataUrlToBlob(dataUrl: string): Blob {
  const [header, base64] = dataUrl.split(',')
  const mime = header.match(/:(.*?);/)?.[1] ?? 'image/jpeg'
  const binary = atob(base64)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i += 1) {
    bytes[i] = binary.charCodeAt(i)
  }
  return new Blob([bytes], { type: mime })
}

export function getDayPhotoPath(
  userId: string,
  challengeId: string,
  dayIndex: number,
): string {
  return `${userId}/${challengeId}/${dayIndex}.jpg`
}

export async function fetchAppState(userId: string): Promise<AppState> {
  const [challengesRes, logsRes, remindersRes] = await Promise.all([
    supabase
      .from('hard75_challenges')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false }),
    supabase.from('hard75_day_logs').select('*').eq('user_id', userId),
    supabase
      .from('hard75_reminder_settings')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle(),
  ])

  if (challengesRes.error) throw challengesRes.error
  if (logsRes.error) throw logsRes.error
  if (remindersRes.error) throw remindersRes.error

  const rows = (challengesRes.data ?? []) as ChallengeRow[]
  const activeChallenge =
    rows.find((row) => row.status === 'active') ?? null
  const pastChallenges = rows
    .filter((row) => row.status !== 'active')
    .map(rowToChallenge)

  const remindersRow = remindersRes.data as
    | {
        enabled: boolean
        fired_keys: string[]
        workout_prefs?: unknown
        task_settings?: unknown
      }
    | null

  return {
    activeChallenge: activeChallenge ? rowToChallenge(activeChallenge) : null,
    pastChallenges,
    dayLogs: ((logsRes.data ?? []) as DayLogRow[]).map(rowToDayLog),
    reminders: {
      ...defaultReminders(),
      enabled: remindersRow?.enabled ?? false,
      firedKeys: remindersRow?.fired_keys ?? [],
    },
    workoutPreferences: normalizeWorkoutPreferences(
      remindersRow?.workout_prefs,
    ),
    taskSettings: normalizeTaskSettings(remindersRow?.task_settings),
  }
}

export async function insertChallenge(
  challenge: Challenge,
  userId: string,
): Promise<void> {
  const { error } = await supabase.from('hard75_challenges').insert({
    id: challenge.id,
    user_id: userId,
    started_at: challenge.startedAt,
    status: challenge.status,
    failed_at: challenge.failedAt ?? null,
    completed_at: challenge.completedAt ?? null,
  })
  if (error) throw error
}

export async function updateChallenge(
  challenge: Challenge,
  userId: string,
): Promise<void> {
  const { error } = await supabase
    .from('hard75_challenges')
    .update({
      started_at: challenge.startedAt,
      status: challenge.status,
      failed_at: challenge.failedAt ?? null,
      completed_at: challenge.completedAt ?? null,
    })
    .eq('id', challenge.id)
    .eq('user_id', userId)
  if (error) throw error
}

export async function upsertDayLog(
  log: DayLog,
  userId: string,
  photoPath: string | null = null,
): Promise<void> {
  const basePayload = {
    user_id: userId,
    challenge_id: log.challengeId,
    day_index: log.dayIndex,
    log_date: log.date,
    workout1: log.workout1,
    workout2: log.workout2,
    diet: log.diet,
    water_oz: log.waterOz,
    reading_pages: log.readingPages,
    reading_title: log.readingTitle,
    has_photo: log.hasPhoto,
    photo_path: log.hasPhoto ? photoPath : null,
    updated_at: new Date().toISOString(),
  }

  const withCustom = {
    ...basePayload,
    custom_tasks: log.customTasks ?? {},
  }

  const { error } = await supabase
    .from('hard75_day_logs')
    .upsert(withCustom, { onConflict: 'challenge_id,day_index' })

  if (!error) return

  // Older DBs may not have custom_tasks yet — still sync the rest.
  if (/custom_tasks/i.test(error.message)) {
    const fallback = await supabase
      .from('hard75_day_logs')
      .upsert(basePayload, { onConflict: 'challenge_id,day_index' })
    if (fallback.error) throw fallback.error
    return
  }

  throw error
}

export async function upsertReminders(
  reminders: ReminderSettings,
  userId: string,
  options?: {
    workoutPreferences?: WorkoutPreference[]
    taskSettings?: TaskSettings
  },
): Promise<void> {
  const payload: Record<string, unknown> = {
    user_id: userId,
    enabled: reminders.enabled,
    fired_keys: reminders.firedKeys,
    updated_at: new Date().toISOString(),
  }
  if (options?.workoutPreferences !== undefined) {
    payload.workout_prefs = options.workoutPreferences
  }
  if (options?.taskSettings !== undefined) {
    payload.task_settings = options.taskSettings
  }

  const { error } = await supabase
    .from('hard75_reminder_settings')
    .upsert(payload)

  if (!error) return

  // Retry without newer columns if migrations aren't applied yet.
  const needsPrefsFallback =
    /workout_prefs/i.test(error.message) ||
    /task_settings/i.test(error.message)

  if (needsPrefsFallback) {
    const stripped: Record<string, unknown> = {
      user_id: userId,
      enabled: reminders.enabled,
      fired_keys: reminders.firedKeys,
      updated_at: new Date().toISOString(),
    }
    // Prefer writing whichever columns the DB already supports.
    if (
      options?.workoutPreferences !== undefined &&
      !/workout_prefs/i.test(error.message)
    ) {
      stripped.workout_prefs = options.workoutPreferences
    }
    if (
      options?.taskSettings !== undefined &&
      !/task_settings/i.test(error.message)
    ) {
      stripped.task_settings = options.taskSettings
    }

    const retry = await supabase
      .from('hard75_reminder_settings')
      .upsert(stripped)
    if (retry.error) {
      // Last resort: core reminder fields only.
      const core = await supabase.from('hard75_reminder_settings').upsert({
        user_id: userId,
        enabled: reminders.enabled,
        fired_keys: reminders.firedKeys,
        updated_at: new Date().toISOString(),
      })
      if (core.error) throw core.error
      throw new Error(
        'Reminder settings saved, but workout/task preferences need the latest SQL migration.',
      )
    }
    return
  }

  throw error
}

/** Push reminders + workout prefs + task settings in one write. */
export async function syncUserSettings(
  reminders: ReminderSettings,
  workoutPreferences: WorkoutPreference[],
  taskSettings: TaskSettings,
  userId: string,
): Promise<void> {
  await upsertReminders(reminders, userId, {
    workoutPreferences,
    taskSettings,
  })
}

export async function upsertWorkoutPreferences(
  preferences: WorkoutPreference[],
  reminders: ReminderSettings,
  userId: string,
  taskSettings?: TaskSettings,
): Promise<void> {
  await upsertReminders(reminders, userId, {
    workoutPreferences: preferences,
    taskSettings,
  })
}

export async function upsertTaskSettings(
  taskSettings: TaskSettings,
  reminders: ReminderSettings,
  userId: string,
  workoutPreferences?: WorkoutPreference[],
): Promise<void> {
  await upsertReminders(reminders, userId, {
    taskSettings,
    workoutPreferences,
  })
}

export async function uploadProgressPhoto(
  userId: string,
  challengeId: string,
  dayIndex: number,
  dataUrl: string,
): Promise<string> {
  const path = getDayPhotoPath(userId, challengeId, dayIndex)
  const blob = dataUrlToBlob(dataUrl)
  const { error } = await supabase.storage
    .from(PHOTO_BUCKET)
    .upload(path, blob, { upsert: true, contentType: 'image/jpeg' })
  if (error) throw error
  return path
}

export async function getProgressPhotoUrl(
  photoPath: string,
): Promise<string | null> {
  const { data, error } = await supabase.storage
    .from(PHOTO_BUCKET)
    .createSignedUrl(photoPath, 3600)
  if (error || !data?.signedUrl) return null
  return data.signedUrl
}

export async function removeProgressPhoto(photoPath: string): Promise<void> {
  const { error } = await supabase.storage
    .from(PHOTO_BUCKET)
    .remove([photoPath])
  if (error) throw error
}

async function uploadLocalPhotos(userId: string, logs: DayLog[]): Promise<void> {
  await Promise.all(
    logs
      .filter((log) => log.hasPhoto)
      .map(async (log) => {
        const dataUrl = await loadProgressPhoto(log.challengeId, log.dayIndex)
        if (!dataUrl) return
        await uploadProgressPhoto(
          userId,
          log.challengeId,
          log.dayIndex,
          dataUrl,
        )
      }),
  )
}

function mergeWorkouts(a: Workout, b: Workout): Workout {
  const aDone = Boolean(a.done)
  const bDone = Boolean(b.done)
  if (bDone && !aDone) return b
  if (aDone && !bDone) return a
  return {
    done: aDone || bDone,
    location: a.location ?? b.location,
    note: a.note || b.note,
    durationMins:
      a.durationMins != null || b.durationMins != null
        ? Math.max(a.durationMins ?? 0, b.durationMins ?? 0) || null
        : null,
  }
}

function mergeDayLog(cloud: DayLog, local: DayLog): DayLog {
  return normalizeDayLog({
    ...cloud,
    diet: cloud.diet || local.diet,
    waterOz: Math.max(cloud.waterOz, local.waterOz),
    readingPages: Math.max(cloud.readingPages, local.readingPages),
    readingTitle: cloud.readingTitle || local.readingTitle,
    hasPhoto: cloud.hasPhoto || local.hasPhoto,
    workout1: mergeWorkouts(cloud.workout1, local.workout1),
    workout2: mergeWorkouts(cloud.workout2, local.workout2),
    customTasks: { ...local.customTasks, ...cloud.customTasks },
  })
}

function mergeDayLogs(cloudLogs: DayLog[], localLogs: DayLog[]): DayLog[] {
  const map = new Map<string, DayLog>()
  for (const log of cloudLogs) {
    map.set(`${log.challengeId}:${log.dayIndex}`, log)
  }
  for (const log of localLogs) {
    const key = `${log.challengeId}:${log.dayIndex}`
    const existing = map.get(key)
    map.set(key, existing ? mergeDayLog(existing, log) : log)
  }
  return [...map.values()]
}

export async function migrateLocalIfEmpty(
  userId: string,
  local: AppState,
): Promise<AppState> {
  const cloud = await fetchAppState(userId)
  const withLocalPrefs = (state: AppState): AppState => {
    const localPrefs = local.workoutPreferences
    const cloudPrefs = state.workoutPreferences
    const defaults = normalizeWorkoutPreferences([])
    const cloudIsDefault =
      JSON.stringify(cloudPrefs) === JSON.stringify(defaults)
    const localIsCustom =
      JSON.stringify(localPrefs) !== JSON.stringify(defaults)

    const localTasks = local.taskSettings
    const cloudTasks = state.taskSettings
    const defaultTasks = normalizeTaskSettings({})
    const cloudTasksEmpty =
      JSON.stringify(cloudTasks) === JSON.stringify(defaultTasks)
    const localTasksCustom =
      JSON.stringify(localTasks) !== JSON.stringify(defaultTasks)

    let next = state
    if (cloudIsDefault && localIsCustom) {
      next = { ...next, workoutPreferences: localPrefs }
    }
    if (cloudTasksEmpty && localTasksCustom) {
      next = { ...next, taskSettings: localTasks }
    }

    // Prefer the higher progress when local and cloud both have the same day.
    if (local.dayLogs.length > 0) {
      const mergedLogs = mergeDayLogs(next.dayLogs, local.dayLogs)
      next = { ...next, dayLogs: mergedLogs }

      // Push any local-ahead fields back to the cloud so refresh stays consistent.
      for (const log of mergedLogs) {
        const cloudLog = cloud.dayLogs.find(
          (item) =>
            item.challengeId === log.challengeId &&
            item.dayIndex === log.dayIndex,
        )
        if (
          !cloudLog ||
          cloudLog.readingPages < log.readingPages ||
          cloudLog.waterOz < log.waterOz ||
          (!cloudLog.diet && log.diet) ||
          (!cloudLog.hasPhoto && log.hasPhoto) ||
          (!cloudLog.readingTitle && log.readingTitle)
        ) {
          const photoPath = log.hasPhoto
            ? getDayPhotoPath(userId, log.challengeId, log.dayIndex)
            : null
          void upsertDayLog(log, userId, photoPath).catch(() => undefined)
        }
      }
    }

    return next
  }

  if (hasCloudData(cloud) || !hasCloudData(local)) {
    return withLocalPrefs(cloud)
  }

  if (local.activeChallenge) {
    await insertChallenge(local.activeChallenge, userId)
  }
  for (const challenge of local.pastChallenges) {
    await insertChallenge(challenge, userId)
  }
  for (const log of local.dayLogs) {
    const photoPath = log.hasPhoto
      ? getDayPhotoPath(userId, log.challengeId, log.dayIndex)
      : null
    await upsertDayLog(log, userId, photoPath)
  }
  await uploadLocalPhotos(userId, local.dayLogs)
  try {
    await upsertReminders(local.reminders, userId, {
      workoutPreferences: local.workoutPreferences,
      taskSettings: local.taskSettings,
    })
  } catch {
    await upsertReminders(local.reminders, userId)
  }

  return withLocalPrefs(await fetchAppState(userId))
}

export function emptyCloudState(): AppState {
  return emptyState()
}
