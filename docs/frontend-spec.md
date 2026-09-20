# Frontend Spec — Agentic Python Tutor

> Defines the client application. Should implement the use cases in `goal-spec.md` and consume the endpoints defined in `api-contract-spec.md`.

**Product name:** the app is user-facing branded **"PyMentor"** (shown as the header/title), even though the spec files/repo keep the generic "Agentic Python Tutor" name.

## 1. Tech Stack
<!-- Framework (React/Vue/Svelte/etc.), language (TS/JS), build tool, styling approach (Tailwind/CSS Modules/etc.), state management library, routing library. -->
- Framework: React + TypeScript
- Build tool: Vite
- Styling: Tailwind CSS
- Routing: React Router
- Server data / caching: TanStack React Query
- Local/UI state: React `useState` + Context (no global store library)
- **Code editor:** CodeMirror 6 (e.g. `@uiw/react-codemirror`) for the in-browser Python editor with syntax highlighting. No in-browser execution (e.g. Pyodide) for MVP — all execution happens server-side in the Sandbox (`backend-spec.md` §6), keeping the client a thin editor + display layer.
- Hosting: Vercel (static SPA build, no serverless functions needed)

## 2. Application Structure
<!-- High-level folder/module layout, if you have opinions upfront. -->
```
src/
  main.tsx
  App.tsx                 # routes + providers
  api/                     # API client, React Query hooks (useCurriculum, useLesson, ...)
  auth/                    # AuthContext, ProtectedRoute
  pages/
    LoginPage.tsx
    SignupPage.tsx
    AssessmentPage.tsx
    HomePage.tsx           # curriculum overview + progress
    LessonPage.tsx
  components/
    AssessmentQuestion.tsx
    CurriculumTrack.tsx
    CodeEditor.tsx
    SubmissionResult.tsx
    TutorChat.tsx
    ProgressBar.tsx
    AppShell.tsx           # minimal header wrapper for authenticated pages
  types/                   # shared TS types, mirroring api-contract-spec.md schemas
```

## 3. Pages / Screens
<!-- One entry per screen: route, purpose, key components, data it needs from the API. -->
| Screen | Route | Purpose | Data Needed |
|--------|-------|---------|--------------|
| Login | `/login` | Authenticate with username/password | none (POST credentials) |
| Signup | `/signup` | Create a username/password account | none (POST credentials) |
| Assessment | `/assessment` | One-time diagnostic quiz (MCQ + short-code questions), shown right after signup or on first login if not yet completed; submitting builds the initial curriculum | `GET /assessment` (questions), `POST /assessment/submit` |
| Home | `/curriculum` | "Welcome to PyMentor" header; `CurriculumTrack` showing every Topic with status and mastery level; "Continue Learning" jumps into the current Topic's lesson | `GET /curriculum` |
| Lesson | `/lessons/:lessonId` | Topic explanation, `CodeEditor` + exercise prompt, "Submit" → `SubmissionResult` (pass/fail, test detail, reviewer feedback), `TutorChat` panel, a "← Back to Curriculum" link | `POST /lessons/next` (to enter), `GET /lessons/:id`, `POST /lessons/:id/submissions`, `GET`/`POST /lessons/:id/messages` |

**Navigation requirement:** every authenticated page needs an explicit way back to Home — a single `AppShell` header isn't enough on its own. Two affordances, both required: (1) the "PyMentor" title in `AppShell` links to `/curriculum` on every authenticated page; (2) `/lessons/:lessonId` additionally shows an explicit "← Back to Curriculum" link, since it's one level deep from Home and a bare logo-link is easy to miss mid-exercise.

## 4. Key Components
<!-- Reusable UI components worth naming upfront (e.g. TripCard, ItineraryTimeline, MapView). Note props/behavior if known. -->
- `AppShell` — header for authenticated pages: "PyMentor" title links to `/curriculum` (Home), plus logged-in username and logout action
- `LoginForm` — username + password fields, submit calls login, shows validation/auth errors; links to `/signup`
- `SignupForm` — username + password fields, submit calls signup, then logs the new user in and redirects to `/assessment` (not `/curriculum` — a brand-new user has no Skill Profile yet); shows validation errors (e.g. username taken)
- `AssessmentQuestion` — renders one MCQ or short-code question and collects the answer; `AssessmentPage` gathers all answers client-side and submits them together on completion
- `CurriculumTrack` — renders the ordered list of Topics with a status badge (locked/current/completed) and a mastery indicator; only the `current` Topic is clickable
- `CodeEditor` — CodeMirror-based Python editor, pre-filled with the Exercise's `starter_code`; a "Submit" action
- `SubmissionResult` — shows per-test pass/fail, the Code Reviewer Agent's feedback text, and (if passed) a "Next Lesson" call-to-action
- `TutorChat` — scrollable message list (learner / tutor agent) plus an input box, scoped to the current Lesson
- `ProgressBar` — small mastery-level indicator (0–5), reused in both `CurriculumTrack` and the Lesson header
- `ProtectedRoute` — route wrapper that redirects to `/login` when there's no authenticated session

