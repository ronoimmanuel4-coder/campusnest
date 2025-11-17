import axios from 'axios';
import Cookies from 'js-cookie';
import toast from 'react-hot-toast';

// API base URL
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

// Create axios instance
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = Cookies.get('token') || localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Unauthorized - redirect to login
      Cookies.remove('token');
      localStorage.removeItem('token');
      window.location.href = '/login';
    } else if (error.response?.status === 403) {
      toast.error('You do not have permission to perform this action');
    } else if (error.response?.status === 500) {
      toast.error('Something went wrong. Please try again later.');
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  logout: () => api.post('/auth/logout'),
  getMe: () => api.get('/auth/me'),
  updatePassword: (data) => api.put('/auth/updatepassword', data),
  forgotPassword: (email) => api.post('/auth/forgotpassword', { email }),
  resetPassword: (token, password) => api.put(`/auth/resetpassword/${token}`, { password }),
  verifyEmail: (token) => api.get(`/auth/verify/${token}`),
  resendVerification: () => api.post('/auth/resend-verification')
};

// Properties API
export const propertiesAPI = {
  getAll: (params) => api.get('/properties', { params }),
  getById: (id) => api.get(`/properties/${id}`),
  getFeatured: () => api.get('/properties/featured'),
  getTrending: () => api.get('/properties/trending'),
  getNearby: () => api.get('/properties/nearby'),
  getMyProperties: () => api.get('/properties/my-properties'),
  getInquiries: () => api.get('/properties/inquiries'),
  createProperty: (formData) => {
    return api.post('/properties', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
  },
  create: (data) => {
    const formData = new FormData();
    Object.keys(data).forEach(key => {
      if (key === 'images' && data[key]) {
        data[key].forEach(image => {
          formData.append('images', image);
        });
      } else if (data[key] !== undefined && data[key] !== null) {
        formData.append(key, data[key]);
      }
    });
    return api.post('/properties', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
  },
  updateProperty: (id, data) => api.put(`/properties/${id}`, data),
  update: (id, data) => api.put(`/properties/${id}`, data),
  delete: (id) => api.delete(`/properties/${id}`),
  save: (id) => api.post(`/properties/${id}/save`),
  unlockProperty: (id) => api.post(`/properties/${id}/unlock`)
};

// Payments API
export const paymentsAPI = {
  unlockProperty: (propertyId, data) => api.post(`/payments/unlock/${propertyId}`, data),
  verifyPaystack: (reference) => api.get(`/payments/paystack/verify/${reference}`),
  getHistory: () => api.get('/payments/history'),
  getById: (id) => api.get(`/payments/${id}`),
  executeMpesa: (data) => api.post('/payments/mpesa/execute', data),
  executePaypal: (data) => api.post('/payments/paypal/execute', data),
  confirmStripe: (data) => api.post('/payments/stripe/confirm', data)
};

// Reviews API
export const reviewsAPI = {
  getByProperty: (propertyId, params) => api.get(`/reviews/property/${propertyId}`, { params }),
  create: (data) => api.post('/reviews', data),
  update: (id, data) => api.put(`/reviews/${id}`, data),
  delete: (id) => api.delete(`/reviews/${id}`),
  markHelpful: (id) => api.post(`/reviews/${id}/helpful`),
  report: (id, reason) => api.post(`/reviews/${id}/report`, { reason }),
  respond: (id, comment) => api.post(`/reviews/${id}/respond`, { comment })
};

// Users API
export const usersAPI = {
  getProfile: () => api.get('/users/profile'),
  updateProfile: (data) => {
    const formData = new FormData();
    Object.keys(data).forEach(key => {
      if (data[key] !== undefined && data[key] !== null) {
        formData.append(key, data[key]);
      }
    });
    return api.put('/users/profile', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
  },
  updateProfilePicture: (formData) => {
    return api.put('/users/profile-picture', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
  },
  getUnlockedProperties: () => api.get('/users/unlocked-properties'),
  getSavedProperties: () => api.get('/users/saved-properties'),
  getMyProperties: () => api.get('/users/my-properties'),
  getLandlordStats: () => api.get('/users/landlord-stats'),
  getCampusServices: () => api.get('/users/campus-services'),
  getSubscription: () => api.get('/users/subscription'),
  updateSubscription: (data) => api.post('/users/subscription', data),
  deleteAccount: (data) => api.delete('/users/account', { data }),
  getRoommates: () => api.get('/users/roommates'),
  getMessagesWithUser: (userId) => api.get(`/users/messages/${userId}`),
  sendMessage: (data) => api.post('/users/messages', data),
  getNotifications: () => api.get('/users/notifications'),
  markNotificationRead: (id) => api.put(`/users/notifications/${id}/read`),
  getStatistics: () => api.get('/users/statistics'),
  createSupportTicket: (data) => api.post('/users/support-tickets', data)
};

// WhatsApp API
export const whatsappAPI = {
  sendInquiry: (data) => api.post('/whatsapp/send-inquiry', data),
  scheduleViewing: (data) => api.post('/whatsapp/schedule-viewing', data),
  getTemplates: () => api.get('/whatsapp/templates')
};

// Admin API
export const adminAPI = {
  // Dashboard
  getDashboard: () => api.get('/admin/dashboard'),
  
  // User Management
  getUsers: (params) => api.get('/admin/users', { params }),
  updateUser: (id, data) => api.put(`/admin/users/${id}`, data),
  deleteUser: (id) => api.delete(`/admin/users/${id}`),
  verifyUser: (id) => api.put(`/admin/users/${id}/verify`),
  banUser: (id) => api.put(`/admin/users/${id}/ban`),
  unbanUser: (id) => api.put(`/admin/users/${id}/unban`),
  updateUserRole: (id, role) => api.put(`/admin/users/${id}/role`, { role }),
  resetUserPassword: (id, data) => api.put(`/admin/users/${id}/reset-password`, data),
  approveLandlord: (id) => api.put(`/admin/users/${id}/approve-landlord`),
  rejectLandlord: (id) => api.put(`/admin/users/${id}/reject-landlord`),
  
  // Property Management
  getProperties: (params) => api.get('/admin/properties', { params }),
  verifyProperty: (id) => api.put(`/admin/properties/${id}/verify`),
  approveProperty: (id) => api.put(`/admin/properties/${id}/approve`),
  rejectProperty: (id) => api.put(`/admin/properties/${id}/reject`),
  deleteProperty: (id) => api.delete(`/admin/properties/${id}`),
  pinProperty: (id) => api.put(`/admin/properties/${id}/pin`),
  unpinProperty: (id) => api.put(`/admin/properties/${id}/unpin`),
  featureProperty: (id, data) => api.put(`/admin/properties/${id}/feature`, data),
  unfeatureProperty: (id) => api.put(`/admin/properties/${id}/unfeature`),
  
  // Payments
  getPayments: (params) => api.get('/admin/payments', { params }),
  refundPayment: (id, data) => api.post(`/admin/payments/${id}/refund`, data),
  
  // Reviews
  getReviews: (params) => api.get('/admin/reviews', { params }),
  moderateReview: (id, data) => api.put(`/admin/reviews/${id}`, data),
  
  // Analytics
  getAnalytics: (params) => api.get('/admin/analytics', { params }),

  // Messaging & Support
  getMessages: () => api.get('/admin/messages'),
  sendBroadcast: (data) => api.post('/admin/messages/broadcast', data),
  getSupportTickets: (params) => api.get('/admin/support-tickets', { params }),
  replyToTicket: (id, message) => api.post(`/admin/support-tickets/${id}/reply`, { message }),
  updateTicketStatus: (id, status) => api.put(`/admin/support-tickets/${id}/status`, { status }),
  getCampusContent: () => api.get('/admin/campus-content'),
  updateCampusContent: (data) => api.put('/admin/campus-content', data)
};

export default api;
