import type { CreateSessionInput } from './types.ts'

export const TITLE_MIN_LENGTH = 3
export const TITLE_MAX_LENGTH = 80

export interface CreateSessionFormValues {
  title: string
  /** Value of an `<input type="datetime-local">`, e.g. `2026-10-20T18:30`. */
  startsAtLocal: string
}

export interface CreateSessionErrors {
  title?: string
  startsAt?: string
}

export function validateCreateSession(
  values: CreateSessionFormValues,
  now: Date,
): CreateSessionErrors {
  const errors: CreateSessionErrors = {}

  const titleLength = values.title.trim().length
  if (titleLength === 0) {
    errors.title = 'Enter a session title.'
  } else if (titleLength < TITLE_MIN_LENGTH || titleLength > TITLE_MAX_LENGTH) {
    errors.title = `Title must be ${TITLE_MIN_LENGTH}–${TITLE_MAX_LENGTH} characters.`
  }

  const startsAt = parseLocalDateTime(values.startsAtLocal)
  if (startsAt === null) {
    errors.startsAt = 'Choose a start date and time.'
  } else if (startsAt.getTime() <= now.getTime()) {
    errors.startsAt = 'Choose a date and time in the future.'
  }

  return errors
}

export function hasErrors(errors: CreateSessionErrors): boolean {
  return errors.title !== undefined || errors.startsAt !== undefined
}

/** Converts already-validated form values into the API payload. */
export function toCreateSessionInput(
  values: CreateSessionFormValues,
): CreateSessionInput {
  const startsAt = parseLocalDateTime(values.startsAtLocal)
  if (startsAt === null) {
    throw new Error('toCreateSessionInput requires a valid start date and time')
  }
  return { title: values.title.trim(), startsAt: startsAt.toISOString() }
}

/** Date-time strings without an offset are parsed in the browser's local time zone. */
function parseLocalDateTime(value: string): Date | null {
  if (value.trim() === '') return null
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? null : date
}
