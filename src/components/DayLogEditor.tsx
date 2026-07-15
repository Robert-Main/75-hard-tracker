import { PhotoCard } from './PhotoCard'
import { ReadingCard } from './ReadingCard'
import { TaskRow } from './TaskRow'
import { WaterCard } from './WaterCard'
import { WorkoutCard } from './WorkoutCard'
import {
  createDayLog,
  isWorkoutComplete,
} from '../lib/challenge'
import { getTaskSubtitle, getTaskTitle, getVisibleCustomTasks, isCoreTaskVisible } from '../lib/taskSettings'
import { isTaskDone } from './DayOverview'
import type {
  CustomTaskDefinition,
  DayLog,
  DayTaskId,
  TaskSettings,
  Workout,
  WorkoutPreference,
} from '../types'
import './DayLogEditor.css'
import './WorkoutCard.css'

interface DayLogEditorProps {
  challengeId: string
  dayIndex: number
  logDate: string
  log: DayLog | null
  taskSettings: TaskSettings
  preferences: WorkoutPreference[]
  disabled?: boolean
  onUpdateWorkout: (
    which: 'workout1' | 'workout2',
    patch: Partial<Workout>,
  ) => void
  onUpdateDayLog: (patch: Partial<DayLog>) => void
  onAddPreference?: (patch: Omit<WorkoutPreference, 'id'>) => Promise<void> | void
  onUpdatePreference?: (
    id: string,
    patch: Partial<Omit<WorkoutPreference, 'id'>>,
  ) => Promise<void> | void
  onRemovePreference?: (id: string) => Promise<void> | void
  onAddReadingPreference?: (patch: {
    title: string
    defaultPages?: number
  }) => Promise<void> | void
  onUpdateReadingPreference?: (
    id: string,
    patch: Partial<{ title: string; defaultPages: number }>,
  ) => Promise<void> | void
  onRemoveReadingPreference?: (id: string) => Promise<void> | void
}

const CORE_TASKS: DayTaskId[] = [
  'workout1',
  'workout2',
  'photo',
  'diet',
  'water',
  'reading',
]

function taskEditHref(id: DayTaskId | string): string {
  return `/settings#task-${id}`
}

