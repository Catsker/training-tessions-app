# TASK-001 Code Review — Training Sessions Workspace

- **Role:** `code-reviewer` (read-only; no files were changed during this review)
- **Review surface:** branch `feat/TASK_001` vs base `c8e5a3c` ("task created and doctor run"), **including the uncommitted working tree** (Steps 3–6 are not committed yet)
- **Compared against:** `tasks/TASK-001/requirements.md`, `tasks/TASK-001/implementation-plan.md`, `frontend-accelerator-onboarding/TASK.md`
- **Rulesets applied:** common `code-reviewer` (evidence-first review, web interface guidelines), framework `code-reviewer` (React)
- **Date:** 2026-10-14

## Verdict: NEEDS-CHANGES (no happy-path blockers)

The required flow (list → filter → create) is implemented, tested, and matches the requirements and plan. No defect breaks the main flow. Two small **should-fix** items remain: documentation drift and light-mode contrast. Both are cheap to fix. Everything else is low severity or a known, accepted limitation.

## Findings

### S1 — Should-fix · Documentation is out of date after Steps 3–4

- `CLAUDE.md:19` still says *"Not installed yet: test runner, Testing Library, MSW / HTTP mock…"*. All of these are now installed.
- `CLAUDE.md:18` lists the scripts without `npm test`.
- `README.md` (Scripts table, from line 17) does not list `npm test`. Plan Step 1 explicitly said to add `test` "once Step 4 exists". Step 4 added the script but not the README row.
- **Failure scenario:** the next role (`verify`) or a new developer reads `CLAUDE.md` or `README.md`, concludes there is no test runner, and either skips `npm test` or reports AC-T1 as "not verifiable". That would be a false verification result.
- **Fix:** update both files to list `npm test` and remove MSW and the test runner from "not installed". `CLAUDE.md` is a root instruction file, so its edit needs explicit developer approval.

### S2 — Should-fix (minor, accessibility) · Accent text fails WCAG AA contrast in light mode

