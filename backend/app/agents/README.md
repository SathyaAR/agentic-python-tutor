One module per agent: `curriculum_planner.py`, `tutor.py`,
`code_reviewer.py`, `evaluator.py`. Each assembles context and calls the
Claude API with a role-specific system prompt — no orchestration framework.
See backend-spec.md §2 and §6.
