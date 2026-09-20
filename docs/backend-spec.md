# Backend Spec — Agentic Python Tutor

> Defines the server, data model, agent architecture, and business logic. Should serve the endpoints defined in `api-contract-spec.md` and support the use cases in `goal-spec.md`.

## 1. Tech Stack
<!-- Language/framework (Node/Express, Python/FastAPI, etc.), database, ORM, auth library, hosting target. -->
- Language/framework: Python 3.12 + FastAPI
- ORM/migrations: SQLAlchemy 2.0 + Alembic
- Database: PostgreSQL
- Validation/serialization: Pydantic (via FastAPI)
- Auth: JWT bearer tokens (`python-jose` or `pyjwt`), passwords hashed with `passlib[bcrypt]`
- **Agents:** Anthropic Python SDK (`anthropic`) calling the Claude API. Model set via `LLM_MODEL` env var (default `claude-sonnet-5`) so it can be swapped without a code change.
- **Code sandbox:** self-hosted, resource-limited subprocess runner (no third-party execution service) — see §6 for the security trade-off this accepts.
- Server: Uvicorn (ASGI), packaged as a Docker container
- Hosting: AWS ECS Fargate (containerized API) behind an Application Load Balancer, database on AWS RDS for PostgreSQL
- Infrastructure as code: Terraform (VPC, RDS, ECS cluster/service/task definition, ALB, ECR repo, IAM roles)
- CI/CD: GitHub Actions (test → build/push Docker image to ECR → deploy to ECS on merge to `main`)

## 2. Architecture Overview
<!-- Monolith vs. services, request flow, key layers (controllers/services/repositories), any background jobs or queues. -->
Single monolithic FastAPI app (no microservices, no background jobs/queues — every agent call and sandbox run happens synchronously within the request). Layers:
- **Routers** (`app/routers/`) — FastAPI path operations per resource (`auth`, `assessment`, `curriculum`, `lessons`); parse/validate the request via Pydantic schemas and call services.
- **Services** (`app/services/`) — business logic (scoring the assessment, advancing the curriculum, ownership checks).
- **Agents** (`app/agents/`) — one module per agent (`curriculum_planner.py`, `tutor.py`, `code_reviewer.py`, `evaluator.py`), each exposing a single function that assembles context (Skill Profile, Topic, Exercise, chat history, etc.) and calls the Claude API with a role-specific system prompt.
- **Sandbox** (`app/sandbox/`) — executes a Submission's code against an Exercise's test cases and returns per-test results.
- **Models** (`app/models/`) — SQLAlchemy ORM models mapping to Postgres tables.
- **Schemas** (`app/schemas/`) — Pydantic request/response models, kept in sync with `api-contract-spec.md`.

**Agent architecture decision:** agents are focused prompt-template + context-assembly functions calling the Anthropic Messages API directly — not a multi-agent orchestration framework (e.g. LangGraph, CrewAI). Four agents with clearly separated, single responsibilities don't need a general orchestration layer for a weekend MVP; the Evaluator Agent receives the Sandbox's test results as plain context rather than invoking the Sandbox itself as a tool-call. Revisit if the agent count or inter-agent handoffs grow post-MVP.

Request flow: client → router (auth dependency validates JWT) → service (business rules, ownership check) → for lesson/submission endpoints, the Sandbox and/or one or more Agents → SQLAlchemy session → Postgres → response mapped through a Pydantic schema.

## 3. Data Model
<!-- Entities and relationships. One table per entity: fields, types, constraints. e.g. User, Trip, Destination, ItineraryItem. -->
Entities mirror the glossary in `goal-spec.md`: User, Topic, Exercise, SkillProfile, CurriculumEntry, LessonSession, Submission, ChatMessage.

### Entity: `User`
| Field | Type | Constraints | Notes |
|-------|------|-------------|-------|
| id | UUID | PK | |
| username | string | unique, not null | |
| password_hash | string | not null | bcrypt hash, never the raw password |
| created_at | timestamp | not null, default now | |

