import { normalizeDayLog } from './challenge'
import { defaultTaskSettings, normalizeTaskSettings } from './taskSettings'
import type {
  AppState,
  ReminderSettings,
  WorkoutLocation,
  WorkoutPreference,
} from '../types'

const STORAGE_KEY = 'seventy-five-hard:v1'

export const defaultReminders = (): ReminderSettings => ({
  enabled: false,
  firedKeys: [],
})

export const defaultWorkoutPreferences = (): WorkoutPreference[] => [
  {
    id: 'pref-run',
    name: 'Outdoor run',
    location: 'outdoor',
    durationMins: 45,
  },
  {
    id: 'pref-walk',
    name: 'Walk',
    location: 'outdoor',
    durationMins: 45,
  },
  {
    id: 'pref-bike',
    name: 'Bike',
    location: 'outdoor',
    durationMins: 45,
  },
  {
    id: 'pref-strength',
    name: 'Strength training',
    location: 'indoor',
    durationMins: 45,
  },
  {
    id: 'pref-hiit',
    name: 'HIIT',
    location: 'indoor',
    durationMins: 45,
  },
  {
    id: 'pref-yoga',
    name: 'Yoga',
    location: 'indoor',
    durationMins: 45,
  },
  {
    id: 'pref-swim',
    name: 'Swim',
    location: 'indoor',
    durationMins: 45,
  },
  {
    id: 'pref-mobility',
    name: 'Stretch / mobility',
    location: 'indoor',
    durationMins: 45,
  },
]

function normalizePreference(raw: Partial<WorkoutPreference>): WorkoutPreference | null {
  const name = typeof raw.name === 'string' ? raw.name.trim() : ''
  if (!name) return null
  const location: WorkoutLocation =
    raw.location === 'outdoor' ? 'outdoor' : 'indoor'
  const durationMins =
    typeof raw.durationMins === 'number' && raw.durationMins > 0
      ? Math.min(600, Math.round(raw.durationMins))
      : 45
  return {
    id:
      typeof raw.id === 'string' && raw.id.length > 0
        ? raw.id
        : `pref-${crypto.randomUUID()}`,
    name,
    location,
    durationMins,
  }
}

export function normalizeWorkoutPreferences(
  value: unknown,
): WorkoutPreference[] {
  if (!Array.isArray(value) || value.length === 0) {
    return defaultWorkoutPreferences()
  }
  const next = value
    .map((item) =>
      item && typeof item === 'object'
        ? normalizePreference(item as Partial<WorkoutPreference>)
        : null,
    )
    .filter((item): item is WorkoutPreference => item !== null)
  return next.length > 0 ? next : defaultWorkoutPreferences()
}

export const emptyState = (): AppState => ({
  activeChallenge: null,
  dayLogs: [],
  pastChallenges: [],
  reminders: defaultReminders(),
  workoutPreferences: defaultWorkoutPreferences(),
  taskSettings: defaultTaskSettings(),
})

export function loadState(): AppState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return emptyState()
    const parsed = JSON.parse(raw) as Partial<AppState>
    return {
      activeChallenge: parsed.activeChallenge ?? null,
      dayLogs: (parsed.dayLogs ?? []).map((log) => normalizeDayLog(log)),
      pastChallenges: parsed.pastChallenges ?? [],
      reminders: {
        ...defaultReminders(),
        ...parsed.reminders,
        firedKeys: parsed.reminders?.firedKeys ?? [],
      },
      workoutPreferences: normalizeWorkoutPreferences(
        parsed.workoutPreferences,
      ),
      taskSettings: normalizeTaskSettings(parsed.taskSettings),
    }
  } catch {
    return emptyState()
  }
}

export function saveState(state: AppState): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
}

export function createWorkoutPreference(
  patch: Omit<WorkoutPreference, 'id'> & { id?: string },
): WorkoutPreference {
  return {
    id: patch.id ?? `pref-${crypto.randomUUID()}`,
    name: patch.name.trim(),
    location: patch.location,
    durationMins: patch.durationMins,
  }
}
