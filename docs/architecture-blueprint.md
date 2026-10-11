# Architecture Blueprint — Agentic Python Tutor (PyMentor)

> A visual companion to `goal-spec.md`, `backend-spec.md`, `frontend-spec.md`, and `api-contract-spec.md`. This file doesn't introduce new decisions — it diagrams the ones already made in those four specs, so a reader can see the shape of the system before diving into the detail. Keep it under `docs/` alongside them.

## 1. Screen Wireframes

Matches `frontend-spec.md` §3 (Pages/Screens) and §7 (design tokens: Python blue `#306998` / yellow `#FFD43B`, Inter + JetBrains Mono). A rendered version of these three screens was also generated as a Claude design canvas — these ASCII versions are the git-trackable reference.

### 1.1 Login — `/login`
```
┌─────────────────────────────────────────┐
│                                           │
│              [Py] PyMentor               │
│        Your personalized Python tutor    │
│                                           │
│   ┌───────────────────────────────┐     │
│   │ Username                       │     │
│   │ [___________________________]  │     │
│   │ Password                       │     │
│   │ [___________________________]  │     │
│   │                                 │     │
│   │ [          Log In           ]  │     │
│   │ ─────────────────────────────  │     │
│   │  Don't have an account? Sign up│     │
│   └───────────────────────────────┘     │
│                                           │
└─────────────────────────────────────────┘
```

### 1.2 Home / Curriculum — `/curriculum`
```
┌──────────────────────────────────────────────────────────┐
│ [Py] PyMentor                 Logged in as asha | Log out │
├──────────────────────────────────────────────────────────┤
│  Welcome to PyMentor                                      │
│  Your personalized Python curriculum, built from your     │
│  assessment.                                               │
│                                                             │
│  [ Continue Learning — Functions ]                         │
│                                                             │
│  ┌───────────────────────────────────────────────────┐    │
│  │ For Loops                    Completed   ●●●●●     │    │
│  ├───────────────────────────────────────────────────┤    │
│  │ Functions                    Current     ●●○○○     │    │
│  ├───────────────────────────────────────────────────┤    │
│  │ List Comprehensions  (dim)   Locked      ○○○○○     │    │
│  ├───────────────────────────────────────────────────┤    │
│  │ Classes & Objects    (dim)   Locked      ○○○○○     │    │
│  └───────────────────────────────────────────────────┘    │
└──────────────────────────────────────────────────────────┘
```

### 1.3 Lesson — `/lessons/:lessonId`
```
┌────────────────────────────────────────────────────────────────────┐
│ [Py] PyMentor                          Logged in as asha | Log out │
├────────────────────────────────────────────────────────────────────┤
│ ← Back to Curriculum                                                 │
│ ┌────────────────────────────────────┐  ┌──────────────────────┐    │
│ │ FUNCTIONS                          │  │ Ask the Tutor         │    │
│ │ A function lets you package up a   │  ├──────────────────────┤    │
│ │ block of code to reuse...          │  │          "Why do I   │    │
│ ├────────────────────────────────────┤  │  need return here?" ►│    │
│ │ exercise.py                        │  │ ◄ "Without return,   │    │
│ │   def add(a, b):                   │  │    the function...   │    │
│ │       pass                         │  │                       │    │
│ ├────────────────────────────────────┤  │                       │    │
│ │                        [ Submit ]  │  │ [Ask a question…    ]│    │
│ ├────────────────────────────────────┤  └──────────────────────┘    │
│ │ ✓ add(2, 3) → 5                    │                               │
│ │ ───────────────────────────────    │                               │
│ │ "Clean and correct — a             │                               │
│ │  straightforward implementation."  │                               │
│ └────────────────────────────────────┘                               │
└────────────────────────────────────────────────────────────────────┘
```

## 2. System Architecture Blueprint

Matches `backend-spec.md` §1–2 and §6, and `frontend-spec.md` §1/§10.

```mermaid
graph TB
  subgraph "Learner's Browser"
    UI["React + TS SPA<br/>(Vite build)"]
  end

  subgraph "Vercel"
    CDN["Static hosting / CDN<br/>frontend/dist output"]
  end

  subgraph "AWS VPC"
    ALB["Application Load Balancer<br/>(public subnet, ACM cert)"]
    subgraph "ECS Fargate — private subnet"
      API["FastAPI app<br/>Routers to Services"]
      SANDBOX["Sandbox<br/>(resource-limited subprocess)"]
      AGENTS["Agents module<br/>curriculum_planner / tutor /<br/>code_reviewer / evaluator"]
    end
    RDS[("RDS PostgreSQL<br/>private subnet")]
  end

  CLAUDE["Anthropic Claude API"]

  UI -- "static assets" --> CDN
  UI -- "HTTPS, JWT bearer<br/>/api/v1/*" --> ALB
  ALB --> API
  API --> SANDBOX
  API --> AGENTS
  AGENTS -- "messages.create" --> CLAUDE
  API -- "SQLAlchemy" --> RDS
```

## 3. High-Level Workflows

### 3.1 Sign up → Assessment → Curriculum
Matches `backend-spec.md` §4 and `api-contract-spec.md`'s `/auth`, `/assessment` endpoints.

```mermaid
sequenceDiagram
  participant B as Browser
  participant A as FastAPI
  participant DB as Postgres
  participant CP as Curriculum Planner Agent

  B->>A: POST /auth/signup
  A->>DB: create User
  A-->>B: access_token

  B->>A: GET /assessment
  A-->>B: AssessmentQuestion[]

  B->>A: POST /assessment/submit (answers)
  A->>DB: write SkillProfile rows (rule-scored)
  A->>CP: SkillProfile -> build sequence
  CP-->>A: ordered Topic list
  A->>DB: write CurriculumEntry rows
  A-->>B: skill_profile + curriculum
```

