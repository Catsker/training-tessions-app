# TASK-001 Requirements: Training Sessions Workspace

- Source of truth: `frontend-accelerator-onboarding/TASK.md`
- Pass criteria: `frontend-accelerator-onboarding/PASS_CRITERIA.md`
- Application Root: repository root (single frontend candidate: Vite + React 19 + TypeScript, npm)
- Role: `requirements-analyst` — requirements only; no plan, no code
- Readiness: **Ready for `writing-plans`**, with open questions below resolved by planner defaults or the developer

## 1. Goal

A trainer opens one workspace page, sees training sessions loaded from a mock API,
narrows the list by status, and creates a new session (title + future date/time)
that then appears in the list.

The exercise exists to practise the accelerator workflow; scope stays deliberately small.

## 2. User and Flow

User: a trainer managing their own training sessions.

1. Open the workspace -> sessions load from a mock API.
2. Filter sessions by one status (or `All`).
3. Open a create form.
4. Submit a title and a future date/time.
5. See the created session in the list.

## 3. Acceptance Criteria

### Sessions list

| ID | Criterion |
| --- | --- |
| AC-L1 | On open, the workspace requests sessions through the request boundary (AC-M1) and renders each returned session. |
| AC-L2 | Each list item shows the session **title**, **status**, and **start date/time** in human-readable form. |
| AC-L3 | While the list request is pending, a visible loading state is shown and no stale/empty list is presented as final. |
| AC-L4 | If the list request fails, one understandable error message is shown (not a raw stack trace or blank screen). |
| AC-L5 | The error state is recoverable: the user can retry from the error state, and a successful retry shows the list. |
| AC-L6 | When the request succeeds with no sessions, or the filter matches none, the user sees a short "no sessions" message rather than a blank area. *(implied by filtering; lightweight)* |

### Status filter

| ID | Criterion |
| --- | --- |
| AC-F1 | A single status filter control is available with an `All` option plus status option(s) (see OQ-1). |
| AC-F2 | `All` is selected by default and shows every loaded session. |
| AC-F3 | Selecting a status shows only sessions with that status; selecting `All` restores the full list. |
| AC-F4 | Filtering works on loaded data without breaking the loading/error states. |

### Create session

