import React, { useState, useEffect } from 'react';
import { 
  Home, Eye, Users, TrendingUp, DollarSign, MessageSquare,
  Star, Calendar, Bell, Settings, Plus, Edit, BarChart3,
  Clock, CheckCircle, AlertCircle, MapPin, Bed, Bath,
  Car, Wifi, Shield, Phone, Mail, UserCheck, RefreshCw, Camera
} from 'lucide-react';
import { propertiesAPI, usersAPI, authAPI } from '../../services/api';
import toast from 'react-hot-toast';
import AddPropertyModal from '../../components/landlord/AddPropertyModal';
import EditPropertyModal from '../../components/landlord/EditPropertyModal';
import useAuthStore from '../../stores/authStore';

const LandlordDashboard = () => {
  const { user, fetchUser } = useAuthStore();
  const [activeTab, setActiveTab] = useState('overview');
  const [properties, setProperties] = useState([]);
  const [tenants, setTenants] = useState([]);
  const [stats, setStats] = useState({});
  const [inquiries, setInquiries] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAddPropertyModal, setShowAddPropertyModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedProperty, setSelectedProperty] = useState(null);
  const [profilePicture, setProfilePicture] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showNotifications, setShowNotifications] = useState(false);
  const [profileForm, setProfileForm] = useState({
    name: '',
    email: '',
    phone: ''
  });
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [isSavingPassword, setIsSavingPassword] = useState(false);

  useEffect(() => {
    const init = async () => {
      console.log('=== LANDLORD USER INFO ===');
      console.log('Current User (before refresh):', user);
      console.log('User ID:', user?._id);
      console.log('User Role:', user?.role);

      // Refresh user from backend so latest isApproved/isBanned/etc. are used
      try {
        await fetchUser();
      } catch (error) {
        console.error('Failed to refresh user in landlord dashboard:', error);
      }

      await fetchDashboardData();
      await fetchNotifications();
    };

    init();
  }, []);

  useEffect(() => {
    if (user) {
      setProfileForm({
        name: user.name || '',
        email: user.email || '',
        phone: user.phone || ''
      });
    }
  }, [user]);

  const fetchDashboardData = async () => {
    try {
      const [propsRes, statsRes, inquiriesRes] = await Promise.all([
        propertiesAPI.getMyProperties(),
        usersAPI.getLandlordStats(),
        propertiesAPI.getInquiries()
      ]);
      
      console.log('=== MY PROPERTIES DEBUG ===');
      console.log('Full Response:', propsRes);
      console.log('Response Data:', propsRes.data);
      console.log('Response Data.data:', propsRes.data?.data);
      console.log('Response Data.properties:', propsRes.data?.properties);
      console.log('Response Data.data.properties:', propsRes.data?.data?.properties);
      
      // Handle different response structures
      let propertiesData = [];
      
      if (propsRes.data?.data?.properties) {
        // Structure: { data: { properties: [...] } }
        propertiesData = propsRes.data.data.properties;
        console.log('Using data.data.properties');
      } else if (propsRes.data?.properties) {
        // Structure: { properties: [...] }
        propertiesData = propsRes.data.properties;
        console.log('Using data.properties');
      } else if (propsRes.data?.data && Array.isArray(propsRes.data.data)) {
        // Structure: { data: [...] }
        propertiesData = propsRes.data.data;
        console.log('Using data.data (array)');
      } else if (Array.isArray(propsRes.data)) {
        // Structure: [...]
        propertiesData = propsRes.data;
        console.log('Using data (array)');
      }
      
      console.log('Final Properties Data:', propertiesData);
      console.log('Properties Count:', propertiesData.length);
      
      setProperties(Array.isArray(propertiesData) ? propertiesData : []);
      const statsData =
        statsRes.data?.data?.stats ||
        statsRes.data?.stats ||
        {};

      setStats(statsData);

      const inquiriesData =
        inquiriesRes.data?.data?.inquiries ||
        inquiriesRes.data?.inquiries ||
        [];

      setInquiries(Array.isArray(inquiriesData) ? inquiriesData : []);
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
      console.error('Error details:', error.response?.data);
      toast.error('Failed to load dashboard data');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchNotifications = async () => {
    try {
      const res = await usersAPI.getNotifications();
      const items = res.data.data || res.data.notifications || [];
      setNotifications(items);
      setUnreadCount(items.filter((n) => !n.read).length);
    } catch (error) {
      console.error('Failed to load notifications:', error);
    }
  };

  const updatePropertyStatus = async (propertyId, status) => {
    try {
      await propertiesAPI.updateProperty(propertyId, { status });
      toast.success('Property status updated');
      fetchDashboardData();
    } catch (error) {
      toast.error('Failed to update property status');
    }
  };

  const handleProfilePictureUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 15 * 1024 * 1024) {
      toast.error('Image size should be less than 15MB');
      return;
    }

    const formData = new FormData();
    formData.append('profilePicture', file);

    try {
      const response = await usersAPI.updateProfilePicture(formData);
      setProfilePicture(response.data.profilePicture);
      toast.success('Profile picture updated');
    } catch (error) {
      toast.error('Failed to update profile picture');
    }
  };

  const handleAddPropertySuccess = (newProperty) => {
    setProperties([newProperty, ...properties]);
    fetchDashboardData();
  };

  const handleEditProperty = (property) => {
    setSelectedProperty(property);
    setShowEditModal(true);
  };

  const handleEditSuccess = () => {
    fetchDashboardData();
  };

  const handleCallInquirer = (inquiry) => {
    const phone = inquiry?.user?.phone;
    if (!phone) {
      toast.error('No phone number available for this inquirer');
      return;
    }

    window.location.href = `tel:${phone}`;
  };

  const handleEmailInquirer = (inquiry) => {
    const email = inquiry?.user?.email;
    if (!email) {
      toast.error('No email address available for this inquirer');
      return;
    }

    const subject = encodeURIComponent(
      `Inquiry about ${inquiry?.property?.title || 'your property inquiry'}`
    );
    const body = encodeURIComponent(
      `Hi ${inquiry?.user?.name || ''},\n\n` +
      `Regarding your ${
        inquiry?.type === 'viewing' ? 'viewing request' : 'inquiry'
      } for ${inquiry?.property?.title || 'the property'}.\n\n` +
      'Best regards,\n' +
      (user?.name || 'Landlord')
    );

    window.location.href = `mailto:${email}?subject=${subject}&body=${body}`;
  };

  const handleWhatsAppInquirer = (inquiry) => {
    const phone = inquiry?.user?.phone;
    if (!phone) {
      toast.error('No phone number available for this inquirer');
      return;
    }

    // Remove non-digit characters to make a valid WhatsApp number
    const normalized = phone.replace(/[^0-9]/g, '');
    const message = encodeURIComponent(
      `Hi ${inquiry?.user?.name || ''}, I am contacting you about your ${
        inquiry?.type === 'viewing' ? 'viewing request' : 'inquiry'
      } for ${inquiry?.property?.title || 'the property'}.`
    );

    const url = `https://wa.me/${normalized}?text=${message}`;
    window.open(url, '_blank');
  };

  const handleProfileInputChange = (e) => {
    const { name, value } = e.target;
    setProfileForm((prev) => ({
      ...prev,
      [name]: value
    }));
  };

  const handlePasswordInputChange = (e) => {
    const { name, value } = e.target;
    setPasswordForm((prev) => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    try {
      setIsSavingProfile(true);
      let phone = profileForm.phone.trim();

      if (phone) {
        if (phone.startsWith('0')) {
          phone = '+254' + phone.substring(1);
        } else if (phone.startsWith('254')) {
          phone = '+' + phone;
        } else if (!phone.startsWith('+254')) {
          phone = '+254' + phone;
        }
      }

      await usersAPI.updateProfile({
        name: profileForm.name,
        email: profileForm.email,
        phone
      });

      await fetchUser();
      toast.success('Profile updated successfully');
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to update profile';
      toast.error(message);
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handleSavePassword = async (e) => {
    e.preventDefault();
    if (!passwordForm.currentPassword || !passwordForm.newPassword || !passwordForm.confirmPassword) {
      toast.error('Please fill in all password fields');
      return;
    }
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast.error('New passwords do not match');
      return;
    }

    try {
      setIsSavingPassword(true);
      await authAPI.updatePassword({
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword
      });
      toast.success('Password updated successfully');
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to update password';
      toast.error(message);
    } finally {
      setIsSavingPassword(false);
    }
  };

  const landlordActivityData = [
    { label: 'Views', value: stats.totalViews || 0 },
    { label: 'Inquiries', value: stats.totalInquiries || 0 },
    { label: 'Properties', value: stats.totalProperties || 0 }
  ];

  const landlordActivityMax = landlordActivityData.reduce(
    (max, item) => Math.max(max, item.value || 0),
    0
  );

  const propertyViewsData = properties.map((property) => ({
    label: property.title || 'Property',
    value: property.stats?.views || property.views || 0
  }));

  const propertyViewsMax = propertyViewsData.reduce(
    (max, item) => Math.max(max, item.value || 0),
    0
  );

  const inquirySourcesData = [
    {
      label: 'Inquiries',
      value: inquiries.filter((inq) => inq.type !== 'viewing').length
    },
    {
      label: 'Viewing Requests',
      value: inquiries.filter((inq) => inq.type === 'viewing').length
    }
  ];

  const inquirySourcesMax = inquirySourcesData.reduce(
    (max, item) => Math.max(max, item.value || 0),
    0
  );

  const buildLinePoints = (data, max) => {
    if (!data.length || !max) return '';
    const n = data.length;
    return data
      .map((item, index) => {
        const x = n === 1 ? 50 : (index / (n - 1)) * 90 + 5;
        const value = item.value || 0;
        const y = 95 - (value / max) * 80;
        return `${x},${y}`;
      })
      .join(' ');
  };

  const landlordActivityPoints = buildLinePoints(
    landlordActivityData,
    landlordActivityMax
  );

  const propertyViewsPoints = buildLinePoints(
    propertyViewsData,
    propertyViewsMax
  );

  const inquirySourcesPoints = buildLinePoints(
    inquirySourcesData,
    inquirySourcesMax
  );

  const tabs = [
    { id: 'overview', label: 'Overview', icon: BarChart3 },
    { id: 'properties', label: 'My Properties', icon: Home },
    { id: 'tenants', label: 'Tenants', icon: Users },
    { id: 'inquiries', label: 'Inquiries', icon: MessageSquare },
    { id: 'analytics', label: 'Analytics', icon: TrendingUp },
    { id: 'settings', label: 'Settings', icon: Settings }
  ];

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 overflow-x-hidden">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 py-4">
            <div className="flex items-center space-x-4">
              <div className="relative">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleProfilePictureUpload}
                  className="hidden"
                  id="profile-upload"
                />
                <label htmlFor="profile-upload" className="cursor-pointer">
                  <div className="h-12 w-12 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden">
                    {profilePicture || user?.profilePicture ? (
                      <img 
                        src={profilePicture || user?.profilePicture} 
                        alt={user?.name}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <Camera className="h-6 w-6 text-gray-400" />
                    )}
                  </div>
                </label>
                {user?.isApproved && (
                  <CheckCircle className="absolute -bottom-1 -right-1 h-5 w-5 text-green-500 bg-white rounded-full" />
                )}
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  {user?.name || 'Landlord Dashboard'}
                </h1>
                <p className="text-sm text-gray-500">
                  {user?.isApproved ? 'Verified Landlord' : 'Pending Approval'}
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-3 sm:space-x-4">
              <div className="relative">
                <button
                  className="relative p-2 text-gray-400 hover:text-gray-600"
                  onClick={() => setShowNotifications(!showNotifications)}
                >
                  <Bell className="h-6 w-6" />
                  {unreadCount > 0 && (
                    <span className="absolute top-0 right-0 h-5 w-5 bg-red-500 rounded-full text-white text-xs flex items-center justify-center">
                      {unreadCount}
                    </span>
                  )}
                </button>
                {showNotifications && (
                  <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg z-50 max-h-80 overflow-y-auto">
                    <div className="px-4 py-2 border-b flex items-center justify-between">
                      <span className="font-semibold text-sm">Notifications</span>
                      {unreadCount > 0 && (
                        <span className="text-xs text-gray-500">{unreadCount} unread</span>
                      )}
                    </div>
                    <div className="divide-y divide-gray-100">
                      {notifications.length === 0 ? (
                        <div className="px-4 py-3 text-sm text-gray-500 flex items-center">
                          <AlertCircle className="h-4 w-4 mr-2 text-gray-400" />
                          No notifications yet
                        </div>
                      ) : (
                        notifications.slice(0, 10).map((n) => (
                          <div
                            key={n._id || n.id}
                            className={`px-4 py-3 text-sm ${
                              n.read ? 'bg-white' : 'bg-primary-50'
                            }`}
                          >
                            <p className="font-medium truncate">{n.title || 'CampusNest Update'}</p>
                            <p className="text-xs text-gray-600 mt-1 line-clamp-2">{n.message}</p>
                            <p className="text-xs text-gray-400 mt-1">
                              {n.createdAt ? new Date(n.createdAt).toLocaleString() : ''}
                            </p>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>
              <button 
                onClick={() => setShowAddPropertyModal(true)}
                disabled={!user?.isApproved}
                className="btn-primary flex items-center disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Property
              </button>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex space-x-6 sm:space-x-8 overflow-x-auto pb-1 -mx-4 px-4 sm:mx-0 sm:px-0">
            {tabs.map(tab => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center space-x-2 py-3 border-b-2 transition-colors ${
                    activeTab === tab.id
                      ? 'border-primary-600 text-primary-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <Icon className="h-5 w-5" />
                  <span className="font-medium">{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div>
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Total Properties</p>
                    <p className="text-3xl font-bold text-gray-900">{stats.totalProperties || 0}</p>
                    <p className="text-sm text-green-600 mt-1">
                      {stats.activeProperties || 0} active
                    </p>
                  </div>
                  <Home className="h-8 w-8 text-blue-600 opacity-20" />
                </div>
              </div>
              
              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Total Views</p>
                    <p className="text-3xl font-bold text-gray-900">{stats.totalViews || 0}</p>
                    <p className="text-sm text-gray-500 mt-1">
                      +{stats.viewsThisWeek || 0} this week
                    </p>
                  </div>
                  <Eye className="h-8 w-8 text-green-600 opacity-20" />
                </div>
              </div>
              
              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Inquiries</p>
                    <p className="text-3xl font-bold text-gray-900">{stats.totalInquiries || 0}</p>
                    <p className="text-sm text-yellow-600 mt-1">
                      {stats.pendingInquiries || 0} pending
                    </p>
                  </div>
                  <MessageSquare className="h-8 w-8 text-yellow-600 opacity-20" />
                </div>
              </div>
              
              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Avg Rating</p>
                    <p className="text-3xl font-bold text-gray-900">
                      {stats.averageRating?.toFixed(1) || '0.0'}
                    </p>
                    <div className="flex items-center mt-1">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star
                          key={star}
                          className={`h-4 w-4 ${
                            star <= Math.round(stats.averageRating || 0)
                              ? 'text-yellow-400 fill-current'
                              : 'text-gray-300'
                          }`}
                        />
                      ))}
                    </div>
                  </div>
                  <Star className="h-8 w-8 text-purple-600 opacity-20" />
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Inquiries</h3>
                <div className="space-y-3">
                  {inquiries.slice(0, 3).map((inquiry, index) => (
                    <div key={index} className="flex items-start space-x-3">
                      <div className="p-2 bg-blue-100 rounded-full">
                        <MessageSquare className="h-4 w-4 text-blue-600" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900">{inquiry.user?.name}</p>
                        <p className="text-xs text-gray-500">{inquiry.property?.title}</p>
                        <p className="text-xs text-gray-400">{inquiry.timeAgo}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Property Performance</h3>
                <div className="space-y-3">
                  {properties.slice(0, 3).map((property, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <p className="text-sm text-gray-900 truncate">{property.title}</p>
                      <div className="flex items-center text-sm text-gray-500">
                        <Eye className="h-3 w-3 mr-1" />
                        {property.views}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Stats</h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Occupancy Rate</span>
                    <span className="text-sm font-semibold text-gray-900">
                      {stats.occupancyRate || 0}%
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Response Rate</span>
                    <span className="text-sm font-semibold text-gray-900">
                      {stats.responseRate || 0}%
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Verified Status</span>
                    <span className="text-sm text-green-600 font-semibold">
                      <CheckCircle className="inline h-4 w-4" /> Verified
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Recent Activity Chart */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Activity Overview</h3>
              <div className="h-64 bg-gray-50 rounded px-4 py-3">
                {!landlordActivityMax ? (
                  <div className="flex items-center justify-center h-full text-gray-400 text-sm">
                    No activity data yet
                  </div>
                ) : (
                  <svg viewBox="0 0 100 100" className="w-full h-full">
                    <polyline
                      fill="none"
                      stroke="#3b82f6"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      points={landlordActivityPoints}
                    />
                    {landlordActivityData.map((item, index) => {
                      const n = landlordActivityData.length || 1;
                      const x = n === 1 ? 50 : (index / (n - 1)) * 90 + 5;
                      const value = item.value || 0;
                      const y =
                        landlordActivityMax > 0
                          ? 95 - (value / landlordActivityMax) * 80
                          : 95;
                      return (
                        <circle
                          key={item.label || index}
                          cx={x}
                          cy={y}
                          r={1.8}
                          fill="#1d4ed8"
                        />
                      );
                    })}
                  </svg>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Settings Tab */}
        {activeTab === 'settings' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Profile Settings */}
            <div className="bg-white rounded-lg shadow p-6 lg:col-span-2">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Profile Settings</h2>
              <form onSubmit={handleSaveProfile} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                  <input
                    type="text"
                    name="name"
                    value={profileForm.name}
                    onChange={handleProfileInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                    placeholder="Enter your full name"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
                  <input
                    type="email"
                    name="email"
                    value={profileForm.email}
                    onChange={handleProfileInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                    placeholder="Enter your email address"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
                  <input
                    type="tel"
                    name="phone"
                    value={profileForm.phone}
                    onChange={handleProfileInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                    placeholder="e.g., 0712345678 or +254712345678"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Kenyan number; you can type 07... and it will be saved as +254...
                  </p>
                </div>

                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={isSavingProfile}
                    className={`btn-primary ${isSavingProfile ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    {isSavingProfile ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              </form>
            </div>

            {/* Password Settings */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Password Settings</h2>
              <form onSubmit={handleSavePassword} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Current Password</label>
                  <input
                    type="password"
                    name="currentPassword"
                    value={passwordForm.currentPassword}
                    onChange={handlePasswordInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                    placeholder="Enter current password"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">New Password</label>
                  <input
                    type="password"
                    name="newPassword"
                    value={passwordForm.newPassword}
                    onChange={handlePasswordInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                    placeholder="Enter new password"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Confirm New Password</label>
                  <input
                    type="password"
                    name="confirmPassword"
                    value={passwordForm.confirmPassword}
                    onChange={handlePasswordInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                    placeholder="Re-enter new password"
                  />
                </div>

                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={isSavingPassword}
                    className={`btn-primary ${isSavingPassword ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    {isSavingPassword ? 'Updating...' : 'Update Password'}
                  </button>
                </div>
              </form>
            </div>

            {/* Contact Admin */}
            <div className="bg-white rounded-lg shadow p-6 h-fit">
              <h2 className="text-xl font-bold text-gray-900 mb-2">Need Help?</h2>
              <p className="text-sm text-gray-600 mb-4">
                For urgent issues, complaints, or account problems, you can reach the CampusNest admin directly.
              </p>
              <div className="space-y-3">
                <button
                  type="button"
                  onClick={() => window.location.href = 'tel:0741218862'}
                  className="w-full inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700"
                >
                  <Phone className="h-4 w-4 mr-2" />
                  Call Admin (0741 218 862)
                </button>
                <button
                  type="button"
                  onClick={() => window.open('https://wa.me/254741218862', '_blank')}
                  className="w-full inline-flex items-center justify-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-green-700 bg-white hover:bg-gray-50"
                >
                  <MessageSquare className="h-4 w-4 mr-2" />
                  WhatsApp Admin
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Properties Tab */}
        {activeTab === 'properties' && (
          <div>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-gray-900">My Properties</h2>
              <button onClick={fetchDashboardData} className="p-2 text-gray-600 hover:text-gray-900">
                <RefreshCw className="h-5 w-5" />
              </button>
            </div>

            {properties.length === 0 ? (
              <div className="col-span-full text-center py-12 bg-white rounded-lg shadow">
                <Home className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No Properties Yet</h3>
                <p className="text-gray-600 mb-4">Start by adding your first property</p>
                <button
                  onClick={() => setShowAddPropertyModal(true)}
                  className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
                >
                  <Plus className="inline h-4 w-4 mr-2" />
                  Add Property
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {properties.map((property) => {
                  const imageUrl = typeof property.images?.[0] === 'string' 
                    ? property.images[0] 
                    : property.images?.[0]?.url;
                  const bedrooms = property.specifications?.bedrooms || property.bedrooms || 0;
                  const bathrooms = property.specifications?.bathrooms || property.bathrooms || 0;
                  const views = property.stats?.views || property.views || 0;
                  const vacancies = property.availability?.vacancies || property.vacancies || 0;

                  return (
                    <div key={property._id} className="bg-white rounded-lg shadow overflow-hidden">
                      <div className="aspect-w-16 aspect-h-9 bg-gray-200">
                        {imageUrl ? (
                          <img 
                            src={imageUrl} 
                            alt={property.title}
                            className="w-full h-48 object-cover"
                            onError={(e) => {
                              e.target.style.display = 'none';
                              e.target.parentElement.innerHTML = '<div class="w-full h-48 flex items-center justify-center"><svg class="h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"></path></svg></div>';
                            }}
                          />
                        ) : (
                          <div className="w-full h-48 flex items-center justify-center">
                            <Home className="h-12 w-12 text-gray-400" />
                          </div>
                        )}
                      </div>
                      <div className="p-4">
                        <h3 className="font-semibold text-gray-900 mb-1">{property.title}</h3>
                        <p className="text-sm text-gray-600 mb-2">
                          <MapPin className="inline h-4 w-4 mr-1" />
                          {property.location?.area || 'Location not specified'}
                        </p>
                        <div className="flex items-center justify-between mb-3">
                          <span className="text-lg font-bold text-primary-600">
                            KSh {(property.price?.amount || property.price || 0).toLocaleString()}/month
                          </span>
                          <span className={`px-2 py-1 text-xs rounded-full ${
                            property.status === 'active' 
                              ? 'bg-green-100 text-green-600'
                              : property.status === 'occupied'
                              ? 'bg-blue-100 text-blue-600'
                              : property.status === 'pending'
                              ? 'bg-yellow-100 text-yellow-600'
                              : 'bg-gray-100 text-gray-600'
                          }`}>
                            {property.status}
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-sm text-gray-500 mb-3">
                          <div className="flex items-center space-x-3">
                            <span className="flex items-center">
                              <Bed className="h-4 w-4 mr-1" />
                              {bedrooms}
                            </span>
                            <span className="flex items-center">
                              <Bath className="h-4 w-4 mr-1" />
                              {bathrooms}
                            </span>
                            <span className="flex items-center">
                              <Eye className="h-4 w-4 mr-1" />
                              {views}
                            </span>
                          </div>
                          {vacancies > 0 && (
                            <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded">
                              {vacancies} vacant
                            </span>
                          )}
                        </div>
                    <div className="flex space-x-2">
                      <button 
                        onClick={() => handleEditProperty(property)}
                        className="flex-1 px-3 py-2 bg-primary-600 text-white rounded text-sm hover:bg-primary-700"
                      >
                        <Edit className="inline h-4 w-4 mr-1" />
                        Edit
                      </button>
                      <button
                        onClick={() => updatePropertyStatus(
                          property._id,
                          property.status === 'active' ? 'occupied' : 'active'
                        )}
                        className="flex-1 px-3 py-2 border border-gray-300 text-gray-700 rounded text-sm hover:bg-gray-50"
                      >
                        Mark as {property.status === 'active' ? 'Occupied' : 'Available'}
                      </button>
                    </div>
                  </div>
                </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Inquiries Tab */}
        {activeTab === 'inquiries' && (
          <div>
            <h2 className="text-xl font-bold text-gray-900 mb-6">Property Inquiries</h2>
            <div className="bg-white rounded-lg shadow">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Inquirer
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Property
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Message
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Date
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {inquiries.map((inquiry) => (
                      <tr key={inquiry._id}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <p className="text-sm font-medium text-gray-900">{inquiry.user?.name}</p>
                            <p className="text-xs text-gray-500">{inquiry.user?.phone}</p>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <p className="text-sm text-gray-900">{inquiry.property?.title}</p>
                        </td>
                        <td className="px-6 py-4">
                          <p className="text-sm text-gray-600">{inquiry.message}</p>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {new Date(inquiry.createdAt).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex space-x-2">
                            <button
                              onClick={() => handleCallInquirer(inquiry)}
                              className="text-blue-600 hover:text-blue-900"
                            >
                              <Phone className="h-5 w-5" />
                            </button>
                            <button
                              onClick={() => handleEmailInquirer(inquiry)}
                              className="text-green-600 hover:text-green-900"
                            >
                              <Mail className="h-5 w-5" />
                            </button>
                            <button
                              onClick={() => handleWhatsAppInquirer(inquiry)}
                              className="text-purple-600 hover:text-purple-900"
                            >
                              <MessageSquare className="h-5 w-5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Analytics Tab */}
        {activeTab === 'analytics' && (
          <div>
            <h2 className="text-xl font-bold text-gray-900 mb-6">Property Analytics</h2>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Views Trend</h3>
                <div className="h-64 bg-gray-50 rounded px-4 py-3">
                  {!propertyViewsData.length || !propertyViewsMax ? (
                    <div className="flex items-center justify-center h-full text-gray-400 text-sm">
                      No views data yet
                    </div>
                  ) : (
                    <svg viewBox="0 0 100 100" className="w-full h-full">
                      <polyline
                        fill="none"
                        stroke="#3b82f6"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        points={propertyViewsPoints}
                      />
                      {propertyViewsData.slice(0, 10).map((item, index) => {
                        const n = Math.min(propertyViewsData.length, 10) || 1;
                        const x = n === 1 ? 50 : (index / (n - 1)) * 90 + 5;
                        const value = item.value || 0;
                        const y =
                          propertyViewsMax > 0
                            ? 95 - (value / propertyViewsMax) * 80
                            : 95;
                        return (
                          <circle
                            key={`${item.label}-${index}`}
                            cx={x}
                            cy={y}
                            r={1.8}
                            fill="#1d4ed8"
                          />
                        );
                      })}
                    </svg>
                  )}
                </div>
              </div>
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Inquiry Sources</h3>
                <div className="h-64 bg-gray-50 rounded px-4 py-3">
                  {!inquirySourcesMax ? (
                    <div className="flex items-center justify-center h-full text-gray-400 text-sm">
                      No inquiries yet
                    </div>
                  ) : (
                    <svg viewBox="0 0 100 100" className="w-full h-full">
                      <polyline
                        fill="none"
                        stroke="#22c55e"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        points={inquirySourcesPoints}
                      />
                      {inquirySourcesData.map((item, index) => {
                        const n = inquirySourcesData.length || 1;
                        const x = n === 1 ? 50 : (index / (n - 1)) * 90 + 5;
                        const value = item.value || 0;
                        const y =
                          inquirySourcesMax > 0
                            ? 95 - (value / inquirySourcesMax) * 80
                            : 95;
                        return (
                          <circle
                            key={item.label || index}
                            cx={x}
                            cy={y}
                            r={1.8}
                            fill="#16a34a"
                          />
                        );
                      })}
                    </svg>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Add Property Modal */}
      <AddPropertyModal 
        isOpen={showAddPropertyModal}
        onClose={() => setShowAddPropertyModal(false)}
        onSuccess={handleAddPropertySuccess}
      />

      {/* Edit Property Modal */}
      {showEditModal && (
        <EditPropertyModal
          property={selectedProperty}
          onClose={() => {
            setShowEditModal(false);
            setSelectedProperty(null);
          }}
          onSuccess={handleEditSuccess}
        />
      )}
    </div>
  );
};

export default LandlordDashboard;