export function DayLogEditor({
  challengeId,
  dayIndex,
  logDate,
  log,
  taskSettings,
  preferences,
  disabled = false,
  onUpdateWorkout,
  onUpdateDayLog,
  onAddPreference,
  onUpdatePreference,
  onRemovePreference,
  onAddReadingPreference,
  onUpdateReadingPreference,
  onRemoveReadingPreference,
}: DayLogEditorProps) {
  const resolved = log ?? createDayLog(challengeId, dayIndex, logDate)
  const { goals } = taskSettings

  const updateCustomTask = (taskId: string, done: boolean) => {
    onUpdateDayLog({
      customTasks: {
        ...resolved.customTasks,
        [taskId]: done,
      },
    })
  }

  const renderCustomTask = (task: CustomTaskDefinition) => (
    <TaskRow
      key={task.id}
      title={task.title}
      subtitle={task.subtitle || 'Your personal daily task'}
      done={Boolean(resolved.customTasks[task.id])}
      editHref={taskEditHref(task.id)}
      alwaysOpen
    >
      <div className="task-editor">
        <label
          className={`done-toggle ${resolved.customTasks[task.id] ? 'is-on' : ''}`}
        >
          <input
            type="checkbox"
            checked={Boolean(resolved.customTasks[task.id])}
            disabled={disabled}
            onChange={(e) => updateCustomTask(task.id, e.target.checked)}
          />
          <span>
            {resolved.customTasks[task.id]
              ? 'Completed — tap to undo'
              : `Mark “${task.title}” done`}
          </span>
        </label>
      </div>
    </TaskRow>
  )

  return (
    <div className={`day-log-editor ${disabled ? 'is-disabled' : ''}`}>
      {CORE_TASKS.filter((id) => isCoreTaskVisible(id, taskSettings)).map(
        (id) => {
        if (id === 'workout1') {
          return (
            <TaskRow
              key={id}
              title={getTaskTitle(id, taskSettings)}
              subtitle={getTaskSubtitle(id, taskSettings)}
              done={isTaskDone('workout1', resolved, taskSettings)}
              editHref={taskEditHref(id)}
              alwaysOpen
            >
              <WorkoutCard
                compact
                workout={resolved.workout1}
                preferences={preferences}
                disabled={disabled}
                onChange={(patch) => onUpdateWorkout('workout1', patch)}
                onAddPreference={onAddPreference}
                onUpdatePreference={onUpdatePreference}
                onRemovePreference={onRemovePreference}
              />
            </TaskRow>
          )
        }

        if (id === 'workout2') {
          const outdoorOk =
            !isCoreTaskVisible('workout1', taskSettings) ||
            resolved.workout1.location === 'outdoor' ||
            resolved.workout2.location === 'outdoor'
          return (
            <TaskRow
              key={id}
              title={getTaskTitle(id, taskSettings)}
              subtitle={getTaskSubtitle(id, taskSettings)}
              done={isWorkoutComplete(resolved.workout2) && outdoorOk}
              editHref={taskEditHref(id)}
              alwaysOpen
            >
              <WorkoutCard
                compact
                workout={resolved.workout2}
                preferences={preferences}
                disabled={disabled}
                onChange={(patch) => onUpdateWorkout('workout2', patch)}
                onAddPreference={onAddPreference}
                onUpdatePreference={onUpdatePreference}
                onRemovePreference={onRemovePreference}
              />
            </TaskRow>
          )
        }

        if (id === 'photo') {
          return (
            <TaskRow
              key={id}
              title={getTaskTitle(id, taskSettings)}
              subtitle={getTaskSubtitle(id, taskSettings)}
              done={isTaskDone('photo', resolved, taskSettings)}
              editHref={taskEditHref(id)}
              alwaysOpen
            >
              <PhotoCard
                challengeId={challengeId}
                dayIndex={dayIndex}
                hasPhoto={resolved.hasPhoto}
                disabled={disabled}
                onHasPhotoChange={(hasPhoto) => onUpdateDayLog({ hasPhoto })}
              />
            </TaskRow>
          )
        }

        if (id === 'diet') {
          return (
            <TaskRow
              key={id}
              title={getTaskTitle(id, taskSettings)}
              subtitle={getTaskSubtitle(id, taskSettings)}
              done={isTaskDone('diet', resolved, taskSettings)}
              editHref={taskEditHref(id)}
              alwaysOpen
            >
              <div className="task-editor">
                <label className={`done-toggle ${resolved.diet ? 'is-on' : ''}`}>
                  <input
                    type="checkbox"
                    checked={resolved.diet}
                    disabled={disabled}
                    onChange={(e) => onUpdateDayLog({ diet: e.target.checked })}
                  />
                  <span>
                    {resolved.diet
                      ? 'Diet followed — tap to undo'
                      : 'Mark diet followed today'}
                  </span>
                </label>
              </div>
            </TaskRow>
          )
        }

        if (id === 'water') {
          return (
            <TaskRow
              key={id}
              title={getTaskTitle(id, taskSettings)}
              subtitle={getTaskSubtitle(id, taskSettings)}
              done={isTaskDone('water', resolved, taskSettings)}
              editHref={taskEditHref(id)}
              alwaysOpen
            >
              <WaterCard
                waterOz={resolved.waterOz}
                goalOz={goals.waterOz}
                disabled={disabled}
                onChange={(waterOz) => onUpdateDayLog({ waterOz })}
              />
            </TaskRow>
          )
        }

        return (
          <TaskRow
            key={id}
            title={getTaskTitle(id, taskSettings)}
            subtitle={getTaskSubtitle(id, taskSettings)}
            done={isTaskDone('reading', resolved, taskSettings)}
            editHref={taskEditHref(id)}
            alwaysOpen
          >
            <ReadingCard
              pages={resolved.readingPages}
              title={resolved.readingTitle}
              goalPages={goals.readingPages}
              preferences={taskSettings.readingPreferences}
              disabled={disabled}
              onChange={(patch) => onUpdateDayLog(patch)}
              onAddPreference={onAddReadingPreference}
              onUpdatePreference={onUpdateReadingPreference}
              onRemovePreference={onRemoveReadingPreference}
            />
          </TaskRow>
        )
      },
      )}

      {getVisibleCustomTasks(taskSettings).map(renderCustomTask)}
    </div>
  )
}