### Entity: `Topic`
| Field | Type | Constraints | Notes |
|-------|------|-------------|-------|
| id | UUID | PK | |
| name | string | not null | e.g. "List Comprehensions" |
| description | string | not null | short summary, given to agents as context |
| order_hint | int | not null | rough default sequencing before personalization; seed content, not user-owned |

### Entity: `Exercise`
| Field | Type | Constraints | Notes |
|-------|------|-------------|-------|
| id | UUID | PK | |
| topic_id | UUID | FK → `Topic.id`, not null | |
| difficulty | enum | not null | `easy`, `medium`, `hard` |
| prompt | string | not null | exercise instructions |
| starter_code | string | not null | pre-filled in the editor |
| test_cases | JSONB | not null | list of `{input, expected_output}`; pre-authored, never AI-generated (see §4) |
| created_at | timestamp | not null, default now | |

### Entity: `SkillProfile`
| Field | Type | Constraints | Notes |
|-------|------|-------------|-------|
| id | UUID | PK | |
| user_id | UUID | FK → `User.id`, not null | |
| topic_id | UUID | FK → `Topic.id`, not null | |
| mastery_level | int | not null, default 0 | 0–5 |
| | | unique (`user_id`, `topic_id`) | |
| updated_at | timestamp | not null | |

### Entity: `CurriculumEntry`
| Field | Type | Constraints | Notes |
|-------|------|-------------|-------|
| id | UUID | PK | |
| user_id | UUID | FK → `User.id`, not null | |
| topic_id | UUID | FK → `Topic.id`, not null | |
| order_index | int | not null | set once by the Curriculum Planner Agent, never re-sequenced (see §4) |
| status | enum | not null, default `locked` | `locked`, `current`, `completed` |
| | | unique (`user_id`, `topic_id`) | |

### Entity: `LessonSession`
| Field | Type | Constraints | Notes |
|-------|------|-------------|-------|
| id | UUID | PK | |
| user_id | UUID | FK → `User.id`, not null | |
| topic_id | UUID | FK → `Topic.id`, not null | |
| exercise_id | UUID | FK → `Exercise.id`, not null | |
| explanation | string | not null | generated once by the Tutor Agent, then cached |
| status | enum | not null, default `in_progress` | `in_progress`, `failed_pending_retry`, `passed` |
| started_at | timestamp | not null, default now | |
| completed_at | timestamp | nullable | set when status becomes `passed` |

### Entity: `Submission`
| Field | Type | Constraints | Notes |
|-------|------|-------------|-------|
| id | UUID | PK | |
| lesson_session_id | UUID | FK → `LessonSession.id`, not null | |
| code | string | not null | |
| status | enum | not null | `passed`, `failed`, `partial` |
| test_results | JSONB | not null | per-test `{input, expected_output, actual_output, passed}` |
| reviewer_feedback | string | nullable | filled by the Code Reviewer Agent |
| submitted_at | timestamp | not null, default now | |

### Entity: `ChatMessage`
| Field | Type | Constraints | Notes |
|-------|------|-------------|-------|
| id | UUID | PK | |
| lesson_session_id | UUID | FK → `LessonSession.id`, not null | |
| role | enum | not null | `learner`, `tutor_agent` |
| content | string | not null | |
| created_at | timestamp | not null, default now | |

### Relationships
<!-- e.g. User has many Trips; Trip has many Destinations -->
- `User` has many `SkillProfile`, `CurriculumEntry`, `LessonSession` (1:N each), scoped by `user_id`.
- `Topic` has many `Exercise`, `SkillProfile`, `CurriculumEntry` — seed/shared data, never owned by or deleted with a single user.
- `LessonSession` has many `Submission` (a Learner may resubmit after a fail) and many `ChatMessage` (1:N each).
- Deleting a `User` cascades to their `SkillProfile`, `CurriculumEntry`, `LessonSession`, and transitively their `Submission`/`ChatMessage` rows. `Topic`/`Exercise` are never deleted with a user.

