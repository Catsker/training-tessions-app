import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

// There is no backend: the mock API (MSW) is the request boundary in every mode.
async function enableMocking() {
  const { worker } = await import('./mocks/browser.ts')
  await worker.start({ onUnhandledRequest: 'bypass' })
}

enableMocking()
  .catch((error: unknown) => {
    console.error('Failed to start the mock API.', error)
  })
  .finally(() => {
    createRoot(document.getElementById('root')!).render(
      <StrictMode>
        <App />
      </StrictMode>,
    )
  })
