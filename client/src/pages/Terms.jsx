import useDocumentTitle from '../hooks/useDocumentTitle.js';

export default function Terms() {
  useDocumentTitle('Terms of service');

  return (
    <main className="app-main" id="main">
      <article className="article">
        <h1 className="article__title">Terms of service</h1>
        <p className="article__byline">Last updated 28 September 2026</p>

        <div className="prose">
          <h2>What Monospace is</h2>
          <p>
            Monospace is a publishing platform where registered users write and publish technical
            articles. It was built as an individual capstone project for a full stack development
            program. It is not a commercial service and carries no uptime or data durability
            guarantee.
          </p>

          <h2>Your account</h2>
          <p>
            You need an account to publish. You are responsible for keeping your password private
            and for everything posted from your account. Use an email address you control, and do
            not share credentials with anyone else.
          </p>

          <h2>Your content</h2>
          <p>
            You keep ownership of everything you write here. By publishing a post you allow the
            platform to store it and display it to readers, including on the public feed, tag pages
            and your profile. Drafts stay private to you until you publish them.
          </p>
          <p>Do not publish content that:</p>
          <ul>
            <li>infringes someone else&apos;s copyright or trademark,</li>
            <li>contains malware, credential harvesting or other hostile code,</li>
            <li>targets or harasses a specific person,</li>
            <li>is unlawful in your jurisdiction.</li>
          </ul>

          <h2>Moderation and removal</h2>
          <p>
            You can edit or delete your own posts at any time from your dashboard. Deletion is
            permanent. The operator of this instance may remove content or suspend an account that
            breaks the rules above.
          </p>

          <h2>Availability</h2>
          <p>
            The service runs on free hosting tiers. It may be slow, restarted or taken offline
            without notice. Keep your own copy of anything you care about.
          </p>

          <h2>Changes</h2>
          <p>
            These terms may change as the project develops. The date at the top reflects the last
            revision. Continuing to use the platform after a change means you accept the updated
            terms.
          </p>
        </div>
      </article>
    </main>
  );
}
