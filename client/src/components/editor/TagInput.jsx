import { useState } from 'react';

const MAX_TAG_LENGTH = 30;

// "  #JavaScript " -> "javascript", matching how the API stores tag names.
function normalizeTag(value) {
  return value.trim().replace(/^#+/, '').replace(/\s+/g, ' ').toLowerCase().slice(0, MAX_TAG_LENGTH);
}

export default function TagInput({ id, tags, onChange, max, ...inputProps }) {
  const [draft, setDraft] = useState('');
  const isFull = tags.length >= max;

  function addTag(value) {
    const tag = normalizeTag(value);
    if (tag && !tags.includes(tag) && !isFull) onChange([...tags, tag]);
    setDraft('');
  }

  function handleKeyDown(event) {
    if (event.key === 'Enter' || event.key === ',') {
      event.preventDefault();
      addTag(draft);
    } else if (event.key === 'Backspace' && !draft && tags.length) {
      onChange(tags.slice(0, -1));
    }
  }

  return (
    <div className="tag-input">
      {tags.map((tag) => (
        <span key={tag} className="tag-input__chip">
          #{tag}
          <button
            type="button"
            className="tag-input__remove"
            aria-label={`Remove tag ${tag}`}
            onClick={() => onChange(tags.filter((current) => current !== tag))}
          >
            ×
          </button>
        </span>
      ))}
      <input
        {...inputProps}
        id={id}
        className="tag-input__field"
        value={draft}
        placeholder={isFull ? `Up to ${max} tags` : 'Add a tag and press Enter'}
        disabled={isFull}
        onChange={(event) => setDraft(event.target.value)}
        onKeyDown={handleKeyDown}
        onBlur={() => draft && addTag(draft)}
        maxLength={MAX_TAG_LENGTH}
      />
    </div>
  );
}
