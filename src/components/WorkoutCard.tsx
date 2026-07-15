import { useState } from 'react'
import type {
  Workout,
  WorkoutLocation,
  WorkoutPreference,
} from '../types'
import {
  btnCompact,
  btnDanger,
  btnGhost,
  btnPrimary,
  btnSecondary,
  cx,
  doneToggle,
  doneToggleOn,
  fieldInput,
  fieldLabel,
  prefChip,
  prefChipSelected,
} from '../lib/ui'

interface WorkoutCardProps {
  workout: Workout
  preferences?: WorkoutPreference[]
  disabled?: boolean
  compact?: boolean
  onChange: (patch: Partial<Workout>) => void
  onAddPreference?: (patch: Omit<WorkoutPreference, 'id'>) => Promise<void> | void
  onUpdatePreference?: (
    id: string,
    patch: Partial<Omit<WorkoutPreference, 'id'>>,
  ) => Promise<void> | void
  onRemovePreference?: (id: string) => Promise<void> | void
}

/** Split a note like "Run, HIIT, Yoga" into individual workout names. */
function parseWorkoutNotes(note: string): string[] {
  return note
    .split(/\s*(?:,|\+|·|;|&)\s*/)
    .map((part) => part.trim())
    .filter(Boolean)
}

function formatWorkoutNotes(names: string[]): string {
  return names.join(', ')
}

function namesMatch(a: string, b: string): boolean {
  return a.trim().toLowerCase() === b.trim().toLowerCase()
}

const manageInput = cx(fieldInput, 'bg-bg')
const locationBtn =
  'appearance-none cursor-pointer rounded-lg border border-line bg-panel px-[0.55rem] py-1.5 text-[0.82rem] font-semibold text-ink transition disabled:cursor-not-allowed disabled:opacity-55'

