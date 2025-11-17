import React, { useState } from 'react';
import { User, Mail, Phone, School, CreditCard } from 'lucide-react';
import useAuthStore from '../stores/authStore';
import toast from 'react-hot-toast';

const ProfilePage = () => {
  const { user } = useAuthStore();
  const [isEditing, setIsEditing] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    toast.success('Profile updated successfully!');
    setIsEditing(false);
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="h-20 w-20 rounded-full bg-primary-100 flex items-center justify-center">
                {user?.avatar ? (
                  <img 
                    src={user.avatar.url} 
                    alt="Profile" 
                    className="h-20 w-20 rounded-full object-cover" 
                  />
                ) : (
                  <User className="h-10 w-10 text-primary-600" />
                )}
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">{user?.name}</h1>
                <p className="text-gray-600">{user?.email}</p>
                <span className="inline-block mt-1 px-3 py-1 text-xs font-semibold rounded-full bg-primary-100 text-primary-600 capitalize">
                  {user?.role}
                </span>
              </div>
            </div>
            <button
              onClick={() => setIsEditing(!isEditing)}
              className="btn-primary text-sm"
            >
              {isEditing ? 'Cancel' : 'Edit Profile'}
            </button>
          </div>
        </div>

        {/* Profile Details */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-6">Profile Information</h2>
          
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <User className="inline h-4 w-4 mr-2" />
                Full Name
              </label>
              <input
                type="text"
                defaultValue={user?.name}
                disabled={!isEditing}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500 disabled:bg-gray-100"
              />
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Mail className="inline h-4 w-4 mr-2" />
                Email Address
              </label>
              <input
                type="email"
                defaultValue={user?.email}
                disabled
                className="w-full px-4 py-2 border border-gray-300 rounded-md bg-gray-100"
              />
              <p className="mt-1 text-xs text-gray-500">Email cannot be changed</p>
            </div>

            {/* Phone */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Phone className="inline h-4 w-4 mr-2" />
                Phone Number
              </label>
              <input
                type="tel"
                defaultValue={user?.phone}
                disabled={!isEditing}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500 disabled:bg-gray-100"
              />
            </div>

            {/* University */}
            {user?.role === 'student' && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <School className="inline h-4 w-4 mr-2" />
                    University
                  </label>
                  <input
                    type="text"
                    defaultValue={user?.university}
                    disabled={!isEditing}
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500 disabled:bg-gray-100"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <CreditCard className="inline h-4 w-4 mr-2" />
                    Student ID
                  </label>
                  <input
                    type="text"
                    defaultValue={user?.studentId}
                    disabled={!isEditing}
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500 disabled:bg-gray-100"
                  />
                </div>
              </>
            )}

            {isEditing && (
              <div className="flex justify-end space-x-4">
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="px-6 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-primary"
                >
                  Save Changes
                </button>
              </div>
            )}
          </form>
        </div>

        {/* Account Status */}
        <div className="mt-6 bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Account Status</h2>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Email Verified</span>
              <span className={`px-3 py-1 text-xs font-semibold rounded-full ${
                user?.isVerified 
                  ? 'bg-green-100 text-green-600' 
                  : 'bg-yellow-100 text-yellow-600'
              }`}>
                {user?.isVerified ? 'Verified' : 'Not Verified'}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Member Since</span>
              <span className="text-gray-900">
                {user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
