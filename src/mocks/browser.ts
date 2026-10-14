import { setupWorker } from 'msw/browser'
import { failNextSessionsRequest, handlers } from './handlers.ts'

// `?mockError=list` makes the first sessions request fail, to check the error and Retry flow.
if (new URLSearchParams(window.location.search).get('mockError') === 'list') {
  failNextSessionsRequest()
}

export const worker = setupWorker(...handlers)
