import { useEffect, useRef, useState } from 'react'
import type { ReadingPreference } from '../types'
import {
  btnCompact,
  btnGhost,
  btnPrimary,
  btnSecondary,
  cx,
  fieldInput,
  fieldLabel,
  prefChip,
  prefChipSelected,
} from '../lib/ui'

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

function parsePages(value: string): number {
  if (value.trim() === '') return 0
  const n = Number(value)
  if (!Number.isFinite(n) || n < 0) return 0
  return Math.min(500, Math.round(n))
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
  const [pagesDraft, setPagesDraft] = useState(String(pages || ''))
  const [titleDraft, setTitleDraft] = useState(title)
  const pagesRef = useRef(pages)
  const titleRef = useRef(title)
  const onChangeRef = useRef(onChange)
  pagesRef.current = pages
  titleRef.current = title
  onChangeRef.current = onChange

  useEffect(() => {
    setPagesDraft(pages > 0 ? String(pages) : '')
  }, [pages])

  useEffect(() => {
    setTitleDraft(title)
  }, [title])

  useEffect(() => {
    const next = parsePages(pagesDraft)
    if (next === pagesRef.current) return
    const timer = window.setTimeout(() => {
      onChangeRef.current({ readingPages: next })
    }, 450)
    return () => window.clearTimeout(timer)
  }, [pagesDraft])

  useEffect(() => {
    if (titleDraft === titleRef.current) return
    const timer = window.setTimeout(() => {
      onChangeRef.current({ readingTitle: titleDraft })
    }, 450)
    return () => window.clearTimeout(timer)
  }, [titleDraft])

  const canManage = Boolean(
    onAddPreference && onUpdatePreference && onRemovePreference,
  )

  const commitPages = (raw: string) => {
    const next = parsePages(raw)
    setPagesDraft(next > 0 ? String(next) : '')
    if (next !== pagesRef.current) onChangeRef.current({ readingPages: next })
  }

  const commitTitle = (raw: string) => {
    if (raw !== titleRef.current) onChangeRef.current({ readingTitle: raw })
  }

  const applyPreference = (pref: ReadingPreference) => {
    const nextPages = Math.max(pages, pref.defaultPages)
    setPagesDraft(String(nextPages))
    setTitleDraft(pref.title)
    onChange({
      readingTitle: pref.title,
      readingPages: nextPages,
    })
  }

  return (
    <div className="grid gap-3">
      {preferences.length > 0 && (
        <div className="grid gap-1.5">
          <div className="flex items-center justify-between gap-2">
            <span className={fieldLabel}>Choose a book</span>
            {canManage && (
              <button
                type="button"
                className={cx(btnGhost, 'text-[0.78rem]')}
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

          <div className="flex flex-wrap gap-1.5" role="list">
            {preferences.map((pref) => {
              const selected =
                title.trim().toLowerCase() === pref.title.toLowerCase()
              return (
                <button
                  key={pref.id}
                  type="button"
                  role="listitem"
                  className={cx(prefChip, selected && prefChipSelected)}
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
                          className={cx(fieldInput, 'bg-bg')}
                          value={editTitle}
                          disabled={busy}
                          onChange={(e) => setEditTitle(e.target.value)}
                        />
                        <input
                          type="number"
                          className={cx(fieldInput, 'bg-bg')}
                          min={1}
                          max={500}
                          value={editPages}
                          disabled={busy}
                          onChange={(e) =>
                            setEditPages(Number(e.target.value) || goalPages)
                          }
                        />
                        <div className="flex flex-wrap gap-1.5">
                          <button
                            type="button"
                            className={cx(btnPrimary, btnCompact)}
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
                            className={cx(btnSecondary, btnCompact)}
                            disabled={busy}
                            onClick={() => setEditId(null)}
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <span className="text-[0.9rem]">
                          {pref.title} · {pref.defaultPages} pg
                        </span>
                        <div className="flex flex-wrap gap-1.5">
                          <button
                            type="button"
                            className={cx(btnSecondary, btnCompact)}
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
                            className={cx(btnSecondary, btnCompact)}
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
                <div className="grid gap-[0.45rem]">
                  <input
                    type="text"
                    className={cx(fieldInput, 'bg-bg')}
                    placeholder="Book title"
                    value={newTitle}
                    disabled={busy}
                    onChange={(e) => setNewTitle(e.target.value)}
                  />
                  <input
                    type="number"
                    className={cx(fieldInput, 'bg-bg')}
                    min={1}
                    max={500}
                    value={newPages}
                    disabled={busy}
                    onChange={(e) =>
                      setNewPages(Number(e.target.value) || goalPages)
                    }
                  />
                  <div className="flex flex-wrap gap-1.5">
                    <button
                      type="button"
                      className={cx(btnPrimary, btnCompact)}
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

      <label className="grid gap-[0.35rem]">
        <span className={fieldLabel}>Pages read</span>
        <input
          type="number"
          className={fieldInput}
          min={0}
          max={500}
          inputMode="numeric"
          value={pagesDraft}
          placeholder="0"
          disabled={disabled}
          onChange={(e) => setPagesDraft(e.target.value)}
          onBlur={() => commitPages(pagesDraft)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.currentTarget.blur()
            }
          }}
        />
      </label>

      <label className="grid gap-[0.35rem]">
        <span className={fieldLabel}>Book (optional)</span>
        <input
          type="text"
          className={fieldInput}
          value={titleDraft}
          placeholder="Title"
          disabled={disabled}
          onChange={(e) => setTitleDraft(e.target.value)}
          onBlur={() => commitTitle(titleDraft)}
        />
      </label>

      {(pages >= goalPages || parsePages(pagesDraft) >= goalPages) && (
        <p className="m-0 text-[0.86rem] font-semibold text-done-ink">
          {goalPages}-page goal reached — you can still edit.
        </p>
      )}
    </div>
  )
}
