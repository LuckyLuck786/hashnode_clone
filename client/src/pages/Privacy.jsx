import useDocumentTitle from '../hooks/useDocumentTitle.js';
import { SITE_NAME } from '../config.js';

export default function Privacy() {
  useDocumentTitle('Privacy Policy');

  return (
    <article className="prose-page">
      <header className="page-header">
        <h1 className="page-title">Privacy Policy</h1>
        <p className="page-subtitle">Last updated September 25, 2026</p>
      </header>

      <div className="markdown">
        <p>
          {SITE_NAME} collects only what it needs to let you write and publish posts. This page
          explains what that is and how it is used.
        </p>

        <h2>What we store</h2>
        <ul>
          <li>Your name, email address and an optional bio and avatar link.</li>
          <li>
            Your password, stored only as a bcrypt hash. Nobody, including the people running the
            project, can read the original password.
          </li>
          <li>The posts and drafts you write, with their tags and dates.</li>
        </ul>

        <h2>What is public</h2>
        <p>
          Your name, bio, avatar and published posts are visible to anyone. Your email address and
          drafts are never shown to other users.
        </p>

        <h2>Cookies and local storage</h2>
        <p>
          {SITE_NAME} does not use tracking or advertising cookies. Your browser&apos;s local storage
          keeps your sign in token and your light or dark theme choice. Logging out removes the
          token.
        </p>

        <h2>Third parties</h2>
        <p>
          The site is hosted on Vercel and the database runs on MongoDB Atlas. Cover images and
          avatars are loaded from the links authors provide, so those image hosts can see that your
          browser requested the image.
        </p>

        <h2>Deleting your data</h2>
        <p>
          You can delete any of your posts from your dashboard. To remove your account entirely,
          contact the project maintainer through the GitHub repository.
        </p>
      </div>
    </article>
  );
}
