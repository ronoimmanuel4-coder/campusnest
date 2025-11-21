import React, { useState, useEffect } from 'react';
import { 
  Search, Filter, Download, UserCheck, Ban, Trash2, AlertCircle, CheckCircle, Shield, 
  Users, MoreVertical, Eye, Lock, Camera, Mail, Phone, MapPin, Calendar, Activity, 
  UserX, RefreshCw, Clock, User, Key, X, Check
} from 'lucide-react';
import { adminAPI } from '../../services/api';
import toast from 'react-hot-toast';
import UserDetailsModal from './UserDetailsModal';

const AdminUserManagement = () => {
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState(null);
  const [showUserModal, setShowUserModal] = useState(false);
  const [pendingLandlords, setPendingLandlords] = useState([]);
  const [activeTab, setActiveTab] = useState('all');

  useEffect(() => {
    fetchUsers();
  }, []);

  useEffect(() => {
    filterUsers();
  }, [users, searchTerm, filterRole, filterStatus]);

  const fetchUsers = async () => {
    try {
      const response = await adminAPI.getUsers();
      console.log('Admin Users Response:', response.data);
      // Backend returns data array directly, not data.users
      const allUsers = response.data.data || response.data.users || response.data || [];
      setUsers(allUsers);
      // Filter pending landlords
      const pending = allUsers.filter(u => u.role === 'landlord' && !u.isApproved);
      setPendingLandlords(pending);
    } catch (error) {
      console.error('Failed to load users:', error);
      toast.error('Failed to load users');
    } finally {
      setIsLoading(false);
    }
  };

  const filterUsers = () => {
    let filtered = [...users];
    
    if (searchTerm) {
      filtered = filtered.filter(user =>
        user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    if (filterRole !== 'all') {
      filtered = filtered.filter(user => user.role === filterRole);
    }
    
    if (filterStatus !== 'all') {
      filtered = filtered.filter(user => {
        if (filterStatus === 'verified') return user.isVerified;
        if (filterStatus === 'unverified') return !user.isVerified;
        if (filterStatus === 'banned') return user.isBanned;
        if (filterStatus === 'active') return !user.isBanned && user.isVerified;
        return true;
      });
    }
    
    setFilteredUsers(filtered);
  };

  const handleUserAction = async (userId, action) => {
    try {
      switch(action) {
        case 'verify':
          await adminAPI.verifyUser(userId);
          toast.success('User verified successfully');
          break;
        case 'ban':
          await adminAPI.banUser(userId);
          toast.success('User banned');
          break;
        case 'unban':
          await adminAPI.unbanUser(userId);
          toast.success('User unbanned');
          break;
        case 'makeAdmin':
          await adminAPI.updateUserRole(userId, 'admin');
          toast.success('User promoted to admin');
          break;
        case 'approve':
          await adminAPI.approveLandlord(userId);
          toast.success('Landlord approved');
          break;
        case 'reject':
          await adminAPI.rejectLandlord(userId);
          toast.success('Landlord rejected');
          break;
        case 'delete':
          if (window.confirm('Are you sure you want to delete this user?')) {
            await adminAPI.deleteUser(userId);
            toast.success('User deleted');
          }
          break;
        default:
          break;
      }
      fetchUsers();
    } catch (error) {
      toast.error(`Failed to ${action} user`);
    }
  };

  const handleBulkAction = async (action) => {
    if (selectedUsers.length === 0) {
      toast.error('No users selected');
      return;
    }
    
    try {
      await Promise.all(selectedUsers.map(userId => handleUserAction(userId, action)));
      setSelectedUsers([]);
    } catch (error) {
      toast.error('Bulk action failed');
    }
  };

  const exportUsers = () => {
    const csv = [
      ['Name', 'Email', 'Role', 'Status', 'Joined Date'],
      ...filteredUsers.map(user => [
        user.name,
        user.email,
        user.role,
        user.isVerified ? 'Verified' : 'Unverified',
        new Date(user.createdAt).toLocaleDateString()
      ])
    ].map(row => row.join(',')).join('\n');
    
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'users.csv';
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
        <h2 className="text-xl font-bold text-gray-900">User Management</h2>
        <button onClick={fetchUsers} className="p-2 text-gray-600 hover:text-gray-900">
          <RefreshCw className="h-5 w-5" />
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Users</p>
              <p className="text-2xl font-bold text-gray-900">{users.length}</p>
            </div>
            <User className="h-8 w-8 text-blue-600 opacity-20" />
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Verified</p>
              <p className="text-2xl font-bold text-green-600">
                {users.filter(u => u.isVerified).length}
              </p>
            </div>
            <CheckCircle className="h-8 w-8 text-green-600 opacity-20" />
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Landlords</p>
              <p className="text-2xl font-bold text-purple-600">
                {users.filter(u => u.role === 'landlord').length}
              </p>
            </div>
            <Shield className="h-8 w-8 text-purple-600 opacity-20" />
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Banned</p>
              <p className="text-2xl font-bold text-red-600">
                {users.filter(u => u.isBanned).length}
              </p>
            </div>
            <Ban className="h-8 w-8 text-red-600 opacity-20" />
          </div>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search users by name or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
              />
            </div>
          </div>
          <select
            value={filterRole}
            onChange={(e) => setFilterRole(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg"
          >
            <option value="all">All Roles</option>
            <option value="student">Students</option>
            <option value="landlord">Landlords</option>
            <option value="admin">Admins</option>
          </select>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg"
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="verified">Verified</option>
            <option value="unverified">Unverified</option>
            <option value="banned">Banned</option>
          </select>
          <button onClick={exportUsers} className="btn-primary flex items-center">
            <Download className="h-4 w-4 mr-2" />
            Export
          </button>
        </div>

        {/* Bulk Actions */}
        {selectedUsers.length > 0 && (
          <div className="flex items-center gap-3 mt-4 pt-4 border-t">
            <span className="text-sm text-gray-600">
              {selectedUsers.length} selected
            </span>
            <button
              onClick={() => handleBulkAction('verify')}
              className="px-3 py-1 bg-green-600 text-white rounded text-sm"
            >
              Verify All
            </button>
            <button
              onClick={() => handleBulkAction('ban')}
              className="px-3 py-1 bg-red-600 text-white rounded text-sm"
            >
              Ban All
            </button>
            <button
              onClick={() => setSelectedUsers([])}
              className="px-3 py-1 bg-gray-600 text-white rounded text-sm"
            >
              Clear Selection
            </button>
          </div>
        )}
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left">
                <input
                  type="checkbox"
                  onChange={(e) => {
                    if (e.target.checked) {
                      setSelectedUsers(filteredUsers.map(u => u._id));
                    } else {
                      setSelectedUsers([]);
                    }
                  }}
                  className="rounded border-gray-300"
                />
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                User
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Role
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Properties
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Joined
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredUsers.map((user) => (
              <tr key={user._id} className="hover:bg-gray-50">
                <td className="px-6 py-4">
                  <input
                    type="checkbox"
                    checked={selectedUsers.includes(user._id)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedUsers([...selectedUsers, user._id]);
                      } else {
                        setSelectedUsers(selectedUsers.filter(id => id !== user._id));
                      }
                    }}
                    className="rounded border-gray-300"
                  />
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <div className="h-10 w-10 flex-shrink-0">
                      {user.avatar ? (
                        <img className="h-10 w-10 rounded-full" src={user.avatar} alt="" />
                      ) : (
                        <div className="h-10 w-10 rounded-full bg-primary-100 flex items-center justify-center">
                          <User className="h-5 w-5 text-primary-600" />
                        </div>
                      )}
                    </div>
                    <div className="ml-4">
                      <div className="text-sm font-medium text-gray-900">{user.name}</div>
                      <div className="text-sm text-gray-500">{user.email}</div>
                      {user.phone && (
                        <div className="text-xs text-gray-400">{user.phone}</div>
                      )}
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full capitalize
                    ${user.role === 'admin' ? 'bg-purple-100 text-purple-800' : 
                      user.role === 'landlord' ? 'bg-blue-100 text-blue-800' : 
                      'bg-gray-100 text-gray-800'}`}>
                    {user.role}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {user.isBanned ? (
                    <span className="flex items-center text-red-600">
                      <Ban className="h-4 w-4 mr-1" />
                      Banned
                    </span>
                  ) : user.isVerified ? (
                    <span className="flex items-center text-green-600">
                      <CheckCircle className="h-4 w-4 mr-1" />
                      Verified
                    </span>
                  ) : (
                    <span className="flex items-center text-yellow-600">
                      <Clock className="h-4 w-4 mr-1" />
                      Pending
                    </span>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {user.properties?.length || 0}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {new Date(user.createdAt).toLocaleDateString()}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => {
                        setSelectedUser(user);
                        setShowUserModal(true);
                      }}
                      className="text-blue-600 hover:text-blue-900"
                      title="View Details"
                    >
                      <Eye className="h-5 w-5" />
                    </button>
                    {!user.isVerified && (
                      <button
                        onClick={() => handleUserAction(user._id, 'verify')}
                        className="text-green-600 hover:text-green-900"
                        title="Verify User"
                      >
                        <UserCheck className="h-5 w-5" />
                      </button>
                    )}
                    {user.role !== 'admin' && (
                      <button
                        onClick={() => handleUserAction(user._id, user.isBanned ? 'unban' : 'ban')}
                        className={`${user.isBanned ? 'text-green-600' : 'text-orange-600'} hover:opacity-80`}
                        title={user.isBanned ? 'Unban User' : 'Ban User'}
                      >
                        {user.isBanned ? <UserCheck className="h-5 w-5" /> : <Ban className="h-5 w-5" />}
                      </button>
                    )}
                    <button
                      onClick={() => handleUserAction(user._id, 'delete')}
                      className="text-red-600 hover:text-red-900"
                      title="Delete User"
                    >
                      <Trash2 className="h-5 w-5" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        </div>
      </div>
      
      {/* User Details Modal */}
      {selectedUser && (
        <UserDetailsModal
          user={selectedUser}
          isOpen={showUserModal}
          onClose={() => {
            setShowUserModal(false);
            setSelectedUser(null);
          }}
          onUpdate={fetchUsers}
        />
      )}
    </div>
  );
};

export default AdminUserManagement;
