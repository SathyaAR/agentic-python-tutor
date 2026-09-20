# API Contract Spec — Agentic Python Tutor

> The binding contract between `frontend-spec.md` and `backend-spec.md`. Both sides must implement to this exactly — treat it as the source of truth for request/response shapes.

## 1. Conventions
<!-- Base URL, versioning scheme (e.g. /api/v1), content type, date/time format, pagination style, naming case (camelCase/snake_case). -->
- **Base URL:** `https://<api-domain>/api/v1` (production domain TBD — behind the ALB from `backend-spec.md`). Frontend reads it from `VITE_API_BASE_URL` (`frontend-spec.md` §10).
- **Versioning:** URL-prefixed, `/api/v1`.
- **Content-Type:** `application/json` for all requests and responses.
- **Date/time format:** ISO 8601 timestamps as `YYYY-MM-DDTHH:MM:SSZ` (UTC) — this API has no plain "date" fields (unlike a trip planner, nothing here is scheduled by calendar date).
- **Naming case:** `snake_case` for all JSON field names, matching the Python/Pydantic/SQLAlchemy field names directly — no alias/conversion layer.
- **Pagination:** none for MVP — list endpoints return the full list (personal-scale usage per `backend-spec.md` §7).
- **Auth header:** `Authorization: Bearer <jwt>` on every request except `POST /auth/login` and `POST /auth/signup`.

## 2. Authentication
<!-- How the client authenticates requests (Bearer token, cookie/session, etc.). Include login/signup/refresh endpoints here or in section 4. -->
JWT bearer tokens (`backend-spec.md` §5). The client authenticates once via `POST /auth/login` or `POST /auth/signup`, gets back an `access_token`, and sends it as `Authorization: Bearer <access_token>` on every subsequent request. No refresh-token endpoint in MVP — a token is valid for `expires_in` seconds (30 days) from issuance, at which point the client must log in again. See §4 for the exact request/response shapes.

## 3. Common Response Envelope & Error Format
<!-- Standard success/error JSON shape, HTTP status code conventions, error codes list. -->
No wrapper envelope — a successful response body *is* the resource (object or array), matching FastAPI/Pydantic defaults directly (`backend-spec.md` §8).
```json
// Success (e.g. GET /lessons/{id})
{
  "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "topic_id": "8b2e...",
  "topic_name": "List Comprehensions",
  "status": "in_progress",
  "explanation": "A list comprehension lets you build a list in a single line...",
  "exercise_prompt": "Write a list comprehension that squares every even number in `nums`.",
  "starter_code": "def square_evens(nums):\n    pass\n",
  "started_at": "2026-09-16T10:00:00Z",
  "completed_at": null
}

// Error (400 / 401 / 404 / 500 / 503)
{
  "detail": "assessment not completed"
}

// Error (422 — request-shape validation, FastAPI's default shape)
{
  "detail": [
    { "loc": ["body", "code"], "msg": "field required", "type": "value_error.missing" }
  ]
}
```

## 4. Endpoints
<!-- One entry per endpoint. Copy the block below for each. -->

### `POST /auth/login`
- **Description:** Authenticate with username/password and receive a JWT.
- **Auth required:** no
- **Request body:**
```json
{ "username": "asha", "password": "hunter2" }
```
- **Response `200`:**
```json
{
  "access_token": "eyJhbGciOi...",
  "token_type": "bearer",
  "expires_in": 2592000,
  "username": "asha"
}
```
- **Error responses:** `401` invalid credentials · `422` missing/malformed fields

---

### `POST /auth/signup`
- **Description:** Create a username/password account. Logs the new user in immediately (same response shape as login). The new user has no Skill Profile or Curriculum yet — the frontend routes them to `GET /assessment` next.
- **Auth required:** no
- **Request body:**
```json
{ "username": "asha", "password": "hunter2" }
```
- **Response `201`:**
```json
{
  "access_token": "eyJhbGciOi...",
  "token_type": "bearer",
  "expires_in": 2592000,
  "username": "asha"
}
```
- **Error responses:** `400` username already taken · `422` missing/malformed fields

---