export function WorkoutCard({
  workout,
  preferences = [],
  disabled = false,
  compact: _compact = false,
  onChange,
  onAddPreference,
  onUpdatePreference,
  onRemovePreference,
}: WorkoutCardProps) {
  const [managing, setManaging] = useState(false)
  const [adding, setAdding] = useState(false)
  const [newName, setNewName] = useState('')
  const [newLocation, setNewLocation] = useState<WorkoutLocation>('outdoor')
  const [newMins, setNewMins] = useState(45)
  const [editId, setEditId] = useState<string | null>(null)
  const [editName, setEditName] = useState('')
  const [editLocation, setEditLocation] = useState<WorkoutLocation>('indoor')
  const [editMins, setEditMins] = useState(45)
  const [busy, setBusy] = useState(false)

  const canManage = Boolean(
    onAddPreference && onUpdatePreference && onRemovePreference,
  )

  const selectedNames = parseWorkoutNotes(workout.note)

  const isPrefSelected = (pref: WorkoutPreference) =>
    selectedNames.some((name) => namesMatch(name, pref.name))

  const setLocation = (location: WorkoutLocation) => {
    onChange({ done: true, location })
  }

  const togglePreference = (pref: WorkoutPreference) => {
    const alreadyOn = selectedNames.some((name) => namesMatch(name, pref.name))
    const nextNames = alreadyOn
      ? selectedNames.filter((name) => !namesMatch(name, pref.name))
      : [...selectedNames, pref.name]

    const selectedPrefs = preferences.filter((item) =>
      nextNames.some((name) => namesMatch(name, item.name)),
    )

    const durationMins =
      selectedPrefs.length > 0
        ? selectedPrefs.reduce((sum, item) => sum + item.durationMins, 0)
        : workout.durationMins

    let location = workout.location
    if (selectedPrefs.length > 0) {
      location = selectedPrefs.some((item) => item.location === 'outdoor')
        ? 'outdoor'
        : 'indoor'
    }

    onChange({
      done: nextNames.length > 0 ? true : workout.done,
      note: formatWorkoutNotes(nextNames),
      durationMins,
      location: nextNames.length > 0 ? location : workout.location,
    })
  }

  const startEdit = (pref: WorkoutPreference) => {
    setEditId(pref.id)
    setEditName(pref.name)
    setEditLocation(pref.location)
    setEditMins(pref.durationMins)
    setAdding(false)
  }

  const onSaveNew = async () => {
    if (!onAddPreference || !newName.trim()) return
    setBusy(true)
    await onAddPreference({
      name: newName.trim(),
      location: newLocation,
      durationMins: newMins || 45,
    })
    setNewName('')
    setNewLocation('outdoor')
    setNewMins(45)
    setAdding(false)
    setBusy(false)
  }

  const onSaveEdit = async () => {
    if (!onUpdatePreference || !editId || !editName.trim()) return
    setBusy(true)
    await onUpdatePreference(editId, {
      name: editName.trim(),
      location: editLocation,
      durationMins: editMins || 45,
    })
    setEditId(null)
    setBusy(false)
  }

  return (
    <div className="grid gap-3">
      <label className={cx(doneToggle, workout.done && doneToggleOn)}>
        <input
          type="checkbox"
          className="h-[0.9rem] w-[0.9rem] shrink-0 accent-done disabled:cursor-not-allowed disabled:opacity-55"
          checked={workout.done}
          disabled={disabled}
          onChange={(e) =>
            onChange({
              done: e.target.checked,
              location: e.target.checked
                ? workout.location ?? 'indoor'
                : null,
            })
          }
        />
        <span>
          {workout.done ? 'Completed — tap to undo' : 'Mark this workout done'}
        </span>
      </label>

      <div className="grid gap-1.5">
        <div className="flex items-center justify-between gap-2">
          <span className={fieldLabel}>Choose workouts</span>
          {canManage && (
            <button
              type="button"
              className={btnGhost + ' text-[0.78rem]'}
              disabled={disabled || busy}
              onClick={() => {
                setManaging((open) => !open)
                setAdding(false)
                setEditId(null)
              }}
            >
              {managing ? 'Done editing' : 'Add / edit'}
            </button>
          )}
        </div>
        <p className="m-0 text-[0.75rem] leading-snug text-muted">
          Tap one or more — select everything you did.
        </p>

        <div className="flex flex-wrap gap-1.5" role="list">
          {preferences.map((pref) => {
            const selected = isPrefSelected(pref)
            return (
              <button
                key={pref.id}
                type="button"
                role="listitem"
                aria-pressed={selected}
                className={cx(prefChip, selected && prefChipSelected)}
                disabled={disabled || managing}
                onClick={() => togglePreference(pref)}
                title={`${pref.location} · ${pref.durationMins} min`}
              >
                {pref.name}
              </button>
            )
          })}
        </div>

        {managing && canManage && (
          <div className="grid gap-[0.65rem] rounded-xl border border-dashed border-line bg-bg p-3">
            <ul className="m-0 grid list-none gap-2 p-0">
              {preferences.map((pref) => (
                <li
                  key={pref.id}
                  className="grid gap-[0.45rem] rounded-[0.65rem] border border-line bg-panel px-[0.65rem] py-[0.55rem]"
                >
                  {editId === pref.id ? (
                    <div className="grid gap-[0.45rem]">
                      <input
                        type="text"
                        className={manageInput}
                        value={editName}
                        disabled={busy}
                        onChange={(e) => setEditName(e.target.value)}
                      />
                      <div className="grid grid-cols-[1fr_4.5rem] gap-1.5">
                        <select
                          className={manageInput}
                          value={editLocation}
                          disabled={busy}
                          onChange={(e) =>
                            setEditLocation(e.target.value as WorkoutLocation)
                          }
                        >
                          <option value="indoor">Indoor</option>
                          <option value="outdoor">Outdoor</option>
                        </select>
                        <input
                          type="number"
                          className={manageInput}
                          min={1}
                          max={600}
                          value={editMins}
                          disabled={busy}
                          onChange={(e) =>
                            setEditMins(Number(e.target.value) || 45)
                          }
                        />
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        <button
                          type="button"
                          className={cx(btnPrimary, btnCompact)}
                          disabled={busy}
                          onClick={() => void onSaveEdit()}
                        >
                          Save
                        </button>
                        <button
                          type="button"
                          className={cx(btnSecondary, btnCompact)}
                          disabled={busy}
                          onClick={() => setEditId(null)}
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="grid gap-0.5">
                        <strong className="text-[0.9rem]">{pref.name}</strong>
                        <span className="text-[0.78rem] capitalize text-muted">
                          {pref.location} · {pref.durationMins} min
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        <button
                          type="button"
                          className={cx(btnSecondary, btnCompact)}
                          disabled={busy}
                          onClick={() => startEdit(pref)}
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          className={cx(btnDanger, btnCompact)}
                          disabled={busy || preferences.length <= 1}
                          onClick={() => {
                            if (
                              window.confirm(
                                `Remove “${pref.name}” from your list?`,
                              )
                            ) {
                              void onRemovePreference?.(pref.id)
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

            {adding ? (
              <div className="grid gap-[0.45rem]">
                <input
                  type="text"
                  className={manageInput}
                  placeholder="e.g. Trail run"
                  value={newName}
                  disabled={busy}
                  onChange={(e) => setNewName(e.target.value)}
                />
                <div className="grid grid-cols-[1fr_4.5rem] gap-1.5">
                  <select
                    className={manageInput}
                    value={newLocation}
                    disabled={busy}
                    onChange={(e) =>
                      setNewLocation(e.target.value as WorkoutLocation)
                    }
                  >
                    <option value="indoor">Indoor</option>
                    <option value="outdoor">Outdoor</option>
                  </select>
                  <input
                    type="number"
                    className={manageInput}
                    min={1}
                    max={600}
                    value={newMins}
                    disabled={busy}
                    onChange={(e) => setNewMins(Number(e.target.value) || 45)}
                  />
                </div>
                <div className="flex flex-wrap gap-1.5">
                  <button
                    type="button"
                    className={cx(btnPrimary, btnCompact)}
                    disabled={busy}
                    onClick={() => void onSaveNew()}
                  >
                    Add workout
                  </button>
                  <button
                    type="button"
                    className={cx(btnSecondary, btnCompact)}
                    disabled={busy}
                    onClick={() => setAdding(false)}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <button
                type="button"
                className={cx(btnSecondary, btnCompact)}
                disabled={busy}
                onClick={() => {
                  setAdding(true)
                  setEditId(null)
                }}
              >
                + Add workout type
              </button>
            )}
          </div>
        )}
      </div>

      <div
        className="grid max-w-64 grid-cols-2 gap-1.5"
        role="group"
        aria-label="Workout location"
      >
        <button
          type="button"
          className={cx(
            locationBtn,
            workout.location === 'indoor' &&
              'border-accent bg-accent text-on-accent',
          )}
          disabled={disabled}
          onClick={() => setLocation('indoor')}
        >
          Indoor
        </button>
        <button
          type="button"
          className={cx(
            locationBtn,
            workout.location === 'outdoor' &&
              'border-accent bg-accent text-on-accent',
          )}
          disabled={disabled}
          onClick={() => setLocation('outdoor')}
        >
          Outdoor
        </button>
      </div>

      <label className="grid gap-[0.35rem]">
        <span className={fieldLabel}>What did you do?</span>
        <input
          type="text"
          className={fieldInput}
          placeholder="e.g. Run, weights, yoga"
          value={workout.note}
          disabled={disabled}
          onChange={(e) => onChange({ note: e.target.value, done: true })}
        />
      </label>

      <label className="grid gap-[0.35rem]">
        <span className={fieldLabel}>Duration (mins)</span>
        <input
          type="number"
          className={fieldInput}
          min={0}
          max={600}
          placeholder="45"
          value={workout.durationMins ?? ''}
          disabled={disabled}
          onChange={(e) => {
            const value = e.target.value
            onChange({
              durationMins: value === '' ? null : Number(value),
              done: true,
            })
          }}
        />
      </label>
    </div>
  )
}