### 3.2 Lesson: request, submit, grade
Matches `backend-spec.md` §4 (the core adaptive loop) and `api-contract-spec.md`'s `/lessons/*` endpoints.

```mermaid
sequenceDiagram
  participant B as Browser
  participant A as FastAPI
  participant T as Tutor Agent
  participant S as Sandbox
  participant E as Evaluator Agent
  participant R as Code Reviewer Agent
  participant DB as Postgres

  B->>A: POST /lessons/next
  A->>DB: find current CurriculumEntry + Exercise
  A->>T: generate level-appropriate explanation
  T-->>A: explanation text
  A->>DB: create LessonSession
  A-->>B: LessonSession (explanation, prompt, starter_code)

  B->>A: POST /lessons/{id}/submissions (code)
  A->>S: run code vs test_cases
  S-->>A: per-test results
  A->>E: interpret results -> status + mastery delta
  E-->>A: passed / failed / partial, delta
  A->>R: review submission
  R-->>A: qualitative feedback
  A->>DB: update SkillProfile, Submission,<br/>(on pass) advance CurriculumEntry
  A-->>B: Submission + mastery_level + advanced
```

### 3.3 Tutor chat
Matches `backend-spec.md` §4 ("Tutor chat") and `api-contract-spec.md`'s `/lessons/{id}/messages` endpoints.

```mermaid
sequenceDiagram
  participant B as Browser
  participant A as FastAPI
  participant T as Tutor Agent
  participant DB as Postgres

  B->>A: POST /lessons/{id}/messages (content)
  A->>DB: append learner ChatMessage
  A->>T: Topic/Exercise context + chat history
  T-->>A: reply text
  A->>DB: append tutor_agent ChatMessage
  A-->>B: learner_message + tutor_reply
```

### 3.4 End-to-end: a submission, including frontend cache behavior
Matches `frontend-spec.md` §5 (React Query invalidation rules).

```mermaid
sequenceDiagram
  participant RQ as React Query cache
  participant UI as CodeEditor / SubmissionResult
  participant ALB as ALB -> ECS (FastAPI)
  participant AG as Sandbox + Agents
  participant PG as RDS Postgres

  UI->>ALB: POST /lessons/{id}/submissions {code}
  ALB->>AG: run + grade + review
  AG->>PG: update SkillProfile, Submission,<br/>CurriculumEntry (if passed)
  PG-->>ALB: committed
  ALB-->>UI: Submission (status, feedback, mastery_level, advanced)
  UI->>RQ: invalidate ['lessons', lessonId]
  alt advanced == true
    UI->>RQ: invalidate ['curriculum']
  end
  RQ-->>UI: refetch -> re-render SubmissionResult / CurriculumTrack
```

## 4. Docker & Backend Deployment Pipeline

Matches `backend-spec.md` §9 (Environment & Deployment, CI/CD).

```mermaid
flowchart LR
  PUSH["git push to main"] --> TEST["Test<br/>pytest + lint"]
  TEST --> BUILD["Build Docker image<br/>tag: commit SHA"]
  BUILD --> ECR["Push image to ECR<br/>GitHub OIDC to IAM role"]
  ECR --> MIGRATE["Alembic migrate<br/>one-off ECS task"]
  MIGRATE --> SEED["Seed Topics/Exercises<br/>idempotent, first deploy"]
  SEED --> DEPLOY["Update ECS service<br/>to new task definition"]
  DEPLOY --> ROLLOUT["Rolling deploy<br/>behind ALB health checks"]
```

What the `Dockerfile` itself does (`backend/Dockerfile`):

```mermaid
flowchart TB
  BASE["FROM python:3.12-slim"] --> DEPS["COPY requirements.txt<br/>pip install"]
  DEPS --> CODE["COPY . .<br/>app/, alembic/, scripts/"]
  CODE --> CMD["CMD uvicorn app.main:app<br/>--host 0.0.0.0 --port 8000"]
```

## 5. Frontend Deployment Pipeline (Vercel)

Matches `frontend-spec.md` §10.

```mermaid
flowchart LR
  PUSH["git push"] --> VERCEL["Vercel detects push<br/>GitHub integration"]
  VERCEL --> BUILD["npm run build<br/>Vite -> frontend/dist"]
  BUILD --> ROUTE{"Branch?"}
  ROUTE -- "main" --> PROD["Deploy to Production<br/>custom domain + *.vercel.app"]
  ROUTE -- "other / PR" --> PREVIEW["Deploy as Preview<br/>unique *.vercel.app URL"]
  PROD --> CORS["Backend ALLOWED_ORIGINS<br/>must include prod domain"]
  PREVIEW --> CORS2["Backend ALLOWED_ORIGINS<br/>must include *.vercel.app wildcard"]
```

## 6. Keeping this in sync

- This file is a derived reference, not a fifth source of truth — `goal-spec.md` / `backend-spec.md` / `frontend-spec.md` / `api-contract-spec.md` stay authoritative; this just visualizes them.
- Mermaid blocks render natively on GitHub and in VS Code with the **"Markdown Preview Mermaid Support"** extension (`bierner.markdown-mermaid`) — worth adding to `.vscode/extensions.json` alongside the others.
- When an endpoint, screen, or deployment step changes in the specs, update the matching diagram here in the same commit. A diagram describing a workflow that no longer exists is worse than no diagram.
