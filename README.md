# Agentic Python Tutor ("PyMentor")

A web app that uses four specialized AI agents — Curriculum Planner, Tutor,
Code Reviewer, and Evaluator — to build and adapt a personalized Python
learning path.

## Specs first

This project follows spec-driven development. Before touching code, read
(in this order):

1. [`docs/goal-spec.md`](docs/goal-spec.md) — what we're building and why
2. [`docs/backend-spec.md`](docs/backend-spec.md) — server, data model, agents, infra
3. [`docs/frontend-spec.md`](docs/frontend-spec.md) — client app, screens, state
4. [`docs/api-contract-spec.md`](docs/api-contract-spec.md) — the binding contract between the two

Any change to how the frontend and backend talk to each other should update
`api-contract-spec.md` first — both sides implement to it, not to each other.

## Repo layout

```
.
├── docs/        # the four specs above
├── backend/     # Python 3.12 + FastAPI (see backend-spec.md)
├── frontend/    # React + TypeScript + Vite (see frontend-spec.md)
└── infra/       # Terraform for AWS ECS/RDS (see backend-spec.md §9)
```

Each subfolder has its own README pointing back to the exact spec section
it implements.

## Quickstart

### Backend
```bash
cd backend
python3.12 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env   # fill in DATABASE_URL, JWT_SECRET, ANTHROPIC_API_KEY
uvicorn app.main:app --reload
```

### Frontend
```bash
cd frontend
npm create vite@latest . -- --template react-ts   # first time only
npm install
npm install -D tailwindcss postcss autoprefixer @uiw/react-codemirror @codemirror/lang-python
cp .env.example .env.local   # fill in VITE_API_BASE_URL
npm run dev
```

### Infra
See `infra/README.md` and `backend-spec.md` §9 before running any Terraform.
Remember to `terraform destroy` after each session — the ALB and NAT Gateway
are billed hourly.
