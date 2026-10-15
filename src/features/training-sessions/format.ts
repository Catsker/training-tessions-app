const startsAtFormatter = new Intl.DateTimeFormat(undefined, {
  dateStyle: 'medium',
  timeStyle: 'short',
})

/** Formats an ISO 8601 date-time in the user's locale, e.g. "Oct 20, 2026, 6:30 PM". */
export function formatStartsAt(iso: string): string {
  return startsAtFormatter.format(new Date(iso))
}

/** Formats a date as an `<input type="datetime-local">` value in local time, e.g. `2026-10-20T18:30`. */
export function toDateTimeLocalValue(date: Date): string {
  const pad = (value: number) => String(value).padStart(2, '0')
  return (
    `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}` +
    `T${pad(date.getHours())}:${pad(date.getMinutes())}`
  )
}
