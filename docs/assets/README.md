# Assets

Non-text reference material for this project: screenshots, exported
mockup images, diagrams saved as images (as opposed to the Mermaid source
in `architecture-blueprint.md`, which stays text so it's diffable).

Suggested subfolders as they fill up:
- `mockups/` — exported screenshots of the UI design canvas. The design
  tool itself isn't git-trackable, so a PNG export here is how the look
  survives if that link ever goes away.
- `screenshots/` — deployment dashboards, the running app, anything dated
  and useful for the showcase write-up later.

Keep file names descriptive and dated where it matters, e.g.
`2026-10-11-login-mockup.png`.

## Capture checklist — frontend v0.1 (2026-10-12)

Not captured yet. Take these once you've run `npm run dev` (mock mode is
fine), save under `screenshots/`, and they're ready for `showcase/`:

- [ ] `2026-10-12-login.png` — `/login` with the demo-mode hint
- [ ] `2026-10-12-assessment.png` — `/assessment` mid-way (one MCQ, one code question)
- [ ] `2026-10-12-home-curriculum.png` — `/curriculum` as `asha` (completed / current / locked rows)
- [ ] `2026-10-12-lesson-failed.png` — lesson after submitting the starter code (failed tests + review)
- [ ] `2026-10-12-lesson-passed-chat.png` — passed result + a tutor chat exchange
- [ ] `2026-10-12-mobile-lesson.png` — the lesson page at phone width (DevTools device mode)
