# CLAUDE.md — TASK-001 Training Sessions Workspace

Project instructions for agents working on TASK-001.
Source of truth: `frontend-accelerator-onboarding/TASK.md`. Requirements: `tasks/TASK-001/requirements.md`.
If this file and `TASK.md` disagree, `TASK.md` wins.

## Purpose

Build a small frontend workspace where a trainer can view, filter, and create training sessions.
The exercise practises the Frontend Accelerator role workflow; keep product and technical scope small.
Success = a controlled, verified workflow, not a production-ready application.

## Project Facts

- Application Root: repository root (single frontend app).
- Stack: React 19, TypeScript ~6, Vite 8, React Compiler (Babel preset), ESLint 10 flat config.
- Package manager: npm (`package-lock.json`).
- Scripts: `npm run dev`, `npm run build` (`tsc -b && vite build`), `npm run lint`, `npm run preview`.
- Not installed yet: test runner, Testing Library, MSW / HTTP mock, HTTP client, router, state library.
- `src/App.tsx` is the Vite starter; replacing its content with the workspace is in scope.
- Runtime Doctor result recorded in `workflow-log.md`: `DEGRADED`, hook `ACTIVE`, no blocking effect.

## Required User Flow

1. Open the workspace and see sessions loaded from a mock API.
2. Filter sessions by one status (`All` + status options).
3. Open a create form.
4. Create a session with a title and a future date/time.
5. See the created session in the list.

## Required Behavior (summary)

- List item shows title, status, start date/time.
- Loading state while the list request is pending.
- One understandable, recoverable (retry) request-error state.
- Title: trimmed, 3–80 characters inclusive. Date/time: required and in the future.
- Useful validation messages; no duplicate submission while create is pending.
- Successfully created session is added to the visible list.
- Mock data sits behind a replaceable HTTP/request boundary; no backend service.
- At least one behavior-level automated test (filtering or successful creation) that passes.

Full acceptance criteria (AC-*), assumptions (A-*), and open questions (OQ-*) live in `requirements.md`.

## Out of Scope

Details/drawers/deep links, search or multiple filters, pagination, edit/delete, auth,
full API contract, screenshot sets, exhaustive a11y/responsive validation, full coverage,
CI/deployment/public URL, strict TypeScript migration, unrelated refactoring.

## Role Workflow

Run one role at a time; the developer selects every next role manually.

1. `requirements-analyst` -> `tasks/TASK-001/requirements.md`
2. `writing-plans` -> `tasks/TASK-001/implementation-plan.md`
3. `coder` -> production code + essential test
4. `code-reviewer` -> response saved verbatim as `tasks/TASK-001/review.md`
5. `verify` -> `tasks/TASK-001/verification.md` (commands, exit results, failures, unverified items)

Optional roles (`architect`, `api-integration`, `ui-designer`, `test-generator`, `debugger`,
`browser-verify`) only when the task actually needs them.

## Agent Rules

- Execute only the invoked role; report the result and STOP. Never start the next role.
- Stay inside the role's write boundary (e.g. analysis/planning roles write only under `tasks/`).
- Do not edit rulesets, `.claude/`, `toolchain/`, or root runtime instructions unless explicitly asked.
- Use existing framework, npm, and scripts; ask before adding dependencies.
- Do not rewrite unrelated code or configuration; do not add features beyond the required flow.
- Keep code compatible with React Compiler and the existing ESLint config.
- Never claim a command, test, or browser check that was not actually run.

## Artifacts

```text
tasks/TASK-001/
|-- requirements.md
|-- implementation-plan.md
|-- review.md
|-- verification.md
`-- workflow-log.md         (developer-maintained: prompts, decisions, manual browser observation)
```

`workflow-log.md` is owned by the developer; agents do not rewrite it.

## Definition of Done

- App starts with `npm run dev`; list -> filter -> create works end to end.
- Loading and recoverable error states implemented.
- Behavior-level test exists and passes; `npm run lint` and `npm run build` results reported.
- Review findings considered; happy-path blockers fixed or recorded.
- One real manual browser observation recorded; known limitations listed honestly.
