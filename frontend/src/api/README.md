API client + React Query hooks. See frontend-spec.md §5.

- `client.ts` — `request()` (attaches the bearer token, handles 401) and the mock/real switch
- `endpoints.ts` — one function per endpoint in api-contract-spec.md §4
- `hooks.ts` — `useCurriculum`, `useLesson`, `useSubmitCode`, … with the §5 invalidation rules
- `mock/` — in-browser stand-in for the backend (used when `VITE_USE_MOCK_API=true`,
  or when no `VITE_API_BASE_URL` is set). Persists to `localStorage`; grading is
  pattern-matching, not real execution. Delete once the backend is live.
