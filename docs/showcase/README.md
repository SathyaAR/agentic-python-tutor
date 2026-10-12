# Showcase

Not written yet — fill this in once the MVP is working. Until then, the
**Progress so far** section below is a running summary to draw from.

This is the polished version of `journal/`: a write-up meant for other
people (a portfolio piece, an interview leave-behind, a LinkedIn post),
not your own working notes. A structure worth aiming for:

1. What it is and why (one paragraph, no jargon)
2. What you built — the agent architecture, the adaptive curriculum,
   whatever the genuinely interesting parts turned out to be
3. What you learned — the real value of this section; be specific
   ("building a sandboxed code-execution endpoint taught me X"), not
   "I learned a lot"
4. Screenshots (pull from `../assets/`)
5. What you'd do differently / what's next

Want a Word or PDF version to send someone? Generate it from this file
once it's written, rather than maintaining both in parallel — markdown
here stays the single source of truth.

---

## Progress so far (draft material, not the final write-up)

| Date | Milestone | Highlights worth telling |
|---|---|---|
| 2026-10-11 | Specs + architecture | Spec-driven setup: goal / backend / frontend / API-contract specs, plus a diagram blueprint |
| 2026-10-12 | Frontend v0.1 | All five screens working end to end against an in-browser mock of the API contract, so the full learner journey was clickable before any backend code existed |

**Candidate "what I learned" points so far:**
- Building a mock of the *contract* (not of the UI) let the frontend be
  finished and tested against real business rules before the backend
  existed — and the mock doubles as an executable reading of the spec.
- Agent-backed calls are slow by nature; giving each one its own loading
  label ("Grading your code…", "Thinking…") makes the wait read as work,
  not a hang.
- Bundle size: one heavy dependency (the code editor) was two-thirds of the
  app. Route-level lazy loading fixed it.

Screenshots to use: see the capture checklist in `../assets/README.md`.
