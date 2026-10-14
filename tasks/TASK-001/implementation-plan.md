# TASK-001 Implementation Plan: Training Sessions Workspace

- Inputs: `tasks/TASK-001/requirements.md` (AC-*, A-*, OQ-*), `frontend-accelerator-onboarding/TASK.md`, `CLAUDE.md`
- Application Root: repository root (Vite 8 + React 19 + TypeScript ~6, npm)
- Role: `writing-plans` — plan only; no production code was changed
- Execution model: **one `coder` prompt per step (Steps 1–6)**, run in order; the developer reviews each step before starting the next

## 1. Current vs Intended Behavior

| | Current | Intended |
| --- | --- | --- |
| UI | Vite starter page (hero image, counter, Vite/React links, social icons) | One "Training sessions" workspace: status filter, sessions list, create form |
| Data | None | Sessions read/created through a replaceable request boundary backed by a mock HTTP API |
| States | — | Loading, recoverable error (Retry), empty, validation, pending submit |
| Tests | No test runner, no `test` script | Behavior-level tests for filtering and successful creation |

## 2. Developer Decisions Required (gate before Step 3)

You asked that no versions or dependencies change without your approval. The plan needs these decisions:

| ID | Decision | Recommended | Effect if declined |
| --- | --- | --- | --- |
| D-1 | Add **`msw`** (devDependency) as the mock HTTP API (OQ-5) | Approve. `TASK.md` names MSW as acceptable. `npx msw init public --save` also generates `public/mockServiceWorker.js` and adds an `"msw"` key to `package.json` | Step 3 switches to fallback F-1 (no new package) |
| D-2 | Add test tooling as devDependencies: **`vitest`, `jsdom`, `@testing-library/react`, `@testing-library/user-event`, `@testing-library/jest-dom`**, plus a `"test": "vitest run"` script (OQ-3) | Approve | Step 4 is skipped and AC-T1 stays **unmet**; this must be reported honestly |
| D-3 | Filter control = `All` plus every status (OQ-1) | Accept default | Show only `All` + `Scheduled` |
| D-4 | After a successful create, reset the filter to `All` so the new session is visible (OQ-2) | Accept default | The new session may be hidden by the active filter |

Version rule for the coder: do not change existing versions. For new packages, choose the current major whose peer range supports **Vite 8 / React 19 / TS 6**. Report exact versions **before** running `npm install`, and install only after the developer approves.

**F-1 fallback (only if D-1 is declined):** `src/mocks/mockFetch.ts` is an in-memory implementation behind the same `sessionsApi` functions (simulated latency + error flag). The UI contract does not change.

## 3. Structure Rules

- Global structure stays the same: no changes to root config layout, entry points (`index.html` -> `src/main.tsx` -> `src/App.tsx`), or tooling folders.
- New code goes **under `src/` only**, in one feature folder plus a mocks folder:

```text
src/
|-- main.tsx                     (modify: start mock worker before render — Step 3)
|-- App.tsx                      (modify: app shell -> workspace)
|-- App.css / index.css          (modify: replace starter styles)
|-- features/training-sessions/
|   |-- types.ts                 Session, SessionStatus, CreateSessionInput, status labels
|   |-- api/http.ts              small fetch wrapper + ApiError
|   |-- api/sessionsApi.ts       getSessions(signal), createSession(input)
|   |-- validation.ts            validateCreateSession(input, now) -> field errors
|   |-- format.ts                formatStartsAt(iso)
|   |-- useSessions.ts           list request state, retry, addSession
|   |-- SessionsWorkspace.tsx    composes filter + list + create form
|   |-- StatusFilter.tsx
|   |-- SessionList.tsx
|   |-- CreateSessionForm.tsx
|   `-- *.test.ts(x)             tests beside the behavior they protect
|-- mocks/
|   |-- data.ts                  seed sessions (dates relative to "now")
|   |-- handlers.ts              GET/POST /api/sessions + error trigger
|   `-- browser.ts               setupWorker(...handlers)
`-- test/
    |-- setup.ts                 jest-dom matchers, MSW server lifecycle
    `-- server.ts                setupServer(...handlers)
```

