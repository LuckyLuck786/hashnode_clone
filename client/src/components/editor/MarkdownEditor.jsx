import { useRef } from 'react';
import MarkdownPreview from './MarkdownPreview.jsx';

const SNIPPETS = [
  { label: 'H2', before: '## ', after: '' },
  { label: 'Bold', before: '**', after: '**' },
  { label: 'Italic', before: '_', after: '_' },
  { label: 'Link', before: '[', after: '](https://)' },
  { label: 'Code', before: '```js\n', after: '\n```' },
  { label: 'List', before: '- ', after: '' },
];

export default function MarkdownEditor({ value, onChange }) {
  const textareaRef = useRef(null);

  // Wraps the selection (or inserts at the caret) and keeps the caret inside the snippet.
  function insert({ before, after }) {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const { selectionStart: start, selectionEnd: end } = textarea;
    const selected = value.slice(start, end);
    onChange(`${value.slice(0, start)}${before}${selected}${after}${value.slice(end)}`);

    const caret = start + before.length + selected.length;
    requestAnimationFrame(() => {
      textarea.focus();
      textarea.setSelectionRange(caret, caret);
    });
  }

  return (
    <div className="editor-grid">
      <section className="editor-pane">
        <div className="editor-pane__head">
          <label htmlFor="post-content">Markdown</label>
          <span>{value.length} characters</span>
        </div>
        <div className="editor-toolbar">
          {SNIPPETS.map((snippet) => (
            <button
              key={snippet.label}
              type="button"
              className="button button--quiet"
              onClick={() => insert(snippet)}
            >
              {snippet.label}
            </button>
          ))}
        </div>
        <div className="editor-pane__body">
          <textarea
            id="post-content"
            className="textarea"
            ref={textareaRef}
            value={value}
            onChange={(event) => onChange(event.target.value)}
            placeholder={'## Getting started\n\nWrite in Markdown. Fence code blocks with ```js.'}
            spellCheck="true"
          />
        </div>
      </section>

      <section className="editor-pane">
        <div className="editor-pane__head">
          <span>Preview</span>
        </div>
        <div className="editor-pane__body">
          <MarkdownPreview content={value} placeholder="Your preview appears here as you type." />
        </div>
      </section>
    </div>
  );
}
