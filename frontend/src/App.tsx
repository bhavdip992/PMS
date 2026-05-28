import React, { useEffect, Suspense, lazy } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useAuthStore } from './store/useAuthStore.tsx';
import DashboardLayout from './components/DashboardLayout.tsx';
import LoadingScreen from './components/LoadingScreen.tsx';

// Lazy-load all feature pages for code splitting
const AuthPage         = lazy(() => import('./features/auth/AuthPage.tsx'));
const ForgotPassword   = lazy(() => import('./features/auth/ForgotPassword.tsx'));
const ResetPassword    = lazy(() => import('./features/auth/ResetPassword.tsx'));
const Dashboard        = lazy(() => import('./features/dashboard/Dashboard.tsx'));
const Projects         = lazy(() => import('./features/projects/Projects.tsx'));
const Tasks            = lazy(() => import('./features/tasks/Tasks.tsx'));
const MyTasks          = lazy(() => import('./features/tasks/MyTasks.tsx'));
const TaskDetailView   = lazy(() => import('./features/tasks/TaskDetailView.tsx'));
const Communications   = lazy(() => import('./features/communications/Communications.tsx'));
const Vault            = lazy(() => import('./features/vault/Vault.tsx'));
const Team             = lazy(() => import('./features/team/Team.tsx'));
const UserManagement   = lazy(() => import('./features/admin/UserManagement.tsx'));
const Calendar         = lazy(() => import('./features/calendar/Calendar.tsx'));
const Workload         = lazy(() => import('./features/workload/Workload.tsx'));
const Settings         = lazy(() => import('./features/settings/Settings.tsx'));
const Inbox            = lazy(() => import('./features/inbox/Inbox.tsx'));

// Protected Route wrapper
const ProtectedRoute: React.FC<{ children: React.ReactNode; roles?: string[] }> = ({ children, roles }) => {
  const { user, isAuthenticated } = useAuthStore();
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (user && user.isActive === false) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 text-center">
        <div className="w-16 h-16 bg-red-900/20 text-red-500 rounded-full flex items-center justify-center mb-4 border border-red-500/20">
          <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        <h1 className="text-2xl font-bold text-slate-100 mb-2">Account Suspended</h1>
        <p className="text-slate-400 max-w-sm text-sm">
          Your workspace access has been deactivated by an administrator. Please contact support or your Super Admin.
        </p>
      </div>
    );
  }

  if (roles && user && !roles.includes(user.role)) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};

export default function App() {
  const { isAuthenticated, loading, checkAuth } = useAuthStore();

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  if (loading) return <LoadingScreen />;

  return (
    <Suspense fallback={<LoadingScreen />}>
      <Routes>
        {/* Public */}
        <Route path="/login" element={!isAuthenticated ? <AuthPage /> : <Navigate to="/" replace />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password/:token" element={<ResetPassword />} />

        {/* Protected app shell */}
        <Route path="/" element={
          <ProtectedRoute>
            <DashboardLayout />
          </ProtectedRoute>
        }>
          <Route index element={<Dashboard />} />
          <Route path="projects" element={<Projects />} />
          <Route path="tasks" element={<Tasks />} />
          <Route path="tasks/:taskId" element={<TaskDetailView />} />
          <Route path="my-tasks" element={<MyTasks />} />
          <Route path="inbox" element={<Inbox />} />
          <Route path="communications" element={<Communications />} />
          <Route path="vault" element={<Vault />} />
          <Route path="team" element={<Team />} />
          <Route path="calendar" element={<Calendar />} />
          <Route path="settings" element={<Settings />} />
          <Route path="workload" element={
            <ProtectedRoute roles={['Super Admin', 'Admin', 'Project Manager']}>
              <Workload />
            </ProtectedRoute>
          } />
          <Route path="admin/users" element={
            <ProtectedRoute roles={['Super Admin']}>
              <UserManagement />
            </ProtectedRoute>
          } />
        </Route>

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  );
}
