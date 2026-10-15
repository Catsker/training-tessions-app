import { ApiError, INVALID_RESPONSE_MESSAGE, request } from './http.ts'
import {
  isSessionStatus,
  type CreateSessionInput,
  type Session,
} from '../types.ts'

const SESSIONS_PATH = '/api/sessions'

export async function getSessions(signal?: AbortSignal): Promise<Session[]> {
  const data = await request(SESSIONS_PATH, { signal })
  if (!Array.isArray(data)) throw invalidResponse()
  return data.map(toSession)
}

export async function createSession(input: CreateSessionInput): Promise<Session> {
  const data = await request(SESSIONS_PATH, { method: 'POST', body: input })
  return toSession(data)
}

function toSession(value: unknown): Session {
  if (typeof value !== 'object' || value === null) throw invalidResponse()

  const { id, title, status, startsAt } = value as Record<string, unknown>
  if (
    typeof id !== 'string' ||
    typeof title !== 'string' ||
    !isSessionStatus(status) ||
    typeof startsAt !== 'string' ||
    Number.isNaN(Date.parse(startsAt))
  ) {
    throw invalidResponse()
  }

  return { id, title, status, startsAt }
}

function invalidResponse(): ApiError {
  return new ApiError(null, INVALID_RESPONSE_MESSAGE)
}
