# Learning Log — Agentic Python Tutor

A running, dated record of decisions, problems hit, and things learned
while building this. Newest entry on top. Write in the moment, not after
the fact — specifics fade fast.

Each entry: what happened, what you decided or learned, and why. Link to
the relevant spec section if the decision changed one.

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
