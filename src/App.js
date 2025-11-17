import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import HomePage from './pages/HomePage';
import ListingsPage from './pages/ListingsPage';
import PropertyDetailPage from './pages/PropertyDetailPage';
import PaystackCallbackPage from './pages/PaystackCallbackPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import AboutPage from './pages/AboutPage';
import useAuthStore from './stores/authStore';
import ProtectedRoute from './components/ProtectedRoute';
import DashboardPage from './pages/DashboardPage';
import ProfilePage from './pages/ProfilePage';
import SavedPropertiesPage from './pages/SavedPropertiesPage';
import UnlockedPropertiesPage from './pages/UnlockedPropertiesPage';
import AdminDashboardPage from './pages/AdminDashboardPage';
import Loader from './components/Loader';

const AppRoutes = () => {
  const location = useLocation();
  const [routeLoading, setRouteLoading] = useState(true);

  useEffect(() => {
    setRouteLoading(true);
    const timeout = setTimeout(() => setRouteLoading(false), 3000); // 3 seconds loader on every navigation
    return () => clearTimeout(timeout);
  }, [location.pathname]);

  if (routeLoading) {
    return <Loader />;
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Navbar />
      <main className="flex-grow">
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<HomePage />} />
          <Route path="/listings" element={<ListingsPage />} />
          <Route path="/property/:id" element={<PropertyDetailPage />} />
          <Route path="/payment/paystack/callback" element={<PaystackCallbackPage />} />
          <Route path="/about" element={<AboutPage />} />
          <Route path="/loader" element={<Loader />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          
          {/* Protected Routes */}
          <Route 
            path="/dashboard" 
            element={
              <ProtectedRoute>
                <DashboardPage />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/profile" 
            element={
              <ProtectedRoute>
                <ProfilePage />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/saved-properties" 
            element={
              <ProtectedRoute>
                <SavedPropertiesPage />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/unlocked-properties" 
            element={
              <ProtectedRoute>
                <UnlockedPropertiesPage />
              </ProtectedRoute>
            } 
          />
          
          {/* Admin Routes */}
          <Route 
            path="/admin" 
            element={
              <ProtectedRoute adminOnly>
                <AdminDashboardPage />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/admin/dashboard" 
            element={
              <ProtectedRoute adminOnly>
                <AdminDashboardPage />
              </ProtectedRoute>
            } 
          />
          
          {/* Redirect */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
      <Footer />
    </div>
  );
};

function App() {
  const { fetchUser, isAuthenticated, isLoading } = useAuthStore();

  useEffect(() => {
    fetchUser();
  }, [fetchUser]);

  if (isLoading) {
    return <Loader />;
  }

  return (
    <Router>
      <AppRoutes />
      <Toaster 
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: '#363636',
            color: '#fff',
          },
          success: {
            duration: 3000,
            iconTheme: {
              primary: '#4ade80',
              secondary: '#fff',
            },
          },
          error: {
            duration: 5000,
            iconTheme: {
              primary: '#ef4444',
              secondary: '#fff',
            },
          },
        }}
      />
    </Router>
  );
}

export default App;
