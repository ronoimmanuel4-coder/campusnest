import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import Cookies from 'js-cookie';
import { authAPI } from '../services/api';
import toast from 'react-hot-toast';

const useAuthStore = create(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,

      // Login
      login: async (credentials) => {
        set({ isLoading: true, error: null });
        try {
          const response = await authAPI.login(credentials);
          const { token, user } = response.data;
          
          // Store token
          Cookies.set('token', token, { expires: 7 });
          localStorage.setItem('token', token);
          
          set({
            user,
            token,
            isAuthenticated: true,
            isLoading: false
          });
          
          toast.success('Login successful!');
          return response.data;
        } catch (error) {
          const message = error.response?.data?.message || 'Login failed';
          set({ error: message, isLoading: false });
          toast.error(message);
          throw error;
        }
      },

      // Register
      register: async (data) => {
        set({ isLoading: true, error: null });
        try {
          const response = await authAPI.register(data);
          const { token, user } = response.data;
          
          // Store token
          Cookies.set('token', token, { expires: 7 });
          localStorage.setItem('token', token);
          
          set({
            user,
            token,
            isAuthenticated: true,
            isLoading: false
          });
          
          toast.success('Registration successful! Please verify your email.');
          return response.data;
        } catch (error) {
          const message = error.response?.data?.message || 'Registration failed';
          set({ error: message, isLoading: false });
          toast.error(message);
          throw error;
        }
      },

      // Logout
      logout: async () => {
        try {
          await authAPI.logout();
        } catch (error) {
          console.error('Logout error:', error);
        } finally {
          // Clear auth data
          Cookies.remove('token');
          localStorage.removeItem('token');
          
          set({
            user: null,
            token: null,
            isAuthenticated: false
          });
          
          toast.success('Logged out successfully');
          window.location.href = '/';
        }
      },

      // Get current user
      fetchUser: async () => {
        const token = Cookies.get('token') || localStorage.getItem('token');
        
        if (!token) {
          set({ isAuthenticated: false });
          return;
        }
        
        try {
          const response = await authAPI.getMe();
          set({
            user: response.data.user,
            isAuthenticated: true
          });
        } catch (error) {
          console.error('Fetch user error:', error);
          set({
            user: null,
            isAuthenticated: false
          });
          
          // Remove invalid token
          Cookies.remove('token');
          localStorage.removeItem('token');
        }
      },

      // Update user profile
      updateProfile: async (data) => {
        try {
          const response = await authAPI.updateProfile(data);
          set({ user: response.data.user });
          toast.success('Profile updated successfully');
          return response.data;
        } catch (error) {
          const message = error.response?.data?.message || 'Update failed';
          toast.error(message);
          throw error;
        }
      },

      // Check if user has unlocked a property
      hasUnlockedProperty: (propertyId) => {
        const { user } = get();
        if (!user) return false;
        
        return user.unlockedProperties?.some(
          up => up.property === propertyId || up.property._id === propertyId
        );
      },

      // Check if property is saved
      hasPropertySaved: (propertyId) => {
        const { user } = get();
        if (!user) return false;
        
        return user.savedProperties?.some(
          p => p === propertyId || p._id === propertyId
        );
      },

      // Clear error
      clearError: () => set({ error: null })
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        isAuthenticated: state.isAuthenticated
      })
    }
  )
);

export default useAuthStore;
