import React, { useState } from 'react';
import {
  X, User, Mail, Phone, MapPin, Calendar, Shield, Lock,
  Camera, CheckCircle, XCircle, Activity, Home, Eye
} from 'lucide-react';
import { adminAPI } from '../../services/api';
import toast from 'react-hot-toast';

const UserDetailsModal = ({ user, isOpen, onClose, onUpdate }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [isResettingPassword, setIsResettingPassword] = useState(false);
  const [newPassword, setNewPassword] = useState(''); // kept for compatibility but no longer used
  const [tempPassword, setTempPassword] = useState('');
  const [editedUser, setEditedUser] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: user?.phone || '',
    address: user?.address || ''
  });

  if (!isOpen || !user) return null;

  const handleUpdateUser = async () => {
    try {
      await adminAPI.updateUser(user._id, editedUser);
      toast.success('User updated successfully');
      setIsEditing(false);
      onUpdate();
    } catch (error) {
      toast.error('Failed to update user');
    }
  };

  const handleResetPassword = async () => {
    if (!window.confirm('Reset this user\'s password and generate a new temporary password?')) {
      return;
    }

    try {
      const res = await adminAPI.resetUserPassword(user._id, {});
      const generated = res.data?.temporaryPassword;
      if (generated) {
        setTempPassword(generated);
        toast.success('Temporary password generated');
      } else {
        toast.success('Password reset successfully');
      }
      setIsResettingPassword(true);
    } catch (error) {
      toast.error('Failed to reset password');
    }
  };

  const handleCopyTempPassword = async () => {
    if (!tempPassword) return;
    try {
      await navigator.clipboard.writeText(tempPassword);
      toast.success('Temporary password copied to clipboard');
    } catch (error) {
      toast.error('Failed to copy password');
    }
  };

  const handleApprove = async () => {
    try {
      await adminAPI.approveLandlord(user._id);
      toast.success('Landlord approved successfully');
      onUpdate();
    } catch (error) {
      toast.error('Failed to approve landlord');
    }
  };

  const handleReject = async () => {
    try {
      await adminAPI.rejectLandlord(user._id);
      toast.success('Landlord rejected');
      onUpdate();
    } catch (error) {
      toast.error('Failed to reject landlord');
    }
  };

  const handleToggleBan = async () => {
    try {
      if (user.isBanned) {
        await adminAPI.unbanUser(user._id);
        toast.success('User unbanned');
      } else {
        await adminAPI.banUser(user._id);
        toast.success('User banned');
      }
      onUpdate();
    } catch (error) {
      toast.error('Failed to update user status');
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b px-6 py-4 flex justify-between items-center">
          <h2 className="text-2xl font-bold text-gray-900">User Details</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="h-6 w-6" />
          </button>
        </div>

        <div className="p-6">
          {/* User Header */}
          <div className="flex items-start justify-between mb-6">
            <div className="flex items-center space-x-4">
              <div className="relative">
                <div className="h-20 w-20 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden">
                  {user.profilePicture ? (
                    <img
                      src={user.profilePicture}
                      alt={editedUser.name || user.name}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <User className="h-10 w-10 text-gray-400" />
                  )}
                </div>
                {user.isVerified && (
                  <CheckCircle className="absolute -bottom-1 -right-1 h-6 w-6 text-green-500 bg-white rounded-full" />
                )}
              </div>
              <div>
                <h3 className="text-xl font-semibold text-gray-900">{editedUser.name || user.name}</h3>
                <p className="text-sm text-gray-500">{editedUser.email || user.email}</p>
                <div className="flex items-center space-x-3 mt-2">
                  <span className={`px-2 py-1 text-xs rounded-full ${
                    user.role === 'admin' ? 'bg-purple-100 text-purple-600' :
                    user.role === 'landlord' ? 'bg-blue-100 text-blue-600' :
                    'bg-gray-100 text-gray-600'
                  }`}>
                    {user.role}
                  </span>
                  {user.isBanned && (
                    <span className="px-2 py-1 text-xs bg-red-100 text-red-600 rounded-full">
                      Banned
                    </span>
                  )}
                  {!user.isVerified && (
                    <span className="px-2 py-1 text-xs bg-yellow-100 text-yellow-600 rounded-full">
                      Unverified
                    </span>
                  )}
                  {user.role === 'landlord' && !user.isApproved && (
                    <span className="px-2 py-1 text-xs bg-orange-100 text-orange-600 rounded-full">
                      Pending Approval
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="flex items-center space-x-2">
              {user.role === 'landlord' && !user.isApproved && (
                <>
                  <button
                    onClick={handleApprove}
                    className="px-3 py-1 bg-green-600 text-white rounded-lg hover:bg-green-700"
                  >
                    Approve
                  </button>
                  <button
                    onClick={handleReject}
                    className="px-3 py-1 bg-red-600 text-white rounded-lg hover:bg-red-700"
                  >
                    Reject
                  </button>
                </>
              )}
              <button
                onClick={handleToggleBan}
                className={`px-3 py-1 rounded-lg ${
                  user.isBanned
                    ? 'bg-green-600 text-white hover:bg-green-700'
                    : 'bg-red-600 text-white hover:bg-red-700'
                }`}
              >
                {user.isBanned ? 'Unban' : 'Ban'}
              </button>
            </div>
          </div>

          {/* User Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="font-semibold text-gray-900 mb-3">Personal Information</h4>
              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <User className="h-4 w-4 text-gray-400" />
                  <span className="text-sm text-gray-600">Name:</span>
                  {isEditing ? (
                    <input
                      type="text"
                      value={editedUser.name}
                      onChange={(e) => setEditedUser({ ...editedUser, name: e.target.value })}
                      className="flex-1 px-2 py-1 border border-gray-300 rounded text-sm"
                    />
                  ) : (
                    <span className="text-sm font-medium text-gray-900">{editedUser.name || user.name}</span>
                  )}
                </div>
                <div className="flex items-center space-x-2">
                  <Mail className="h-4 w-4 text-gray-400" />
                  <span className="text-sm text-gray-600">Email:</span>
                  {isEditing ? (
                    <input
                      type="email"
                      value={editedUser.email}
                      onChange={(e) => setEditedUser({ ...editedUser, email: e.target.value })}
                      className="flex-1 px-2 py-1 border border-gray-300 rounded text-sm"
                    />
                  ) : (
                    <span className="text-sm font-medium text-gray-900">{editedUser.email || user.email}</span>
                  )}
                </div>
                <div className="flex items-center space-x-2">
                  <Phone className="h-4 w-4 text-gray-400" />
                  <span className="text-sm text-gray-600">Phone:</span>
                  {isEditing ? (
                    <input
                      type="tel"
                      value={editedUser.phone}
                      onChange={(e) => setEditedUser({ ...editedUser, phone: e.target.value })}
                      className="flex-1 px-2 py-1 border border-gray-300 rounded text-sm"
                    />
                  ) : (
                    <span className="text-sm font-medium text-gray-900">{editedUser.phone || user.phone || 'N/A'}</span>
                  )}
                </div>
                <div className="flex items-center space-x-2">
                  <MapPin className="h-4 w-4 text-gray-400" />
                  <span className="text-sm text-gray-600">Address:</span>
                  {isEditing ? (
                    <input
                      type="text"
                      value={editedUser.address}
                      onChange={(e) => setEditedUser({ ...editedUser, address: e.target.value })}
                      className="flex-1 px-2 py-1 border border-gray-300 rounded text-sm"
                    />
                  ) : (
                    <span className="text-sm font-medium text-gray-900">{editedUser.address || user.address || 'N/A'}</span>
                  )}
                </div>
              </div>
            </div>

            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="font-semibold text-gray-900 mb-3">Account Information</h4>
              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <Calendar className="h-4 w-4 text-gray-400" />
                  <span className="text-sm text-gray-600">Joined:</span>
                  <span className="text-sm font-medium text-gray-900">
                    {new Date(user.createdAt).toLocaleDateString()}
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <Activity className="h-4 w-4 text-gray-400" />
                  <span className="text-sm text-gray-600">Last Active:</span>
                  <span className="text-sm font-medium text-gray-900">
                    {user.lastActive ? new Date(user.lastActive).toLocaleString() : 'N/A'}
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <Shield className="h-4 w-4 text-gray-400" />
                  <span className="text-sm text-gray-600">Role:</span>
                  <span className="text-sm font-medium text-gray-900 capitalize">{user.role}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <CheckCircle className="h-4 w-4 text-gray-400" />
                  <span className="text-sm text-gray-600">Status:</span>
                  <span className="text-sm font-medium text-gray-900">
                    {user.isVerified ? 'Verified' : 'Unverified'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Landlord Specific Information */}
          {user.role === 'landlord' && (
            <div className="bg-blue-50 rounded-lg p-4 mb-6">
              <h4 className="font-semibold text-gray-900 mb-3">Landlord Information</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Properties Listed</p>
                  <p className="text-lg font-semibold text-gray-900">{user.propertyCount || 0}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Active Tenants</p>
                  <p className="text-lg font-semibold text-gray-900">{user.tenantCount || 0}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Average Rating</p>
                  <p className="text-lg font-semibold text-gray-900">{user.averageRating || 0}/5</p>
                </div>
              </div>
              {user.businessDocuments && (
                <div className="mt-4">
                  <p className="text-sm font-medium text-gray-700 mb-2">Business Documents</p>
                  <div className="flex flex-wrap gap-2">
                    {user.businessDocuments.map((doc, index) => (
                      <a
                        key={index}
                        href={doc.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-3 py-1 bg-white text-blue-600 rounded border border-blue-300 text-sm hover:bg-blue-50"
                      >
                        {doc.name}
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Password Reset Section */}
          <div className="bg-yellow-50 rounded-lg p-4 mb-6">
            <h4 className="font-semibold text-gray-900 mb-3">Security Settings</h4>
            {isResettingPassword ? (
              <div className="space-y-3">
                <p className="text-sm text-gray-700">
                  Click <span className="font-semibold">Confirm Reset</span> to generate a new
                  temporary password. Share it with the user & they must change it after login.
                </p>
                {tempPassword && (
                  <div className="border border-dashed border-yellow-400 rounded-lg p-3 bg-white">
                    <p className="text-xs text-gray-500 mb-1">
                      Temporary password (visible once):
                    </p>
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-sm break-all mr-2">{tempPassword}</span>
                      <button
                        type="button"
                        onClick={handleCopyTempPassword}
                        className="px-2 py-1 text-xs bg-gray-800 text-white rounded hover:bg-gray-900"
                      >
                        Copy
                      </button>
                    </div>
                  </div>
                )}
                <div className="flex space-x-2">
                  <button
                    onClick={handleResetPassword}
                    className="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700"
                  >
                    Confirm Reset
                  </button>
                  <button
                    onClick={() => {
                      setIsResettingPassword(false);
                      setNewPassword('');
                      setTempPassword('');
                    }}
                    className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                  >
                    Close
                  </button>
                </div>
              </div>
            ) : (
              <button
                onClick={() => {
                  setIsResettingPassword(true);
                  setTempPassword('');
                }}
                className="flex items-center space-x-2 px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700"
              >
                <Lock className="h-4 w-4" />
                <span>Reset Password</span>
              </button>
            )}
          </div>

          {/* Activity Log */}
          {user.activityLog && user.activityLog.length > 0 && (
            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="font-semibold text-gray-900 mb-3">Recent Activity</h4>
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {user.activityLog.map((activity, index) => (
                  <div key={index} className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">{activity.action}</span>
                    <span className="text-gray-400">
                      {new Date(activity.timestamp).toLocaleString()}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex justify-end space-x-3 mt-6">
            {isEditing ? (
              <>
                <button
                  onClick={() => setIsEditing(false)}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleUpdateUser}
                  className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
                >
                  Save Changes
                </button>
              </>
            ) : (
              <button
                onClick={() => setIsEditing(true)}
                className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
              >
                Edit User
              </button>
            )}
            <button
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserDetailsModal;
