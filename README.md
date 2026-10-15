# Training Sessions

A small frontend workspace where a trainer can view, filter, and create training sessions.
Sessions come from a mock API; there is no backend service.

Built with React 19, TypeScript, and Vite (React Compiler enabled).

## Getting started

```bash
npm install
npm run dev
```

Open the URL that Vite prints in the terminal.

## Scripts

| Command | Purpose |
| --- | --- |
| `npm run dev` | Start the development server |
| `npm run build` | Type-check (`tsc -b`) and build for production |
| `npm run lint` | Run ESLint |
| `npm run preview` | Serve the production build locally |
| `npm test` | Run behaviour tests (Vitest + Testing Library; API mocked with MSW) |

## Mock API

There is no backend: [MSW](https://mswjs.io/) serves `GET` and `POST /api/sessions` in every mode
(dev, preview, and production builds). The handlers live in `src/mocks/`. Data is kept in memory,
so created sessions disappear when the page reloads.

To check the error state, open the app with `?mockError=list`. The first sessions request then
fails, and **Retry** loads the list.

## Task documentation

Requirements, implementation plan, and workflow log for this feature live in
[`tasks/TASK-001/`](tasks/TASK-001/). Agent instructions are in [`CLAUDE.md`](CLAUDE.md).
