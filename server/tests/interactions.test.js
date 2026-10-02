import assert from 'node:assert/strict';
import { after, before, beforeEach, describe, test } from 'node:test';
import request from 'supertest';
import { clearDatabase, registerUser, startApp, stopApp } from './helpers.js';

let app;

before(async () => {
  app = await startApp();
});
after(stopApp);
beforeEach(clearDatabase);

async function createPublishedPost(token, overrides = {}) {
  const res = await request(app)
    .post('/api/posts')
    .set('Authorization', `Bearer ${token}`)
    .send({ title: 'A post', content: 'Some **body** text.', status: 'published', ...overrides })
    .expect(201);
  return res.body.post;
}

describe('likes', () => {
  test('toggling a like on and off keeps the count in step', async () => {
    const { token } = await registerUser(app);
    const post = await createPublishedPost(token);

    const liked = await request(app)
      .post(`/api/posts/${post._id}/like`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200);
    assert.deepEqual({ liked: liked.body.liked, likeCount: liked.body.likeCount }, {
      liked: true,
      likeCount: 1,
    });

    // A second reader adds their own like; the count tracks both.
    const reader = await registerUser(app);
    const second = await request(app)
      .post(`/api/posts/${post._id}/like`)
      .set('Authorization', `Bearer ${reader.token}`)
      .expect(200);
    assert.equal(second.body.likeCount, 2);

    // Liking twice from the same account never double counts.
    const again = await request(app)
      .post(`/api/posts/${post._id}/like`)
      .set('Authorization', `Bearer ${reader.token}`)
      .expect(200);
    assert.deepEqual({ liked: again.body.liked, likeCount: again.body.likeCount }, {
      liked: false,
      likeCount: 1,
    });
  });

  test('requires a token and rejects unknown posts', async () => {
    const { token } = await registerUser(app);
    await request(app).post('/api/posts/000000000000000000000000/like').expect(401);

    const post = await createPublishedPost(token);
    await request(app).post(`/api/posts/${post._id}/like`).expect(401);
    await request(app)
      .post('/api/posts/000000000000000000000000/like')
      .set('Authorization', `Bearer ${token}`)
      .expect(404);
  });

  test('the post response reports whether the reader liked it', async () => {
    const { token } = await registerUser(app);
    const post = await createPublishedPost(token);

    const before = await request(app)
      .get(`/api/posts/${post.slug}`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200);
    assert.equal(before.body.liked, false);
    assert.equal(before.body.post.likeCount, 0);

    await request(app)
      .post(`/api/posts/${post._id}/like`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    const after = await request(app)
      .get(`/api/posts/${post.slug}`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200);
    assert.equal(after.body.liked, true);
    assert.equal(after.body.post.likeCount, 1);

    // A guest sees no liked flag at all rather than a misleading false.
    const guest = await request(app).get(`/api/posts/${post.slug}`).expect(200);
    assert.equal(guest.body.liked, false);
    assert.equal(guest.body.post.likeCount, 1);

    // The id of everyone else who liked the post is not part of the public response.
    assert.equal('likes' in guest.body.post, false);
    assert.equal('bookmarks' in guest.body.post, false);
  });

  test('concurrent reactions from different readers keep the count accurate', async () => {
    const author = await registerUser(app);
    const post = await createPublishedPost(author.token);
    const readers = await Promise.all([registerUser(app), registerUser(app), registerUser(app)]);

    const responses = await Promise.all(
      readers.map((reader) =>
        request(app)
          .post(`/api/posts/${post._id}/like`)
          .set('Authorization', `Bearer ${reader.token}`),
      ),
    );

    for (const res of responses) assert.equal(res.status, 200);
    const detail = await request(app).get(`/api/posts/${post.slug}`).expect(200);
    assert.equal(detail.body.post.likeCount, 3);
  });
});

describe('comments', () => {
  test('adds a comment and threads a reply under it', async () => {
    const { token } = await registerUser(app);
    const post = await createPublishedPost(token);
    const replyAuthor = await registerUser(app);

    const root = await request(app)
      .post(`/api/posts/${post._id}/comments`)
      .set('Authorization', `Bearer ${token}`)
      .send({ body: 'Nice write-up' })
      .expect(201);
    assert.equal(root.body.comment.depth, 0);

    await request(app)
      .post(`/api/posts/${post._id}/comments`)
      .set('Authorization', `Bearer ${replyAuthor.token}`)
      .send({ body: 'Agreed', parent: root.body.comment._id })
      .expect(201);

    const thread = await request(app).get(`/api/posts/${post._id}/comments`).expect(200);
    assert.equal(thread.body.topLevel.length, 1);
    assert.equal(thread.body.topLevel[0].replies.length, 1);
    assert.equal(thread.body.topLevel[0].replies[0].body, 'Agreed');
    assert.equal(thread.body.replyCount, 2);

    // The reply carries the reader's name so the thread renders without extra lookups.
    assert.equal(thread.body.topLevel[0].replies[0].author.name, replyAuthor.user.name);
  });

  test('rejects empty comments and replies to replies', async () => {
    const { token } = await registerUser(app);
    const post = await createPublishedPost(token);

    await request(app)
      .post(`/api/posts/${post._id}/comments`)
      .set('Authorization', `Bearer ${token}`)
      .send({ body: '   ' })
      .expect(400);

    const root = await request(app)
      .post(`/api/posts/${post._id}/comments`)
      .set('Authorization', `Bearer ${token}`)
      .send({ body: 'Top level' })
      .expect(201);
    const reply = await request(app)
      .post(`/api/posts/${post._id}/comments`)
      .set('Authorization', `Bearer ${token}`)
      .send({ body: 'A reply', parent: root.body.comment._id })
      .expect(201);

    // Threads stop at one level of replies.
    await request(app)
      .post(`/api/posts/${post._id}/comments`)
      .set('Authorization', `Bearer ${token}`)
      .send({ body: 'Too deep', parent: reply.body.comment._id })
      .expect(400);
  });

  test('refuses comments on a draft and on a post that does not exist', async () => {
    const { token } = await registerUser(app);
    const draft = await createPublishedPost(token, { title: 'Draft', status: 'draft' });

    await request(app)
      .post(`/api/posts/${draft._id}/comments`)
      .set('Authorization', `Bearer ${token}`)
      .send({ body: 'Anyone there?' })
      .expect(404);
    await request(app).get(`/api/posts/${draft._id}/comments`).expect(404);

    await request(app)
      .post('/api/posts/000000000000000000000000/comments')
      .set('Authorization', `Bearer ${token}`)
      .send({ body: 'hello' })
      .expect(404);
  });

  test('requires a token to comment', async () => {
    const { token } = await registerUser(app);
    const post = await createPublishedPost(token);
    await request(app)
      .post(`/api/posts/${post._id}/comments`)
      .send({ body: 'anonymous' })
      .expect(401);
  });

  test('deletes a comment with its replies, and blocks everyone else', async () => {
    const author = await registerUser(app);
    const post = await createPublishedPost(author.token);
    const reader = await registerUser(app);
    const stranger = await registerUser(app);

    const root = await request(app)
      .post(`/api/posts/${post._id}/comments`)
      .set('Authorization', `Bearer ${author.token}`)
      .send({ body: 'Top level' })
      .expect(201);
    await request(app)
      .post(`/api/posts/${post._id}/comments`)
      .set('Authorization', `Bearer ${reader.token}`)
      .send({ body: 'A reply', parent: root.body.comment._id })
      .expect(201);

    // Someone with no connection to the comment or the post cannot remove it.
    await request(app)
      .delete(`/api/comments/${root.body.comment._id}`)
      .set('Authorization', `Bearer ${stranger.token}`)
      .expect(403);
    await request(app).delete(`/api/comments/${root.body.comment._id}`).expect(401);

    // The post author may moderate their own discussion, replies included.
    const removed = await request(app)
      .delete(`/api/comments/${root.body.comment._id}`)
      .set('Authorization', `Bearer ${author.token}`)
      .expect(200);
    assert.equal(removed.body.deleted, 2);

    const thread = await request(app).get(`/api/posts/${post._id}/comments`).expect(200);
    assert.equal(thread.body.topLevel.length, 0);
    assert.equal(thread.body.replyCount, 0);
  });

  test('deleting a post takes its comments with it', async () => {
    const { token } = await registerUser(app);
    const post = await createPublishedPost(token);

    const comment = await request(app)
      .post(`/api/posts/${post._id}/comments`)
      .set('Authorization', `Bearer ${token}`)
      .send({ body: 'Will be orphaned' })
      .expect(201);

    await request(app)
      .delete(`/api/posts/${post._id}`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    // The comment endpoint is gone with its post, rather than erroring on a dead reference.
    await request(app)
      .delete(`/api/comments/${comment.body.comment._id}`)
      .set('Authorization', `Bearer ${token}`)
      .expect(404);
  });
});

describe('following', () => {
  test('follows and unfollows, and reports follower counts', async () => {
    const author = await registerUser(app, { name: 'Author' });
    const reader = await registerUser(app);

    const followed = await request(app)
      .post(`/api/users/${author.user._id}/follow`)
      .set('Authorization', `Bearer ${reader.token}`)
      .expect(200);
    assert.deepEqual(followed.body, { following: true, followerCount: 1 });

    const unfollowed = await request(app)
      .post(`/api/users/${author.user._id}/follow`)
      .set('Authorization', `Bearer ${reader.token}`)
      .expect(200);
    assert.deepEqual(unfollowed.body, { following: false, followerCount: 0 });
  });

  test('refuses self-follow, unknown users and missing tokens', async () => {
    const reader = await registerUser(app);

    await request(app)
      .post(`/api/users/${reader.user._id}/follow`)
      .set('Authorization', `Bearer ${reader.token}`)
      .expect(400);
    await request(app).post(`/api/users/${reader.user._id}/follow`).expect(401);
    await request(app)
      .post('/api/users/000000000000000000000000/follow')
      .set('Authorization', `Bearer ${reader.token}`)
      .expect(404);
  });

  test('lists followers and following for any profile', async () => {
    const author = await registerUser(app, { name: 'Author' });
    const first = await registerUser(app, { name: 'First Reader' });
    const second = await registerUser(app, { name: 'Second Reader' });

    await request(app)
      .post(`/api/users/${author.user._id}/follow`)
      .set('Authorization', `Bearer ${first.token}`)
      .expect(200);
    await request(app)
      .post(`/api/users/${author.user._id}/follow`)
      .set('Authorization', `Bearer ${second.token}`)
      .expect(200);

    const followers = await request(app).get(`/api/users/${author.user._id}/followers`).expect(200);
    assert.deepEqual(followers.body.users.map((user) => user.name).sort(), [
      'First Reader',
      'Second Reader',
    ]);

    // The author follows nobody, so this list is empty rather than an error.
    const following = await request(app).get(`/api/users/${author.user._id}/following`).expect(200);
    assert.deepEqual(following.body.users, []);
    await request(app).get('/api/users/000000000000000000000000/followers').expect(404);
  });

  test('a profile reports the viewer\'s follow state', async () => {
    const author = await registerUser(app);
    const reader = await registerUser(app);

    const before = await request(app)
      .get(`/api/users/${author.user._id}`)
      .set('Authorization', `Bearer ${reader.token}`)
      .expect(200);
    assert.equal(before.body.isFollowing, false);
    assert.equal(before.body.user.followerCount, 0);

    await request(app)
      .post(`/api/users/${author.user._id}/follow`)
      .set('Authorization', `Bearer ${reader.token}`)
      .expect(200);

    const after = await request(app)
      .get(`/api/users/${author.user._id}`)
      .set('Authorization', `Bearer ${reader.token}`)
      .expect(200);
    assert.equal(after.body.isFollowing, true);
    assert.equal(after.body.user.followerCount, 1);
  });

  test('the following feed shows only followed authors and only published posts', async () => {
    const followed = await registerUser(app, { name: 'Followed' });
    const ignored = await registerUser(app, { name: 'Ignored' });
    const reader = await registerUser(app);

    await createPublishedPost(followed.token, { title: 'Worth reading' });
    await createPublishedPost(ignored.token, { title: 'Not for you' });
    await createPublishedPost(followed.token, { title: 'Still a draft', status: 'draft' });

    const empty = await request(app)
      .get('/api/posts/following')
      .set('Authorization', `Bearer ${reader.token}`)
      .expect(200);
    assert.deepEqual(empty.body.posts, []);

    await request(app)
      .post(`/api/users/${followed.user._id}/follow`)
      .set('Authorization', `Bearer ${reader.token}`)
      .expect(200);

    const feed = await request(app)
      .get('/api/posts/following')
      .set('Authorization', `Bearer ${reader.token}`)
      .expect(200);
    assert.deepEqual(feed.body.posts.map((post) => post.title), ['Worth reading']);

    await request(app).get('/api/posts/following').expect(401);
  });

  test('the following feed honours search and treats input as plain text', async () => {
    const author = await registerUser(app);
    const reader = await registerUser(app);
    await createPublishedPost(author.token, { title: 'Caching in MongoDB' });
    await createPublishedPost(author.token, { title: 'Writing an express server' });

    await request(app)
      .post(`/api/users/${author.user._id}/follow`)
      .set('Authorization', `Bearer ${reader.token}`)
      .expect(200);

    const hit = await request(app)
      .get('/api/posts/following?search=mongo')
      .set('Authorization', `Bearer ${reader.token}`)
      .expect(200);
    assert.deepEqual(hit.body.posts.map((post) => post.title), ['Caching in MongoDB']);

    // A regex metacharacter must be matched literally, not compiled as a pattern.
    const literal = await request(app)
      .get('/api/posts/following?search=.')
      .set('Authorization', `Bearer ${reader.token}`)
      .expect(200);
    assert.deepEqual(literal.body.posts, []);

    const miss = await request(app)
      .get('/api/posts/following?search=nothing-here')
      .set('Authorization', `Bearer ${reader.token}`)
      .expect(200);
    assert.deepEqual(miss.body.posts, []);
  });
});

describe('bookmarks', () => {
  test('saves a post, lists it and removes it again', async () => {
    const author = await registerUser(app);
    const reader = await registerUser(app);
    const post = await createPublishedPost(author.token, { title: 'Save me' });

    const saved = await request(app)
      .post(`/api/posts/${post._id}/bookmark`)
      .set('Authorization', `Bearer ${reader.token}`)
      .expect(200);
    assert.deepEqual({ bookmarked: saved.body.bookmarked, bookmarkCount: saved.body.bookmarkCount }, {
      bookmarked: true,
      bookmarkCount: 1,
    });

    const list = await request(app)
      .get('/api/posts/bookmarks')
      .set('Authorization', `Bearer ${reader.token}`)
      .expect(200);
    assert.deepEqual(list.body.posts.map((saved_) => saved_.title), ['Save me']);

    await request(app)
      .post(`/api/posts/${post._id}/bookmark`)
      .set('Authorization', `Bearer ${reader.token}`)
      .expect(200);

    const emptied = await request(app)
      .get('/api/posts/bookmarks')
      .set('Authorization', `Bearer ${reader.token}`)
      .expect(200);
    assert.deepEqual(emptied.body.posts, []);
    await request(app).get('/api/posts/bookmarks').expect(401);
  });

  test('keeps a draft out of the saved list until it is published', async () => {
    const author = await registerUser(app);
    const reader = await registerUser(app);
    const draft = await createPublishedPost(author.token, { title: 'Work in progress', status: 'draft' });

    await request(app)
      .post(`/api/posts/${draft._id}/bookmark`)
      .set('Authorization', `Bearer ${reader.token}`)
      .expect(200);

    // Drafts are still listed for the reader who chose to save them, so the bookmark is
    // not silently lost when the post is published later.
    const list = await request(app)
      .get('/api/posts/bookmarks')
      .set('Authorization', `Bearer ${reader.token}`)
      .expect(200);
    assert.deepEqual(list.body.posts.map((post) => post.status), ['draft']);
  });

  test('deleting a post removes it from everyone\'s saved list', async () => {
    const author = await registerUser(app);
    const reader = await registerUser(app);
    const post = await createPublishedPost(author.token);

    await request(app)
      .post(`/api/posts/${post._id}/bookmark`)
      .set('Authorization', `Bearer ${reader.token}`)
      .expect(200);
    await request(app)
      .delete(`/api/posts/${post._id}`)
      .set('Authorization', `Bearer ${author.token}`)
      .expect(200);

    const list = await request(app)
      .get('/api/posts/bookmarks')
      .set('Authorization', `Bearer ${reader.token}`)
      .expect(200);
    assert.deepEqual(list.body.posts, []);
  });
});

describe('theme', () => {
  test('persists the theme choice on the account', async () => {
    const { token, user } = await registerUser(app);
    assert.equal(user.theme, 'light');

    const updated = await request(app)
      .put('/api/users/me')
      .set('Authorization', `Bearer ${token}`)
      .send({ theme: 'dark' })
      .expect(200);
    assert.equal(updated.body.user.theme, 'dark');

    // The choice survives a fresh sign-in, which is what makes it per-user.
    const signedIn = await request(app)
      .post('/api/auth/login')
      .send({ email: user.email, password: 'password123' })
      .expect(200);
    assert.equal(signedIn.body.user.theme, 'dark');
  });

  test('rejects an unknown theme', async () => {
    const { token } = await registerUser(app);
    await request(app)
      .put('/api/users/me')
      .set('Authorization', `Bearer ${token}`)
      .send({ theme: 'neon' })
      .expect(400);
  });

  test('never returns bookmarks or following ids to the client', async () => {
    const followed = await registerUser(app);
    const follower = await registerUser(app);
    await request(app)
      .post(`/api/users/${followed.user._id}/follow`)
      .set('Authorization', `Bearer ${follower.token}`)
      .expect(200);

    // The session user carries counts, never the underlying id arrays.
    const me = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${follower.token}`)
      .expect(200);
    assert.equal(me.body.user.followingCount, 1);
    assert.equal('following' in me.body.user, false);
    assert.equal('password' in me.body.user, false);

    // A public profile exposes counts too, and never leaks the follower id list.
    const profile = await request(app).get(`/api/users/${followed.user._id}`).expect(200);
    assert.equal(profile.body.user.followerCount, 1);
    assert.equal(profile.body.user.followingCount, 0);
    assert.equal(JSON.stringify(profile.body).includes('"following":['), false);
    assert.equal(JSON.stringify(profile.body).includes('password'), false);
  });
});