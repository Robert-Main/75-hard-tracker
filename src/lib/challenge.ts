import { addDays, daysBetween, toDateString } from './dates'
import type {
  Challenge,
  CustomTaskDefinition,
  DayLog,
  DayStatus,
  DayTaskId,
  TaskSettings,
  Workout,
} from '../types'
import {
  defaultTaskSettings,
  getVisibleCoreTasks,
  getVisibleCustomTasks,
  WATER_GOAL_OZ,
  READING_GOAL_PAGES,
  WORKOUT_GOAL_MINS,
} from './taskSettings'

export { WATER_GOAL_OZ, READING_GOAL_PAGES, WORKOUT_GOAL_MINS }
export const CHALLENGE_DAYS = 75

function resolveGoals(settings?: TaskSettings) {
  const goals = settings?.goals ?? defaultTaskSettings().goals
  return {
    waterOz: goals.waterOz || WATER_GOAL_OZ,
    readingPages: goals.readingPages || READING_GOAL_PAGES,
    workoutMins: goals.workoutMins || WORKOUT_GOAL_MINS,
  }
}

export function emptyWorkout(): Workout {
  return {
    done: false,
    location: null,
    note: '',
    durationMins: null,
  }
}

export function createDayLog(
  challengeId: string,
  dayIndex: number,
  date: string,
): DayLog {
  return {
    challengeId,
    dayIndex,
    date,
    workout1: emptyWorkout(),
    workout2: emptyWorkout(),
    diet: false,
    waterOz: 0,
    readingPages: 0,
    readingTitle: '',
    hasPhoto: false,
    customTasks: {},
  }
}

/** Migrate older workout-only logs to the full day shape. */
export function normalizeDayLog(log: Partial<DayLog> & Pick<DayLog, 'challengeId' | 'dayIndex' | 'date'>): DayLog {
  const base = createDayLog(log.challengeId, log.dayIndex, log.date)
  return {
    ...base,
    ...log,
    workout1: { ...base.workout1, ...log.workout1 },
    workout2: { ...base.workout2, ...log.workout2 },
    diet: Boolean(log.diet),
    waterOz: typeof log.waterOz === 'number' ? log.waterOz : 0,
    readingPages: typeof log.readingPages === 'number' ? log.readingPages : 0,
    readingTitle: log.readingTitle ?? '',
    hasPhoto: Boolean(log.hasPhoto),
    customTasks:
      log.customTasks && typeof log.customTasks === 'object'
        ? Object.fromEntries(
            Object.entries(log.customTasks).filter(
              ([, value]) => typeof value === 'boolean',
            ),
          )
        : {},
  }
}

export function createChallenge(startedAt: string = toDateString()): Challenge {
  return {
    id: crypto.randomUUID(),
    startedAt,
    status: 'active',
  }
}

export function getCurrentDayIndex(
  startedAt: string,
  today: string = toDateString(),
): number {
  return daysBetween(startedAt, today) + 1
}

export function dateForDayIndex(startedAt: string, dayIndex: number): string {
  return addDays(startedAt, dayIndex - 1)
}

export function isWorkoutComplete(workout: Workout): boolean {
  return workout.done && workout.location !== null
}

function hasOutdoorWorkout(log: DayLog): boolean {
  return (
    log.workout1.location === 'outdoor' || log.workout2.location === 'outdoor'
  )
}

export function isDayComplete(
  log: DayLog | undefined,
  settings?: TaskSettings,
): boolean {
  if (!log) return false
  const taskSettings = settings ?? defaultTaskSettings()
  // Personal extras count on the progress ring, not official fail rules.
  return getMissingTasks(log, taskSettings).length === 0
}

export function getMissingTasks(
  log: DayLog | undefined,
  settings?: TaskSettings,
): DayTaskId[] {
  const taskSettings = settings ?? defaultTaskSettings()
  const goals = resolveGoals(taskSettings)
  const visible = new Set(getVisibleCoreTasks(taskSettings))

  if (!log) {
    return getVisibleCoreTasks(taskSettings)
  }

  const missing: DayTaskId[] = []
  if (visible.has('workout1') && !isWorkoutComplete(log.workout1)) {
    missing.push('workout1')
  }
  if (visible.has('workout2') && !isWorkoutComplete(log.workout2)) {
    missing.push('workout2')
  }
  if (
    visible.has('workout1') &&
    visible.has('workout2') &&
    isWorkoutComplete(log.workout1) &&
    isWorkoutComplete(log.workout2) &&
    !hasOutdoorWorkout(log)
  ) {
    if (!missing.includes('workout1')) missing.push('workout1')
    if (!missing.includes('workout2')) missing.push('workout2')
  }
  if (visible.has('diet') && !log.diet) missing.push('diet')
  if (visible.has('water') && log.waterOz < goals.waterOz) missing.push('water')
  if (visible.has('reading') && log.readingPages < goals.readingPages) {
    missing.push('reading')
  }
  if (visible.has('photo') && !log.hasPhoto) missing.push('photo')
  return missing
}