### `GET /assessment`
- **Description:** Get the diagnostic assessment questions. Content is fixed/seeded, not personalized — auth is required only for consistency (every non-auth route requires a token), not because the questions vary per user.
- **Auth required:** yes
- **Response `200`:**
```json
[
  {
    "id": "q1...",
    "topic_id": "8b2e...",
    "type": "mcq",
    "prompt": "What does `range(3)` produce?",
    "options": ["0, 1, 2", "1, 2, 3", "0, 1, 2, 3"]
  },
  {
    "id": "q2...",
    "topic_id": "9cf1...",
    "type": "code",
    "prompt": "Write a function that returns the square of its input.",
    "options": null
  }
]
```
- **Error responses:** `401`

---

### `POST /assessment/submit`
- **Description:** Submit assessment answers. Scores each answer into an initial `SkillProfile` per Topic, then calls the Curriculum Planner Agent to build the personalized `Curriculum`. Can only be called once per user.
- **Auth required:** yes
- **Request body:**
```json
{
  "answers": [
    { "question_id": "q1...", "answer": "0, 1, 2" },
    { "question_id": "q2...", "answer": "def square(x):\n    return x * x" }
  ]
}
```
- **Response `201`:**
```json
{
  "skill_profile": [
    { "topic_id": "8b2e...", "topic_name": "For Loops", "mastery_level": 3 }
  ],
  "curriculum": [
    { "id": "ce1...", "topic_id": "8b2e...", "topic_name": "For Loops", "order_index": 0, "status": "current", "mastery_level": 3 },
    { "id": "ce2...", "topic_id": "9cf1...", "topic_name": "Functions", "order_index": 1, "status": "locked", "mastery_level": 0 }
  ]
}
```
- **Error responses:** `400` assessment already completed · `401` · `422` missing/malformed fields

---

### `GET /curriculum`
- **Description:** Get the learner's personalized curriculum — topic order, status, and current mastery.
- **Auth required:** yes
- **Response `200`:**
```json
[
  { "id": "ce1...", "topic_id": "8b2e...", "topic_name": "For Loops", "order_index": 0, "status": "completed", "mastery_level": 5 },
  { "id": "ce2...", "topic_id": "9cf1...", "topic_name": "Functions", "order_index": 1, "status": "current", "mastery_level": 1 }
]
```
- **Error responses:** `401` · `404` assessment not completed (no `CurriculumEntry` rows yet — the frontend treats this specific case as a redirect to `/assessment`, per `frontend-spec.md` §8)

---

### `POST /lessons/next`
- **Description:** Get-or-create the `LessonSession` for the learner's `current` `CurriculumEntry`. Returns an existing `in_progress`/`failed_pending_retry` session for that Topic if one exists, rather than creating a duplicate.
- **Auth required:** yes
- **Response `200`** (existing session reused) **or `201`** (newly created):
```json
{
  "id": "ls1...",
  "topic_id": "9cf1...",
  "topic_name": "Functions",
  "exercise_id": "ex1...",
  "explanation": "A function lets you package up a block of code to reuse...",
  "exercise_prompt": "Write a function `add(a, b)` that returns the sum of its two arguments.",
  "starter_code": "def add(a, b):\n    pass\n",
  "status": "in_progress",
  "started_at": "2026-09-16T10:00:00Z",
  "completed_at": null
}
```
- **Error responses:** `400` no `current` CurriculumEntry (curriculum finished, or assessment not completed) · `401`

---

### `GET /lessons/{lesson_id}`
- **Description:** Get one `LessonSession`'s current detail, including its latest `Submission` if one exists (for reload/refresh).
- **Auth required:** yes
- **Path params:** `lesson_id` (UUID)
- **Response `200`:**
```json
{
  "id": "ls1...",
  "topic_id": "9cf1...",
  "topic_name": "Functions",
  "exercise_id": "ex1...",
  "explanation": "A function lets you package up a block of code to reuse...",
  "exercise_prompt": "Write a function `add(a, b)` that returns the sum of its two arguments.",
  "starter_code": "def add(a, b):\n    pass\n",
  "status": "failed_pending_retry",
  "started_at": "2026-09-16T10:00:00Z",
  "completed_at": null,
  "latest_submission": {
    "id": "sub1...",
    "status": "failed",
    "test_results": [
      { "input": "add(2, 3)", "expected_output": "5", "actual_output": "None", "passed": false }
    ],
    "reviewer_feedback": "You're missing a `return` statement — the function currently falls through without sending back a value.",
    "submitted_at": "2026-09-16T10:04:00Z"
  }
}
```
- **Error responses:** `401` · `404` lesson not found or not owned by the caller