- TypeScript constraints from `tsconfig.app.json`: `erasableSyntaxOnly` (no `enum`, no parameter properties — use string unions / `as const`), `verbatimModuleSyntax` (`import type`), `noUnusedLocals/Parameters`. Follow the existing convention of importing local TSX files with the extension (`./App.tsx`).
- ESLint `react-refresh/only-export-components`: component files export only components; constants and helpers live in `types.ts` / `format.ts` / `validation.ts`.
- React Compiler is on: no manual `useMemo`/`useCallback` unless needed; keep render pure.

## 4. Shared Contracts (across steps)

- **Session** (A-1/A-2): `{ id: string; title: string; status: 'scheduled' | 'completed' | 'cancelled'; startsAt: string /* ISO 8601 */ }`
- **CreateSessionInput**: `{ title: string; startsAt: string /* ISO 8601 */ }`. The title is already trimmed and the date is already converted to ISO by the form.
- **Endpoints** (mock only, relative URLs):
  - `GET /api/sessions` -> `200 Session[]`
  - `POST /api/sessions` body `CreateSessionInput` -> `201 Session`. Status is always `scheduled` (A-3) and the id is generated by the mock.
- **http.ts**: throws `ApiError` (status + user-safe message) on non-2xx or network failure. Components never see raw `fetch` errors.
- **sessionsApi.ts** is the only module the UI uses for data (AC-M1). No component imports `src/mocks/*`.
- **Validation** (AC-C2/C3): `title.trim().length` must be within 3–80 inclusive, and `startsAt` must be present and `> now`, compared in the browser's local time (A-7). The pure function takes `now` as a parameter so it is testable.
- **Error trigger** (AC-M4, OQ-4): opening the app with `?mockError=list` makes the **first** `GET /api/sessions` fail with 500, so Retry succeeds. Tests use `server.use(...)` overrides instead.

## 5. Steps

Each step ends with `npm run lint` and `npm run build` passing, and the coder reports and STOPs.
Steps are sequential. If D-2 is declined, skip Step 4 and drop the test rows from Steps 5–6. Record that AC-T1 is unmet.

---

### Step 1 — Clean the starter and set up the Training Sessions app shell

**Goal:** turn the empty Vite template into a neutral Training Sessions shell with no starter leftovers. No features yet.

| File | Action | Why |
| --- | --- | --- |
| `src/App.tsx` | Rewrite | Remove hero, counter, docs and social sections. Render a semantic shell: `<header>` with `<h1>Training sessions</h1>` and a one-line description, plus an empty `<main>` placeholder for the workspace |
| `src/App.css` | Replace | Delete starter selectors (`.counter`, `.hero`, `#center`, `#next-steps`, `#docs`, `#spacer`, `.ticks`). Add minimal layout styles for header/main |
| `src/index.css` | Trim | Keep the colour/font tokens and dark-mode tokens. Remove `#social .button-icon`, `.counter`, the `code` rules and the 56px `h1` hero sizing. Make `#root` left-aligned with a readable max width and padding |
| `src/assets/hero.png`, `src/assets/react.svg`, `src/assets/vite.svg` | **Delete** | Unused after the rewrite |
| `public/icons.svg` | **Delete** | Only the removed starter sections referenced it |
| `public/favicon.svg` | Keep | Still referenced by `index.html` (replacing its artwork is optional and out of scope) |
| `index.html` | Modify | `<title>Training Sessions</title>`; add a short `<meta name="description">` |
| `README.md` | Rewrite | Replace the Vite template text with: app purpose, `npm run dev` / `build` / `lint` (and `test` once Step 4 exists), and a link to `tasks/TASK-001/` |

Do not touch: `package.json` (name, versions, scripts), `package-lock.json`, configs, `src/main.tsx`.

**Done when:** a grep for `hero.png|react.svg|vite.svg|icons.svg` in `src/` and `index.html` returns nothing, `npm run lint` + `npm run build` pass, and `npm run dev` shows the "Training sessions" shell.

---

### Step 2 — Domain model, request boundary, validation (no UI, no mocks)

**Goal:** add the typed contracts from §4 that every later step depends on.

| File | Action |
| --- | --- |
| `src/features/training-sessions/types.ts` | Create: `SessionStatus` union, `SESSION_STATUSES` array and labels, `Session`, `CreateSessionInput` |
| `src/features/training-sessions/api/http.ts` | Create: `request<T>(path, init)` using `fetch` with JSON handling and support for an abort `signal`; `ApiError` |
| `src/features/training-sessions/api/sessionsApi.ts` | Create: `getSessions(signal?)`, `createSession(input)` |
| `src/features/training-sessions/validation.ts` | Create: `validateCreateSession({ title, startsAtLocal }, now)` returns `{ title?: string; startsAt?: string }`, with user-facing messages ("Title must be 3–80 characters.", "Choose a date and time in the future.") |
| `src/features/training-sessions/format.ts` | Create: `formatStartsAt(iso)` via `Intl.DateTimeFormat` (date + short time) |

