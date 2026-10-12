import { request } from './client';
import type {
  AssessmentAnswer,
  AssessmentQuestion,
  AssessmentResult,
  AuthResponse,
  ChatExchange,
  ChatMessage,
  Credentials,
  CurriculumEntry,
  LessonSession,
  Submission,
} from '../types/api';

// One function per endpoint in api-contract-spec.md §4.
export const api = {
  login: (creds: Credentials) => request<AuthResponse>('POST', '/auth/login', creds),
  signup: (creds: Credentials) => request<AuthResponse>('POST', '/auth/signup', creds),

  getAssessment: () => request<AssessmentQuestion[]>('GET', '/assessment'),
  submitAssessment: (answers: AssessmentAnswer[]) =>
    request<AssessmentResult>('POST', '/assessment/submit', { answers }),

  getCurriculum: () => request<CurriculumEntry[]>('GET', '/curriculum'),

  nextLesson: () => request<LessonSession>('POST', '/lessons/next'),
  getLesson: (lessonId: string) => request<LessonSession>('GET', `/lessons/${lessonId}`),
  submitCode: (lessonId: string, code: string) =>
    request<Submission>('POST', `/lessons/${lessonId}/submissions`, { code }),

  getMessages: (lessonId: string) => request<ChatMessage[]>('GET', `/lessons/${lessonId}/messages`),
  sendMessage: (lessonId: string, content: string) =>
    request<ChatExchange>('POST', `/lessons/${lessonId}/messages`, { content }),
};