## 5. State Management
<!-- What's global state vs. local/component state vs. server cache (e.g. React Query). How is auth state handled? -->
- **Server cache (React Query):** curriculum (`['curriculum']`), lesson detail (`['lessons', lessonId]`), lesson chat (`['lessons', lessonId, 'messages']`). Submitting code invalidates `['lessons', lessonId]` (to refresh status/mastery) and, only on a `passed` result, `['curriculum']` (to reflect the newly-`current` Topic) — an invalidation on every submission regardless of outcome would flash the curriculum into a loading state for no visible change on a failed attempt.
- **Local/UI state (`useState`):** in-progress assessment answers, code editor contents before submit, the chat input field.
- **Auth state (Context):** `AuthContext` holds the current auth token and username; populated on login/signup, read by `ProtectedRoute`, `AppShell` (to display "logged in as ..."), and the API client (attached as the `Authorization` header on every request). Both are persisted in `localStorage` so a page refresh doesn't log the user out; cleared on logout or a `401` response.

## 6. User Flows
<!-- Step-by-step flows for key interactions, e.g. "Create a trip", "Add a destination", "Reorder itinerary". -->
- **Sign up:** User enters a username/password on `/signup` → submit → on success, store the token in `AuthContext`/`localStorage` and redirect to `/assessment` (there's no curriculum yet). On failure (e.g. username taken), show inline error.
- **Login (already assessed):** User enters username/password on `/login` → submit → on success, store the token and redirect straight to `/curriculum`. On failure, show inline error.
- **Take the assessment:** On `/assessment`, answer each `AssessmentQuestion` → submit all answers at once → backend scores them, builds the curriculum, and returns it → redirect to `/curriculum`.
- **View progress (Home):** User lands on `/curriculum` and sees "Welcome to PyMentor," the `CurriculumTrack` (every Topic with status + mastery), and a "Continue Learning" action for the `current` Topic.
- **Start/continue a lesson:** From Home, click "Continue Learning" (or the `current` Topic row) → `POST /lessons/next` → navigate to `/lessons/:lessonId`, showing the explanation and exercise.
- **Complete a lesson:** Read the explanation, write code in `CodeEditor`, click Submit → `SubmissionResult` shows test results and reviewer feedback. If passed, click "Next Lesson" to request the newly-current Topic's lesson. If failed, edit the code and resubmit to the same Lesson.
- **Ask the tutor:** Within a Lesson, type a question in `TutorChat` → send → the learner's message appears immediately, followed by the Tutor Agent's reply.
- **Logout:** User clicks logout in `AppShell` → clear `AuthContext`/`localStorage` → redirect to `/login`.

## 7. UI/UX Requirements
<!-- Design system or component library (if any), responsiveness, dark mode, accessibility (WCAG level), loading/empty/error states. -->
- No formal design system; plain Tailwind utility styling, kept simple and consistent (single color/spacing scale used throughout).

### Design Tokens (colors & fonts)
- **Fonts:** `Inter` (UI text, loaded from Google Fonts) paired with `JetBrains Mono` (code editor and inline code snippets) — a two-font pairing, unlike a single-typeface app, since a monospace font is functionally necessary anywhere code is shown or edited, not just a stylistic choice.
- **Palette:** a clean, neutral UI surface with Python's own brand colors (blue/yellow) used as the primary and accent.

| Token | Hex | Usage |
|-------|-----|-------|
| `background` | `#F5F7FA` | Page background (light neutral) |
| `surface` | `#FFFFFF` | Cards, panels, editor chrome, modals |
| `primary` | `#306998` | Buttons, links, active nav, headings accent (Python blue) |
| `primary-hover` | `#244F76` | Hover/active state of primary elements |
| `accent` | `#FFD43B` | Used sparingly for success highlights and badges (Python yellow) — never as text-on-white, for contrast reasons |
| `text` | `#1F2933` | Body and heading text |
| `text-muted` | `#6B7785` | Secondary text, placeholders, helper text |
| `border` | `#DDE3EA` | Borders on cards/inputs |
| `success` | `#2E7D32` | Passed-test indicator |
| `error` | `#C0392B` | Inline error/validation messages, failed-test indicator |

Wired into Tailwind via `tailwind.config.js`:
```js
theme: {
  extend: {
    colors: {
      background: '#F5F7FA',
      surface: '#FFFFFF',
      primary: { DEFAULT: '#306998', hover: '#244F76' },
      accent: '#FFD43B',
      text: { DEFAULT: '#1F2933', muted: '#6B7785' },
      border: '#DDE3EA',
      success: '#2E7D32',
      error: '#C0392B',
    },
    fontFamily: {
      sans: ['Inter', 'sans-serif'],
      mono: ['"JetBrains Mono"', 'monospace'],
    },
  },
}
```
- Dark mode is out of scope for MVP (a fast follow-on given the token-based Tailwind setup, but not built now).
- Responsive: must be usable on both desktop and mobile browser widths, code editor included (per `goal-spec.md` — no native mobile app; CodeMirror supports touch input).
- Accessibility: basic semantic HTML, labeled form inputs, keyboard-operable forms/buttons. No formal WCAG level target for a weekend MVP.
- Loading state: agent-backed calls (explanation generation, grading, chat replies) take noticeably longer than a normal API call, so each shows a distinct, specific loading label (e.g. "Grading your code…" vs. "Thinking…") rather than a generic spinner, so the delay reads as expected rather than stalled.
- Empty state: not applicable to the curriculum itself (it always has content once the assessment is done), but `TutorChat` shows a short prompt ("Ask a question about this lesson") when no messages exist yet.
- Error state: inline error messages for failed login/signup, a failed submission grading (e.g. sandbox timeout, distinct from a *failing test result*, which is a normal graded outcome), and failed data fetch, with a retry action where reasonable.

## 8. Auth & Permissions (Client Side)
<!-- Login/signup flow, session/token storage, protected routes, role-based UI differences. -->
- Basic username/password login and signup in MVP.
- On successful login or signup, the API returns a token; stored in `localStorage` and held in `AuthContext` for the session.
- All routes except `/login` and `/signup` are wrapped in `ProtectedRoute`, which redirects to `/login` if no valid token is present.
- **Assessment gating:** `GET /curriculum` returns `404` with `{"detail": "assessment not completed"}` for a logged-in user who hasn't taken the assessment yet (`api-contract-spec.md` §4). `HomePage` treats that specific `404` as a redirect to `/assessment` rather than an error state — this is how the frontend knows whether to show the curriculum or the assessment, without a separate "assessment done?" flag on the user.
- No roles/permission tiers — every logged-in user can only see and manage their own curriculum and lessons (enforced by the backend; the frontend simply scopes all requests to the current user via the auth token).
- A `401` response from the API clears the stored token and redirects to `/login`.

## 9. Non-Functional Requirements
<!-- Performance targets (e.g. load time), browser support, offline behavior, SEO needs. -->
- Browser support: latest versions of Chrome, Firefox, Safari, Edge. No legacy browser support required.
- Performance: no formal budget for a weekend MVP; keep initial load reasonable by relying on Vite's default code splitting.
- Offline: not required, and less viable here than a typical CRUD app anyway — every meaningful action (explanation, grading, chat) is agent-backed and needs the network.
- SEO: not required — the app is behind login, no public/marketing pages.

## 10. Deployment (Vercel)
<!-- How the SPA is built and served on Vercel, and what that implies for routing/config/CORS. -->
- **Build:** Vercel builds with `npm run build` (Vite) and serves the static `dist/` output. No Vercel serverless functions are needed — the API lives on a separately hosted backend.
- **SPA routing fallback:** React Router does client-side routing, so a static host needs to serve `index.html` for every path (otherwise refreshing `/lessons/:lessonId` 404s). Add `vercel.json`:
```json
{
  "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }]
}
```
- **API base URL:** never hardcoded. Read from a build-time env var, e.g. `VITE_API_BASE_URL`, set per Vercel environment (Production / Preview / Development) in the project settings, and referenced in the API client as `import.meta.env.VITE_API_BASE_URL`.
- **CORS:** Preview deployments hit the same production API as Production (no separate staging backend, matching `backend-spec.md`'s single-environment setup), so the backend must allow both the Vercel production domain and its `*.vercel.app` preview domains as CORS origins.
- **HTTPS:** automatic on Vercel — relevant since the app sends an auth token on every request.

## 11. Open Questions
_None currently — all resolved:_
- Assessment gating is a `404` detail check on `GET /curriculum` (§8), not a separate user flag — kept the User model unchanged from a plain username/password account.
- Code editor confirmed as CodeMirror 6 rather than Monaco — lighter weight, sufficient for single-file Python snippets at this scope.
