import useDocumentTitle from '../hooks/useDocumentTitle.js';
import { SITE_NAME } from '../config.js';

export default function Terms() {
  useDocumentTitle('Terms of Use');

  return (
    <article className="prose-page">
      <header className="page-header">
        <h1 className="page-title">Terms of Use</h1>
        <p className="page-subtitle">Last updated September 25, 2026</p>
      </header>

      <div className="markdown">
        <p>
          {SITE_NAME} is a student project built during an internship to practice full stack
          development. It is not a commercial service and it is not affiliated with Hashnode. By
          creating an account or publishing a post you agree to the terms below.
        </p>

        <h2>Your account</h2>
        <p>
          You are responsible for keeping your password private and for everything posted from your
          account. Use a password you do not use anywhere else. The shared demo account can be
          changed by anyone, so do not store anything personal in it.
        </p>

        <h2>Your content</h2>
        <p>
          You keep ownership of what you write. By publishing a post you allow it to be shown
          publicly on {SITE_NAME}. You can edit or delete your posts at any time from your
          dashboard. Drafts are visible only to you.
        </p>

        <h2>What is not allowed</h2>
        <ul>
          <li>Content that is illegal, hateful or harassing.</li>
          <li>Spam, advertising or links to malware.</li>
          <li>Posting other people&apos;s work as your own.</li>
          <li>Attempting to break, overload or gain unauthorized access to the service.</li>
        </ul>
        <p>Posts or accounts that break these rules may be removed without notice.</p>

        <h2>No warranty</h2>
        <p>
          {SITE_NAME} is provided as is for learning purposes. The database may be reset while the
          project is being developed, so keep a copy of anything you want to keep.
        </p>

        <h2>Changes</h2>
        <p>
          These terms may be updated as the project changes. The date at the top of this page shows
          when they were last revised.
        </p>
      </div>
    </article>
  );
}
