import { useCallback, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import api from '../api/axios.js';
import Avatar from '../components/Avatar.jsx';
import TagPill from '../components/post/TagPill.jsx';
import MarkdownPreview from '../components/editor/MarkdownPreview.jsx';
import CommentThread from '../components/CommentThread.jsx';
import ReactionBar from '../components/ReactionBar.jsx';
import ErrorMessage from '../components/ErrorMessage.jsx';
import { ArticleSkeleton } from '../components/Skeleton.jsx';
import useRequest from '../hooks/useRequest.js';
import useDocumentTitle from '../hooks/useDocumentTitle.js';
import useAuth from '../hooks/useAuth.js';
import { formatDate } from '../utils/format.js';

export default function PostDetail() {
  const { slug } = useParams();
  const { user } = useAuth();

  const { data, loading, error, reload } = useRequest(
    (signal) =>
      api.get(`/posts/${slug}`, { signal }).then((res) => ({
        post: res.data.post,
        liked: res.data.liked,
      })),
    [slug],
  );

  const [thread, setThread] = useState(null);

  useDocumentTitle(data?.post.title);

  const postId = data?.post?._id;
  // A draft has no public discussion, so its comments are never fetched.
  const isPublished = data?.post?.status === 'published';

  // Comments load separately from the post so a slow discussion never delays the article.
  const loadThread = useCallback(async () => {
    try {
      const res = await api.get(`/posts/${postId}/comments`);
      setThread(res.data);
    } catch {
      setThread(null); // A failed discussion load leaves the post itself readable.
    }
  }, [postId]);

  useEffect(() => {
    if (!postId || !isPublished) return;
    loadThread();
  }, [postId, isPublished, loadThread]);

  if (loading) {
    return (
      <main className="app-main" id="main">
        <ArticleSkeleton />
      </main>
    );
  }

  if (error) {
    return (
      <main className="app-main" id="main">
        <ErrorMessage onRetry={reload}>{error}</ErrorMessage>
        <p style={{ marginTop: '1rem' }}>
          <Link to="/">Back to the feed</Link>
        </p>
      </main>
    );
  }

  const post = data.post;
  const isOwner = user && post.author?._id === user._id;

  return (
    <main className="app-main" id="main">
      <article className="article">
        {post.status === 'draft' ? (
          <p className="draft-banner">
            This is a draft. Only you can see it, and it stays out of the feed, tag pages and your
            public profile until you publish it.
          </p>
        ) : null}

        {post.coverImage ? <img className="article__cover" src={post.coverImage} alt="" /> : null}

        <h1 className="article__title">{post.title}</h1>

        <div className="article__byline">
          {post.author ? (
            <Link to={`/profile/${post.author._id}`}>
              <Avatar user={post.author} /> {post.author.name}
            </Link>
          ) : null}
          <span className="dot-sep">{formatDate(post.publishedAt || post.createdAt)}</span>
          <span className="dot-sep">{post.readingTime} min read</span>
          {isOwner ? (
            <Link className="dot-sep" to={`/editor/${post._id}`}>
              Edit this post
            </Link>
          ) : null}
        </div>

        <div style={{ marginTop: '2rem' }}>
          <MarkdownPreview content={post.content} />
        </div>

        {post.tags?.length ? (
          <div className="article__tags tag-list">
            {post.tags.map((tag) => (
              <TagPill key={tag._id} tag={tag} />
            ))}
          </div>
        ) : null}

        <div className="article__actions">
          <ReactionBar
            postId={post._id}
            liked={data.liked}
            likeCount={post.likeCount ?? 0}
          />
        </div>

        {isPublished ? (
          <CommentThread
            postId={post._id}
            postAuthorId={post.author?._id}
            thread={thread}
            onChange={loadThread}
          />
        ) : null}

        {post.author?.bio ? (
          <p className="page-head__meta" style={{ marginTop: '1.5rem' }}>
            {post.author.name}: {post.author.bio}
          </p>
        ) : null}
      </article>
    </main>
  );
}