import { useEffect, useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import api, { readErrorMessage } from '../api/axios.js';
import MarkdownEditor from '../components/editor/MarkdownEditor.jsx';
import ErrorMessage from '../components/ErrorMessage.jsx';
import LoadingSpinner from '../components/LoadingSpinner.jsx';
import { PostListSkeleton } from '../components/Skeleton.jsx';
import useDocumentTitle from '../hooks/useDocumentTitle.js';
import { parseTagInput, tagsToInput } from '../utils/format.js';

const EMPTY_POST = { title: '', content: '', coverImage: '', tags: '' };
const MAX_TAGS = 5;

export default function PostEditor() {
  const { id } = useParams();
  const isNew = !id;
  const navigate = useNavigate();

  const [form, setForm] = useState(EMPTY_POST);
  const [status, setStatus] = useState('draft');
  const [loading, setLoading] = useState(!isNew);
  const [loadError, setLoadError] = useState(null);
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(null);

  useDocumentTitle(isNew ? 'New post' : 'Edit post');

  useEffect(() => {
    if (isNew) return;

    const controller = new AbortController();
    setLoading(true);
    api
      .get(`/posts/${id}/edit`, { signal: controller.signal })
      .then(({ data }) => {
        setForm({
          title: data.post.title,
          content: data.post.content,
          coverImage: data.post.coverImage ?? '',
          tags: tagsToInput(data.post.tags),
        });
        setStatus(data.post.status);
        setLoading(false);
      })
      .catch((requestError) => {
        if (controller.signal.aborted) return;
        setLoadError(readErrorMessage(requestError, 'Could not load that post.'));
        setLoading(false);
      });

    return () => controller.abort();
  }, [id, isNew]);

  function update(field) {
    return (event) => setForm((current) => ({ ...current, [field]: event.target.value }));
  }

  async function save(nextStatus) {
    const tags = parseTagInput(form.tags);
    if (!form.title.trim()) return setError('Give the post a title before saving.');
    if (!form.content.trim()) return setError('The post body cannot be empty.');
    if (tags.length > MAX_TAGS) return setError(`Use at most ${MAX_TAGS} tags.`);

    setBusy(nextStatus);
    setError(null);

    const payload = {
      title: form.title,
      content: form.content,
      coverImage: form.coverImage.trim(),
      status: nextStatus,
      tags,
    };

    try {
      const { data } = isNew
        ? await api.post('/posts', payload)
        : await api.put(`/posts/${id}`, payload);

      navigate(nextStatus === 'published' ? `/post/${data.post.slug}` : '/dashboard');
    } catch (saveError) {
      setError(readErrorMessage(saveError, 'Could not save the post.'));
      setBusy(null);
    }
  }

  if (loading) {
    return (
      <main className="app-main" id="main">
        <PostListSkeleton count={2} />
      </main>
    );
  }

  if (loadError) {
    return (
      <main className="app-main" id="main">
        <ErrorMessage>{loadError}</ErrorMessage>
        <p style={{ marginTop: '1rem' }}>
          <Link to="/dashboard">Back to your dashboard</Link>
        </p>
      </main>
    );
  }

  return (
    <main className="app-main" id="main">
      <div className="page-head">
        <div className="page-head__row">
          <div>
            <h1 className="page-head__title">{isNew ? 'New post' : 'Edit post'}</h1>
            <p className="page-head__meta">
              {status === 'published'
                ? 'This post is live. Saving updates it immediately.'
                : 'Saved as a draft until you publish it.'}
            </p>
          </div>
          <div className="button-row">
            <button
              type="button"
              className="button"
              onClick={() => save('draft')}
              disabled={busy !== null}
            >
              {busy === 'draft' ? <LoadingSpinner label="Saving" /> : null}
              Save draft
            </button>
            <button
              type="button"
              className="button button--primary"
              onClick={() => save('published')}
              disabled={busy !== null}
            >
              {busy === 'published' ? <LoadingSpinner label="Publishing" /> : null}
              {status === 'published' ? 'Update post' : 'Publish'}
            </button>
          </div>
        </div>
      </div>

      {error ? (
        <div style={{ marginBottom: '1rem' }}>
          <ErrorMessage>{error}</ErrorMessage>
        </div>
      ) : null}

      <div className="field">
        <label className="field__label" htmlFor="post-title">
          Title
        </label>
        <input
          id="post-title"
          className="input"
          maxLength={150}
          value={form.title}
          onChange={update('title')}
          placeholder="What are you writing about?"
        />
      </div>

      <div className="editor-sidebar">
        <div>
          <label className="field__label" htmlFor="post-tags">
            Tags
          </label>
          <input
            id="post-tags"
            className="input"
            value={form.tags}
            onChange={update('tags')}
            placeholder="javascript, mongodb, career"
          />
          <p className="field__hint">
            Comma separated, up to {MAX_TAGS}. New tags are created automatically.
          </p>
        </div>

        <div>
          <label className="field__label" htmlFor="post-cover">
            Cover image URL
          </label>
          <input
            id="post-cover"
            className="input"
            value={form.coverImage}
            onChange={update('coverImage')}
            placeholder="https://"
          />
          <p className="field__hint">Optional.</p>
        </div>
      </div>

      <MarkdownEditor
        value={form.content}
        onChange={(content) => setForm((current) => ({ ...current, content }))}
      />
    </main>
  );
}
