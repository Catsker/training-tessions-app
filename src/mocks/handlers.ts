import { delay, http, HttpResponse } from 'msw'
import type { Session } from '../features/training-sessions/types.ts'
import { addMockSession, getMockSessions } from './data.ts'

const SESSIONS_URL = '/api/sessions'

// React StrictMode (dev) sends the initial request twice and aborts the first one.
// The worker does not forward aborts to handlers, so the one-shot failure covers
// every request in the initial burst; a later Retry falls outside the window.
const FAILURE_BURST_MS = 250

let failListRequests = false
let failureBurstEndsAt: number | null = null

/** Makes the next `GET /api/sessions` (and its StrictMode duplicate) respond with 500, so Retry can recover. */
export function failNextSessionsRequest(): void {
  failListRequests = true
  failureBurstEndsAt = null
}

function shouldFailListRequest(): boolean {
  if (!failListRequests) return false

  const now = Date.now()
  failureBurstEndsAt ??= now + FAILURE_BURST_MS
  if (now <= failureBurstEndsAt) return true

  failListRequests = false
  return false
}

export const handlers = [
  http.get(SESSIONS_URL, async () => {
    const shouldFail = shouldFailListRequest()
    await delay()

    if (shouldFail) {
      return HttpResponse.json({ message: 'Mock server error' }, { status: 500 })
    }

    return HttpResponse.json(getMockSessions())
  }),

  http.post(SESSIONS_URL, async ({ request }) => {
    await delay()

    const body: unknown = await request.json().catch(() => null)
    if (typeof body !== 'object' || body === null) {
      return HttpResponse.json({ message: 'Invalid request body' }, { status: 400 })
    }

    const { title, startsAt } = body as Record<string, unknown>
    if (typeof title !== 'string' || typeof startsAt !== 'string') {
      return HttpResponse.json({ message: 'Invalid request body' }, { status: 400 })
    }

    const session: Session = {
      id: crypto.randomUUID(),
      title,
      status: 'scheduled',
      startsAt,
    }
    addMockSession(session)

    return HttpResponse.json(session, { status: 201 })
  }),
]
