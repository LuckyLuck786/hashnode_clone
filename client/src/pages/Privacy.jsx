import useDocumentTitle from '../hooks/useDocumentTitle.js';

export default function Privacy() {
  useDocumentTitle('Privacy policy');

  return (
    <main className="app-main" id="main">
      <article className="article">
        <h1 className="article__title">Privacy policy</h1>
        <p className="article__byline">Last updated 28 September 2026</p>

        <div className="prose">
          <h2>What is collected</h2>
          <p>Only what the platform needs to work:</p>
          <ul>
            <li>your name, email address and a bcrypt hash of your password,</li>
            <li>your optional bio and avatar URL,</li>
            <li>the posts, tags and cover image URLs you create,</li>
            <li>timestamps showing when records were created and last updated.</li>
          </ul>
          <p>
            Your password is hashed with bcrypt before it reaches the database and is never stored
            or transmitted in plain text. The API never returns a password hash, not even to you.
          </p>

          <h2>What is public</h2>
          <p>
            Your name, bio, avatar and published posts are visible to anyone, signed in or not.
            Your email address is never shown to other users, and your drafts are visible only to
            you.
          </p>

          <h2>Cookies and tracking</h2>
          <p>
            No cookies are set and no analytics or advertising trackers are loaded. Your session
            token is kept in your browser&apos;s local storage and is sent to the API only to prove
            who you are. Logging out removes it.
          </p>

          <h2>Third parties</h2>
          <p>
            Data is stored in a MongoDB Atlas database, and the application is served from a
            hosting provider. Both can see the data in transit and at rest as part of running the
            service. Cover images and avatars you link to are loaded straight from whichever host
            you point at, so that host can see your readers&apos; requests.
          </p>

          <h2>Your choices</h2>
          <p>
            You can edit your name, bio and avatar at any time from profile settings, and delete any
            post from your dashboard. To have your account and its posts removed entirely, contact
            the operator of this instance.
          </p>

          <h2>Scope</h2>
          <p>
            This is a student project built to a course specification, not a commercial product.
            Treat it accordingly and do not store sensitive information here.
          </p>
        </div>
      </article>
    </main>
  );
}