---

### `POST /lessons/{lesson_id}/submissions`
- **Description:** Submit code for grading. Runs the Sandbox against the Exercise's test cases, then the Evaluator Agent (pass/fail/partial + mastery change) and the Code Reviewer Agent (qualitative feedback). On a `passed` result, advances the Curriculum.
- **Auth required:** yes
- **Path params:** `lesson_id` (UUID)
- **Request body:**
```json
{ "code": "def add(a, b):\n    return a + b\n" }
```
- **Response `201`:**
```json
{
  "id": "sub2...",
  "lesson_session_id": "ls1...",
  "status": "passed",
  "test_results": [
    { "input": "add(2, 3)", "expected_output": "5", "actual_output": "5", "passed": true }
  ],
  "reviewer_feedback": "Clean and correct — a straightforward, idiomatic implementation.",
  "mastery_level": 2,
  "advanced": true,
  "submitted_at": "2026-09-16T10:06:00Z"
}
```
- **Error responses:** `400` lesson session already `passed` · `401` · `404` lesson not found or not owned by the caller · `503` the Sandbox or an Agent call failed/timed out

---

### `GET /lessons/{lesson_id}/messages`
- **Description:** Get the Tutor Agent chat history for this lesson.
- **Auth required:** yes
- **Path params:** `lesson_id` (UUID)
- **Response `200`:**
```json
[
  { "id": "m1...", "lesson_session_id": "ls1...", "role": "learner", "content": "Why do I need `return` here?", "created_at": "2026-09-16T10:03:00Z" },
  { "id": "m2...", "lesson_session_id": "ls1...", "role": "tutor_agent", "content": "Without `return`, the function computes the sum but never sends it back to the caller...", "created_at": "2026-09-16T10:03:05Z" }
]
```
- **Error responses:** `401` · `404` lesson not found or not owned by the caller

---

### `POST /lessons/{lesson_id}/messages`
- **Description:** Send a message to the Tutor Agent about this lesson; returns both the stored learner message and the agent's reply.
- **Auth required:** yes
- **Path params:** `lesson_id` (UUID)
- **Request body:**
```json
{ "content": "Why do I need `return` here?" }
```
- **Response `201`:**
```json
{
  "learner_message": { "id": "m1...", "lesson_session_id": "ls1...", "role": "learner", "content": "Why do I need `return` here?", "created_at": "2026-09-16T10:03:00Z" },
  "tutor_reply": { "id": "m2...", "lesson_session_id": "ls1...", "role": "tutor_agent", "content": "Without `return`, the function computes the sum but never sends it back to the caller...", "created_at": "2026-09-16T10:03:05Z" }
}
```
- **Error responses:** `400` empty/whitespace-only content · `401` · `404` lesson not found or not owned by the caller · `503` the Agent call failed/timed out

---

## 5. Data Schemas
<!-- Shared object shapes referenced across endpoints (e.g. Trip, Destination, ItineraryItem, User). Keep field names/types consistent with backend-spec.md's data model. -->

### `TopicStatus` (enum)
`"locked"` | `"current"` | `"completed"`

### `SubmissionStatus` (enum)
`"passed"` | `"failed"` | `"partial"`

### `ExerciseDifficulty` (enum)
`"easy"` | `"medium"` | `"hard"`

### `MessageRole` (enum)
`"learner"` | `"tutor_agent"`

### `AssessmentQuestion`
<!-- Returned by GET /assessment -->
| Field | Type | Required | Notes |
|-------|------|----------|-------|
| id | string (UUID) | yes | |
| topic_id | string (UUID) | yes | which Topic this question diagnoses |
| type | `"mcq"` \| `"code"` | yes | |
| prompt | string | yes | |
| options | string[] \| null | yes | present for `mcq`, `null` for `code` |

