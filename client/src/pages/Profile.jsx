import { Link, useParams, useSearchParams } from 'react-router-dom';
import api from '../api/axios.js';
import Avatar from '../components/Avatar.jsx';
import FollowButton from '../components/FollowButton.jsx';
import PostList from '../components/post/PostList.jsx';
import Pagination from '../components/Pagination.jsx';
import EmptyState from '../components/EmptyState.jsx';
import ErrorMessage from '../components/ErrorMessage.jsx';
import { PostListSkeleton } from '../components/Skeleton.jsx';
import useRequest from '../hooks/useRequest.js';
import useDocumentTitle from '../hooks/useDocumentTitle.js';
import useDocumentMeta from '../hooks/useDocumentMeta.js';
import useAuth from '../hooks/useAuth.js';
import { formatDate } from '../utils/format.js';

export default function Profile() {
  const { id } = useParams();
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const page = Number(searchParams.get('page')) || 1;

  const { data, loading, error, reload } = useRequest(
    (signal) => api.get(`/users/${id}`, { params: { page }, signal }).then((res) => res.data),
    [id, page],
  );

  useDocumentTitle(data?.user.name);

  useDocumentMeta({
    title: data?.user.name,
    description: data?.user.bio || undefined,
    image: data?.user.avatarUrl,
  });

  if (loading) {
    return (
      <main className="app-main" id="main">
        <PostListSkeleton count={3} />
      </main>
    );
  }

  if (error) {
    return (
      <main className="app-main" id="main">
        <ErrorMessage onRetry={reload}>{error}</ErrorMessage>
      </main>
    );
  }

  const isMe = user?._id === data.user._id;

  return (
    <main className="app-main" id="main">
      <div className="page-head">
        <div className="page-head__row">
          <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
            <Avatar user={data.user} size="lg" />
            <div>
              <h1 className="page-head__title">{data.user.name}</h1>
              {data.user.bio ? <p className="page-head__meta">{data.user.bio}</p> : null}
              <p className="page-head__meta">
                Joined {formatDate(data.user.createdAt)}
                <span className="dot-sep">
                  {data.total} published {data.total === 1 ? 'post' : 'posts'}
                </span>
                <span className="dot-sep">
                  {data.user.followerCount ?? 0}{' '}
                  {data.user.followerCount === 1 ? 'follower' : 'followers'}
                </span>
              </p>
            </div>
          </div>
          {isMe ? (
            <Link className="button" to="/settings">
              Edit profile
            </Link>
          ) : (
            <FollowButton userId={data.user._id} initialFollowing={data.isFollowing} />
          )}
        </div>
      </div>

      {data.posts.length ? (
        <>
          <PostList posts={data.posts} showAuthor={false} />
          <Pagination
            page={data.page}
            totalPages={data.totalPages}
            onChange={(next) => setSearchParams({ page: String(next) })}
          />
        </>
      ) : (
        <EmptyState title="No published posts yet">
          {isMe
            ? 'Your drafts stay private. Publish one and it appears here.'
            : 'This author has not published anything so far.'}
        </EmptyState>
      )}
    </main>
  );
}