- `src/App.css:59-60` (`.button`) and `src/App.css:226-227` (`.status-badge--scheduled`) put `--accent` (#aa3bff) text on `--accent-bg` (10% of the same colour over white).
- The measured contrast is **3.83:1**; WCAG 1.4.3 requires **4.5:1** for 14–16 px text. Dark mode passes at 5.34:1. `--danger` text passes at 6.03:1.
- **Affected:** the primary actions "New session", "Retry" and "Create session", and the "Scheduled" badge.
- **Fix:** add a darker light-mode text token for accent text, e.g. `--accent-text`, and confirm it reaches at least 4.5:1 on `--accent-bg`. Keep the current colour for borders and outlines.
- `PASS_CRITERIA.md` lists accessibility as non-blocking. This is still recommended because it is a one-token fix.

### L1 — Low · A failed create can go unnoticed if the form is closed while saving

- `SessionsWorkspace.tsx:45`: the "New session" toggle stays enabled while `CreateSessionForm` is waiting for the server (`CreateSessionForm.tsx:57-64`).
- **Scenario A:** the user clicks "Create session", then clicks "New session" while it shows "Creating…". The form closes, and if the request then fails, the error is stored in the closed form, so the user never sees it.
- **Scenario B:** the user closes and reopens the form while saving, and starts typing. When the first request succeeds, `handleCreated` runs `closeCreateForm()` and the newly typed values are lost.
- **Fix:** disable the toggle (or keep the form mounted) while a submit is pending, e.g. have the form report its pending state to the workspace.

### L2 — Low · Every non-2xx response is reported as a server error

- `api/http.ts:54-55`: 4xx responses (for example the mock's `400 Invalid request body`) show *"Something went wrong on the server."*
- This can't happen today, because the client validates before sending. It would mislead users once a real API returns validation errors.
- **Fix later:** give 4xx responses a different message when a real backend replaces the mock.

### L3 — Low / accepted limitation · Mock behaviour in every mode

- `src/main.tsx:7-10` starts MSW in production builds and `preview` as well. This is plan decision §9, since there is no backend.
- MSW (about 159 kB gzipped) is loaded before the first render.
- `src/mocks/browser.ts:5` lets `?mockError=list` force errors in production too.
- `src/mocks/handlers.ts:10-30`: the error trigger fails all list requests within a **250 ms window** so that React StrictMode's duplicate request also fails. This depends on timing. It was 3 out of 3 reliable in the dev browser and only affects the manual check, not the product flow.
- **Action:** list these under "Known limitations" in `workflow-log.md`. No code change is needed for onboarding.

### N1 — Nit · Lint warning from a generated file

- `npm run lint` passes with exit code 0, but reports *"Unused eslint-disable directive"* in the generated `public/mockServiceWorker.js`.
- Optional fix, with approval because it changes config: add `public/mockServiceWorker.js` to `globalIgnores` in `eslint.config.js`.

## Requirements Traceability

| AC | Requirement | Status | Evidence |
| --- | --- | --- | --- |
| AC-L1 | Sessions loaded through the request boundary | ✅ | `useSessions.ts:19-35`; test "shows a loading state, then the sessions" |
| AC-L2 | Title, status, start date/time shown | ✅ | `SessionList.tsx`; uses `<time dateTime>` and `Intl` formatting |
| AC-L3 | Loading state | ✅ | `SessionsWorkspace.tsx:59-63` (`role="status"`); tested |
| AC-L4 | Understandable error | ✅ | `SessionsWorkspace.tsx:65-73` (`role="alert"`); tested |
| AC-L5 | Recoverable with Retry | ✅ | `useSessions.ts:37-40`; tested, and checked in the browser via `?mockError=list` |
| AC-L6 | Empty / no-match message | ✅ implemented, ⚠️ untested | `SessionsWorkspace.tsx:80-82` |
| AC-F1 | `All` + status options | ✅ (D-3 default, not explicitly confirmed) | `StatusFilter.tsx` |
| AC-F2/F3 | Default All; filter and restore | ✅ | test "filters sessions by status…" |
| AC-F4 | Filter does not break states | ✅ | the filter only applies to loaded data (`SessionsWorkspace.tsx:75-85`) |
| AC-C1 | Open create form | ✅ | `SessionsWorkspace.tsx:38-57` |
| AC-C2 | Trimmed title, 3–80 chars | ✅ | `validation.ts:23-28`, `:52`; trim proven by a test that fails when trimming is removed |
| AC-C3 | Future date/time at submit | ✅ | `validation.ts:30-35`; past-time test |
| AC-C4 | Useful validation messages | ✅ | per-field messages, `aria-invalid` / `aria-describedby`, first invalid field gets focus; tested |
| AC-C5 | No duplicate submit; pending visible | ✅ | ref guard `CreateSessionForm.tsx:42` + disabled "Creating…"; test fails when the guard is removed |
| AC-C6 | Created session appears in list | ✅ | `handleCreated` adds the session and resets the filter (D-4 default); tested |
| AC-C7 | Create failure keeps values and allows resubmit | ✅ (see L1 edge case) | tested |
| AC-M1 | UI never imports mocks | ✅ | grep: only `src/test/*` and the dynamic import in `main.tsx` reference `src/mocks` |
| AC-M2/M3 | MSW mock, no backend | ✅ | `msw@2.15.0` (approved D-1) |
| AC-M4 | Deterministic error trigger | ✅ (timing-based, see L3) | `?mockError=list` |
| AC-T1 | Behaviour-level test passes | ✅ | 10 tests in 2 files (Vitest 4.1.11, approved D-2) |
| AC-T2 | Developer's manual browser observation | ⏳ **pending** | agent browser checks were done; the developer's own observation is not yet in `workflow-log.md` |

## Plan Conformance

| Step | Result | Deviations |
| --- | --- | --- |
| 1 Clean starter / shell | ✅ | none |
| 2 Types, request boundary, validation | ✅ | `request()` returns `unknown` and responses are checked in `sessionsApi.ts` (stricter than planned, justified by rules); extra helpers `hasErrors`, `toCreateSessionInput`, `isSessionStatus` |
| 3 MSW mock | ✅ | error trigger changed to a 250 ms window in Step 5 because of StrictMode (see L3) |
| 4 Test tooling | ✅ | 3 API tests instead of 1 smoke test; README not updated with `test` (**S1**) |
| 5 List / filter / states | ✅ | sessions sorted by start time (allowed by A-6) |
| 6 Create form | ✅ | the toggle lives in the workspace instead of inside the form component (fine); 4 tests instead of 3 |

Dependencies changed only with explicit approval (D-1, D-2). No unrelated refactors or global structure changes.

## Positive Notes

- Clear boundary: every response is checked against the expected shape before use, and errors are mapped to user-safe `ApiError` messages.
- The list request is cancelled when the effect re-runs, so the hook behaves correctly under StrictMode.
- The tests exercise user behaviour through the same MSW handlers the app uses. Two key tests were mutation-checked: they fail when the duplicate-submit guard or the title trimming is removed.

## Residual Gaps (not blocking)

- No test for the empty / no-match state (AC-L6), network-failure mapping, or sort order.
- Tests render without `<StrictMode>`. The Step 5 double-request bug was only caught in the browser. Consider rendering the workspace inside `StrictMode` in tests.
- No validation of responsive layout or full accessibility beyond S2 (optional per `TASK.md`).
- AC-T2: the developer's manual browser observation is still required.

## Recommended Next Actions

1. Developer decision on S1 and S2 (and optionally L1). If accepted, run **`coder`** with a bounded prompt covering only those findings. The `CLAUDE.md` edit needs explicit approval.
2. Record the D-3/D-4 defaults as accepted, and L3 as a known limitation, in `workflow-log.md`.
3. Do the manual browser check (list → filter → create, plus `?mockError=list` → Retry) and record it.
4. Then run **`verify`**.

---

# Follow-up Review — Steps 7–9 (2026-10-14)

- **Role:** `code-reviewer`. Only this section was appended to `review.md`; no code was changed and the review above is unchanged
- **Review surface:** branch `feat/TASK_001` vs base `c8e5a3c`, **including the uncommitted working tree**. Focus: the Step 7–9 changes made after the first review, then a re-check of the final result against `requirements.md` and `implementation-plan.md`
- **Instruction applied:** approve when there are no critical divergences; ignore small ones

## Verdict: PASS — approved

There are no blocking or should-fix findings left. Both should-fix items from the first review (S1, S2) are fixed, as are the optional L1 and N1. The required flow (list → filter → create) still meets every acceptance criterion. The small remaining differences, listed below, were not counted, as instructed.

## Status of the First Review's Findings

| Finding | Status | Evidence |
| --- | --- | --- |
| S2 — accent text contrast | ✅ Fixed (Step 7) | `src/index.css:10` / `:43` add `--accent-text` (#8b2fd9 light / #c084fc dark). Used only for text colour at `src/App.css:59` (`.button`) and `:227` (`.status-badge--scheduled`); outlines, borders and the error stripe still use `--accent`. Measured 5.22:1 light (was 3.83:1) and 5.34:1 dark |
| L1 — form could close while a create was pending | ✅ Fixed (Step 8) | `SessionsWorkspace.tsx:19`, `:50-53`: `aria-disabled` plus an early return while pending. `CreateSessionForm.tsx:58`, `:67` report pending start and failure; `closeCreateForm()` clears it (`:23`). Using `aria-disabled` keeps focus restoration working. New test "keeps the form open while a create is pending…" plus a focus check on the success test; both were mutation-checked by `coder` |
| S1 — outdated docs | ✅ Fixed (Step 9, D-5 approved) | `README.md` adds the `npm test` row and a *Mock API* section. `CLAUDE.md` Project Facts / Definition of Done updated with no other sections touched; 93 lines (limit 60–120) |
| N1 — lint warning from generated worker | ✅ Fixed (Step 9, D-7 approved) | `eslint.config.js:9` — `globalIgnores(['dist', 'public/mockServiceWorker.js'])` |
| L2 — non-2xx all shown as "server" error | Accepted, unchanged | Unreachable with the mock; revisit with a real API |
| L3 — MSW and `?mockError=list` active in every mode; 250 ms trigger window | Accepted, unchanged | Now documented in `README.md` (*Mock API*) |

## New Findings

None blocking and none should-fix. Steps 7–9 are small and contained, and match the plan. Specifically checked:
- the pending guard can't leave the toggle stuck: it's cleared on failure, success and cancel;
- keyboard activation of the `aria-disabled` toggle hits the same early return;
- no non-text `--accent` usage was switched to the text token;
- the documentation now states only installed tooling and existing commands.

## Requirements Traceability (final)

All acceptance criteria from the first review's table remain ✅ (AC-L1…L6, AC-F1…F4, AC-C1…C7, AC-M1…M4, AC-T1). AC-C7 is now also safe in the L1 edge case. The only item still open is **AC-T2** (the developer's manual browser observation). It's a developer action, not a code divergence.

## Evidence (commands run during this review)

| Command | Result |
| --- | --- |
| `npm test` | exit 0 — 2 files, **11 tests passed** |
| `npm run lint` | exit 0 — **0 errors, 0 warnings** |
| `npm run build` | exit 0 |

## Small Divergences (noted, not counted)

- `review.md` was saved by the developer, and this section was appended at the developer's explicit request (the plan's §6 suggested exactly this).
- Plan Step 2's `request<T>()` became `request(): Promise<unknown>` with checking in `sessionsApi.ts`, which is stricter and was already accepted in the first review.
- Test-only gaps remain optional (`implementation-plan.md` §8): empty / no-match state, sort order, network-failure mapping, and rendering tests inside `<StrictMode>`.
- No browser re-check was done for Step 8 (tests only, as the plan's "Done when" allowed).

## Remaining Actions Before `verify` (developer)

1. Fill in the Step 9 and review rows in `workflow-log.md`, including decisions D-5, D-6 and D-7.
2. Do and record the manual browser observation: list → filter → create, plus `?mockError=list` → Retry (AC-T2, required by `PASS_CRITERIA.md`).
3. List L2 and L3 under "Known limitations".
4. Optionally commit Steps 3–9; they are currently uncommitted.
5. Run **`verify`** and record the commands and results in `tasks/TASK-001/verification.md`.
