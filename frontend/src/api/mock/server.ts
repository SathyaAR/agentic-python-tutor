// In-browser stand-in for the FastAPI backend. Implements the routes in
// api-contract-spec.md §4 with the business rules from backend-spec.md §4,
// persisting state to localStorage so the static app is fully clickable.
import { ApiError } from '../errors';
import { DEMO_MASTERY, DEMO_USER, EXERCISES, QUESTIONS, TOPICS, type MockExercise } from './data';
import type {
  AssessmentAnswer,
  ChatMessage,
  CurriculumEntry,
  LessonSession,
  Submission,
  TestResult,
  TopicStatus,
} from '../../types/api';

const STORAGE_KEY = 'pymentor.mockdb.v1';
const TOKEN_PREFIX = 'mock-token.';
const EXPIRES_IN = 60 * 60 * 24 * 30;

interface StoredEntry {
  id: string;
  topic_id: string;
  order_index: number;
  status: TopicStatus;
}

interface StoredLesson {
  id: string;
  topic_id: string;
  exercise_id: string;
  explanation: string;
  status: LessonSession['status'];
  started_at: string;
  completed_at: string | null;
  submissions: Submission[];
  messages: ChatMessage[];
}

interface StoredUser {
  password: string;
  mastery: Record<string, number> | null;
  curriculum: StoredEntry[] | null;
  lessons: Record<string, StoredLesson>;
}

interface MockDb {
  users: Record<string, StoredUser>;
}

// ---------- persistence ----------

function seedDb(): MockDb {
  const curriculum = TOPICS.map((t, i): StoredEntry => ({
    id: uid(),
    topic_id: t.id,
    order_index: i,
    status: i < 3 ? 'completed' : i === 3 ? 'current' : 'locked',
  }));
  return {
    users: {
      [DEMO_USER.username]: {
        password: DEMO_USER.password,
        mastery: { ...DEMO_MASTERY },
        curriculum,
        lessons: {},
      },
    },
  };
}

function load(): MockDb {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw) as MockDb;
  } catch {
    /* fall through to a fresh seed */
  }
  const db = seedDb();
  save(db);
  return db;
}

function save(db: MockDb) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(db));
  } catch {
    /* storage unavailable: state lives for this page load only */
  }
}

/** Wipe all mock data back to the seeded demo state. */
export function resetMockDb() {
  save(seedDb());
}

// ---------- helpers ----------

function uid(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) return crypto.randomUUID();
  return 'id-' + Math.random().toString(36).slice(2) + Date.now().toString(36);
}

const now = () => new Date().toISOString().replace(/\.\d{3}Z$/, 'Z');
const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));
const topicById = (id: string) => TOPICS.find((t) => t.id === id)!;
const exerciseById = (id: string) => EXERCISES.find((e) => e.id === id)!;

function authUser(db: MockDb, token: string | null): [string, StoredUser] {
  if (!token?.startsWith(TOKEN_PREFIX)) throw new ApiError(401, 'Not authenticated');
  const username = decodeURIComponent(token.slice(TOKEN_PREFIX.length));
  const user = db.users[username];
  if (!user) throw new ApiError(401, 'Invalid token');
  return [username, user];
}

function toCurriculum(user: StoredUser): CurriculumEntry[] {
  return (user.curriculum ?? []).map((e) => ({
    ...e,
    topic_name: topicById(e.topic_id).name,
    mastery_level: user.mastery?.[e.topic_id] ?? 0,
  }));
}

function toLesson(lesson: StoredLesson, withLatest: boolean): LessonSession {
  const ex = exerciseById(lesson.exercise_id);
  const out: LessonSession = {
    id: lesson.id,
    topic_id: lesson.topic_id,
    topic_name: topicById(lesson.topic_id).name,
    exercise_id: lesson.exercise_id,
    explanation: lesson.explanation,
    exercise_prompt: ex.prompt,
    starter_code: ex.starter_code,
    status: lesson.status,
    started_at: lesson.started_at,
    completed_at: lesson.completed_at,
  };
  if (withLatest) {
    const latest = lesson.submissions[lesson.submissions.length - 1] ?? null;
    out.latest_submission = latest && { ...latest, mastery_level: undefined, advanced: undefined };
  }
  return out;
}

function ownedLesson(user: StoredUser, id: string): StoredLesson {
  const lesson = user.lessons[id];
  if (!lesson) throw new ApiError(404, 'lesson not found');
  return lesson;
}

function validateCredentials(body: unknown): { username: string; password: string } {
  const b = (body ?? {}) as Record<string, unknown>;
  const missing = (['username', 'password'] as const).filter(
    (k) => typeof b[k] !== 'string' || !(b[k] as string).trim(),
  );
  if (missing.length) {
    throw new ApiError(
      422,
      missing.map((k) => ({ loc: ['body', k], msg: `${k} is required`, type: 'value_error.missing' })),
    );
  }
  return { username: (b.username as string).trim(), password: b.password as string };
}

