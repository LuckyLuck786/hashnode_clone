import { Link } from 'react-router-dom';
import Avatar from '../Avatar.jsx';
import TagPill from './TagPill.jsx';
import { formatDate } from '../../utils/format.js';

export default function PostCard({ post, showAuthor = true }) {
  const author = post.author;

  return (
    <article className={`post-card${post.coverImage ? '' : ' post-card--no-image'}`}>
      <div>
        <h2 className="post-card__title">
          <Link to={`/post/${post.slug}`}>{post.title}</Link>
        </h2>

        {post.excerpt ? <p className="post-card__excerpt">{post.excerpt}</p> : null}

        <div className="post-card__footer">
          {showAuthor && author ? (
            <Link className="post-card__author" to={`/profile/${author._id}`}>
              <Avatar user={author} />
              {author.name}
            </Link>
          ) : null}
          <span className={showAuthor && author ? 'dot-sep' : undefined}>
            {formatDate(post.publishedAt || post.createdAt)}
          </span>
          <span className="dot-sep">{post.readingTime} min read</span>
          {post.likeCount > 0 ? (
            <span className="dot-sep post-card__likes">
              <span aria-hidden="true">♥</span> {post.likeCount}
            </span>
          ) : null}
          {post.tags?.length ? (
            <span className="tag-list">
              {post.tags.map((tag) => (
                <TagPill key={tag._id} tag={tag} />
              ))}
            </span>
          ) : null}
        </div>
      </div>

      {post.coverImage ? (
        <div className="post-card__media">
          <img className="post-card__cover" src={post.coverImage} alt="" loading="lazy" />
        </div>
      ) : null}
    </article>
  );
}
