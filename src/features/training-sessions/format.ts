const startsAtFormatter = new Intl.DateTimeFormat(undefined, {
  dateStyle: 'medium',
  timeStyle: 'short',
})

/** Formats an ISO 8601 date-time in the user's locale, e.g. "Oct 20, 2026, 6:30 PM". */
export function formatStartsAt(iso: string): string {
  return startsAtFormatter.format(new Date(iso))
}
