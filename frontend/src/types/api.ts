// Mirrors docs/api-contract-spec.md §4–5. snake_case on purpose: no alias layer.

export type TopicStatus = 'locked' | 'current' | 'completed';
export type SubmissionStatus = 'passed' | 'failed' | 'partial';
export type LessonStatus = 'in_progress' | 'failed_pending_retry' | 'passed';
export type MessageRole = 'learner' | 'tutor_agent';

export interface Credentials {
  username: string;
  password: string;
}

export interface AuthResponse {
  access_token: string;
  token_type: 'bearer';
  expires_in: number;
  username: string;
}

export interface AssessmentQuestion {
  id: string;
  topic_id: string;
  type: 'mcq' | 'code';
  prompt: string;
  options: string[] | null;
}

export interface AssessmentAnswer {
  question_id: string;
  answer: string;
}

export interface SkillProfileEntry {
  topic_id: string;
  topic_name: string;
  mastery_level: number;
}

export interface CurriculumEntry {
  id: string;
  topic_id: string;
  topic_name: string;
  order_index: number;
  status: TopicStatus;
  mastery_level: number;
}

export interface AssessmentResult {
  skill_profile: SkillProfileEntry[];
  curriculum: CurriculumEntry[];
}

export interface TestResult {
  input: string;
  expected_output: string;
  actual_output: string;
  passed: boolean;
}

export interface Submission {
  id: string;
  lesson_session_id: string;
  status: SubmissionStatus;
  test_results: TestResult[];
  reviewer_feedback: string;
  mastery_level?: number;
  advanced?: boolean;
  submitted_at: string;
}

export interface LessonSession {
  id: string;
  topic_id: string;
  topic_name: string;
  exercise_id: string;
  explanation: string;
  exercise_prompt: string;
  starter_code: string;
  status: LessonStatus;
  started_at: string;
  completed_at: string | null;
  latest_submission?: Submission | null;
}

export interface ChatMessage {
  id: string;
  lesson_session_id: string;
  role: MessageRole;
  content: string;
  created_at: string;
}

export interface ChatExchange {
  learner_message: ChatMessage;
  tutor_reply: ChatMessage;
}
