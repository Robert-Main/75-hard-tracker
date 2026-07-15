import { useEffect, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { formatDisplayDate } from '../lib/dates'
import { useAuth } from '../context/AuthContext'
import { useChallenge } from '../context/ChallengeContext'
import { useTheme, type ThemeMode } from '../context/ThemeContext'
import type { DayTaskId, WorkoutLocation, WorkoutPreference } from '../types'
import {
  DEFAULT_CORE_TASKS,
  getTaskSubtitle,
  getTaskTitle,
  isCoreTaskVisible,
} from '../lib/taskSettings'
import {
  btnDanger,
  btnPrimary,
  btnSecondary,
  cx,
  fieldInput,
  fieldLabel,
  mutedText,
  pageTitle,
  panelCard,
} from '../lib/ui'

const CORE_TASK_IDS: DayTaskId[] = [
  'workout1',
  'workout2',
  'photo',
  'diet',
  'water',
  'reading',
]

const emptyDraft = () => ({
  name: '',
  location: 'indoor' as WorkoutLocation,
  durationMins: 45,
})

const THEME_OPTIONS: Array<{ id: ThemeMode; label: string }> = [
  { id: 'light', label: 'Light' },
  { id: 'dark', label: 'Dark' },
  { id: 'system', label: 'System' },
]

export function SettingsPage() {
  const { user, signOut } = useAuth()
  const { theme, setTheme } = useTheme()
  const location = useLocation()
  const {
    state,
    startChallenge,
    declareFailed,
    updateReminders,
    sendTestReminder,
    syncError,
    addWorkoutPreference,
    updateWorkoutPreference,
    removeWorkoutPreference,
    updateCoreTask,
    updateTaskGoals,
    addCustomTask,
    updateCustomTask,
    removeCustomTask,
    addReadingPreference,
    updateReadingPreference,
    removeReadingPreference,
    setCoreTaskVisible,
    setCustomTaskVisible,
  } = useChallenge()
  const challenge = state.activeChallenge
  const { reminders, workoutPreferences, taskSettings } = state
  const [reminderMessage, setReminderMessage] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [draft, setDraft] = useState(emptyDraft)

  useEffect(() => {
    if (!location.hash) return
    const id = location.hash.slice(1)
    const el = document.getElementById(id)
    el?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }, [location.hash])
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editDraft, setEditDraft] = useState(emptyDraft)
  const [prefMessage, setPrefMessage] = useState<string | null>(null)
  const [taskMessage, setTaskMessage] = useState<string | null>(null)
  const [customDraft, setCustomDraft] = useState({ title: '', subtitle: '' })
  const [editingCustomId, setEditingCustomId] = useState<string | null>(null)
  const [customEditDraft, setCustomEditDraft] = useState({
    title: '',
    subtitle: '',
  })
  const [coreDrafts, setCoreDrafts] = useState<
    Record<DayTaskId, { title: string; subtitle: string }>
  >(() =>
    Object.fromEntries(
      CORE_TASK_IDS.map((id) => [
        id,
        {
          title: getTaskTitle(id, taskSettings),
          subtitle: getTaskSubtitle(id, taskSettings),
        },
      ]),
    ) as Record<DayTaskId, { title: string; subtitle: string }>,
  )

  const onToggleReminders = async (enabled: boolean) => {
    setBusy(true)
    setReminderMessage(null)
    const ok = await updateReminders({ enabled })
    setBusy(false)
    if (enabled && !ok) {
      setReminderMessage(
        'Notification permission is required. Enable it in your browser settings.',
      )
      return
    }
    setReminderMessage(
      enabled
        ? 'Reminders on — you’ll get an hourly nudge until today’s list is complete.'
        : 'Reminders off.',
    )
  }

  const onTest = async () => {
    setBusy(true)
    setReminderMessage(null)
    const ok = await sendTestReminder()
    setBusy(false)
    setReminderMessage(
      ok
        ? 'Test notification sent. If you didn’t see it, check notification permissions.'
        : 'Could not send a notification. Allow notifications for this app first.',
    )
  }

  const onExport = () => {
    const payload = {
      exportedAt: new Date().toISOString(),
      state,
    }
    const blob = new Blob([JSON.stringify(payload, null, 2)], {
      type: 'application/json',
    })
    const url = URL.createObjectURL(blob)
    const anchor = document.createElement('a')
    anchor.href = url
    anchor.download = `75-hard-export-${new Date().toISOString().slice(0, 10)}.json`
    anchor.click()
    URL.revokeObjectURL(url)
  }

  const onAddPreference = async () => {
    const name = draft.name.trim()
    if (!name) {
      setPrefMessage('Enter a workout name first.')
      return
    }
    setBusy(true)
    setPrefMessage(null)
    await addWorkoutPreference({
      name,
      location: draft.location,
      durationMins: draft.durationMins || 45,
    })
    setDraft(emptyDraft())
    setBusy(false)
    setPrefMessage('Workout added to your list.')
  }

  const startEdit = (pref: WorkoutPreference) => {
    setEditingId(pref.id)
    setEditDraft({
      name: pref.name,
      location: pref.location,
      durationMins: pref.durationMins,
    })
    setPrefMessage(null)
  }

  const onSaveEdit = async () => {
    if (!editingId) return
    const name = editDraft.name.trim()
    if (!name) {
      setPrefMessage('Workout name cannot be empty.')
      return
    }
    setBusy(true)
    await updateWorkoutPreference(editingId, {
      name,
      location: editDraft.location,
      durationMins: editDraft.durationMins || 45,
    })
    setEditingId(null)
    setBusy(false)
    setPrefMessage('Workout updated.')
  }

  const onSaveCoreTask = async (id: DayTaskId) => {
    const draft = coreDrafts[id]
    if (!draft.title.trim()) {
      setTaskMessage('Task title cannot be empty.')
      return
    }
    setBusy(true)
    setTaskMessage(null)
    await updateCoreTask(id, {
      title: draft.title.trim(),
      subtitle: draft.subtitle.trim(),
    })
    setBusy(false)
    setTaskMessage('Task updated.')
  }

  const onResetCoreTask = (id: DayTaskId) => {
    const defaults = DEFAULT_CORE_TASKS[id]
    setCoreDrafts((prev) => ({
      ...prev,
      [id]: {
        title: defaults.title,
        subtitle: defaults.subtitle,
      },
    }))
  }

  const onAddCustomTask = async () => {
    const title = customDraft.title.trim()
    if (!title) {
      setTaskMessage('Enter a task name first.')
      return
    }
    setBusy(true)
    setTaskMessage(null)
    await addCustomTask({
      title,
      subtitle: customDraft.subtitle.trim(),
    })
    setCustomDraft({ title: '', subtitle: '' })
    setBusy(false)
    setTaskMessage('Personal task added.')
  }

  const onSaveCustomTask = async () => {
    if (!editingCustomId) return
    const title = customEditDraft.title.trim()
    if (!title) {
      setTaskMessage('Task name cannot be empty.')
      return
    }
    setBusy(true)
    await updateCustomTask(editingCustomId, {
      title,
      subtitle: customEditDraft.subtitle.trim(),
    })
    setEditingCustomId(null)
    setBusy(false)
    setTaskMessage('Personal task updated.')
  }

  return (
    <section className="grid gap-[0.85rem] min-[900px]:grid-cols-2 min-[900px]:items-start min-[900px]:gap-4">
      <h1 className={cx(pageTitle, "mb-4 min-[900px]:col-span-2 min-[900px]:mb-1")}>Settings</h1>

      <div className={cx(panelCard, "!mb-0")}>
        <h2 className="m-0 text-[0.95rem]">Theme</h2>
        <p className={mutedText}>
          Switch between light, dark, or follow your device setting.
        </p>
        <div className="flex flex-wrap gap-2" role="group" aria-label="Theme">
          {THEME_OPTIONS.map((option) => (
            <button
              key={option.id}
              type="button"
              className={cx("inline-flex items-center gap-2 rounded-xl border border-line bg-panel px-3 py-2 text-[0.85rem] font-semibold text-ink transition hover:border-accent/40", theme === option.id && "border-accent bg-accent text-on-accent")}
              onClick={() => setTheme(option.id)}
            >
              <span
                className={cx("h-4 w-4 rounded-full border border-line", option.id === "light" && "bg-[#f4f7f6]", option.id === "dark" && "bg-[#0e1614]", option.id === "system" && "bg-gradient-to-r from-[#f4f7f6] to-[#0e1614]")}
                aria-hidden="true"
              />
              {option.label}
            </button>
          ))}
        </div>
      </div>

      <div id="daily-tasks" className={cx(panelCard, "!mb-0 min-[900px]:col-span-2")}>
        <h2 className="m-0 text-[0.95rem]">Daily tasks</h2>
        <p className={mutedText}>
          Choose what shows on Today, rename core tasks, and add or delete your
          own. Tap <strong>Edit</strong> on a Today card to jump here.
        </p>

        <div className="mb-[0.35rem] grid gap-[0.55rem]">
          <h3 className="m-0 text-[0.9rem]">Shown on Today</h3>
          <p className={mutedText}>
            Uncheck a task to hide it on Today. Hidden core tasks are not
            required for the day.
          </p>
          <ul className="m-0 grid list-none gap-[0.35rem] p-0">
            {CORE_TASK_IDS.map((id) => {
              const shown = isCoreTaskVisible(id, taskSettings)
              return (
                <li key={id}>
                  <label className="flex cursor-pointer items-center gap-[0.55rem] rounded-[0.65rem] border border-line bg-bg/65 px-[0.65rem] py-[0.55rem] text-[0.9rem] font-semibold">
                    <input
                      className="h-4 w-4 shrink-0 accent-accent"
                      type="checkbox"
                      checked={shown}
                      disabled={busy}
                      onChange={(e) =>
                        void setCoreTaskVisible(id, e.target.checked)
                      }
                    />
                    <span>{getTaskTitle(id, taskSettings)}</span>
                  </label>
                </li>
              )
            })}
            {taskSettings.customTasks.map((task) => (
              <li key={task.id}>
                <label className="flex cursor-pointer items-center gap-[0.55rem] rounded-[0.65rem] border border-line bg-bg/65 px-[0.65rem] py-[0.55rem] text-[0.9rem] font-semibold">
                  <input
                      className="h-4 w-4 shrink-0 accent-accent"
                    type="checkbox"
                    checked={task.visible !== false}
                    disabled={busy}
                    onChange={(e) =>
                      void setCustomTaskVisible(task.id, e.target.checked)
                    }
                  />
                  <span>{task.title}</span>
                </label>
              </li>
            ))}
          </ul>
        </div>

        <div className="grid gap-[0.65rem]">
          <h3 className="m-0 text-[0.9rem]">Goals</h3>
          <div className="grid gap-[0.65rem] min-[640px]:grid-cols-3">
            <label className="grid gap-[0.35rem]">
              <span className={fieldLabel}>Workout minutes</span>
              <input
                className={fieldInput}
                type="number"
                min={1}
                max={600}
                value={taskSettings.goals.workoutMins}
                disabled={busy}
                onChange={(e) =>
                  void updateTaskGoals({
                    workoutMins: Number(e.target.value) || 45,
                  })
                }
              />
            </label>
            <label className="grid gap-[0.35rem]">
              <span className={fieldLabel}>Water goal (oz)</span>
              <input
                className={fieldInput}
                type="number"
                min={1}
                max={512}
                value={taskSettings.goals.waterOz}
                disabled={busy}
                onChange={(e) =>
                  void updateTaskGoals({
                    waterOz: Number(e.target.value) || 128,
                  })
                }
              />
            </label>
            <label className="grid gap-[0.35rem]">
              <span className={fieldLabel}>Reading pages</span>
              <input
                className={fieldInput}
                type="number"
                min={1}
                max={500}
                value={taskSettings.goals.readingPages}
                disabled={busy}
                onChange={(e) =>
                  void updateTaskGoals({
                    readingPages: Number(e.target.value) || 10,
                  })
                }
              />
            </label>
          </div>
        </div>

        <ul className="mt-3 grid list-none gap-3 p-0">
          {CORE_TASK_IDS.map((id) => (
            <li key={id} id={`task-${id}`} className="grid gap-[0.55rem] rounded-[0.85rem] border border-line bg-bg/65 p-[0.85rem]">
              <div className="text-[0.92rem]">
                <strong>{getTaskTitle(id, taskSettings)}</strong>
              </div>
              <label className="grid gap-[0.35rem]">
                <span className={fieldLabel}>Title</span>
                <input
                className={fieldInput}
                  type="text"
                  value={coreDrafts[id].title}
                  disabled={busy}
                  onChange={(e) =>
                    setCoreDrafts((prev) => ({
                      ...prev,
                      [id]: { ...prev[id], title: e.target.value },
                    }))
                  }
                />
              </label>
              <label className="grid gap-[0.35rem]">
                <span className={fieldLabel}>Subtitle</span>
                <input
                className={fieldInput}
                  type="text"
                  value={coreDrafts[id].subtitle}
                  disabled={busy}
                  onChange={(e) =>
                    setCoreDrafts((prev) => ({
                      ...prev,
                      [id]: { ...prev[id], subtitle: e.target.value },
                    }))
                  }
                />
              </label>
              <div className="flex flex-wrap gap-[0.45rem]">
                <button
                  type="button"
                  className={cx(btnPrimary, "!w-fit")}
                  disabled={busy}
                  onClick={() => void onSaveCoreTask(id)}
                >
                  Save task
                </button>
                <button
                  type="button"
                  className={cx(btnSecondary, "!w-fit")}
                  disabled={busy}
                  onClick={() => onResetCoreTask(id)}
                >
                  Reset
                </button>
              </div>
            </li>
          ))}
        </ul>

        <div className="mt-4 grid gap-[0.65rem] border-t border-line pt-4">
          <h3 className="m-0 text-[0.9rem]">Your personal tasks</h3>
          <p className={mutedText}>
            Add or delete extras for Today. Use the checkboxes above to choose
            which ones appear. These count on the progress ring, not official
            fail rules.
          </p>
          <ul className="m-0 grid list-none gap-[0.55rem] p-0">
            {taskSettings.customTasks.map((task) => (
              <li key={task.id} id={`task-${task.id}`} className="grid gap-[0.55rem] rounded-xl border border-line bg-bg px-[0.85rem] py-3">
                {editingCustomId === task.id ? (
                  <div className="grid gap-[0.55rem]">
                    <input
                className={fieldInput}
                      type="text"
                      value={customEditDraft.title}
                      disabled={busy}
                      onChange={(e) =>
                        setCustomEditDraft((prev) => ({
                          ...prev,
                          title: e.target.value,
                        }))
                      }
                      placeholder="Task name"
                    />
                    <input
                className={fieldInput}
                      type="text"
                      value={customEditDraft.subtitle}
                      disabled={busy}
                      onChange={(e) =>
                        setCustomEditDraft((prev) => ({
                          ...prev,
                          subtitle: e.target.value,
                        }))
                      }
                      placeholder="Short description (optional)"
                    />
                    <div className="flex flex-wrap gap-[0.45rem]">
                      <button
                        type="button"
                        className={cx(btnPrimary, "!w-fit")}
                        disabled={busy}
                        onClick={() => void onSaveCustomTask()}
                      >
                        Save
                      </button>
                      <button
                        type="button"
                        className={cx(btnSecondary, "!w-fit")}
                        disabled={busy}
                        onClick={() => setEditingCustomId(null)}
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="grid gap-[0.15rem]">
                      <strong className="text-[0.95rem]">{task.title}</strong>
                      <span className="text-[0.82rem] capitalize text-muted">
                        {task.subtitle || 'Personal daily task'}
                        {task.visible === false ? ' · hidden' : ''}
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-[0.45rem]">
                      <button
                        type="button"
                        className={cx(btnSecondary, "!w-fit")}
                        disabled={busy}
                        onClick={() =>
                          void setCustomTaskVisible(
                            task.id,
                            task.visible === false,
                          )
                        }
                      >
                        {task.visible === false ? 'Show' : 'Hide'}
                      </button>
                      <button
                        type="button"
                        className={cx(btnSecondary, "!w-fit")}
                        disabled={busy}
                        onClick={() => {
                          setEditingCustomId(task.id)
                          setCustomEditDraft({
                            title: task.title,
                            subtitle: task.subtitle,
                          })
                        }}
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        className={cx(btnSecondary, "!w-fit")}
                        disabled={busy}
                        onClick={() => {
                          if (
                            window.confirm(
                              `Delete “${task.title}”? This removes it from your list.`,
                            )
                          ) {
                            void removeCustomTask(task.id)
                          }
                        }}
                      >
                        Delete
                      </button>
                    </div>
                  </>
                )}
              </li>
            ))}
          </ul>
          <div className="grid gap-[0.55rem]">
            <h4 className="m-0 text-[0.9rem]">Add a personal task</h4>
            <input
                className={fieldInput}
              type="text"
              value={customDraft.title}
              disabled={busy}
              onChange={(e) =>
                setCustomDraft((prev) => ({ ...prev, title: e.target.value }))
              }
              placeholder="e.g. Meditate 10 min"
            />
            <input
                className={fieldInput}
              type="text"
              value={customDraft.subtitle}
              disabled={busy}
              onChange={(e) =>
                setCustomDraft((prev) => ({
                  ...prev,
                  subtitle: e.target.value,
                }))
              }
              placeholder="Optional note"
            />
            <button
              type="button"
              className={cx(btnPrimary, "!w-fit")}
              disabled={busy}
              onClick={() => void onAddCustomTask()}
            >
              Add task
            </button>
          </div>
        </div>

        {taskMessage && <p className="m-0 text-[0.9rem] leading-snug text-accent-ink">{taskMessage}</p>}
      </div>

      <div id="my-workouts" className={cx(panelCard, "!mb-0 min-[900px]:col-span-2")}>
        <h2 className="m-0 text-[0.95rem]">My workouts</h2>
        <p className={mutedText}>
          Save the workouts you do most. On Today, tap one or more to fill
          indoor / outdoor, names, and total duration — edit anytime here.
        </p>

        <ul className="m-0 grid list-none gap-[0.55rem] p-0">
          {workoutPreferences.map((pref) => (
            <li key={pref.id} className="grid gap-[0.55rem] rounded-xl border border-line bg-bg px-[0.85rem] py-3">
              {editingId === pref.id ? (
                <div className="grid gap-[0.55rem]">
                  <input
                className={fieldInput}
                    type="text"
                    value={editDraft.name}
                    disabled={busy}
                    onChange={(e) =>
                      setEditDraft((prev) => ({
                        ...prev,
                        name: e.target.value,
                      }))
                    }
                    placeholder="Workout name"
                  />
                  <div className="grid grid-cols-[1fr_5.5rem] gap-2">
                    <select
                    className={fieldInput}
                      value={editDraft.location}
                      disabled={busy}
                      onChange={(e) =>
                        setEditDraft((prev) => ({
                          ...prev,
                          location: e.target.value as WorkoutLocation,
                        }))
                      }
                    >
                      <option value="indoor">Indoor</option>
                      <option value="outdoor">Outdoor</option>
                    </select>
                    <input
                className={fieldInput}
                      type="number"
                      min={1}
                      max={600}
                      value={editDraft.durationMins}
                      disabled={busy}
                      onChange={(e) =>
                        setEditDraft((prev) => ({
                          ...prev,
                          durationMins: Number(e.target.value) || 45,
                        }))
                      }
                    />
                  </div>
                  <div className="flex flex-wrap gap-[0.45rem]">
                    <button
                      type="button"
                      className={cx(btnPrimary, "!w-fit")}
                      disabled={busy}
                      onClick={() => void onSaveEdit()}
                    >
                      Save
                    </button>
                    <button
                      type="button"
                      className={cx(btnSecondary, "!w-fit")}
                      disabled={busy}
                      onClick={() => setEditingId(null)}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="grid gap-[0.15rem]">
                    <strong className="text-[0.95rem]">{pref.name}</strong>
                    <span className="text-[0.82rem] capitalize text-muted">
                      {pref.location} · {pref.durationMins} min
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-[0.45rem]">
                    <button
                      type="button"
                      className={cx(btnSecondary, "!w-fit")}
                      disabled={busy}
                      onClick={() => startEdit(pref)}
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      className={btnDanger}
                      disabled={busy || workoutPreferences.length <= 1}
                      onClick={() => {
                        if (
                          window.confirm(
                            `Remove “${pref.name}” from your workout list?`,
                          )
                        ) {
                          void removeWorkoutPreference(pref.id)
                        }
                      }}
                    >
                      Remove
                    </button>
                  </div>
                </>
              )}
            </li>
          ))}
        </ul>

        <div className="mt-[0.35rem] grid gap-[0.55rem] border-t border-dashed border-line pt-[0.85rem]">
          <h3 className="m-0 text-[0.9rem]">Add a workout</h3>
          <input
                className={fieldInput}
            type="text"
            value={draft.name}
            disabled={busy}
            placeholder="e.g. Trail run, kettlebells"
            onChange={(e) =>
              setDraft((prev) => ({ ...prev, name: e.target.value }))
            }
          />
          <div className="grid grid-cols-[1fr_5.5rem] gap-2">
            <select
                    className={fieldInput}
              value={draft.location}
              disabled={busy}
              onChange={(e) =>
                setDraft((prev) => ({
                  ...prev,
                  location: e.target.value as WorkoutLocation,
                }))
              }
            >
              <option value="indoor">Indoor</option>
              <option value="outdoor">Outdoor</option>
            </select>
            <input
                className={fieldInput}
              type="number"
              min={1}
              max={600}
              value={draft.durationMins}
              disabled={busy}
              onChange={(e) =>
                setDraft((prev) => ({
                  ...prev,
                  durationMins: Number(e.target.value) || 45,
                }))
              }
            />
          </div>
          <button
            type="button"
            className={cx(btnPrimary, "!w-fit")}
            disabled={busy}
            onClick={() => void onAddPreference()}
          >
            Add workout
          </button>
        </div>

        {prefMessage && <p className="m-0 text-[0.9rem] leading-snug text-accent-ink">{prefMessage}</p>}
      </div>

      <div id="my-books" className={cx(panelCard, "!mb-0 min-[900px]:col-span-2")}>
        <h2 className="m-0 text-[0.95rem]">My books</h2>
        <p className={mutedText}>
          Saved reading picks — tap one on Today to fill the book and page
          count.
        </p>
        <ul className="m-0 grid list-none gap-[0.55rem] p-0">
          {taskSettings.readingPreferences.map((pref) => (
            <li key={pref.id} className="grid gap-[0.55rem] rounded-xl border border-line bg-bg px-[0.85rem] py-3">
              <div className="grid gap-[0.15rem]">
                <strong className="text-[0.95rem]">{pref.title}</strong>
                <span className="text-[0.82rem] text-muted">{pref.defaultPages} pages</span>
              </div>
              <div className="flex flex-wrap gap-[0.45rem]">
                <button
                  type="button"
                  className={cx(btnSecondary, "!w-fit")}
                  disabled={busy}
                  onClick={() => {
                    const title = window.prompt('Book title', pref.title)
                    if (!title?.trim()) return
                    const pages = window.prompt(
                      'Default pages',
                      String(pref.defaultPages),
                    )
                    void updateReadingPreference(pref.id, {
                      title: title.trim(),
                      defaultPages: Number(pages) || taskSettings.goals.readingPages,
                    })
                  }}
                >
                  Edit
                </button>
                <button
                  type="button"
                  className={cx(btnSecondary, "!w-fit")}
                  disabled={busy}
                  onClick={() => {
                    if (
                      window.confirm(`Remove “${pref.title}” from your book list?`)
                    ) {
                      void removeReadingPreference(pref.id)
                    }
                  }}
                >
                  Remove
                </button>
              </div>
            </li>
          ))}
        </ul>
        <div className="grid gap-[0.55rem]">
          <h3 className="m-0 text-[0.9rem]">Add a book</h3>
          <button
            type="button"
            className={cx(btnPrimary, "!w-fit")}
            disabled={busy}
            onClick={() => {
              const title = window.prompt('Book title')
              if (!title?.trim()) return
              void addReadingPreference({
                title: title.trim(),
                defaultPages: taskSettings.goals.readingPages,
              })
            }}
          >
            Add book
          </button>
        </div>
      </div>

      <div className={cx(panelCard, "!mb-0")}>
        <h2 className="m-0 text-[0.95rem]">Account</h2>
        <p className={mutedText}>Signed in as {user?.email}</p>
        {syncError && <p className="m-0 text-[0.9rem] leading-snug text-accent-ink">{syncError}</p>}
        <div className="flex flex-wrap gap-2">
          <Link className={cx(btnSecondary, "!w-fit no-underline")} to="/profile">
            Open profile
          </Link>
          <button
            type="button"
            className={cx(btnSecondary, "!w-fit")}
            onClick={() => void signOut()}
          >
            Log out
          </button>
        </div>
      </div>

      <div className={cx(panelCard, "!mb-0")}>
        <h2 className="m-0 text-[0.95rem]">Your data</h2>
        <p className={mutedText}>
          Challenge logs, reminders, and photos sync to your Supabase account.
        </p>
        <ul className="m-0 grid list-disc gap-1.5 pl-[1.1rem] text-[0.92rem] leading-snug text-muted [&_code]:text-[0.82rem]">
          <li>
            <strong>Challenge logs</strong> — Supabase database
          </li>
          <li>
            <strong>Photos</strong> — Supabase Storage (private bucket)
          </li>
          <li>
            <strong>View progress</strong> — Progress tab (tap a day)
          </li>
        </ul>
        <button type="button" className={cx(btnSecondary, "!w-fit")} onClick={onExport}>
          Export progress JSON
        </button>
      </div>

      <div className={cx(panelCard, "!mb-0")}>
        <h2 className="m-0 text-[0.95rem]">Reminders</h2>
        <p className={mutedText}>
          Hourly notifications while today’s 75 Hard list is incomplete. Best
          with the app installed and notifications allowed.
        </p>

        <label className="flex items-center justify-between gap-4 font-semibold">
          <span>Hourly reminders</span>
          <input
            className="h-[1.15rem] w-[1.15rem] accent-accent"
            type="checkbox"
            checked={reminders.enabled}
            disabled={busy}
            onChange={(e) => void onToggleReminders(e.target.checked)}
          />
        </label>

        <button
          type="button"
          className={cx(btnSecondary, "!w-fit")}
          disabled={busy}
          onClick={() => void onTest()}
        >
          Send test reminder
        </button>

        {reminderMessage && <p className="m-0 text-[0.9rem] leading-snug text-accent-ink">{reminderMessage}</p>}
      </div>

      <div className={cx(panelCard, "!mb-0")}>
        <h2 className="m-0 text-[0.95rem]">Challenge</h2>
        {challenge ? (
          <>
            <p>
              Started {formatDisplayDate(challenge.startedAt)} · status{' '}
              <strong>{challenge.status}</strong>
            </p>
            <button
              type="button"
              className={btnDanger}
              onClick={() => {
                if (
                  window.confirm(
                    'Declare this challenge failed and archive it?',
                  )
                ) {
                  void declareFailed()
                }
              }}
            >
              I failed — reset
            </button>
          </>
        ) : (
          <p>No active challenge.</p>
        )}
        <button
          type="button"
          className={cx(btnSecondary, "!w-fit")}
          onClick={() => {
            if (
              challenge &&
              !window.confirm(
                'Archive the current challenge as failed and start Day 1 again?',
              )
            ) {
              return
            }
            void startChallenge()
          }}
        >
          {challenge ? 'Restart from Day 1' : 'Start challenge'}
        </button>
      </div>

      <div className={cx(panelCard, "!mb-0")}>
        <h2 className="m-0 text-[0.95rem]">Past attempts</h2>
        {state.pastChallenges.length === 0 ? (
          <p className={mutedText}>None yet.</p>
        ) : (
          <ul className="m-0 grid list-none gap-[0.45rem] p-0 text-[0.92rem] text-muted">
            {state.pastChallenges.map((item) => (
              <li key={item.id}>
                <span>
                  {formatDisplayDate(item.startedAt)} → {item.status}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className={cx(panelCard, "!mb-0")}>
        <h2 className="m-0 text-[0.95rem]">Rules</h2>
        <p className={mutedText}>
          Review the official 75 Hard daily requirements and fail conditions.
        </p>
        <Link className={cx(btnSecondary, "!w-fit no-underline")} to="/rules">
          Open rules
        </Link>
      </div>

      <div className={cx(panelCard, "!mb-0")}>
        <h2 className="m-0 text-[0.95rem]">Install</h2>
        <p className={mutedText}>
          On your phone, open this app in the browser and use “Add to Home
          Screen” / “Install app” for a full-screen experience.
        </p>
      </div>
    </section>
  )
}