export function getMissingCustomTasks(
  log: DayLog | undefined,
  customTasks: CustomTaskDefinition[],
): string[] {
  if (!log || customTasks.length === 0) return []
  return customTasks
    .filter((task) => task.visible !== false && !log.customTasks[task.id])
    .map((task) => task.id)
}

export function countDayTasksDone(
  log: DayLog | undefined,
  settings?: TaskSettings,
): {
  done: number
  total: number
} {
  const taskSettings = settings ?? defaultTaskSettings()
  const visibleCustom = getVisibleCustomTasks(taskSettings)
  const coreTotal = getVisibleCoreTasks(taskSettings).length
  const customTotal = visibleCustom.length
  const total = coreTotal + customTotal
  const coreMissing = getMissingTasks(log, taskSettings).length
  const customMissing = getMissingCustomTasks(log, visibleCustom).length
  return { done: total - coreMissing - customMissing, total }
}

export function dayTaskLabel(id: DayTaskId): string {
  switch (id) {
    case 'workout1':
      return 'Workout 1'
    case 'workout2':
      return 'Workout 2'
    case 'diet':
      return 'Diet'
    case 'water':
      return '1 gallon water'
    case 'reading':
      return '10 pages reading'
    case 'photo':
      return 'Progress photo'
  }
}

export function findDayLog(
  logs: DayLog[],
  challengeId: string,
  dayIndex: number,
): DayLog | undefined {
  return logs.find(
    (log) => log.challengeId === challengeId && log.dayIndex === dayIndex,
  )
}

export function getDayStatus(
  challenge: Challenge,
  logs: DayLog[],
  dayIndex: number,
  today: string = toDateString(),
  settings?: TaskSettings,
): DayStatus {
  const current = getCurrentDayIndex(challenge.startedAt, today)

  if (dayIndex > current) return 'upcoming'
  if (dayIndex === current && challenge.status === 'active') {
    const log = findDayLog(logs, challenge.id, dayIndex)
    return isDayComplete(log, settings) ? 'complete' : 'today'
  }

  const log = findDayLog(logs, challenge.id, dayIndex)
  if (isDayComplete(log, settings)) return 'complete'
  if (dayIndex < current) return 'missed'
  return 'incomplete'
}

/** Returns the first missed day index (past incomplete day), or null. */
export function findMissedDay(
  challenge: Challenge,
  logs: DayLog[],
  today: string = toDateString(),
  settings?: TaskSettings,
): number | null {
  if (challenge.status !== 'active') return null

  const current = getCurrentDayIndex(challenge.startedAt, today)
  if (current > CHALLENGE_DAYS + 1) {
    return CHALLENGE_DAYS
  }

  const lastPastDay = Math.min(current - 1, CHALLENGE_DAYS)

  for (let day = 1; day <= lastPastDay; day += 1) {
    const log = findDayLog(logs, challenge.id, day)
    if (!isDayComplete(log, settings)) return day
  }

  return null
}

/** True when the user skipped logging on one or more past days. */
export function hasLoggingGap(
  challenge: Challenge,
  logs: DayLog[],
  today: string = toDateString(),
  settings?: TaskSettings,
): boolean {
  return findMissedDay(challenge, logs, today, settings) !== null
}

export function checkCompletion(
  challenge: Challenge,
  logs: DayLog[],
  today: string = toDateString(),
  settings?: TaskSettings,
): Challenge {
  if (challenge.status !== 'active') return challenge

  const current = getCurrentDayIndex(challenge.startedAt, today)
  if (current < CHALLENGE_DAYS) return challenge

  for (let day = 1; day <= CHALLENGE_DAYS; day += 1) {
    const log = findDayLog(logs, challenge.id, day)
    if (!isDayComplete(log, settings)) return challenge
  }

  return {
    ...challenge,
    status: 'completed',
    completedAt: today,
  }
}

export function markFailed(challenge: Challenge, failedAt: string = toDateString()): Challenge {
  return {
    ...challenge,
    status: 'failed',
    failedAt,
  }
}

export function countCompletedDays(
  challenge: Challenge,
  logs: DayLog[],
  settings?: TaskSettings,
): number {
  return logs.filter(
    (log) => log.challengeId === challenge.id && isDayComplete(log, settings),
  ).length
}