**Done when:** lint and build pass and no UI changes. Nothing calls the API yet, so no runtime behavior changes.

---

### Step 3 — Mock HTTP API (**requires D-1**)

**Goal:** serve `/api/sessions` from MSW in the browser so the app has data without a backend (AC-M1..M4).

| File | Action |
| --- | --- |
| `package.json`, `package-lock.json` | `npm install -D msw@<approved>`, then `npx msw init public --save` |
| `public/mockServiceWorker.js` | Generated. Do not edit |
| `src/mocks/data.ts` | Create: about 6 seed sessions covering all three statuses. Dates are relative to load time: `completed` in the past, `scheduled` in the future, `cancelled` in either. Kept in an in-memory array (A-4) |
| `src/mocks/handlers.ts` | Create: `GET` returns the array after a realistic `delay()`. `POST` assigns an id (`crypto.randomUUID()`) and `status: 'scheduled'`, appends to the array, and returns 201. Add the one-shot error flag for `?mockError=list` |
| `src/mocks/browser.ts` | Create: `setupWorker(...handlers)` |
| `src/main.tsx` | Modify: start the worker (`onUnhandledRequest: 'bypass'`), then render. The worker runs in every mode because there is no real backend; this is documented as the replaceable boundary |

**Done when:** in `npm run dev`, DevTools shows `GET /api/sessions` → 200 with seed data (temporary `console` checks must be removed), and `?mockError=list` gives a 500 on the first call. Lint and build pass.

---

### Step 4 — Test tooling (**requires D-2**)

**Goal:** a working behavior-test setup that reuses the same MSW handlers in Node.

| File | Action |
| --- | --- |
| `package.json`, `package-lock.json` | Install the approved devDependencies from D-2 and add the `"test": "vitest run"` script. Do not touch other scripts or versions |
| `vite.config.ts` | Add a `test` block: `environment: 'jsdom'`, `setupFiles: ['./src/test/setup.ts']`. Keep the existing React and Babel plugins unchanged. Use the `vitest/config` types |
| `src/test/server.ts` | Create: `setupServer(...handlers)` |
| `src/test/setup.ts` | Create: import `@testing-library/jest-dom/vitest`. Add `beforeAll(listen({ onUnhandledRequest: 'error' }))`, `afterEach(resetHandlers + cleanup)` and `afterAll(close)`. Reset seed data between tests (export a `resetSessions()` from `src/mocks/data.ts`) |
| `src/features/training-sessions/api/sessionsApi.test.ts` | Create one smoke test: `getSessions()` resolves the seed data, so the infrastructure is proven before UI tests |

Notes: `fetch` in jsdom needs absolute URLs under MSW/Node. Either resolve relative paths against `location.origin` in `http.ts` (preferred, no test-only branching) or set the jsdom URL in config. Avoid fake timers together with MSW and user-event.

**Done when:** `npm test` passes. Lint and build pass, which also proves that `tsc -b` type-checks the test files.

---

### Step 5 — Sessions list, loading/error/empty states, status filter

**Goal:** AC-L1..L6 and AC-F1..F4.

| File | Action |
| --- | --- |
| `src/features/training-sessions/useSessions.ts` | Create: state `{ status: 'loading' \| 'error' \| 'success'; sessions; error }`. Loads in an effect with an `AbortController`, which is safe under StrictMode double-invocation. Exposes `retry()` and `addSession(session)`, which appends immutably |
| `src/features/training-sessions/StatusFilter.tsx` | Create: a labelled `<select>` ("Status") with `All` plus statuses (D-3). Controlled by the parent |
| `src/features/training-sessions/SessionList.tsx` | Create: a `<ul>` of items showing title, a status badge with a text label (not colour-only), and `<time dateTime>` with `formatStartsAt`. Empty message: "No sessions match this filter." |
| `src/features/training-sessions/SessionsWorkspace.tsx` | Create: owns `filter` state and derives the visible list during render (no duplicated state). Loading: `role="status"` "Loading sessions…". Error: `role="alert"` with "Couldn't load sessions." and a **Retry** button |
| `src/App.tsx` | Modify: render `<SessionsWorkspace />` inside `<main>` |
| `src/App.css` | Extend: list, badge and filter styles. Must stay usable at narrow widths |
| `src/features/training-sessions/SessionsWorkspace.test.tsx` | Create essential tests: (a) seeded sessions appear after loading; (b) choosing a status shows only matching sessions and `All` restores them; (c) a GET 500 override shows the error, and Retry shows the list |

