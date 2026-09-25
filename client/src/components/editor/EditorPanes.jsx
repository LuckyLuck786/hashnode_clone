import { useState } from 'react';
import MarkdownView from '../post/MarkdownView.jsx';

const PANES = [
  { value: 'write', label: 'Write' },
  { value: 'preview', label: 'Preview' },
];

// Markdown textarea and live preview. Side by side on wide screens, tabs on phones.
export default function EditorPanes({ content, onChange }) {
  const [activePane, setActivePane] = useState('write');

  return (
    <div>
      <div className="tabs editor__pane-tabs" role="tablist" aria-label="Editor view">
        {PANES.map(({ value, label }) => (
          <button
            key={value}
            type="button"
            role="tab"
            className="tab"
            aria-selected={activePane === value}
            onClick={() => setActivePane(value)}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="editor__panes">
        <div className="editor__pane" data-active={activePane === 'write'}>
          <label htmlFor="post-content" className="editor__pane-label">
            Markdown
          </label>
          <textarea
            id="post-content"
            className="textarea editor__content"
            value={content}
            onChange={(event) => onChange(event.target.value)}
            placeholder={'Write your post in Markdown.\n\n## A heading\n\nSome text with `code`.'}
            required
          />
        </div>

        <div className="editor__pane" data-active={activePane === 'preview'}>
          <p className="editor__pane-label">Preview</p>
          <div className="editor__preview">
            {content.trim() ? (
              <MarkdownView source={content} />
            ) : (
              <p className="editor__preview-empty">Nothing to preview yet.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
