import { Link } from 'react-router-dom';
import api from '../api/axios.js';
import PostList from '../components/post/PostList.jsx';
import EmptyState from '../components/EmptyState.jsx';
import ErrorMessage from '../components/ErrorMessage.jsx';
import { PostListSkeleton } from '../components/Skeleton.jsx';
import useRequest from '../hooks/useRequest.js';
import useDocumentTitle from '../hooks/useDocumentTitle.js';

export default function Bookmarks() {
  useDocumentTitle('Saved posts');

  const { data, loading, error, reload } = useRequest(
    (signal) => api.get('/posts/bookmarks', { signal }).then((res) => res.data.posts),
    [],
  );

  return (
    <main className="app-main" id="main">
      <div className="page-head">
        <h1 className="page-head__title">Saved posts</h1>
        <p className="page-head__meta">
          Posts you bookmarked for later. Only you can see this list.
        </p>
      </div>

      {loading ? <PostListSkeleton /> : null}
      {!loading && error ? <ErrorMessage onRetry={reload}>{error}</ErrorMessage> : null}

      {!loading && !error && data ? (
        data.length ? (
          <PostList posts={data} />
        ) : (
          <EmptyState title="Nothing saved yet">
            Use the bookmark button on any post and it will wait for you here.{' '}
            <Link to="/">Browse the feed</Link>.
          </EmptyState>
        )
      ) : null}
    </main>
  );
}