**Done when:** tests pass, and in the browser the list loads, filtering works, and `?mockError=list` → Retry recovers. Lint and build pass.

---

### Step 6 — Create session form

**Goal:** AC-C1..C7 and the full flow end to end.

| File | Action |
| --- | --- |
| `src/features/training-sessions/CreateSessionForm.tsx` | Create: a "New session" button toggles an inline form (A-8). Fields: **Title** (`<input>` without a `maxLength` attribute, so the 80-character message can appear) and **Start date and time** (`<input type="datetime-local">` with `min` set to now as a hint only). On submit: run `validateCreateSession(..., new Date())` and show errors linked with `aria-describedby` and `aria-invalid`. If valid, convert local → ISO, call `createSession`, and disable submit with a "Creating…" label while pending (AC-C5). On success: call `onCreated(session)`, reset and close the form. On failure: show `role="alert"` with the message, keep the values, re-enable submit (AC-C7) |
| `src/features/training-sessions/SessionsWorkspace.tsx` | Modify: render the form. In `onCreated`: `addSession` plus reset the filter to `All` (D-4) |
| `src/App.css` | Extend: form, field-error and button styles |
| `src/features/training-sessions/SessionsWorkspace.test.tsx` (or `CreateSessionForm.test.tsx`) | Add essential tests: (a) **successful creation**: open the form, type a title with surrounding spaces and set a future datetime, submit; the trimmed title appears in the list; (b) a too-short title and a past datetime show their messages and no POST is sent; (c) a double click while pending results in one POST (count requests in the handler override). Set `datetime-local` with `fireEvent.change` using a value computed from `Date.now()` + 2 days in local `YYYY-MM-DDTHH:mm`, because typing into `datetime-local` is unreliable in jsdom |

**Done when:** all tests pass, lint and build pass, and the manual list → filter → create flow works in `npm run dev`.

---

## 6. After the Coder Steps (not coder work)

1. Developer: exercise list → filter → create once in the browser, including `?mockError=list` → Retry. Record the real observation in `workflow-log.md`.
2. `code-reviewer`: review the branch diff and save the response verbatim to `tasks/TASK-001/review.md`.
3. Fix happy-path blockers if any (back to `coder` or `debugger`, one prompt per finding group).
4. `verify`: run the commands below and record them in `tasks/TASK-001/verification.md`.

## 7. Verification Commands

| Command | Exists today | Purpose |
| --- | --- | --- |
| `npm run lint` | Yes | ESLint |
| `npm run build` | Yes | `tsc -b` type-check + production build |
| `npm run dev` | Yes | Manual browser check (use the URL Vite prints; do not assume a port) |
| `npm test` | **After Step 4 (D-2)** | Behavior tests |

## 8. Additional Test Opportunities (optional, not required for onboarding)

- Unit tests for `validateCreateSession` boundaries (2/3/80/81 chars, whitespace-only, now ± 1 minute).
- A create-request failure (POST 500) keeps the form values.
- A "no sessions" response renders the empty message.
- An `http.ts` network failure maps to `ApiError`.

## 9. Risks and Notes

- **Time-sensitive tests:** compute future/past dates from `Date.now()` and avoid hard-coded dates. Seed dates are also relative.
- **MSW worker start-up:** rendering before `worker.start()` resolves can race the first request, so main.tsx must await it.
- **Production build / `preview`:** the mock worker also runs there (there is no backend). This is a known, acceptable limitation for onboarding.
- **Rollback:** each step is isolated by file. Steps 3–4 can be reverted by restoring `package.json` and `package-lock.json` and deleting `src/mocks`, `src/test` and `public/mockServiceWorker.js`. No feature flag is needed.

## 10. Readiness

Plan is actionable. **Step 1 and Step 2 can start immediately.** Step 3 needs D-1, Step 4 needs D-2, and Steps 5–6 assume D-3/D-4 defaults unless you change them.
Recommended next role: **`coder`** for **Step 1 only**.
