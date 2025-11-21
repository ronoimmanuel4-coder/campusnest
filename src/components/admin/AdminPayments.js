import React, { useState, useEffect } from 'react';
import {
  DollarSign,
  CreditCard,
  TrendingUp,
  Download,
  Filter,
  Calendar,
  CheckCircle,
  XCircle,
  Clock,
  AlertTriangle,
  RefreshCw,
  Search,
  ArrowUpRight,
  ArrowDownRight,
  Phone,
  MessageSquare
} from 'lucide-react';
import { adminAPI } from '../../services/api';
import toast from 'react-hot-toast';

const AdminPayments = () => {
  const [payments, setPayments] = useState([]);
  const [stats, setStats] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [filterType, setFilterType] = useState('all');
  const [dateRange, setDateRange] = useState('30days');
  const [refundingId, setRefundingId] = useState(null);
  
  useEffect(() => {
    fetchPayments();
  }, [filterType, dateRange]);

  const fetchPayments = async () => {
    try {
      const params = {};

      if (filterType !== 'all') {
        params.paymentMethod = filterType;
      }

      if (dateRange !== 'all') {
        const now = new Date();
        const start = new Date();

        if (dateRange === '7days') {
          start.setDate(now.getDate() - 7);
        } else if (dateRange === '30days') {
          start.setDate(now.getDate() - 30);
        } else if (dateRange === '90days') {
          start.setDate(now.getDate() - 90);
        }

        params.startDate = start.toISOString();
      }

      const response = await adminAPI.getPayments(params);
      const paymentsData = response.data?.data || [];
      setPayments(paymentsData);

      const completed = paymentsData.filter(p => p.status === 'completed');
      const failed = paymentsData.filter(p => p.status === 'failed');

      const totalRevenue = completed.reduce(
        (sum, p) => sum + (p.amount || 0),
        0
      );

      const now = new Date();
      const currentYear = now.getFullYear();
      const currentMonth = now.getMonth();

      const monthlyCompleted = completed.filter(p => {
        if (!p.createdAt) return false;
        const d = new Date(p.createdAt);
        return d.getFullYear() === currentYear && d.getMonth() === currentMonth;
      });

      const monthlyRevenue = monthlyCompleted.reduce(
        (sum, p) => sum + (p.amount || 0),
        0
      );

      const successRate = paymentsData.length
        ? Math.round((completed.length / paymentsData.length) * 100)
        : 0;

      const failedAmount = failed.reduce(
        (sum, p) => sum + (p.amount || 0),
        0
      );

      setStats({
        totalRevenue,
        monthlyRevenue,
        revenueGrowth: 0,
        monthlyTransactions: monthlyCompleted.length,
        successRate,
        successfulPayments: completed.length,
        failedPayments: failed.length,
        failedAmount
      });
    } catch (error) {
      toast.error('Failed to load payments');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCallPerson = (person, label) => {
    const phone = person?.phone;
    if (!phone) {
      toast.error(`No phone number for this ${label}`);
      return;
    }

    window.location.href = `tel:${phone}`;
  };

  const handleWhatsAppPerson = (person, label, propertyTitle) => {
    const phone = person?.phone;
    if (!phone) {
      toast.error(`No phone number for this ${label}`);
      return;
    }

    const normalized = phone.replace(/[^0-9]/g, '');
    const message = encodeURIComponent(
      `Hi ${person?.name || ''}, I am contacting you regarding ${
        propertyTitle || 'a property'
      } on CampusNest.`
    );

    const url = `https://wa.me/${normalized}?text=${message}`;
    window.open(url, '_blank');
  };

  const handleRefundPayment = async (payment) => {
    if (!payment || payment.status !== 'completed') {
      toast.error('Only completed payments can be refunded');
      return;
    }

    const confirmRefund = window.confirm('Are you sure you want to mark this transaction as refunded?');
    if (!confirmRefund) {
      return;
    }

    const reason = window.prompt('Enter refund reason (optional):') || undefined;

    try {
      setRefundingId(payment._id);
      const response = await adminAPI.refundPayment(payment._id, {
        amount: payment.amount,
        reason
      });
      const updatedPayment = response.data?.data;
      if (updatedPayment) {
        setPayments((prev) =>
          prev.map((p) => (p._id === payment._id ? updatedPayment : p))
        );
      }
      toast.success('Payment marked as refunded');
    } catch (error) {
      const message = error?.response?.data?.message || 'Failed to refund payment';
      toast.error(message);
    } finally {
      setRefundingId(null);
    }
  };

  const exportPayments = () => {
    const csv = [
      ['Transaction ID', 'User', 'Amount', 'Type', 'Status', 'Date'],
      ...payments.map(p => [
        p.transactionId,
        p.user?.email,
        `KSh ${p.amount}`,
        p.type,
        p.status,
        new Date(p.createdAt).toLocaleString()
      ])
    ].map(row => row.join(',')).join('\n');
    
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `payments-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold text-gray-900">Payment Management</h2>
        <div className="flex space-x-3">
          <button onClick={fetchPayments} className="p-2 text-gray-600 hover:text-gray-900">
            <RefreshCw className="h-5 w-5" />
          </button>
          <button onClick={exportPayments} className="btn-primary flex items-center">
            <Download className="h-4 w-4 mr-2" />
            Export
          </button>
        </div>
      </div>

      {/* Revenue Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Revenue</p>
              <p className="text-2xl font-bold text-gray-900">
                KSh {(stats.totalRevenue || 0).toLocaleString()}
              </p>
              <p className="text-sm text-green-600 mt-1">
                <ArrowUpRight className="inline h-4 w-4" />
                {stats.revenueGrowth || 0}% from last month
              </p>
            </div>
            <DollarSign className="h-8 w-8 text-green-600 opacity-20" />
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">This Month</p>
              <p className="text-2xl font-bold text-blue-600">
                KSh {(stats.monthlyRevenue || 0).toLocaleString()}
              </p>
              <p className="text-sm text-gray-500 mt-1">
                {stats.monthlyTransactions || 0} transactions
              </p>
            </div>
            <TrendingUp className="h-8 w-8 text-blue-600 opacity-20" />
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Success Rate</p>
              <p className="text-2xl font-bold text-green-600">
                {stats.successRate || 0}%
              </p>
              <p className="text-sm text-gray-500 mt-1">
                {stats.successfulPayments || 0} successful
              </p>
            </div>
            <CheckCircle className="h-8 w-8 text-green-600 opacity-20" />
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Failed</p>
              <p className="text-2xl font-bold text-red-600">
                {stats.failedPayments || 0}
              </p>
              <p className="text-sm text-gray-500 mt-1">
                KSh {(stats.failedAmount || 0).toLocaleString()}
              </p>
            </div>
            <XCircle className="h-8 w-8 text-red-600 opacity-20" />
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search transactions..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg"
              />
            </div>
          </div>
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg"
          >
            <option value="all">All Payments</option>
            <option value="mpesa">M-Pesa</option>
            <option value="stripe">Stripe</option>
            <option value="paypal">PayPal</option>
            <option value="paystack">Paystack</option>
          </select>
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg"
          >
            <option value="7days">Last 7 Days</option>
            <option value="30days">Last 30 Days</option>
            <option value="90days">Last 90 Days</option>
            <option value="all">All Time</option>
          </select>
        </div>
      </div>

      {/* Payments Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Transaction
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                User
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Amount
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Method
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Status
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
            {payments.map((payment) => (
              <tr key={payment._id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {payment.invoice?.invoiceNumber || payment._id}
                    </p>
                    <p className="text-xs text-gray-500">
                      {payment.property?.title}
                    </p>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div>
                    <p className="text-sm text-gray-900">{payment.user?.name}</p>
                    <p className="text-xs text-gray-500">{payment.user?.email}</p>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <p className="text-sm font-semibold text-gray-900">
                    KSh {payment.amount.toLocaleString()}
                  </p>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 py-1 text-xs rounded-full ${
                    payment.paymentMethod === 'mpesa' ? 'bg-green-100 text-green-800' :
                    payment.paymentMethod === 'stripe' ? 'bg-blue-100 text-blue-800' :
                    payment.paymentMethod === 'paypal' ? 'bg-indigo-100 text-indigo-800' :
                    payment.paymentMethod === 'paystack' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {payment.paymentMethod}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`flex items-center text-sm ${
                    payment.status === 'completed' ? 'text-green-600' :
                    payment.status === 'failed' ? 'text-red-600' :
                    'text-yellow-600'
                  }`}>
                    {payment.status === 'completed' && <CheckCircle className="h-4 w-4 mr-1" />}
                    {payment.status === 'failed' && <XCircle className="h-4 w-4 mr-1" />}
                    {payment.status === 'pending' && <Clock className="h-4 w-4 mr-1" />}
                    {payment.status}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {new Date(payment.createdAt).toLocaleString()}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {payment.status === 'completed' ? (
                    <button
                      onClick={() => handleRefundPayment(payment)}
                      disabled={refundingId === payment._id}
                      className="text-xs font-medium text-red-600 hover:text-red-900 disabled:opacity-50"
                    >
                      {refundingId === payment._id ? 'Refunding...' : 'Mark Refunded'}
                    </button>
                  ) : payment.status === 'refunded' ? (
                    <span className="text-xs text-gray-500">Refunded</span>
                  ) : (
                    <span className="text-xs text-gray-400">No actions</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        </div>
      </div>

      {/* Property unlocks: user + landlord contacts */}
      <div className="mt-8">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Property Unlocks (User &amp; Landlord Contacts)
        </h3>
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Property
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  User (Student)
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Landlord
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
              {payments
                .filter(
                  (p) =>
                    p.paymentType === 'unlock' &&
                    p.status === 'completed' &&
                    p.property
                )
                .map((payment) => (
                  <tr key={payment._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          {payment.property?.title || 'Unknown property'}
                        </p>
                        <p className="text-xs text-gray-500">
                          {payment.invoice?.invoiceNumber || payment._id}
                        </p>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <p className="text-sm text-gray-900">
                          {payment.user?.name || 'Unknown user'}
                        </p>
                        <p className="text-xs text-gray-500">
                          {payment.user?.email}
                        </p>
                        {payment.user?.phone && (
                          <p className="text-xs text-gray-500">
                            {payment.user.phone}
                          </p>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <p className="text-sm text-gray-900">
                          {payment.property?.landlord?.name || 'Unknown landlord'}
                        </p>
                        <p className="text-xs text-gray-500">
                          {payment.property?.landlord?.email}
                        </p>
                        {payment.property?.landlord?.phone && (
                          <p className="text-xs text-gray-500">
                            {payment.property.landlord.phone}
                          </p>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(payment.createdAt).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleCallPerson(payment.user, 'user')}
                          title="Call user"
                          className="text-blue-600 hover:text-blue-900"
                        >
                          <Phone className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() =>
                            handleWhatsAppPerson(
                              payment.user,
                              'user',
                              payment.property?.title
                            )
                          }
                          title="WhatsApp user"
                          className="text-green-600 hover:text-green-900"
                        >
                          <MessageSquare className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() =>
                            handleCallPerson(payment.property?.landlord, 'landlord')
                          }
                          title="Call landlord"
                          className="text-orange-600 hover:text-orange-900"
                        >
                          <Phone className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() =>
                            handleWhatsAppPerson(
                              payment.property?.landlord,
                              'landlord',
                              payment.property?.title
                            )
                          }
                          title="WhatsApp landlord"
                          className="text-purple-600 hover:text-purple-900"
                        >
                          <MessageSquare className="h-4 w-4" />
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
    </div>
  );
};

export default AdminPayments;
