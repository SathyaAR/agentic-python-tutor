# Specs & Knowledge Base

Read in order:

1. **goal-spec.md** — problem, users, MVP scope, glossary
2. **backend-spec.md** — tech stack, agent architecture, data model, infra
3. **frontend-spec.md** — screens, components, state, design tokens
4. **api-contract-spec.md** — the binding contract; update this first when
   the frontend/backend interface changes, then bring both specs in line
   with it
5. **architecture-blueprint.md** — visual companion to the four specs above:
   screen wireframes, system architecture, workflow diagrams, deployment
   pipelines

## Beyond the specs

- **journal/** — a running, dated log of decisions, problems hit, and
  things learned while building this. Write here as you go, not after
  the fact — specifics fade fast, and this is the raw material for
  `showcase/` later. It's also genuinely useful for future-you, re-opening
  this repo in six months wondering *why* a choice was made.
- **assets/** — screenshots, exported mockup images, anything visual that
  doesn't belong as a text file.
- **showcase/** — the polished write-up you produce once the MVP is
  working: what you built, what you learned, before/after, screenshots.
  Meant for other people to read (a portfolio piece, an interview
  leave-behind) — `journal/` is the unpolished source material for it,
  not a substitute for it.