// ---------- "agents" (canned, deterministic) ----------

function tutorExplanation(topicId: string, mastery: number): string {
  const t = topicById(topicId);
  const lead =
    mastery <= 1
      ? "Let's start from the basics."
      : mastery <= 3
        ? 'You have some of this already, so here is the key idea.'
        : 'Quick refresher before a tougher exercise.';
  return `${lead} ${t.explanation}`;
}

function tutorReply(topicId: string, question: string): string {
  const t = topicById(topicId);
  const q = question.toLowerCase();
  if (q.includes('return')) {
    return 'Without `return`, the function computes its result but never sends it back to the caller — Python returns `None` instead. Put `return <value>` on the last line of the function.';
  }
  if (/hint|stuck|help|how/.test(q)) return `Here's a nudge: ${t.hint}`;
  if (/error|wrong|fail/.test(q)) {
    return 'Compare the "expected" and "got" columns in your test results — the gap usually points straight at the bug. If you see `None`, you are probably missing a `return`.';
  }
  return `Good question! In the context of ${t.name}: ${t.explanation.split('. ')[0]}. (This is a mock tutor reply — the real Tutor Agent will answer in full once the backend is connected.)`;
}

function runTests(ex: MockExercise, code: string): TestResult[] {
  return ex.test_cases.map((tc) => {
    const passed = tc.check(code);
    const actual = passed ? tc.expected_output : returnsSomething(code) ? '<different output>' : 'None';
    return { input: tc.input, expected_output: tc.expected_output, actual_output: actual, passed };
  });
}

const returnsSomething = (code: string) => /\breturn\s+\S/.test(code);

