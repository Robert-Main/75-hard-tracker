import { useState } from 'react'
import type { ReadingPreference } from '../types'
import './ChecklistCard.css'
import './WorkoutCard.css'

interface ReadingCardProps {
  pages: number
  title: string
  goalPages: number
  preferences?: ReadingPreference[]
  disabled?: boolean
  onChange: (patch: { readingPages?: number; readingTitle?: string }) => void
  onAddPreference?: (patch: {
    title: string
    defaultPages?: number
  }) => Promise<void> | void
  onUpdatePreference?: (
    id: string,
    patch: Partial<{ title: string; defaultPages: number }>,
  ) => Promise<void> | void
  onRemovePreference?: (id: string) => Promise<void> | void
}

export function ReadingCard({
  pages,
  title,
  goalPages,
  preferences = [],
  disabled = false,
  onChange,
  onAddPreference,
  onUpdatePreference,
  onRemovePreference,
}: ReadingCardProps) {
  const [managing, setManaging] = useState(false)
  const [adding, setAdding] = useState(false)
  const [newTitle, setNewTitle] = useState('')
  const [newPages, setNewPages] = useState(goalPages)
  const [editId, setEditId] = useState<string | null>(null)
  const [editTitle, setEditTitle] = useState('')
  const [editPages, setEditPages] = useState(goalPages)
  const [busy, setBusy] = useState(false)

  const canManage = Boolean(
    onAddPreference && onUpdatePreference && onRemovePreference,
  )

  const applyPreference = (pref: ReadingPreference) => {
    onChange({
      readingTitle: pref.title,
      readingPages: Math.max(pages, pref.defaultPages),
    })
  }

  return (
    <div className="task-editor">
      {preferences.length > 0 && (
        <div className="pref-pick">
          <div className="pref-pick__head">
            <span className="pref-pick__label">Choose a book</span>
            {canManage && (
              <button
                type="button"
                className="pref-pick__manage"
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

          <div className="pref-pick__row" role="list">
            {preferences.map((pref) => {
              const selected =
                title.trim().toLowerCase() === pref.title.toLowerCase()
              return (
                <button
                  key={pref.id}
                  type="button"
                  role="listitem"
                  className={`pref-chip ${selected ? 'is-selected' : ''}`}
                  disabled={disabled || managing}
                  onClick={() => applyPreference(pref)}
                  title={`${pref.defaultPages} pages`}
                >
                  {pref.title}
                </button>
              )
            })}
          </div>

          {managing && canManage && (
            <div className="pref-manage">
              <ul className="pref-manage__list">
                {preferences.map((pref) => (
                  <li key={pref.id}>
                    {editId === pref.id ? (
                      <div className="pref-manage__form">
                        <input
                          type="text"
                          value={editTitle}
                          disabled={busy}
                          onChange={(e) => setEditTitle(e.target.value)}
                        />
                        <input
                          type="number"
                          min={1}
                          max={500}
                          value={editPages}
                          disabled={busy}
                          onChange={(e) =>
                            setEditPages(Number(e.target.value) || goalPages)
                          }
                        />
                        <div className="pref-manage__actions">
                          <button
                            type="button"
                            className="btn-primary"
                            disabled={busy}
                          onClick={() => {
                            if (!onUpdatePreference || !editTitle.trim()) return
                            setBusy(true)
                            void Promise.resolve(
                              onUpdatePreference(editId, {
                                title: editTitle.trim(),
                                defaultPages: editPages,
                              }),
                            ).finally(() => {
                              setEditId(null)
                              setBusy(false)
                            })
                          }}
                          >
                            Save
                          </button>
                          <button
                            type="button"
                            className="btn-secondary"
                            disabled={busy}
                            onClick={() => setEditId(null)}
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="pref-manage__row-item">
                        <span>
                          {pref.title} · {pref.defaultPages} pg
                        </span>
                        <div className="pref-manage__actions">
                          <button
                            type="button"
                            className="btn-secondary"
                            disabled={busy}
                            onClick={() => {
                              setEditId(pref.id)
                              setEditTitle(pref.title)
                              setEditPages(pref.defaultPages)
                              setAdding(false)
                            }}
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            className="btn-secondary"
                            disabled={busy || preferences.length <= 1}
                            onClick={() => {
                              if (
                                !onRemovePreference ||
                                !window.confirm(
                                  `Remove “${pref.title}” from your book list?`,
                                )
                              ) {
                                return
                              }
                              setBusy(true)
                              void Promise.resolve(
                                onRemovePreference(pref.id),
                              ).finally(() => setBusy(false))
                            }}
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                    )}
                  </li>
                ))}
              </ul>

              {adding ? (
                <div className="pref-manage__form">
                  <input
                    type="text"
                    placeholder="Book title"
                    value={newTitle}
                    disabled={busy}
                    onChange={(e) => setNewTitle(e.target.value)}
                  />
                  <input
                    type="number"
                    min={1}
                    max={500}
                    value={newPages}
                    disabled={busy}
                    onChange={(e) =>
                      setNewPages(Number(e.target.value) || goalPages)
                    }
                  />
                  <div className="pref-manage__actions">
                    <button
                      type="button"
                      className="btn-primary"
                      disabled={busy || !newTitle.trim()}
                      onClick={() => {
                        if (!onAddPreference || !newTitle.trim()) return
                        setBusy(true)
                        void Promise.resolve(
                          onAddPreference({
                            title: newTitle.trim(),
                            defaultPages: newPages,
                          }),
                        ).finally(() => {
                          setNewTitle('')
                          setNewPages(goalPages)
                          setAdding(false)
                          setBusy(false)
                        })
                      }}
                    >
                      Save book
                    </button>
                    <button
                      type="button"
                      className="btn-secondary"
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
                  className="pref-manage__add"
                  disabled={busy}
                  onClick={() => {
                    setAdding(true)
                    setEditId(null)
                    setNewPages(goalPages)
                  }}
                >
                  + Add book
                </button>
              )}
            </div>
          )}
        </div>
      )}

      <label className="field">
        <span>Pages read</span>
        <input
          type="number"
          min={0}
          max={500}
          value={pages || ''}
          placeholder="0"
          disabled={disabled}
          onChange={(e) =>
            onChange({
              readingPages: e.target.value === '' ? 0 : Number(e.target.value),
            })
          }
        />
      </label>

      <label className="field">
        <span>Book (optional)</span>
        <input
          type="text"
          value={title}
          placeholder="Title"
          disabled={disabled}
          onChange={(e) => onChange({ readingTitle: e.target.value })}
        />
      </label>

      {pages >= goalPages && (
        <p className="task-editor__hint">
          {goalPages}-page goal reached — you can still edit.
        </p>
      )}
    </div>
  )
}
