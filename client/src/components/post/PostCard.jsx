import { Link } from 'react-router-dom';
import Avatar from '../ui/Avatar.jsx';
import PostMeta from './PostMeta.jsx';
import TagList from './TagList.jsx';

export default function PostCard({ post, showAuthor = true }) {
  const postUrl = `/post/${post.slug}`;

  return (
    <li className={`post-row ${post.coverImage ? 'post-row--with-cover' : ''}`}>
      <article>
        {showAuthor && post.author && (
          <Link to={`/u/${post.author._id}`} className="post-row__author">
            <Avatar user={post.author} size={24} />
            <span>{post.author.name}</span>
          </Link>
        )}
        <h2 className="post-row__title">
          <Link to={postUrl}>{post.title}</Link>
        </h2>
        <p className="post-row__excerpt">{post.excerpt}</p>
        <div className="post-row__footer">
          <PostMeta post={post} />
          <TagList tags={post.tags} />
        </div>
      </article>
      {post.coverImage && (
        // The title link already leads to the post, so the image is hidden from screen readers.
        <Link to={postUrl} tabIndex={-1} aria-hidden="true">
          <img className="post-row__cover" src={post.coverImage} alt="" loading="lazy" />
        </Link>
      )}
    </li>
  );
}
