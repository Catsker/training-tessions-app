import { useId, useRef, useState } from 'react'
import { CreateSessionForm } from './CreateSessionForm.tsx'
import { SessionList } from './SessionList.tsx'
import { StatusFilter } from './StatusFilter.tsx'
import type { Session, StatusFilterValue } from './types.ts'
import { useSessions } from './useSessions.ts'

function byStartTime(a: Session, b: Session): number {
  return Date.parse(a.startsAt) - Date.parse(b.startsAt)
}

export function SessionsWorkspace() {
  const headingId = useId()
  const createFormId = useId()
  const { state, retry, addSession } = useSessions()
  const [filter, setFilter] = useState<StatusFilterValue>('all')
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  // While a create request is pending the form must stay open, or its result would be lost.
  const [isCreatePending, setIsCreatePending] = useState(false)
  const newSessionButtonRef = useRef<HTMLButtonElement>(null)

  function closeCreateForm() {
    setIsCreatePending(false)
    setIsCreateOpen(false)
    newSessionButtonRef.current?.focus()
  }

  function handleCreated(session: Session) {
    addSession(session)
    // Show every status so the new session is visible whatever filter was active.
    setFilter('all')
    closeCreateForm()
  }

  return (
    <section className="sessions" aria-labelledby={headingId}>
      <div className="sessions-toolbar">
        <h2 id={headingId}>Sessions</h2>
        <div className="sessions-actions">
          <StatusFilter value={filter} onChange={setFilter} />
          {state.status === 'success' ? (
            <button
              ref={newSessionButtonRef}
              type="button"
              className="button"
              aria-expanded={isCreateOpen}
              aria-controls={isCreateOpen ? createFormId : undefined}
              // aria-disabled (not disabled) keeps the button focusable, so closeCreateForm()
              // can return focus to it in the same event that clears the pending state.
              aria-disabled={isCreatePending ? true : undefined}
              onClick={() => {
                if (isCreatePending) return
                setIsCreateOpen((current) => !current)
              }}
            >
              New session
            </button>
          ) : null}
        </div>
      </div>

      {state.status === 'success' && isCreateOpen ? (
        <div id={createFormId}>
          <CreateSessionForm
            onCreated={handleCreated}
            onCancel={closeCreateForm}
            onPendingChange={setIsCreatePending}
          />
        </div>
      ) : null}

      {state.status === 'loading' ? (
        <p className="state-message" role="status">
          Loading sessions…
        </p>
      ) : null}

      {state.status === 'error' ? (
        <div className="error-panel" role="alert">
          <p className="error-title">Couldn’t load sessions.</p>
          <p>{state.message}</p>
          <button type="button" className="button" onClick={retry}>
            Retry
          </button>
        </div>
      ) : null}

      {state.status === 'success' ? (
        <SessionList
          sessions={state.sessions
            .filter((session) => filter === 'all' || session.status === filter)
            .toSorted(byStartTime)}
          emptyMessage={
            filter === 'all' ? 'No sessions yet.' : 'No sessions match this filter.'
          }
          labelledBy={headingId}
        />
      ) : null}
    </section>
  )
}
