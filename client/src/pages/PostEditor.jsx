import { useCallback, useEffect, useState } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import { createPost, fetchPostForEdit, updatePost } from '../api/posts.js';
import { getErrorMessage } from '../api/axios.js';
import useResource from '../hooks/useResource.js';
import useDocumentTitle from '../hooks/useDocumentTitle.js';
import EditorPanes from '../components/editor/EditorPanes.jsx';
import TagInput from '../components/editor/TagInput.jsx';
import Field from '../components/ui/Field.jsx';
import Skeleton from '../components/ui/Skeleton.jsx';
import StateMessage, { ErrorMessage } from '../components/ui/StateMessage.jsx';
import { MAX_TAGS_PER_POST } from '../config.js';

const EMPTY_POST = { title: '', coverImage: '', tags: [], content: '', status: 'draft' };

function toFormValues(post) {
  return {
    title: post.title,
    coverImage: post.coverImage ?? '',
    tags: post.tags.map((tag) => tag.name),
    content: post.content,
    status: post.status,
  };
}

// One page for both /write and /edit/:id. Editing waits for the saved post before rendering
// the form so the fields start with the right values.
export default function PostEditor() {
  const { id } = useParams();
  const load = useCallback(() => (id ? fetchPostForEdit(id) : Promise.resolve(null)), [id]);
  const { data: post, status, error, retry } = useResource(load);
  useDocumentTitle(id ? 'Edit post' : 'New post');

  if (status === 'loading') return <EditorSkeleton />;
  if (status === 'error' && [403, 404].includes(error.status)) {
    return (
      <StateMessage
        title="You cannot edit this post"
        action={
          <Link to="/dashboard" className="btn">
            Go to your dashboard
          </Link>
        }
      >
        It does not exist, or it belongs to someone else.
      </StateMessage>
    );
  }
  if (status === 'error') return <ErrorMessage message={error.message} onRetry={retry} />;

  return <EditorForm key={id ?? 'new'} post={post} />;
}

function EditorForm({ post }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [savedValues, setSavedValues] = useState(() => (post ? toFormValues(post) : EMPTY_POST));
  const [values, setValues] = useState(savedValues);
  const [savingAs, setSavingAs] = useState(null); // 'draft' | 'published' while a request runs
  const [error, setError] = useState('');
  const [notice, setNotice] = useState(location.state?.notice ?? '');

  const isDirty = JSON.stringify(values) !== JSON.stringify(savedValues);
  const isPublished = savedValues.status === 'published';

  // Warn before closing the tab with unsaved work.
  useEffect(() => {
    if (!isDirty) return undefined;
    const warn = (event) => event.preventDefault();
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, [isDirty]);

  function setField(field, value) {
    setValues((current) => ({ ...current, [field]: value }));
    setNotice('');
  }

  async function save(nextStatus) {
    if (!values.title.trim() || !values.content.trim()) {
      setError('Add a title and some content before saving.');
      return;
    }

    setSavingAs(nextStatus);
    setError('');
    setNotice('');
    try {
      const payload = { ...values, title: values.title.trim(), status: nextStatus };
      const saved = post ? await updatePost(post._id, payload) : await createPost(payload);

      if (nextStatus === 'published') {
        navigate(`/post/${saved.slug}`);
        return;
      }

      if (!post) {
        // A new draft now has an id, so continue editing it at its own URL.
        navigate(`/edit/${saved._id}`, { replace: true, state: { notice: 'Draft saved.' } });
        return;
      }

      const nextValues = toFormValues(saved);
      setSavedValues(nextValues);
      setValues(nextValues);
      setNotice('Draft saved.');
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSavingAs(null);
    }
  }

  function handleSubmit(event) {
    event.preventDefault();
    save('published');
  }

  const isSaving = savingAs !== null;

  return (
    <form className="editor" onSubmit={handleSubmit}>
      <div className="editor__toolbar">
        <p className="meta">
          <span className={`status-label status-label--${savedValues.status}`}>
            {post ? savedValues.status : 'new post'}
          </span>
          {isDirty && <span>Unsaved changes</span>}
          {notice && <span className="form-success">{notice}</span>}
        </p>
        <div className="editor__actions">
          <button type="button" className="btn" onClick={() => save('draft')} disabled={isSaving}>
            {savingAs === 'draft' ? 'Saving...' : isPublished ? 'Unpublish' : 'Save draft'}
          </button>
          <button type="submit" className="btn btn--primary" disabled={isSaving}>
            {savingAs === 'published' ? 'Publishing...' : isPublished ? 'Update post' : 'Publish'}
          </button>
        </div>
      </div>

      {error && (
        <p className="form-error" role="alert">
          {error}
        </p>
      )}

      <label htmlFor="post-title" className="visually-hidden">
        Title
      </label>
      <textarea
        id="post-title"
        className="editor__title"
        rows={1}
        maxLength={150}
        placeholder="Post title"
        value={values.title}
        onChange={(event) => setField('title', event.target.value.replace(/\n/g, ' '))}
        required
      />

      <div className="editor__meta">
        <Field label="Cover image URL" hint="Optional. A direct link to a JPG, PNG or WebP image.">
          {(props) => (
            <input
              {...props}
              type="url"
              className="input"
              placeholder="https://"
              value={values.coverImage}
              onChange={(event) => setField('coverImage', event.target.value)}
            />
          )}
        </Field>
        <Field
          label="Tags"
          hint={`Up to ${MAX_TAGS_PER_POST}. Press Enter or comma after each one.`}
        >
          {(props) => (
            <TagInput
              {...props}
              tags={values.tags}
              max={MAX_TAGS_PER_POST}
              onChange={(tags) => setField('tags', tags)}
            />
          )}
        </Field>
      </div>

      <EditorPanes content={values.content} onChange={(content) => setField('content', content)} />
    </form>
  );
}

function EditorSkeleton() {
  return (
    <div className="editor" aria-busy="true" aria-label="Loading editor">
      <Skeleton width={220} height={32} />
      <Skeleton width="70%" height={40} />
      <Skeleton height={40} />
      <Skeleton height={360} />
    </div>
  );
}
