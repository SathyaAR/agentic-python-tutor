import type { AssessmentQuestion as Question } from '../types/api';
import { CodeEditor } from './CodeEditor';
import { renderInlineCode } from './InlineCode';

interface Props {
  question: Question;
  index: number;
  answer: string;
  onChange: (answer: string) => void;
}

/** One MCQ or short-code question (frontend-spec.md §4). */
export function AssessmentQuestion({ question, index, answer, onChange }: Props) {
  const name = `q-${question.id}`;
  return (
    <fieldset className="card p-5">
      <legend className="sr-only">Question {index + 1}</legend>
      <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-text-muted">
        Question {index + 1} · {question.type === 'mcq' ? 'Multiple choice' : 'Short code'}
      </p>
      <p className="mb-4 font-medium">{renderInlineCode(question.prompt)}</p>
      {question.type === 'mcq' && question.options ? (
        <div className="space-y-2">
          {question.options.map((opt) => (
            <label
              key={opt}
              className={`flex cursor-pointer items-center gap-3 rounded-md border px-3 py-2 text-sm transition-colors ${
                answer === opt ? 'border-primary bg-primary/5' : 'border-border hover:bg-background'
              }`}
            >
              <input
                type="radio"
                name={name}
                value={opt}
                checked={answer === opt}
                onChange={() => onChange(opt)}
                className="accent-primary"
              />
              <span className="font-mono">{opt}</span>
            </label>
          ))}
        </div>
      ) : (
        <CodeEditor value={answer} onChange={onChange} minHeight="120px" ariaLabel={`Answer for question ${index + 1}`} />
      )}
    </fieldset>
  );
}
