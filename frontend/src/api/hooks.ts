import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from './endpoints';
import type { ChatMessage, Submission } from '../types/api';

// Query keys and invalidation rules: frontend-spec.md §5.
export const queryKeys = {
  curriculum: ['curriculum'] as const,
  assessment: ['assessment'] as const,
  lesson: (id: string) => ['lessons', id] as const,
  messages: (id: string) => ['lessons', id, 'messages'] as const,
};

export function useCurriculum() {
  return useQuery({ queryKey: queryKeys.curriculum, queryFn: api.getCurriculum });
}

export function useAssessment() {
  return useQuery({ queryKey: queryKeys.assessment, queryFn: api.getAssessment });
}

export function useSubmitAssessment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: api.submitAssessment,
    onSuccess: (result) => qc.setQueryData(queryKeys.curriculum, result.curriculum),
  });
}

export function useNextLesson() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: api.nextLesson,
    onSuccess: (lesson) => qc.setQueryData(queryKeys.lesson(lesson.id), lesson),
  });
}

export function useLesson(lessonId: string) {
  return useQuery({ queryKey: queryKeys.lesson(lessonId), queryFn: () => api.getLesson(lessonId) });
}

export function useSubmitCode(lessonId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (code: string) => api.submitCode(lessonId, code),
    onSuccess: (submission: Submission) => {
      qc.invalidateQueries({ queryKey: queryKeys.lesson(lessonId), exact: true });
      // Only a pass changes the curriculum; skip the refetch otherwise.
      if (submission.status === 'passed') {
        qc.invalidateQueries({ queryKey: queryKeys.curriculum });
      }
    },
  });
}

export function useMessages(lessonId: string) {
  return useQuery({
    queryKey: queryKeys.messages(lessonId),
    queryFn: () => api.getMessages(lessonId),
  });
}

export function useSendMessage(lessonId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (content: string) => api.sendMessage(lessonId, content),
    onSuccess: ({ learner_message, tutor_reply }) => {
      qc.setQueryData<ChatMessage[]>(queryKeys.messages(lessonId), (prev = []) => [
        ...prev,
        learner_message,
        tutor_reply,
      ]);
    },
  });
}
