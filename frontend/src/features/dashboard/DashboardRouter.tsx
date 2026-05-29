import React from 'react';
import { useAuthStore } from '../../store/useAuthStore.tsx';
import SuperAdminDashboard from './SuperAdminDashboard.tsx';
import AdminDashboard from './AdminDashboard.tsx';
import DeveloperDashboard from './DeveloperDashboard.tsx';

export default function DashboardRouter() {
  const { user } = useAuthStore();

  switch (user?.role) {
    case 'Super Admin':
      return <SuperAdminDashboard />;
    case 'Admin':
    case 'Project Manager':
      return <AdminDashboard />;
    default:
      return <DeveloperDashboard />;
  }
}
