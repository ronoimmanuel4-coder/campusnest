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
  const [analytics, setAnalytics] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('7days');

  useEffect(() => {
    fetchDashboardData();
  }, [timeRange]);

  const fetchDashboardData = async () => {
    try {
      const now = new Date();
      const start = new Date();

      if (timeRange === '24hours') {
        start.setDate(now.getDate() - 1);
      } else if (timeRange === '7days') {
        start.setDate(now.getDate() - 7);
      } else if (timeRange === '30days') {
        start.setDate(now.getDate() - 30);
      } else if (timeRange === '90days') {
        start.setDate(now.getDate() - 90);
      }

      const [dashboardRes, analyticsRes] = await Promise.all([
        adminAPI.getDashboard(),
        adminAPI.getAnalytics({
          startDate: start.toISOString(),
          groupBy: 'day'
        })
      ]);

      const dashboard = dashboardRes.data?.data || {};
      const { statistics = {}, topProperties = [], recentActivities = {} } = dashboard;

      setStats({
        ...statistics,
        topProperties
      });

      const activityItems = [];

      (recentActivities.payments || []).forEach((payment) => {
        activityItems.push({
          type: 'payment',
          title: `Payment of KSh ${Number(payment.amount || 0).toLocaleString()} by ${payment.user?.name || payment.user?.email || 'Unknown user'}`,
          time: payment.createdAt
        });
      });

      (recentActivities.users || []).forEach((user) => {
        activityItems.push({
          type: 'user',
          title: `New ${user.role || 'user'}: ${user.name || user.email}`,
          time: user.createdAt
        });
      });

      (recentActivities.properties || []).forEach((property) => {
        activityItems.push({
          type: 'property',
          title: `New property: ${property.title}`,
          time: property.createdAt
        });
      });

      setRecentActivity(activityItems);
      setAnalytics(analyticsRes.data?.data || {});
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

  const usersStats = stats.users || {};
  const propertiesStats = stats.properties || {};
  const paymentsStats = stats.payments || {};
  const reviewsStats = stats.reviews || {};

  const totalUsers = usersStats.total || 0;
  const newUsersThisMonth = usersStats.newThisMonth || 0;
  const userGrowth =
    totalUsers > 0 ? Math.round((newUsersThisMonth / totalUsers) * 100) : 0;

  const activeProperties = propertiesStats.active || 0;
  const totalProperties = propertiesStats.total || 0;
  const pendingProperties = Math.max(totalProperties - activeProperties, 0);

  const monthlyRevenue = paymentsStats.revenueThisMonth || 0;
  const totalRevenue = paymentsStats.totalRevenue || 0;
  const revenueShare =
    totalRevenue > 0 ? Math.round((monthlyRevenue / totalRevenue) * 100) : 0;

  const averageRating = reviewsStats.averageRating || 0;
  const totalReviews = reviewsStats.total || 0;

  const statCards = [
    {
      title: 'Total Users',
      value: totalUsers,
      change: userGrowth,
      changeValue: `+${newUsersThisMonth} this month`,
      icon: Users,
      color: 'blue'
    },
    {
      title: 'Active Properties',
      value: activeProperties,
      subtitle: `${pendingProperties} pending approval`,
      icon: Home,
      color: 'green'
    },
    {
      title: 'Monthly Revenue',
      value: `KSh ${Number(monthlyRevenue || 0).toLocaleString()}`,
      change: revenueShare,
      icon: DollarSign,
      color: 'yellow'
    },
    {
      title: 'Average Rating',
      value: averageRating.toFixed(1),
      subtitle: `${totalReviews} total reviews`,
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

  const activityData = (analytics?.users || []).slice(-10);
  const maxActivity = activityData.reduce(
    (max, point) => Math.max(max, point.count || 0),
    0
  );

  const revenueData = (analytics?.payments || []).slice(-10);
  const maxRevenue = revenueData.reduce(
    (max, point) => Math.max(max, point.totalAmount || 0),
    0
  );

  const formatDateLabel = (value) => {
    if (!value) return '';
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return String(value);
    return `${d.getMonth() + 1}/${d.getDate()}`;
  };

  const buildLinePoints = (data, max, getValue) => {
    if (!data.length || !max) return '';
    const n = data.length;
    return data
      .map((point, index) => {
        const x = n === 1 ? 50 : (index / (n - 1)) * 90 + 5;
        const value = getValue(point) || 0;
        const y = 95 - (value / max) * 80;
        return `${x},${y}`;
      })
      .join(' ');
  };

  const activityPoints = buildLinePoints(
    activityData,
    maxActivity,
    (p) => p.count || 0
  );

  const revenuePoints = buildLinePoints(
    revenueData,
    maxRevenue,
    (p) => p.totalAmount || 0
  );

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
          <div className="h-64 bg-gray-50 rounded px-4 py-3">
            {!activityData.length || !maxActivity ? (
              <div className="flex items-center justify-center h-full text-gray-400 text-sm">
                No activity data for selected period
              </div>
            ) : (
              <svg viewBox="0 0 100 100" className="w-full h-full">
                <polyline
                  fill="none"
                  stroke="#3b82f6"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  points={activityPoints}
                />
                {activityData.map((point, index) => {
                  const n = activityData.length || 1;
                  const x = n === 1 ? 50 : (index / (n - 1)) * 90 + 5;
                  const value = point.count || 0;
                  const y =
                    maxActivity > 0 ? 95 - (value / maxActivity) * 80 : 95;
                  return (
                    <circle
                      key={point._id || index}
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

        {/* Revenue Chart */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Revenue Trend</h3>
            <TrendingUp className="h-5 w-5 text-green-500" />
          </div>
          <div className="h-64 bg-gray-50 rounded px-4 py-3">
            {!revenueData.length || !maxRevenue ? (
              <div className="flex items-center justify-center h-full text-gray-400 text-sm">
                No revenue data for selected period
              </div>
            ) : (
              <svg viewBox="0 0 100 100" className="w-full h-full">
                <polyline
                  fill="none"
                  stroke="#22c55e"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  points={revenuePoints}
                />
                {revenueData.map((point, index) => {
                  const n = revenueData.length || 1;
                  const x = n === 1 ? 50 : (index / (n - 1)) * 90 + 5;
                  const amount = point.totalAmount || 0;
                  const y =
                    maxRevenue > 0 ? 95 - (amount / maxRevenue) * 80 : 95;
                  return (
                    <circle
                      key={point._id || index}
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
                  <p className="text-xs text-gray-500">
                    {activity.time ? new Date(activity.time).toLocaleString() : ''}
                  </p>
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
                  <p className="text-xs text-gray-500">
                    {property.location?.area || property.location?.campus || 'Unknown location'}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold text-gray-900">
                    {(property.stats?.views || 0)} views
                  </p>
                  <div className="flex items-center text-xs text-yellow-600">
                    <Star className="h-3 w-3 mr-1" />
                    {property.rating?.average !== undefined
                      ? property.rating.average.toFixed(1)
                      : 'N/A'}
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
