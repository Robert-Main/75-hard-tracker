/** Shared Tailwind class bundles for repeated UI patterns. */

export function cx(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(' ')
}

export const btnPrimary =
  'inline-flex items-center justify-center rounded-xl border-0 bg-accent px-5 py-3.5 font-bold tracking-wide text-on-accent transition hover:bg-accent-hot active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-65 w-full md:w-fit'

export const btnSecondary =
  'inline-flex items-center justify-center rounded-xl border border-line bg-panel px-3.5 py-3 font-bold text-ink transition hover:border-accent/40 disabled:cursor-not-allowed disabled:opacity-65'

export const btnDanger =
  'inline-flex items-center justify-center rounded-xl border border-danger/35 bg-danger/10 px-3 py-2 text-sm font-bold text-danger'

export const btnGhost =
  'appearance-none border-0 bg-transparent p-0 font-semibold text-accent-ink underline cursor-pointer'

export const fieldLabel =
  'text-[0.78rem] font-semibold uppercase tracking-wide text-muted'

export const fieldInput =
  'w-full rounded-lg border border-line bg-panel px-2.5 py-2 text-[0.9rem] text-ink outline-none focus:outline focus:outline-2 focus:outline-offset-1 focus:outline-accent/45 disabled:cursor-not-allowed disabled:opacity-55'

export const panelCard =
  'mb-3.5 grid gap-3 rounded-2xl border border-line bg-panel/90 p-4'

export const sectionTitle =
  'm-0 font-display text-[clamp(1.9rem,7vw,2.4rem)] uppercase tracking-wide text-ink'

export const mutedText = 'm-0 text-muted leading-snug'

export const prefChip =
  'appearance-none rounded-full border border-line bg-panel px-2.5 py-1.5 text-[0.8rem] font-semibold text-ink transition hover:border-accent/40 disabled:cursor-not-allowed disabled:opacity-55'

export const prefChipSelected =
  'border-accent bg-accent text-on-accent hover:border-accent'

export const doneToggle =
  'inline-flex max-w-full w-fit cursor-pointer items-center gap-1.5 rounded-full border border-line bg-panel px-2.5 py-1 text-[0.78rem] font-bold leading-tight text-muted'

export const doneToggleOn =
  'border-done bg-done text-on-done'

export const textLink =
  'w-fit font-semibold text-accent-ink no-underline hover:underline'

export const btnCompact = '!w-fit px-[0.7rem] py-[0.45rem] text-[0.8rem]'

export const pageTitle =
  'm-0 font-display text-[clamp(1.9rem,7vw,2.4rem)] uppercase tracking-[0.03em] text-ink'