### `AssessmentAnswer`
<!-- Sent in POST /assessment/submit -->
| Field | Type | Required | Notes |
|-------|------|----------|-------|
| question_id | string (UUID) | yes | |
| answer | string | yes | selected option text for `mcq`, raw code for `code` |

### `SkillProfileEntry`
| Field | Type | Required | Notes |
|-------|------|----------|-------|
| topic_id | string (UUID) | yes | |
| topic_name | string | yes | |
| mastery_level | integer | yes | 0–5 |

### `CurriculumEntry`
<!-- Returned by GET /curriculum and embedded in POST /assessment/submit -->
| Field | Type | Required | Notes |
|-------|------|----------|-------|
| id | string (UUID) | yes | |
| topic_id | string (UUID) | yes | |
| topic_name | string | yes | |
| order_index | integer | yes | fixed at creation, never re-sequenced |
| status | `TopicStatus` | yes | |
| mastery_level | integer | yes | 0–5, mirrors the matching `SkillProfileEntry` |

### `LessonSession`
<!-- Returned by POST /lessons/next and GET /lessons/{id} -->
| Field | Type | Required | Notes |
|-------|------|----------|-------|
| id | string (UUID) | yes | |
| topic_id | string (UUID) | yes | |
| topic_name | string | yes | |
| exercise_id | string (UUID) | yes | |
| explanation | string | yes | generated once by the Tutor Agent, then cached |
| exercise_prompt | string | yes | |
| starter_code | string | yes | |
| status | `"in_progress"` \| `"failed_pending_retry"` \| `"passed"` | yes | |
| started_at | string (datetime) | yes | |
| completed_at | string (datetime) \| null | yes | set when `status` becomes `passed` |
| latest_submission | `Submission` \| null | no | only present on `GET /lessons/{id}` |

### `Submission`
| Field | Type | Required | Notes |
|-------|------|----------|-------|
| id | string (UUID) | yes | |
| lesson_session_id | string (UUID) | yes | |
| status | `SubmissionStatus` | yes | |
| test_results | `TestResult[]` | yes | |
| reviewer_feedback | string | yes | from the Code Reviewer Agent |
| mastery_level | integer | no | only on the `POST .../submissions` response — the Skill Profile's new value for this Topic |
| advanced | boolean | no | only on the `POST .../submissions` response — whether the Curriculum moved to a new `current` Topic |
| submitted_at | string (datetime) | yes | |

### `TestResult`
| Field | Type | Required | Notes |
|-------|------|----------|-------|
| input | string | yes | how the exercise's test case was invoked |
| expected_output | string | yes | |
| actual_output | string | yes | |
| passed | boolean | yes | |

### `ChatMessage`
| Field | Type | Required | Notes |
|-------|------|----------|-------|
| id | string (UUID) | yes | |
| lesson_session_id | string (UUID) | yes | |
| role | `MessageRole` | yes | |
| content | string | yes | |
| created_at | string (datetime) | yes | |

## 6. Status Code Reference
| Code | Meaning |
|------|---------|
| 200  | OK |
| 201  | Created |
| 400  | Business-rule validation error (e.g. assessment already completed, submitting to a `passed` lesson session, username already taken) |
| 401  | Missing, invalid, or expired token; or bad login credentials |
| 404  | Not found — including a resource that exists but belongs to another user (never `403`, to avoid confirming it exists) |
| 422  | Request-shape validation error (missing/malformed field) |
| 503  | The Sandbox or a Claude API agent call failed or timed out — safe to retry |
| 500  | Unhandled server error |

## 7. Open Questions
_None currently — all resolved:_
- No day-level/date fields anywhere in this API (unlike a scheduling app) — every timestamp is a plain event time (`created_at`, `started_at`, `submitted_at`), so §1's date/time convention only needs the one datetime format.
- `POST /assessment/submit` is a one-time action (`400` if already done) — no retake endpoint in MVP, matching `goal-spec.md`.
- A `503` (not a `4xx`) is used for Sandbox/Agent failures specifically so the frontend can treat it as "retry-worthy" and distinguish it from a genuine failing test result, which is a normal `201` response with `status: "failed"`.