## 4. Business Logic & Rules
<!-- Validation rules, computed fields, ordering logic, edge cases (e.g. overlapping dates, empty trips). -->
- **Assessment → initial curriculum:** `POST /assessment/submit` scores each answer with a fixed rule (correct MCQ = +1, correct short-code question = +2, capped 0–5 per Topic) and writes `SkillProfile` rows, then calls the **Curriculum Planner Agent** with the full Skill Profile to produce an ordered Topic sequence, written as `CurriculumEntry` rows (`order_index` 0..N−1; the first entry starts `current`, the rest `locked`). This runs once per user — `400` if `CurriculumEntry` rows already exist; re-assessing later is out of scope for MVP.
- **Requesting the next lesson:** `POST /lessons/next` finds the user's `current` `CurriculumEntry`, selects an `Exercise` for that Topic whose difficulty matches the Topic's mastery level (0–1 → easy, 2–3 → medium, 4–5 → hard), calls the **Tutor Agent** to generate a level-appropriate explanation, and creates a `LessonSession` (`in_progress`). If an `in_progress` or `failed_pending_retry` `LessonSession` already exists for the current Topic, that same session is returned instead of creating a new one — "continue where I left off" is idempotent.
- **Grading a submission:** `POST /lessons/{id}/submissions` runs the Sandbox against the Exercise's `test_cases` (`400` if the `LessonSession` isn't `in_progress`/`failed_pending_retry`), then the **Evaluator Agent** interprets the results into `passed`/`failed`/`partial` and a mastery change (pass on the first attempt: +2, capped at 5; pass on a retry: +1; fail: −1, floored at 0). The **Code Reviewer Agent** is called regardless of pass/fail to produce qualitative feedback. `SkillProfile.mastery_level` is updated; only on `passed` does the `LessonSession` become `passed`, its `CurriculumEntry` become `completed`, and the next `CurriculumEntry` (by `order_index`) become `current`. A `failed`/`partial` result sets the session to `failed_pending_retry` so the same session accepts another `Submission` — no new `LessonSession`/`Exercise` is created until the Learner passes.
- **Tutor chat:** scoped to one `LessonSession` — `POST /lessons/{id}/messages` appends a `learner` `ChatMessage`, calls the **Tutor Agent** with the Topic/Exercise context plus the session's chat history, then appends and returns the `tutor_agent` reply. No cross-lesson memory for MVP.
- **Ownership:** `Topic`/`Exercise` reads are unscoped (shared catalog); every `SkillProfile`/`CurriculumEntry`/`LessonSession`/`Submission`/`ChatMessage` operation checks `user_id == current_user.id` (transitively via `LessonSession` for `Submission`/`ChatMessage`) — a resource that exists but belongs to another user returns `404`, never `403`, to avoid confirming it exists.
- **No curriculum reordering after generation:** the Curriculum Planner Agent sets `order_index` once, at assessment time, and only ever changes an entry's *status* afterward — never re-sequences it. This keeps "adapt via repeat/insert-remedial" simple: a remedial exercise is just another `Exercise` at the same Topic and a lower difficulty, not a new `CurriculumEntry`.
- **No AI-generated exercises or test cases:** `Exercise` rows (including `test_cases`) are seeded ahead of time (§9) — explicitly out of scope per `goal-spec.md`, since LLM-generated test cases can't be trusted to be correct or deterministic without a validation step this MVP has no time to build.
- **No overlapping-attempt validation:** a Learner can resubmit as many times as they like to the same `LessonSession`; no attempt cap or cooldown for MVP.

