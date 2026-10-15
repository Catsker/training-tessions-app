import { formatStartsAt } from './format.ts'
import { SESSION_STATUS_LABELS, type Session } from './types.ts'

interface SessionListProps {
  sessions: Session[]
  /** Shown instead of the list when `sessions` is empty. */
  emptyMessage: string
  labelledBy: string
}

export function SessionList({ sessions, emptyMessage, labelledBy }: SessionListProps) {
  if (sessions.length === 0) {
    return <p className="state-message">{emptyMessage}</p>
  }

  return (
    <ul className="session-list" aria-labelledby={labelledBy}>
      {sessions.map((session) => (
        <li key={session.id} className="session-item">
          <h3 className="session-title">{session.title}</h3>
          <span className={`status-badge status-badge--${session.status}`}>
            {SESSION_STATUS_LABELS[session.status]}
          </span>
          <time className="session-time" dateTime={session.startsAt}>
            {formatStartsAt(session.startsAt)}
          </time>
        </li>
      ))}
    </ul>
  )
}
