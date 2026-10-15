import type { Session } from '../features/training-sessions/types.ts'

/** Local date `days` from `now` at the given time, as ISO 8601. */
function daysFromNow(now: Date, days: number, hours: number, minutes = 0): string {
  const date = new Date(now)
  date.setDate(date.getDate() + days)
  date.setHours(hours, minutes, 0, 0)
  return date.toISOString()
}

function createSeedSessions(now: Date): Session[] {
  return [
    { id: 'session-1', title: 'Morning mobility class', status: 'completed', startsAt: daysFromNow(now, -5, 8) },
    { id: 'session-2', title: 'Strength fundamentals', status: 'completed', startsAt: daysFromNow(now, -2, 18, 30) },
    { id: 'session-3', title: 'Team HIIT workout', status: 'cancelled', startsAt: daysFromNow(now, 1, 7) },
    { id: 'session-4', title: 'Yoga for runners', status: 'scheduled', startsAt: daysFromNow(now, 1, 19) },
    { id: 'session-5', title: 'Interval running club', status: 'scheduled', startsAt: daysFromNow(now, 3, 7, 30) },
    { id: 'session-6', title: 'Core and balance', status: 'scheduled', startsAt: daysFromNow(now, 6, 12) },
  ]
}

// In-memory store: created sessions live until the page reloads.
let sessions: Session[] = createSeedSessions(new Date())

export function getMockSessions(): Session[] {
  return [...sessions]
}

export function addMockSession(session: Session): void {
  sessions = [...sessions, session]
}

/** Restores fresh seed data; used between tests. */
export function resetMockSessions(): void {
  sessions = createSeedSessions(new Date())
}