## 5. Authentication & Authorization
<!-- Auth strategy (JWT/session/OAuth), password handling, role/permission model, who can access/modify what. -->
- **Strategy:** JWT bearer tokens, matching the frontend's `Authorization: Bearer <token>` expectation (`frontend-spec.md` §5/§8).
- **Login:** `POST /auth/login` verifies username + password (bcrypt) and returns a signed JWT (`JWT_SECRET`, expiry 30 days — no refresh-token flow for MVP; re-login once it expires).
- **Signup:** `POST /auth/signup` creates a new account and returns a token in the same shape as login, so the client is immediately logged in. `username` must be unique (`400` if taken). A brand-new user has no `SkillProfile`/`CurriculumEntry` rows yet, so the frontend routes them to the assessment first (`frontend-spec.md` §6).
- **Authorization:** every route except `/auth/login` and `/auth/signup` requires a valid JWT; the authenticated `user_id` scopes all Skill Profile/Curriculum/Lesson queries. No roles/permission tiers.
- An expired/invalid/missing token returns `401`.

## 6. Third-Party Integrations
<!-- Maps, geocoding, weather, flight/hotel data, email, etc. Include what each is used for. -->
- **Anthropic Claude API** (`anthropic` Python SDK) — backs all four agents. `ANTHROPIC_API_KEY` from Secrets Manager, model from `LLM_MODEL`. Each agent call is a single synchronous `messages.create` with a role-specific system prompt plus assembled context — no tool-use/function-calling loop needed for MVP.
- **Code execution sandbox** (self-hosted, not a third-party service): a `Submission`'s code runs as a subprocess with `resource.setrlimit` CPU/memory caps, a wall-clock timeout (e.g. 5s), a restricted `builtins`/import allowlist (stdlib only — no `os`, `subprocess`, `socket`, `sys`), and no network access from that subprocess. **Accepted MVP trade-off:** this is process-level isolation, not container-per-execution or microVM-level isolation (e.g. Docker-per-run, gVisor, Firecracker). Acceptable given the personal-scale, single/few-user usage assumed in `goal-spec.md` §8 (no public signup) — explicitly **not** safe to expose to untrusted or public users as-is; hardening the sandbox is a named post-MVP item (`goal-spec.md` §5).

## 7. Non-Functional Requirements
<!-- Performance/scalability targets, rate limiting, caching strategy, logging/monitoring, expected load. -->
- Expected load: a single user or a small handful of personal accounts (MVP, no public signup) — no performance/scalability targets beyond "feels responsive" at this scale.
- Agent calls add latency (roughly 1–5s per call) — the API doesn't hide this; `frontend-spec.md` §7 covers surfacing it as a loading state rather than trying to optimize it away.
- Rate limiting: not needed at this scale/threat model.
- Caching: none — a `LessonSession`'s explanation is cached in the row itself (generated once, reused on reload); no separate LLM response cache given low personal-scale volume.
- Logging: Uvicorn's default access/error logs are sufficient; no external monitoring/APM for MVP.

## 8. Error Handling
<!-- Standard error response shape, how validation errors vs. server errors vs. auth errors are surfaced. (Should match api-contract-spec.md) -->
- Uses FastAPI's default conventions: `HTTPException` → `{"detail": "<message>"}`; Pydantic validation failures → `422` with FastAPI's standard `detail` array of field errors.
- Status codes: `400` business-rule validation (e.g. assessment already completed, submitting to a `passed` session), `401` missing/invalid/expired JWT, `404` resource not found or not owned by the caller, `422` request-shape validation, `503` an Agent call or Sandbox run failed/timed out, `500` unhandled error.
- A failed/timed-out Claude API call or Sandbox run returns `503` with `{"detail": "AI agent temporarily unavailable, please retry"}` rather than surfacing the raw provider error — this must match `api-contract-spec.md` once that spec is filled in, since the exact response envelope is the frontend/backend contract.

