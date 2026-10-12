# PyMentor — Frontend

React + TypeScript + Vite + Tailwind SPA. Spec: [`docs/frontend-spec.md`](../docs/frontend-spec.md).

## Run it

```bash
cd frontend
npm install
npm run dev          # http://localhost:5173
```

With no `.env.local`, the app runs against the **in-browser mock API** — no
backend needed. Log in as `asha` / `python123` (assessment already taken),
or sign up a new user to go through the assessment first. "Reset demo data"
on the login page wipes the mock state.

To use the real backend, `cp .env.example .env.local` and set
`VITE_USE_MOCK_API=false` plus `VITE_API_BASE_URL`.

## Scripts

| Command | What it does |
|---|---|
| `npm run dev` | Vite dev server with hot reload |
| `npm run build` | Type-check + production build into `dist/` |
| `npm run preview` | Serve the built `dist/` locally |
| `npm run typecheck` | TypeScript only |

## Routes

`/login` · `/signup` · `/assessment` · `/curriculum` (Home) · `/lessons/:lessonId`

> **WSL note:** install `node_modules` from the same OS you run `npm run dev` in.
> Vite's native binaries (esbuild, rollup) are platform-specific, so a
> Windows-installed `node_modules` won't run under WSL, and vice versa.
