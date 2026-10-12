import CodeMirror, { EditorView } from '@uiw/react-codemirror';
import { python } from '@codemirror/lang-python';

const extensions = [
  python(),
  EditorView.theme({
    '&': { fontSize: '14px' },
    '.cm-content, .cm-gutters': { fontFamily: '"JetBrains Mono", monospace' },
  }),
];

interface Props {
  value: string;
  onChange: (value: string) => void;
  minHeight?: string;
  readOnly?: boolean;
  ariaLabel?: string;
}

/** CodeMirror 6 Python editor (frontend-spec.md §1, §4). No in-browser execution. */
export function CodeEditor({ value, onChange, minHeight = '220px', readOnly = false, ariaLabel = 'Code editor' }: Props) {
  return (
    <div className="overflow-hidden rounded-md border border-border" aria-label={ariaLabel}>
      <CodeMirror
        value={value}
        onChange={onChange}
        extensions={extensions}
        minHeight={minHeight}
        editable={!readOnly}
        basicSetup={{ foldGutter: false, highlightActiveLineGutter: true }}
      />
    </div>
  );
}
