const NETWORK_ERROR_MESSAGE =
  "Can't reach the server. Check your connection and try again."
const SERVER_ERROR_MESSAGE = 'Something went wrong on the server. Please try again.'
export const INVALID_RESPONSE_MESSAGE =
  'The server sent an unexpected response. Please try again.'

/** Request failure with a message that is safe to show to the user. */
export class ApiError extends Error {
  /** HTTP status, or `null` when no response was received. */
  readonly status: number | null

  constructor(status: number | null, message: string) {
    super(message)
    this.name = 'ApiError'
    this.status = status
  }
}

interface RequestOptions {
  method?: 'GET' | 'POST'
  /** Serialized as JSON when provided. */
  body?: unknown
  signal?: AbortSignal
}

/**
 * Sends a JSON request and resolves with the parsed body as `unknown`;
 * callers narrow it. Throws `ApiError` on network failure, non-2xx status,
 * or an unparsable body. Aborts are rethrown unchanged so callers can ignore them.
 */
export async function request(
  path: string,
  { method = 'GET', body, signal }: RequestOptions = {},
): Promise<unknown> {
  // Absolute URL so the same code works in the browser and in Node-based tests.
  const url = new URL(path, window.location.origin)
  const hasBody = body !== undefined

  let response: Response
  try {
    response = await fetch(url, {
      method,
      signal,
      headers: hasBody
        ? { Accept: 'application/json', 'Content-Type': 'application/json' }
        : { Accept: 'application/json' },
      body: hasBody ? JSON.stringify(body) : undefined,
    })
  } catch (error) {
    if (signal?.aborted) throw error
    throw new ApiError(null, NETWORK_ERROR_MESSAGE)
  }

  if (!response.ok) {
    throw new ApiError(response.status, SERVER_ERROR_MESSAGE)
  }

  if (response.status === 204) return null

  try {
    return await response.json()
  } catch (error) {
    if (signal?.aborted) throw error
    throw new ApiError(response.status, INVALID_RESPONSE_MESSAGE)
  }
}