function reviewerFeedback(code: string, status: Submission['status']): string {
  const notes: string[] = [];
  if (status === 'passed') notes.push('Clean and correct — a straightforward, idiomatic implementation.');
  else if (status === 'partial') notes.push('Close — some cases pass, but not all. Check the failing inputs below.');
  else if (!returnsSomething(code))
    notes.push("You're missing a `return` statement — the function currently falls through without sending back a value.");
  else notes.push("The logic doesn't produce the expected output yet. Walk through one failing input by hand.");
  if (/\bprint\(/.test(code)) notes.push('Tip: `print` shows a value but does not return it — tests check the return value.');
  if (code.split('\n').some((l) => l.length > 79)) notes.push('Style: some lines exceed 79 characters (PEP 8).');
  return notes.join(' ');
}

// ---------- router ----------

export async function mockRequest<T>(
  method: string,
  path: string,
  body: unknown,
  token: string | null,
): Promise<T> {
  const db = load();
  const isAgentCall =
    (method === 'POST' && /^\/lessons\/(next|[^/]+\/(submissions|messages))$/.test(path)) ||
    path === '/assessment/submit';
  await delay(isAgentCall ? 900 + Math.random() * 700 : 250);

  const result = route(db, method, path, body, token);
  save(db);
  return result as T;
}

function route(db: MockDb, method: string, path: string, body: unknown, token: string | null): unknown {
  // --- auth ---
  if (method === 'POST' && path === '/auth/login') {
    const { username, password } = validateCredentials(body);
    const user = db.users[username];
    if (!user || user.password !== password) throw new ApiError(401, 'Invalid username or password');
    return authResponse(username);
  }
  if (method === 'POST' && path === '/auth/signup') {
    const { username, password } = validateCredentials(body);
    if (db.users[username]) throw new ApiError(400, 'Username already taken');
    db.users[username] = { password, mastery: null, curriculum: null, lessons: {} };
    return authResponse(username);
  }

  const [, user] = authUser(db, token);

  // --- assessment ---
  if (method === 'GET' && path === '/assessment') {
    return QUESTIONS.map(({ isCorrect: _ignored, ...q }) => q);
  }
  if (method === 'POST' && path === '/assessment/submit') {
    if (user.curriculum) throw new ApiError(400, 'assessment already completed');
    const answers = ((body as { answers?: AssessmentAnswer[] })?.answers ?? []) as AssessmentAnswer[];
    const mastery: Record<string, number> = Object.fromEntries(TOPICS.map((t) => [t.id, 0]));
    for (const a of answers) {
      const q = QUESTIONS.find((x) => x.id === a.question_id);
      if (q && q.isCorrect(a.answer)) {
        mastery[q.topic_id] = Math.min(5, mastery[q.topic_id] + (q.type === 'code' ? 2 : 1));
      }
    }
    user.mastery = mastery;
    // "Curriculum Planner": weakest topics first, catalog order breaks ties.
    const ordered = [...TOPICS].sort((a, b) => mastery[a.id] - mastery[b.id] || TOPICS.indexOf(a) - TOPICS.indexOf(b));
    user.curriculum = ordered.map((t, i) => ({
      id: uid(),
      topic_id: t.id,
      order_index: i,
      status: i === 0 ? 'current' : 'locked',
    }));
    return {
      skill_profile: TOPICS.map((t) => ({ topic_id: t.id, topic_name: t.name, mastery_level: mastery[t.id] })),
      curriculum: toCurriculum(user),
    };
  }

  // --- curriculum ---
  if (method === 'GET' && path === '/curriculum') {
    if (!user.curriculum) throw new ApiError(404, 'assessment not completed');
    return toCurriculum(user);
  }

  // --- lessons ---
  if (method === 'POST' && path === '/lessons/next') {
    const current = user.curriculum?.find((e) => e.status === 'current');
    if (!current) throw new ApiError(400, 'no current curriculum entry');
    const existing = Object.values(user.lessons).find(
      (l) => l.topic_id === current.topic_id && l.status !== 'passed',
    );
    if (existing) return toLesson(existing, false);
    const ex = EXERCISES.find((e) => e.topic_id === current.topic_id)!;
    const lesson: StoredLesson = {
      id: uid(),
      topic_id: current.topic_id,
      exercise_id: ex.id,
      explanation: tutorExplanation(current.topic_id, user.mastery?.[current.topic_id] ?? 0),
      status: 'in_progress',
      started_at: now(),
      completed_at: null,
      submissions: [],
      messages: [],
    };
    user.lessons[lesson.id] = lesson;
    return toLesson(lesson, false);
  }

  const lessonMatch = path.match(/^\/lessons\/([^/]+)(?:\/(submissions|messages))?$/);
  if (lessonMatch) {
    const [, lessonId, sub] = lessonMatch;
    const lesson = ownedLesson(user, lessonId);

    if (method === 'GET' && !sub) return toLesson(lesson, true);

    if (method === 'POST' && sub === 'submissions') {
      if (lesson.status === 'passed') throw new ApiError(400, 'lesson session already passed');
      const code = (body as { code?: unknown })?.code;
      if (typeof code !== 'string') {
        throw new ApiError(422, [{ loc: ['body', 'code'], msg: 'field required', type: 'value_error.missing' }]);
      }
      const results = runTests(exerciseById(lesson.exercise_id), code);
      const passedCount = results.filter((r) => r.passed).length;
      const status: Submission['status'] =
        passedCount === results.length ? 'passed' : passedCount === 0 ? 'failed' : 'partial';

      // Evaluator mastery rule: first-try pass +2, retry pass +1, otherwise -1 (clamped 0–5).
      const firstAttempt = lesson.submissions.length === 0;
      const mastery = user.mastery!;
      const delta = status === 'passed' ? (firstAttempt ? 2 : 1) : -1;
      mastery[lesson.topic_id] = Math.max(0, Math.min(5, (mastery[lesson.topic_id] ?? 0) + delta));

      let advanced = false;
      if (status === 'passed') {
        lesson.status = 'passed';
        lesson.completed_at = now();
        const entries = user.curriculum!;
        const idx = entries.findIndex((e) => e.topic_id === lesson.topic_id);
        entries[idx].status = 'completed';
        const next = entries.find((e) => e.order_index === entries[idx].order_index + 1);
        if (next) {
          next.status = 'current';
          advanced = true;
        }
      } else {
        lesson.status = 'failed_pending_retry';
      }

      const submission: Submission = {
        id: uid(),
        lesson_session_id: lesson.id,
        status,
        test_results: results,
        reviewer_feedback: reviewerFeedback(code, status),
        mastery_level: mastery[lesson.topic_id],
        advanced,
        submitted_at: now(),
      };
      lesson.submissions.push(submission);
      return submission;
    }

    if (method === 'GET' && sub === 'messages') return lesson.messages;

    if (method === 'POST' && sub === 'messages') {
      const content = String((body as { content?: unknown })?.content ?? '').trim();
      if (!content) throw new ApiError(400, 'message content must not be empty');
      const learner_message: ChatMessage = {
        id: uid(),
        lesson_session_id: lesson.id,
        role: 'learner',
        content,
        created_at: now(),
      };
      const tutor_reply: ChatMessage = {
        id: uid(),
        lesson_session_id: lesson.id,
        role: 'tutor_agent',
        content: tutorReply(lesson.topic_id, content),
        created_at: now(),
      };
      lesson.messages.push(learner_message, tutor_reply);
      return { learner_message, tutor_reply };
    }
  }

  throw new ApiError(404, `No mock route for ${method} ${path}`);
}

function authResponse(username: string) {
  return {
    access_token: TOKEN_PREFIX + encodeURIComponent(username),
    token_type: 'bearer',
    expires_in: EXPIRES_IN,
    username,
  };
}
