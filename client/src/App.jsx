import { Suspense, lazy } from 'react';
import { Route, Routes } from 'react-router-dom';
import Navbar from './components/layout/Navbar.jsx';
import Footer from './components/layout/Footer.jsx';
import ProtectedRoute from './components/layout/ProtectedRoute.jsx';
import Feed from './pages/Feed.jsx';
import TagPage from './pages/TagPage.jsx';
import TagsPage from './pages/TagsPage.jsx';
import Login from './pages/Login.jsx';
import Register from './pages/Register.jsx';
import Dashboard from './pages/Dashboard.jsx';
import Bookmarks from './pages/Bookmarks.jsx';
import Profile from './pages/Profile.jsx';
import ProfileSettings from './pages/ProfileSettings.jsx';
import Terms from './pages/Terms.jsx';
import Privacy from './pages/Privacy.jsx';
import NotFound from './pages/NotFound.jsx';
import { ArticleSkeleton } from './components/Skeleton.jsx';

// The Markdown renderer and its syntax highlighter are the heaviest part of the bundle.
// Loading them only on the two pages that need them keeps the feed fast on first visit.
const PostDetail = lazy(() => import('./pages/PostDetail.jsx'));
const PostEditor = lazy(() => import('./pages/PostEditor.jsx'));

export default function App() {
  return (
    <div className="app-shell">
      <a className="skip-link" href="#main">
        Skip to content
      </a>
      <Navbar />

      <Suspense
        fallback={
          <main className="app-main">
            <ArticleSkeleton />
          </main>
        }
      >
        <Routes>
          <Route path="/" element={<Feed />} />
          <Route path="/post/:slug" element={<PostDetail />} />
          <Route path="/tag/:slug" element={<TagPage />} />
          <Route path="/tags" element={<TagsPage />} />
          <Route path="/profile/:id" element={<Profile />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/terms" element={<Terms />} />
          <Route path="/privacy" element={<Privacy />} />

          {/* Everything below requires a valid token; ProtectedRoute redirects guests to /login. */}
          <Route element={<ProtectedRoute />}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/bookmarks" element={<Bookmarks />} />
            <Route path="/editor/new" element={<PostEditor />} />
            <Route path="/editor/:id" element={<PostEditor />} />
            <Route path="/settings" element={<ProfileSettings />} />
          </Route>

          <Route path="*" element={<NotFound />} />
        </Routes>
      </Suspense>

      <Footer />
    </div>
  );
}
