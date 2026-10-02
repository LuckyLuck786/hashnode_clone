import { useSearchParams, useParams } from 'react-router-dom';
import api from '../api/axios.js';
import PostList from '../components/post/PostList.jsx';
import Pagination from '../components/Pagination.jsx';
import EmptyState from '../components/EmptyState.jsx';
import ErrorMessage from '../components/ErrorMessage.jsx';
import { PostListSkeleton } from '../components/Skeleton.jsx';
import useRequest from '../hooks/useRequest.js';
import useDocumentTitle from '../hooks/useDocumentTitle.js';

export default function TagPage() {
  const { slug } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const page = Number(searchParams.get('page')) || 1;

  const { data, loading, error, reload } = useRequest(
    (signal) => api.get(`/tags/${slug}/posts`, { params: { page }, signal }).then((res) => res.data),
    [slug, page],
  );

  useDocumentTitle(data ? `#${data.tag.name}` : null);

  return (
    <main className="app-main" id="main">
      <div className="page-head">
        <h1 className="page-head__title">{data ? data.tag.name : slug}</h1>
        <p className="page-head__meta">
          {data ? `${data.total} published ${data.total === 1 ? 'post' : 'posts'} in this topic` : 'Loading topic'}
        </p>
      </div>

      {loading ? <PostListSkeleton /> : null}
      {!loading && error ? <ErrorMessage onRetry={reload}>{error}</ErrorMessage> : null}

      {!loading && !error && data ? (
        data.posts.length ? (
          <>
            <PostList posts={data.posts} />
            <Pagination
              page={data.page}
              totalPages={data.totalPages}
              onChange={(next) => setSearchParams({ page: String(next) })}
            />
          </>
        ) : (
          <EmptyState title="Nothing published under this tag yet">
            Be the first to write about it.
          </EmptyState>
        )
      ) : null}
    </main>
  );
}
