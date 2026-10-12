# Learning Log — Agentic Python Tutor

A running, dated record of decisions, problems hit, and things learned
while building this. Newest entry on top. Write in the moment, not after
the fact — specifics fade fast.

Each entry: what happened, what you decided or learned, and why. Link to
the relevant spec section if the decision changed one.

---

## 2026-10-12 — Frontend v0.1: all five screens, running on a mock API

**What got built** (`frontend/`, see `frontend/README.md`):
- Vite + React 19 + TypeScript + Tailwind 3.4 scaffold, design tokens from
  `frontend-spec.md` §7 wired into `tailwind.config.js`.
- All five routes from §3: `/login`, `/signup`, `/assessment`,
  `/curriculum` (Home), `/lessons/:lessonId` — plus `AppShell`,
  `CurriculumTrack`, `CodeEditor` (CodeMirror 6), `SubmissionResult`,
  `TutorChat`, `ProgressBar`, `ProtectedRoute`/`PublicOnlyRoute`.
- Typed API client + React Query hooks mirroring `api-contract-spec.md`,
  including the §5 invalidation rule (curriculum refetch only on `passed`)
  and the §8 assessment gate (`404 "assessment not completed"` → redirect).

**Decided: build an in-browser mock of the whole API contract**
(`src/api/mock/`). The backend doesn't exist yet, but I wanted to click
through the real flow now. The mock implements every endpoint *and* the
backend-spec §4 rules (mastery +2 / +1 / −1, idempotent `/lessons/next`,
one-time assessment, curriculum advance on pass), persisted to
`localStorage`. Switched by `VITE_USE_MOCK_API`; with no env file at all it
defaults to mock, so a fresh clone just runs. Trade-off: grading is regex
pattern-matching on the code text, not execution — fine for a demo,
obviously not for real. A "Demo mode" banner makes that visible.
Why not MSW? One less dependency and no service worker; the mock sits
behind the same `request()` function the real client uses, so swapping is
one env var.

**Decided: Tailwind 3.4, not 4.** The spec's token block is a v3
`tailwind.config.js`; v4 moves config into CSS. Keeping v3 means the spec
stays literally correct.

**Problems hit / learned:**
- Circular import: `client.ts` → `mock/server.ts` → `ApiError` in
  `client.ts`. Moved `ApiError` to `api/errors.ts`.
- First build was a single 817 kB chunk — CodeMirror is heavy. Lazy-loading
  `AssessmentPage` and `LessonPage` got `/login` down to ~106 kB gzipped.
- WSL vs Windows: `node_modules` contains platform-specific binaries
  (esbuild, rollup). Install from whichever OS runs `npm run dev`.

**Verified:** `tsc -b` + `vite build` clean; a Node smoke test drove the
mock through login → lesson → fail → retry-pass → curriculum advance →
chat → signup → assessment (14 checks, all passing). Not yet verified in
a real browser by me — needs a manual click-through.

**Specs touched:** `frontend-spec.md` §1 (versions, mock note), §2
(structure), §4 (`PublicOnlyRoute`), §10 (mock switch). `infra/README.md`
(Vercel checklist). No changes to `api-contract-spec.md` or
`backend-spec.md`.

**Next:** backend skeleton (FastAPI routers matching the contract), then
flip `VITE_USE_MOCK_API=false` and delete what the mock no longer needs.

---

## 2026-10-11 — Project scaffolded

- Repo structure, specs, and this knowledge base set up. See
  `docs/README.md` for the full layout and `docs/architecture-blueprint.md`
  for the system diagrams.
- Decided: monorepo (backend/ + frontend/ + infra/ + docs/) over separate
  repos — simpler for a solo weekend project, one commit can touch both
  sides of a feature.
- Decided: VS Code opens the project from its native Windows path
  (`D:\VSCode\Projects\agentic-python-tutor`), not through WSL — avoids a
  mismatch between where the terminal runs and where the files actually
  live.

<!-- Add new entries above this line, newest first -->
