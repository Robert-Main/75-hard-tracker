export type WorkoutLocation = 'indoor' | 'outdoor'

export interface Workout {
  done: boolean
  location: WorkoutLocation | null
  note: string
  durationMins: number | null
}

/** Saved workout types the user can tap into today’s logs. */
export interface WorkoutPreference {
  id: string
  name: string
  location: WorkoutLocation
  durationMins: number
}

export interface DayLog {
  challengeId: string
  dayIndex: number
  date: string
  workout1: Workout
  workout2: Workout
  /** Followed diet with no cheat meals / alcohol */
  diet: boolean
  /** Water intake in fluid ounces (1 gallon = 128) */
  waterOz: number
  /** Non-fiction pages read today */
  readingPages: number
  readingTitle: string
  /** Progress photo stored in IndexedDB when true */
  hasPhoto: boolean
  /** Optional personal tasks the user added — id → done */
  customTasks: Record<string, boolean>
}

export interface CoreTaskOverride {
  title?: string
  subtitle?: string
}

export interface TaskGoals {
  waterOz: number
  readingPages: number
  workoutMins: number
}

export interface ReadingPreference {
  id: string
  title: string
  defaultPages: number
}

export interface CustomTaskDefinition {
  id: string
  title: string
  subtitle: string
  /** When false, hidden from Today (default true). */
  visible: boolean
}

export interface TaskSettings {
  core: Partial<Record<DayTaskId, CoreTaskOverride>>
  goals: TaskGoals
  readingPreferences: ReadingPreference[]
  customTasks: CustomTaskDefinition[]
  /** Core 75 Hard task ids hidden from the Today checklist. */
  hiddenCore: DayTaskId[]
}

export type ChallengeStatus = 'active' | 'failed' | 'completed'

export interface Challenge {
  id: string
  startedAt: string
  status: ChallengeStatus
  failedAt?: string
  completedAt?: string
}

export interface ReminderSettings {
  enabled: boolean
  /** Keys like "2026-07-15|14" for each hour already notified today */
  firedKeys: string[]
}

export interface AppState {
  activeChallenge: Challenge | null
  dayLogs: DayLog[]
  pastChallenges: Challenge[]
  reminders: ReminderSettings
  workoutPreferences: WorkoutPreference[]
  taskSettings: TaskSettings
}

export type DayStatus = 'upcoming' | 'today' | 'complete' | 'incomplete' | 'missed'

export type DayTaskId =
  | 'workout1'
  | 'workout2'
  | 'diet'
  | 'water'
  | 'reading'
  | 'photo'
