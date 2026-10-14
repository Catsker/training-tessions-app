export const SESSION_STATUSES = ['scheduled', 'completed', 'cancelled'] as const

export type SessionStatus = (typeof SESSION_STATUSES)[number]

export const SESSION_STATUS_LABELS: Record<SessionStatus, string> = {
  scheduled: 'Scheduled',
  completed: 'Completed',
  cancelled: 'Cancelled',
}

export function isSessionStatus(value: unknown): value is SessionStatus {
  return SESSION_STATUSES.some((status) => status === value)
}

export interface Session {
  id: string
  title: string
  status: SessionStatus
  /** ISO 8601 date-time. */
  startsAt: string
}

export interface CreateSessionInput {
  /** Already trimmed. */
  title: string
  /** ISO 8601 date-time. */
  startsAt: string
}
