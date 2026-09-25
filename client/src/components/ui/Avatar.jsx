import { useState } from 'react';
import { initialsOf } from '../../utils/format.js';

// Shows the user's photo, or their initials when there is no photo or it fails to load.
export default function Avatar({ user, size = 32 }) {
  const [failedUrl, setFailedUrl] = useState(null);
  const style = { width: size, height: size, fontSize: Math.round(size * 0.38) };
  const url = user?.avatarUrl;

  if (url && url !== failedUrl) {
    return (
      <img
        className="avatar"
        src={url}
        alt=""
        width={size}
        height={size}
        style={style}
        loading="lazy"
        onError={() => setFailedUrl(url)}
      />
    );
  }

  return (
    <span className="avatar avatar--initials" style={style} aria-hidden="true">
      {initialsOf(user?.name)}
    </span>
  );
}
