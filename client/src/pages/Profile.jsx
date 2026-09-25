import { useCallback } from 'react';
import { Link, useParams } from 'react-router-dom';
import { fetchUserProfile } from '../api/users.js';
import useAuth from '../hooks/useAuth.js';
import usePaginatedPosts from '../hooks/usePaginatedPosts.js';
import useDocumentTitle from '../hooks/useDocumentTitle.js';
import Avatar from '../components/ui/Avatar.jsx';
import Skeleton from '../components/ui/Skeleton.jsx';
import StateMessage from '../components/ui/StateMessage.jsx';
import PostList from '../components/post/PostList.jsx';
import { formatDate } from '../utils/format.js';

export default function Profile() {
  const { id } = useParams();
  const { user: currentUser } = useAuth();
  const fetchPage = useCallback((page) => fetchUserProfile(id, { page }), [id]);
  const list = usePaginatedPosts(fetchPage);
  const profile = list.meta?.user;
  const isOwnProfile = currentUser?._id === id;
  useDocumentTitle(profile?.name);

  if (list.status === 'error' && list.error.status === 404) {
    return (
      <StateMessage
        title="User not found"
        action={
          <Link to="/" className="btn">
            Back to the feed
          </Link>
        }
      >
        This profile does not exist or has been removed.
      </StateMessage>
    );
  }

  return (
    <div className="prose-page">
      {profile ? (
        <header className="profile-header">
          <Avatar user={profile} size={72} />
          <div>
            <h1 className="profile-header__name">{profile.name}</h1>
            {profile.bio && <p className="profile-header__bio">{profile.bio}</p>}
            <p className="meta">Member since {formatDate(profile.createdAt)}</p>
            {isOwnProfile && (
              <Link to="/settings" className="text-link">
                Edit profile
              </Link>
            )}
          </div>
        </header>
      ) : (
        list.status === 'loading' && (
          <div className="profile-header" aria-hidden="true">
            <Skeleton width={72} height={72} />
            <div style={{ flex: 1 }}>
              <Skeleton width="50%" height={28} style={{ marginBottom: 10 }} />
              <Skeleton width="80%" height={14} />
            </div>
          </div>
        )
      )}

      <h2 className="sidebar-heading">Posts</h2>
      <PostList
        list={list}
        showAuthor={false}
        emptyTitle="No published posts yet"
        emptyMessage={
          isOwnProfile
            ? 'Posts you publish will be listed here for everyone to read.'
            : `${profile?.name ?? 'This writer'} has not published anything yet.`
        }
        emptyAction={
          isOwnProfile && (
            <Link to="/write" className="btn">
              Write your first post
            </Link>
          )
        }
      />
    </div>
  );
}
