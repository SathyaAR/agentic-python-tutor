import { lazy, Suspense } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { ProtectedRoute, PublicOnlyRoute } from './auth/ProtectedRoute';
import { AppShell } from './components/AppShell';
import { LoginPage } from './pages/LoginPage';
import { SignupPage } from './pages/SignupPage';
import { HomePage } from './pages/HomePage';
import { LoadingLabel } from './components/Feedback';

// CodeMirror-heavy pages load on demand so /login stays light.
const AssessmentPage = lazy(() => import('./pages/AssessmentPage').then((m) => ({ default: m.AssessmentPage })));
const LessonPage = lazy(() => import('./pages/LessonPage').then((m) => ({ default: m.LessonPage })));

// Routes: frontend-spec.md §3.
export default function App() {
  return (
    <Routes>
      <Route element={<PublicOnlyRoute />}>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignupPage />} />
      </Route>
      <Route element={<ProtectedRoute />}>
        <Route element={<AppShell />}>
          <Route path="/assessment" element={<Suspense fallback={<LoadingLabel label="Loading…" />}><AssessmentPage /></Suspense>} />
          <Route path="/curriculum" element={<HomePage />} />
          <Route path="/lessons/:lessonId" element={<Suspense fallback={<LoadingLabel label="Loading…" />}><LessonPage /></Suspense>} />
        </Route>
      </Route>
      <Route path="*" element={<Navigate to="/curriculum" replace />} />
    </Routes>
  );
}
