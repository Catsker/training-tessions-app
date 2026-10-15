import '@testing-library/jest-dom/vitest'
import { cleanup } from '@testing-library/react'
import { afterAll, afterEach, beforeAll } from 'vitest'
import { resetMockSessions } from '../mocks/data.ts'
import { server } from './server.ts'

beforeAll(() => {
  server.listen({ onUnhandledRequest: 'error' })
})

afterEach(() => {
  cleanup()
  server.resetHandlers()
  server.events.removeAllListeners()
  resetMockSessions()
})

afterAll(() => {
  server.close()
})