| ID | Criterion |
| --- | --- |
| AC-C1 | The user can open a create form from the workspace. |
| AC-C2 | Title is required; it is **trimmed**, and the trimmed length must be **3–80 characters inclusive**. Whitespace-only input is invalid. |
| AC-C3 | Date and time are required, and the combined value must be **later than the current moment** at submit time (user's local time). |
| AC-C4 | Invalid input blocks submission and shows a useful message next to / associated with the relevant field (e.g. "Title must be 3–80 characters", "Start time must be in the future"). |
| AC-C5 | While the create request is pending, repeated submission is prevented (e.g. submit disabled) and pending state is visible. |
| AC-C6 | On success, the created session (as returned by the mock API) appears in the list without a page reload, with its title, status, and start date/time. The stored title is the trimmed value. |
| AC-C7 | If the create request fails, the user sees an error message, entered values are preserved, and they can submit again. *(assumption A-5)* |

### Mock boundary

| ID | Criterion |
| --- | --- |
| AC-M1 | UI components do not import mock data directly; all session reads/writes go through an HTTP client or equivalent replaceable request boundary. |
| AC-M2 | No mock mechanism exists in the repository today; MSW or another conventional HTTP mock is used (selection belongs to the planner). |
| AC-M3 | No backend service is implemented. |
| AC-M4 | The list-request failure (AC-L4/AC-L5) can be triggered deterministically for manual checks and tests (mechanism is a planner decision, see OQ-4). |

### Test and manual check

| ID | Criterion |
| --- | --- |
| AC-T1 | At least one behavior-level automated test covers the main flow (filtering **or** successful creation) and passes. |
| AC-T2 | The app starts with a documented repository command (`npm run dev`), and the list -> filter -> create flow is exercised once in a browser; the real observation is recorded in `workflow-log.md`. |

## 4. Constraints

- Use the existing framework (React 19 + Vite 8 + TypeScript ~6), package manager (npm), and scripts.
- Do not rewrite unrelated code or configuration; do not add features outside the required flow.
- Replacing the Vite starter content in `src/App.tsx` with the workspace is in scope; other unrelated refactors are not.
- React Compiler is enabled (`babel-plugin-react-compiler`); code must stay compatible with it.
- Report incomplete behavior honestly; never claim an unperformed check.

## 5. Non-Goals

Session details, drawers, deep links; search or multiple filters; pagination; editing/deleting
sessions; authentication/permissions; a complete API contract or scenario matrix; screenshot sets;
exhaustive responsive/accessibility validation; full test coverage; CI, deployment, public URL;
strict TypeScript migration; localization (UI language is English only).

## 6. Facts (verified in repository)

- `package.json` scripts: `dev`, `build` (`tsc -b && vite build`), `lint`, `preview`. **No `test` script.**
- Dependencies: `react`, `react-dom` only. **No test runner, Testing Library, MSW, HTTP client, router, or state library installed.**
- `src/App.tsx` is the unmodified Vite starter; `src/main.tsx` renders it in `StrictMode`.
- No root `CLAUDE.md`, no `rulesets/project/` rules, no living specs (`specs/`) exist.

## 7. Assumptions (not confirmed truth)

- **A-1** Session shape (minimum): `id`, `title`, `status`, `startsAt` (ISO 8601 date-time string).
- **A-2** Status values: `scheduled`, `completed`, `cancelled`. Seed data includes each status.
- **A-3** A newly created session gets status `scheduled` (assigned by the mock API, not chosen in the form).
- **A-4** Mock data lives in memory; created sessions persist until page reload only.
- **A-5** Create-request failure handling (AC-C7) is minimal: message + retry by resubmitting. TASK.md does not require a deterministic create-error trigger.
- **A-6** List order is not specified; any stable order (e.g. start time ascending) is acceptable.
- **A-7** "Future" is compared against the browser's current local time; no time-zone selection.
- **A-8** The create form may be inline, toggled, or a dialog; the choice belongs to the planner/UI.

## 8. Open Questions

| ID | Question | Proposed default | Owner |
| --- | --- | --- | --- |
| OQ-1 | "An `All` option and one status filter": a single control listing all statuses, or literally `All` + one status (e.g. `Scheduled`)? | One control: `All` + every status from A-2 (satisfies both readings) | Developer |
| OQ-2 | If a status filter is active that excludes the new session's status, how does the user "see the created session"? | Reset filter to `All` after successful creation | Developer |
| OQ-3 | No test stack exists. Add Vitest + Testing Library (+ jsdom) and a `test` script? | Yes — minimal dev dependencies required to satisfy AC-T1 | Developer approval; `writing-plans` |
| OQ-4 | How is the list error triggered for manual check/tests (mock handler override, query flag, etc.)? | Planner decides; test override via MSW handler | `writing-plans` |
| OQ-5 | MSW vs a hand-written fetch-level mock module? | MSW (named in TASK.md as acceptable) | `writing-plans` |

## 9. Specialist Gaps

- **Architecture / API / visual direction:** no blocking gap. Folder layout, request boundary shape,
  and mock contract are small enough for `writing-plans`; `architect`, `api-integration`, and
  `ui-designer` are not required for onboarding.

## 10. Recommendation

Next role: **`writing-plans`** — produce `tasks/TASK-001/implementation-plan.md` from this file,
resolving OQ-3..OQ-5 and confirming OQ-1/OQ-2 defaults with the developer.
Use `brainstorm` only if the developer rejects the OQ-1/OQ-2 defaults and the product behavior becomes unclear.
