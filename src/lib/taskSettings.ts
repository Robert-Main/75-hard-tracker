import type {
  CustomTaskDefinition,
  DayTaskId,
  TaskSettings,
} from '../types'

export const WATER_GOAL_OZ = 128
export const READING_GOAL_PAGES = 10
export const WORKOUT_GOAL_MINS = 45

export const ALL_CORE_TASK_IDS: DayTaskId[] = [
  'workout1',
  'workout2',
  'photo',
  'diet',
  'water',
  'reading',
]

export const DEFAULT_CORE_TASKS: Record<
  DayTaskId,
  { title: string; subtitle: string }
> = {
  workout1: {
    title: 'Workout #1',
    subtitle: `${WORKOUT_GOAL_MINS} minutes, indoor or outdoor`,
  },
  workout2: {
    title: 'Workout #2 (Outdoor)',
    subtitle: `${WORKOUT_GOAL_MINS} minutes — at least one workout must be outdoors`,
  },
  photo: {
    title: 'Progress Photo',
    subtitle: 'Take a daily progress photo',
  },
  diet: {
    title: 'Follow Your Diet',
    subtitle: 'No cheat meals, no alcohol',
  },
  water: {
    title: 'Drink 1 Gallon of Water',
    subtitle: '3.8 liters throughout the day',
  },
  reading: {
    title: 'Read 10 Pages',
    subtitle: 'Non-fiction / personal growth',
  },
}

export const defaultTaskSettings = (): TaskSettings => ({
  core: {},
  goals: {
    waterOz: WATER_GOAL_OZ,
    readingPages: READING_GOAL_PAGES,
    workoutMins: WORKOUT_GOAL_MINS,
  },
  readingPreferences: [],
  customTasks: [],
  hiddenCore: [],
})

function isDayTaskId(value: string): value is DayTaskId {
  return (ALL_CORE_TASK_IDS as string[]).includes(value)
}

export function normalizeTaskSettings(value: unknown): TaskSettings {
  const base = defaultTaskSettings()
  if (!value || typeof value !== 'object') return base

  const raw = value as Partial<TaskSettings>
  const goals = { ...base.goals, ...(raw.goals ?? {}) }
  goals.waterOz =
    typeof goals.waterOz === 'number' && goals.waterOz > 0
      ? Math.min(512, Math.round(goals.waterOz))
      : WATER_GOAL_OZ
  goals.readingPages =
    typeof goals.readingPages === 'number' && goals.readingPages > 0
      ? Math.min(500, Math.round(goals.readingPages))
      : READING_GOAL_PAGES
  goals.workoutMins =
    typeof goals.workoutMins === 'number' && goals.workoutMins > 0
      ? Math.min(600, Math.round(goals.workoutMins))
      : WORKOUT_GOAL_MINS

  const core: TaskSettings['core'] = {}
  if (raw.core && typeof raw.core === 'object') {
    for (const id of Object.keys(raw.core) as DayTaskId[]) {
      const item = raw.core[id]
      if (!item || typeof item !== 'object') continue
      const title =
        typeof item.title === 'string' ? item.title.trim() : undefined
      const subtitle =
        typeof item.subtitle === 'string' ? item.subtitle.trim() : undefined
      if (title || subtitle) {
        core[id] = {
          ...(title ? { title } : {}),
          ...(subtitle ? { subtitle } : {}),
        }
      }
    }
  }

  const readingPreferences = Array.isArray(raw.readingPreferences)
    ? raw.readingPreferences
        .map((item) => {
          if (!item || typeof item !== 'object') return null
          const row = item as {
            id?: string
            title?: string
            defaultPages?: number
          }
          const title = typeof row.title === 'string' ? row.title.trim() : ''
          if (!title) return null
          return {
            id:
              typeof row.id === 'string' && row.id.length > 0
                ? row.id
                : `read-${crypto.randomUUID()}`,
            title,
            defaultPages:
              typeof row.defaultPages === 'number' && row.defaultPages > 0
                ? Math.min(500, Math.round(row.defaultPages))
                : goals.readingPages,
          }
        })
        .filter((item): item is NonNullable<typeof item> => item !== null)
    : []

  const customTasks = Array.isArray(raw.customTasks)
    ? raw.customTasks
        .map((item) => {
          if (!item || typeof item !== 'object') return null
          const row = item as {
            id?: string
            title?: string
            subtitle?: string
            visible?: boolean
          }
          const title = typeof row.title === 'string' ? row.title.trim() : ''
          if (!title) return null
          return {
            id:
              typeof row.id === 'string' && row.id.length > 0
                ? row.id
                : `custom-${crypto.randomUUID()}`,
            title,
            subtitle:
              typeof row.subtitle === 'string' ? row.subtitle.trim() : '',
            visible: row.visible !== false,
          }
        })
        .filter((item): item is CustomTaskDefinition => item !== null)
    : []

  const hiddenCore = Array.isArray(raw.hiddenCore)
    ? raw.hiddenCore.filter(
        (id): id is DayTaskId => typeof id === 'string' && isDayTaskId(id),
      )
    : []

  return { core, goals, readingPreferences, customTasks, hiddenCore }
}

export function isCoreTaskVisible(
  id: DayTaskId,
  settings: TaskSettings,
): boolean {
  return !settings.hiddenCore.includes(id)
}

export function getVisibleCoreTasks(settings: TaskSettings): DayTaskId[] {
  return ALL_CORE_TASK_IDS.filter((id) => isCoreTaskVisible(id, settings))
}

export function getVisibleCustomTasks(
  settings: TaskSettings,
): CustomTaskDefinition[] {
  return settings.customTasks.filter((task) => task.visible !== false)
}

export function countVisibleTasks(settings: TaskSettings): number {
  return (
    getVisibleCoreTasks(settings).length + getVisibleCustomTasks(settings).length
  )
}

export function getTaskTitle(id: DayTaskId, settings: TaskSettings): string {
  return settings.core[id]?.title?.trim() || DEFAULT_CORE_TASKS[id].title
}

export function getTaskSubtitle(
  id: DayTaskId,
  settings: TaskSettings,
): string {
  const custom = settings.core[id]?.subtitle?.trim()
  if (custom) return custom

  const defaults = DEFAULT_CORE_TASKS[id]
  if (id === 'workout1') {
    return `${settings.goals.workoutMins} minutes, indoor or outdoor`
  }
  if (id === 'workout2') {
    return `${settings.goals.workoutMins} minutes — at least one workout must be outdoors`
  }
  if (id === 'water') {
    return `${settings.goals.waterOz} oz (${(settings.goals.waterOz / 128).toFixed(1)} gallons)`
  }
  if (id === 'reading') {
    return `${settings.goals.readingPages} pages — non-fiction / personal growth`
  }
  return defaults.subtitle
}

export function dayTaskLabelFromSettings(
  id: DayTaskId,
  settings: TaskSettings,
): string {
  return getTaskTitle(id, settings)
}

export function createReadingPreference(
  patch: { title: string; defaultPages?: number },
  settings: TaskSettings,
) {
  return {
    id: `read-${crypto.randomUUID()}`,
    title: patch.title.trim(),
    defaultPages: patch.defaultPages ?? settings.goals.readingPages,
  }
}

export function createCustomTask(patch: {
  title: string
  subtitle?: string
  visible?: boolean
}): CustomTaskDefinition {
  return {
    id: `custom-${crypto.randomUUID()}`,
    title: patch.title.trim(),
    subtitle: patch.subtitle?.trim() ?? '',
    visible: patch.visible !== false,
  }
}
