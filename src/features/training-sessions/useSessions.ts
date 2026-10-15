import { useEffect, useState } from 'react'
import { ApiError } from './api/http.ts'
import { getSessions } from './api/sessionsApi.ts'
import type { Session } from './types.ts'

const FALLBACK_ERROR_MESSAGE = 'Something went wrong. Please try again.'

export type SessionsState =
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'success'; sessions: Session[] }

/** Loads sessions from the API and keeps the list in sync with local additions. */
export function useSessions() {
  const [state, setState] = useState<SessionsState>({ status: 'loading' })
  // Bumped by retry() to re-run the request effect.
  const [attempt, setAttempt] = useState(0)

  useEffect(() => {
    const controller = new AbortController()

    getSessions(controller.signal).then(
      (sessions) => {
        if (controller.signal.aborted) return
        setState({ status: 'success', sessions })
      },
      (error: unknown) => {
        if (controller.signal.aborted) return
        const message = error instanceof ApiError ? error.message : FALLBACK_ERROR_MESSAGE
        setState({ status: 'error', message })
      },
    )

    return () => controller.abort()
  }, [attempt])

  function retry() {
    setState({ status: 'loading' })
    setAttempt((current) => current + 1)
  }

  function addSession(session: Session) {
    setState((current) =>
      current.status === 'success'
        ? { status: 'success', sessions: [...current.sessions, session] }
        : current,
    )
  }

  return { state, retry, addSession }
}
