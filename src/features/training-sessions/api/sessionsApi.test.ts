import { http, HttpResponse } from 'msw'
import { describe, expect, it } from 'vitest'
import { server } from '../../../test/server.ts'
import { ApiError } from './http.ts'
import { createSession, getSessions } from './sessionsApi.ts'

describe('sessionsApi', () => {
  it('loads the seeded sessions from the mock API', async () => {
    const sessions = await getSessions()

    expect(sessions).toHaveLength(6)
    expect(sessions.map((session) => session.status)).toEqual(
      expect.arrayContaining(['scheduled', 'completed', 'cancelled']),
    )
  })

  it('creates a scheduled session that the next list request includes', async () => {
    const startsAt = new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString()

    const created = await createSession({ title: 'Evening stretch', startsAt })

    expect(created).toMatchObject({ title: 'Evening stretch', status: 'scheduled', startsAt })
    expect(await getSessions()).toContainEqual(created)
  })

  it('turns a server failure into an ApiError with a user-safe message', async () => {
    server.use(http.get('/api/sessions', () => new HttpResponse(null, { status: 500 })))

    const error: unknown = await getSessions().catch((caught: unknown) => caught)

    expect(error).toBeInstanceOf(ApiError)
    expect(error).toMatchObject({ status: 500 })
    expect((error as ApiError).message).not.toMatch(/500|stack|fetch/i)
  })
})
