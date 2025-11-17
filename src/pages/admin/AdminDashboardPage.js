import React, { useState } from 'react';
import { Shield, BarChart3, Users, Home, DollarSign, MessageSquare, FileText, Settings, Bell, Calendar } from 'lucide-react';
import AdminOverview from '../../components/admin/AdminOverview';
import AdminUserManagement from '../../components/admin/AdminUserManagement';
import AdminPropertyManagement from '../../components/admin/AdminPropertyManagement';
import AdminMessaging from '../../components/admin/AdminMessaging';
import AdminPayments from '../../components/admin/AdminPayments';
import AdminReports from '../../components/admin/AdminReports';
import AdminSettings from '../../components/admin/AdminSettings';
import AdminCampusLife from '../../components/admin/AdminCampusLife';

const AdminDashboardPage = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [notifications, setNotifications] = useState(5);

  const tabs = [
    { id: 'overview', label: 'Overview', icon: BarChart3, component: AdminOverview },
    { id: 'users', label: 'Users', icon: Users, component: AdminUserManagement },
    { id: 'properties', label: 'Properties', icon: Home, component: AdminPropertyManagement },
    { id: 'payments', label: 'Payments', icon: DollarSign, component: AdminPayments },
    { id: 'messages', label: 'Messages', icon: MessageSquare, component: AdminMessaging },
    { id: 'campus-life', label: 'Campus Life', icon: Calendar, component: AdminCampusLife },
    { id: 'reports', label: 'Reports', icon: FileText, component: AdminReports },
    { id: 'settings', label: 'Settings', icon: Settings, component: AdminSettings }
  ];

  const ActiveComponent = tabs.find(tab => tab.id === activeTab)?.component || AdminOverview;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Admin Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center">
              <Shield className="h-8 w-8 text-primary-600 mr-3" />
              <h1 className="text-2xl font-bold text-gray-900">Admin Control Panel</h1>
            </div>
            <div className="flex items-center space-x-4">
              <button className="relative p-2 text-gray-400 hover:text-gray-600">
                <Bell className="h-6 w-6" />
                {notifications > 0 && (
                  <span className="absolute top-0 right-0 h-5 w-5 bg-red-500 rounded-full text-white text-xs flex items-center justify-center">
                    {notifications}
                  </span>
                )}
              </button>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex space-x-8 overflow-x-auto">
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

      {/* Tab Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <ActiveComponent />
      </div>
    </div>
  );
};

export default AdminDashboardPage;
