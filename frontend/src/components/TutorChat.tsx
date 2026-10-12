import { useEffect, useRef, useState, type FormEvent } from 'react';
import { errorMessage } from '../api/client';
import { useMessages, useSendMessage } from '../api/hooks';
import { ErrorMessage, LoadingLabel } from './Feedback';
import { renderInlineCode } from './InlineCode';

/** Lesson-scoped chat with the Tutor Agent (frontend-spec.md §4). */
export function TutorChat({ lessonId }: { lessonId: string }) {
  const { data: messages, isLoading, error, refetch } = useMessages(lessonId);
  const send = useSendMessage(lessonId);
  const [draft, setDraft] = useState('');
  const [pending, setPending] = useState<string | null>(null);
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages, pending]);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const content = draft.trim();
    if (!content || send.isPending) return;
    setPending(content); // show the learner's message immediately (frontend-spec.md §6)
    setDraft('');
    send.mutate(content, {
      onSettled: () => setPending(null),
      onError: () => setDraft(content),
    });
  };

  return (
    <aside className="card flex h-[28rem] flex-col lg:h-[calc(100vh-11rem)] lg:max-h-[44rem]">
      <h2 className="border-b border-border px-4 py-3 font-semibold">Ask the Tutor</h2>
      <div ref={listRef} className="flex-1 space-y-3 overflow-y-auto px-4 py-3">
        {isLoading && <LoadingLabel label="Loading conversation…" />}
        {error && <ErrorMessage message={errorMessage(error)} onRetry={() => refetch()} />}
        {messages && messages.length === 0 && !pending && (
          <p className="pt-6 text-center text-sm text-text-muted">Ask a question about this lesson.</p>
        )}
        {messages?.map((m) => (
          <Bubble key={m.id} fromLearner={m.role === 'learner'} text={m.content} />
        ))}
        {pending && (
          <>
            <Bubble fromLearner text={pending} />
            <LoadingLabel label="Thinking…" />
          </>
        )}
        {send.error && <ErrorMessage message={errorMessage(send.error)} />}
      </div>
      <form onSubmit={handleSubmit} className="flex gap-2 border-t border-border p-3">
        <label htmlFor="tutor-input" className="sr-only">Ask a question</label>
        <input
          id="tutor-input"
          className="input"
          placeholder="Ask a question…"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
        />
        <button type="submit" className="btn-primary px-3" disabled={!draft.trim() || send.isPending}>
          Send
        </button>
      </form>
    </aside>
  );
}

function Bubble({ fromLearner, text }: { fromLearner: boolean; text: string }) {
  return (
    <div className={`flex ${fromLearner ? 'justify-end' : 'justify-start'}`}>
      <p
        className={`max-w-[85%] whitespace-pre-wrap rounded-lg px-3 py-2 text-sm leading-relaxed ${
          fromLearner ? 'bg-primary text-white [&_code]:bg-white/20 [&_code]:text-white' : 'bg-background text-text'
        }`}
      >
        {renderInlineCode(text)}
      </p>
    </div>
  );
}
