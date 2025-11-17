import React from 'react';
import useAuthStore from '../stores/authStore';
import AdminDashboard from './admin/AdminDashboardPage';
import LandlordDashboard from './landlord/LandlordDashboard';
import StudentDashboard from './student/StudentDashboard';

const DashboardPage = () => {
  const { user } = useAuthStore();

  // Route to appropriate dashboard based on user role
  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  // Admin Dashboard
  if (user.role === 'admin') {
    return <AdminDashboard />;
  }

  // Landlord Dashboard
  if (user.role === 'landlord') {
    return <LandlordDashboard />;
  }

  // Student Dashboard (default)
  return <StudentDashboard />;
};

export default DashboardPage;