## 9. Environment & Deployment
<!-- Env vars, config management, deployment target, migrations strategy. -->
- **Env vars/secrets:** `DATABASE_URL` (RDS connection string), `JWT_SECRET`, `JWT_EXPIRY_MINUTES`, `ALLOWED_ORIGINS` (comma-separated, for CORS), `ANTHROPIC_API_KEY`, `LLM_MODEL`. `DATABASE_URL`/`JWT_SECRET`/`ANTHROPIC_API_KEY` are stored as ECS task definition secrets sourced from AWS Secrets Manager; non-secret config (`ALLOWED_ORIGINS`, `JWT_EXPIRY_MINUTES`, `LLM_MODEL`) as plain task-definition env vars.
- **Migrations:** Alembic; run as a one-off ECS task (`alembic upgrade head`) triggered by the deploy pipeline before the new app version receives traffic.
- **Seeding:** unlike a pure user-generated-content app, this one needs a content seed step — `Topic` and `Exercise` rows (including `test_cases`) are authored content with no in-app authoring UI for MVP, loaded via a one-off script (`scripts/seed_content.py`) run once against RDS before first use. User accounts are still created normally via `POST /auth/signup`.

### Infrastructure (Terraform)
- **VPC:** private subnets for ECS tasks and RDS, routed to the internet via a NAT Gateway; public subnets for the ALB and the NAT Gateway itself. RDS is not publicly accessible — only reachable from the ECS tasks' security group.
- **RDS:** PostgreSQL instance (smallest instance class appropriate for this scale, e.g. `db.t4g.micro` — free-tier eligible for a new AWS account's first 12 months), automated backups enabled.
- **ECR:** one repository for the backend's Docker image.
- **ECS:** Fargate cluster, one service running the FastAPI container in the private subnets, task definition referencing the ECR image + env vars/secrets above.
- **ALB:** routes HTTPS traffic to the ECS service's target group; ACM cert for the API's domain.
- **IAM:** a task execution role (pull from ECR, read Secrets Manager) and a narrowly-scoped deploy role for GitHub Actions (via OIDC — no long-lived AWS access keys stored in GitHub).
- Terraform state stored remotely (e.g. an S3 backend with DynamoDB locking) rather than locally.
- **Cost note:** NAT Gateway (~$0.045/hr) and ALB (~$0.0225/hr) are billed hourly. Since this app is only expected to run for a few hours at a time, run `terraform destroy` after each session (or whenever it isn't actively being used) — this setup is meant to be spun up and torn down, not left running.

### CI/CD (GitHub Actions)
On push to `main`:
1. **Test:** install deps, run backend test suite + lint.
2. **Build:** build the Docker image, tag with the commit SHA.
3. **Push:** push the image to ECR (auth via GitHub OIDC → the IAM deploy role, no static AWS keys as GitHub secrets).
4. **Migrate:** run the Alembic migration as a one-off ECS task against RDS.
5. **Seed (first deploy only):** run `scripts/seed_content.py` as a one-off ECS task if the `Topic` table is empty — safe to run repeatedly since it's idempotent (upsert by a stable slug, not by generated UUID).
6. **Deploy:** update the ECS service/task definition to the new image tag and wait for the rollout to stabilize.

- **CORS:** `CORSMiddleware` configured from `ALLOWED_ORIGINS`, including both the Vercel production domain and its `*.vercel.app` preview domains (`frontend-spec.md` §10).

## 10. Open Questions
_None currently — all resolved:_
- Exact assessment question bank (which Topics, how many questions, MCQ vs. short-code mix) is a content-authoring task, not an architecture decision — deferred to implementation, alongside the rest of the seeded `Topic`/`Exercise` catalog.
- No expiry/reset for a `LessonSession` stuck at `failed_pending_retry` after many attempts — not needed at personal scale for a weekend MVP; revisit if it comes up in use.
- Single environment (no staging/PR-preview tier), matching `frontend-spec.md` §10 — confirmed sufficient for now.
