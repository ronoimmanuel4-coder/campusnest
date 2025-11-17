import React, { useState, useEffect } from 'react';
import { 
  Users, Home, DollarSign, Star, TrendingUp, Activity,
  Eye, MessageSquare, UserCheck, Clock, AlertCircle,
  ArrowUp, ArrowDown, BarChart3, Calendar
} from 'lucide-react';
import { adminAPI } from '../../services/api';
import toast from 'react-hot-toast';

const AdminOverview = () => {
  const [stats, setStats] = useState({});
  const [recentActivity, setRecentActivity] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('7days');

  useEffect(() => {
    fetchDashboardData();
  }, [timeRange]);

  const fetchDashboardData = async () => {
    try {
      const response = await adminAPI.getDashboard({ timeRange });
      setStats(response.data.statistics || {});
      setRecentActivity(response.data.recentActivity || []);
    } catch (error) {
      toast.error('Failed to load dashboard data');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  const statCards = [
    {
      title: 'Total Users',
      value: stats.users?.total || 0,
      change: stats.users?.percentageChange || 0,
      changeValue: `+${stats.users?.newThisWeek || 0} this week`,
      icon: Users,
      color: 'blue'
    },
    {
      title: 'Active Properties',
      value: stats.properties?.active || 0,
      subtitle: `${stats.properties?.pending || 0} pending approval`,
      icon: Home,
      color: 'green'
    },
    {
      title: 'Monthly Revenue',
      value: `KSh ${(stats.revenue?.monthly || 0).toLocaleString()}`,
      change: stats.revenue?.percentageChange || 0,
      icon: DollarSign,
      color: 'yellow'
    },
    {
      title: 'Average Rating',
      value: stats.reviews?.average?.toFixed(1) || '0.0',
      subtitle: `${stats.reviews?.total || 0} total reviews`,
      icon: Star,
      color: 'purple'
    }
  ];

  const getColorClasses = (color) => {
    const colors = {
      blue: 'bg-blue-100 text-blue-600',
      green: 'bg-green-100 text-green-600',
      yellow: 'bg-yellow-100 text-yellow-600',
      purple: 'bg-purple-100 text-purple-600'
    };
    return colors[color] || colors.blue;
  };

  return (
    <div>
      {/* Time Range Selector */}
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold text-gray-900">Dashboard Overview</h2>
        <select
          value={timeRange}
          onChange={(e) => setTimeRange(e.target.value)}
          className="border border-gray-300 rounded-md px-3 py-2 text-sm"
        >
          <option value="24hours">Last 24 Hours</option>
          <option value="7days">Last 7 Days</option>
          <option value="30days">Last 30 Days</option>
          <option value="90days">Last 90 Days</option>
        </select>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {statCards.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <div key={index} className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between mb-4">
                <div className={`${getColorClasses(stat.color)} rounded-full p-3`}>
                  <Icon className="h-6 w-6" />
                </div>
                {stat.change !== undefined && (
                  <div className={`flex items-center text-sm ${stat.change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {stat.change >= 0 ? <ArrowUp className="h-4 w-4" /> : <ArrowDown className="h-4 w-4" />}
                    <span className="ml-1">{Math.abs(stat.change)}%</span>
                  </div>
                )}
              </div>
              <h3 className="text-2xl font-bold text-gray-900">{stat.value}</h3>
              <p className="text-sm text-gray-600 mt-1">{stat.title}</p>
              {stat.subtitle && (
                <p className="text-xs text-gray-500 mt-2">{stat.subtitle}</p>
              )}
              {stat.changeValue && (
                <p className="text-xs text-green-600 mt-2">{stat.changeValue}</p>
              )}
            </div>
          );
        })}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Activity Chart */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Platform Activity</h3>
            <Activity className="h-5 w-5 text-gray-400" />
          </div>
          <div className="h-64 flex items-center justify-center bg-gray-50 rounded">
            <BarChart3 className="h-12 w-12 text-gray-300" />
            <span className="ml-3 text-gray-500">Activity Chart</span>
          </div>
        </div>

        {/* Revenue Chart */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Revenue Trend</h3>
            <TrendingUp className="h-5 w-5 text-green-500" />
          </div>
          <div className="h-64 flex items-center justify-center bg-gray-50 rounded">
            <DollarSign className="h-12 w-12 text-gray-300" />
            <span className="ml-3 text-gray-500">Revenue Chart</span>
          </div>
        </div>
      </div>

      {/* Recent Activity & Quick Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Activity */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h3>
          <div className="space-y-4">
            {recentActivity.slice(0, 5).map((activity, index) => (
              <div key={index} className="flex items-start space-x-3">
                <div className={`p-2 rounded-full ${
                  activity.type === 'user' ? 'bg-blue-100' :
                  activity.type === 'property' ? 'bg-green-100' :
                  activity.type === 'payment' ? 'bg-yellow-100' :
                  'bg-gray-100'
                }`}>
                  {activity.type === 'user' && <UserCheck className="h-4 w-4 text-blue-600" />}
                  {activity.type === 'property' && <Home className="h-4 w-4 text-green-600" />}
                  {activity.type === 'payment' && <DollarSign className="h-4 w-4 text-yellow-600" />}
                  {activity.type === 'message' && <MessageSquare className="h-4 w-4 text-purple-600" />}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">{activity.title}</p>
                  <p className="text-xs text-gray-500">{activity.time}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Top Properties */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Top Properties</h3>
          <div className="space-y-4">
            {stats.topProperties?.slice(0, 5).map((property, index) => (
              <div key={index} className="flex items-center justify-between">
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">{property.title}</p>
                  <p className="text-xs text-gray-500">{property.location}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold text-gray-900">
                    {property.views} views
                  </p>
                  <div className="flex items-center text-xs text-yellow-600">
                    <Star className="h-3 w-3 mr-1" />
                    {property.rating}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* System Status */}
      <div className="mt-8 bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">System Status</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
            <div className="flex items-center">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse mr-2"></div>
              <span className="text-sm font-medium text-gray-700">API Status</span>
            </div>
            <span className="text-sm text-green-600">Operational</span>
          </div>
          <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
            <div className="flex items-center">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse mr-2"></div>
              <span className="text-sm font-medium text-gray-700">Database</span>
            </div>
            <span className="text-sm text-green-600">Connected</span>
          </div>
          <div className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg">
            <div className="flex items-center">
              <div className="w-2 h-2 bg-yellow-500 rounded-full mr-2"></div>
              <span className="text-sm font-medium text-gray-700">Email Service</span>
            </div>
            <span className="text-sm text-yellow-600">Limited</span>
          </div>
          <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
            <div className="flex items-center">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse mr-2"></div>
              <span className="text-sm font-medium text-gray-700">Payments</span>
            </div>
            <span className="text-sm text-green-600">Active</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminOverview;
