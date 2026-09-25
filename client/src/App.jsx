import { lazy } from 'react';
import { Route, Routes } from 'react-router-dom';
import Layout from './components/layout/Layout.jsx';
import ProtectedRoute from './components/layout/ProtectedRoute.jsx';
import ScrollToTop from './components/layout/ScrollToTop.jsx';
import Feed from './pages/Feed.jsx';
import Tags from './pages/Tags.jsx';
import TagPage from './pages/TagPage.jsx';
import Profile from './pages/Profile.jsx';
import Login from './pages/Login.jsx';
import Register from './pages/Register.jsx';
import Dashboard from './pages/Dashboard.jsx';
import ProfileSettings from './pages/ProfileSettings.jsx';
import Terms from './pages/Terms.jsx';
import Privacy from './pages/Privacy.jsx';
import NotFound from './pages/NotFound.jsx';

// The Markdown renderer and syntax highlighter are the largest dependencies, and only these
// two pages use them, so they are loaded on demand.
const PostDetail = lazy(() => import('./pages/PostDetail.jsx'));
const PostEditor = lazy(() => import('./pages/PostEditor.jsx'));

export default function App() {
  return (
    <>
      <ScrollToTop />
      <Routes>
        <Route element={<Layout />}>
          <Route index element={<Feed />} />
          <Route path="post/:slug" element={<PostDetail />} />
          <Route path="tags" element={<Tags />} />
          <Route path="tags/:slug" element={<TagPage />} />
          <Route path="u/:id" element={<Profile />} />
          <Route path="login" element={<Login />} />
          <Route path="register" element={<Register />} />
          <Route path="terms" element={<Terms />} />
          <Route path="privacy" element={<Privacy />} />

          <Route element={<ProtectedRoute />}>
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="write" element={<PostEditor />} />
            <Route path="edit/:id" element={<PostEditor />} />
            <Route path="settings" element={<ProfileSettings />} />
          </Route>

          <Route path="*" element={<NotFound />} />
        </Route>
      </Routes>
    </>
  );
}
