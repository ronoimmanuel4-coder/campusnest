import React, { useState, useEffect } from 'react';
import {
  Search, Filter, Pin, Star, Eye, Edit, Trash2, CheckCircle,
  XCircle, Clock, Building, MapPin, DollarSign, AlertTriangle,
  TrendingUp, Image, Home, Ban, Shield, RefreshCw, Download
} from 'lucide-react';
import { adminAPI } from '../../services/api';
import toast from 'react-hot-toast';
import PropertyDetailModal from './PropertyDetailModal';

const AdminPropertyManagement = () => {
  const [properties, setProperties] = useState([]);
  const [filteredProperties, setFilteredProperties] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterType, setFilterType] = useState('all');
  const [selectedProperty, setSelectedProperty] = useState(null);
  const [showPropertyModal, setShowPropertyModal] = useState(false);

  useEffect(() => {
    fetchProperties();
  }, []);

  useEffect(() => {
    filterProperties();
  }, [properties, searchTerm, filterStatus, filterType]);

  const fetchProperties = async () => {
    try {
      const response = await adminAPI.getProperties();
      console.log('Admin Properties Response:', response.data);
      // Backend returns data array directly
      const allProperties = response.data.data || response.data.properties || response.data || [];
      setProperties(allProperties);
    } catch (error) {
      console.error('Failed to load properties:', error);
      toast.error('Failed to load properties');
    } finally {
      setIsLoading(false);
    }
  };

  const filterProperties = () => {
    let filtered = [...properties];
    
    if (searchTerm) {
      filtered = filtered.filter(prop =>
        prop.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        prop.location?.area?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    if (filterStatus !== 'all') {
      filtered = filtered.filter(prop => prop.status === filterStatus);
    }
    
    if (filterType !== 'all') {
      if (filterType === 'featured') {
        filtered = filtered.filter(prop => prop.isFeatured);
      } else if (filterType === 'pinned') {
        filtered = filtered.filter(prop => prop.isPinned);
      } else if (filterType === 'reported') {
        filtered = filtered.filter(prop => prop.reports?.length > 0);
      }
    }
    
    setFilteredProperties(filtered);
  };

  const handlePropertyAction = async (propertyId, action) => {
    try {
      switch(action) {
        case 'approve':
          await adminAPI.approveProperty(propertyId);
          toast.success('Property approved');
          break;
        case 'reject':
          await adminAPI.rejectProperty(propertyId);
          toast.success('Property rejected');
          break;
        case 'pin':
          await adminAPI.pinProperty(propertyId);
          toast.success('Property pinned to top');
          break;
        case 'unpin':
          await adminAPI.unpinProperty(propertyId);
          toast.success('Property unpinned');
          break;
        case 'feature':
          await adminAPI.featureProperty(propertyId);
          toast.success('Property featured');
          break;
        case 'unfeature':
          await adminAPI.unfeatureProperty(propertyId);
          toast.success('Property unfeatured');
          break;
        case 'delete':
          if (window.confirm('Are you sure you want to delete this property?')) {
            await adminAPI.deleteProperty(propertyId);
            toast.success('Property deleted');
          }
          break;
        default:
          break;
      }
      fetchProperties();
    } catch (error) {
      toast.error(`Failed to ${action} property`);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  const stats = {
    total: properties.length,
    active: properties.filter(p => p.status === 'active').length,
    pending: properties.filter(p => p.status === 'pending').length,
    featured: properties.filter(p => p.isFeatured).length,
    pinned: properties.filter(p => p.isPinned).length,
    reported: properties.filter(p => p.reports?.length > 0).length
  };

  return (
    <div>
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold text-gray-900">Property Management</h2>
        <button onClick={fetchProperties} className="p-2 text-gray-600 hover:text-gray-900">
          <RefreshCw className="h-5 w-5" />
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-6 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total</p>
              <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
            </div>
            <Home className="h-8 w-8 text-blue-600 opacity-20" />
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Active</p>
              <p className="text-2xl font-bold text-green-600">{stats.active}</p>
            </div>
            <CheckCircle className="h-8 w-8 text-green-600 opacity-20" />
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Pending</p>
              <p className="text-2xl font-bold text-yellow-600">{stats.pending}</p>
            </div>
            <Clock className="h-8 w-8 text-yellow-600 opacity-20" />
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Featured</p>
              <p className="text-2xl font-bold text-purple-600">{stats.featured}</p>
            </div>
            <Star className="h-8 w-8 text-purple-600 opacity-20" />
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Pinned</p>
              <p className="text-2xl font-bold text-blue-600">{stats.pinned}</p>
            </div>
            <Pin className="h-8 w-8 text-blue-600 opacity-20" />
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Reported</p>
              <p className="text-2xl font-bold text-red-600">{stats.reported}</p>
            </div>
            <AlertTriangle className="h-8 w-8 text-red-600 opacity-20" />
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
                placeholder="Search properties..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
              />
            </div>
          </div>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg"
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="pending">Pending</option>
            <option value="rejected">Rejected</option>
            <option value="inactive">Inactive</option>
          </select>
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg"
          >
            <option value="all">All Types</option>
            <option value="featured">Featured</option>
            <option value="pinned">Pinned</option>
            <option value="reported">Reported</option>
          </select>
          <button className="btn-primary flex items-center">
            <Download className="h-4 w-4 mr-2" />
            Export
          </button>
        </div>
      </div>

      {/* Properties Grid */}
      <div className="grid grid-cols-1 gap-6">
        {filteredProperties.map((property) => (
          <div key={property._id} className="bg-white rounded-lg shadow">
            <div className="p-6">
              <div className="flex flex-col lg:flex-row lg:justify-between gap-4">
                {/* Property Info */}
                <div className="flex flex-col sm:flex-row gap-4">
                  {/* Image */}
                  <div className="w-32 h-32 bg-gray-200 rounded-lg overflow-hidden flex-shrink-0">
                    {property.images?.[0] ? (
                      <img 
                        src={property.images[0]} 
                        alt={property.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Image className="h-8 w-8 text-gray-400" />
                      </div>
                    )}
                  </div>
                  
                  {/* Details */}
                  <div className="flex-1">
                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
                      <div>
                        <div className="flex items-center">
                          <h3 className="text-lg font-semibold text-gray-900">
                            {property.title}
                          </h3>
                          {property.isFeatured && (
                            <Star className="h-5 w-5 text-yellow-500 ml-2 fill-current" />
                          )}
                          {property.isPinned && (
                            <Pin className="h-5 w-5 text-blue-500 ml-2" />
                          )}
                        </div>
                        <div className="flex items-center text-sm text-gray-600 mt-1">
                          <MapPin className="h-4 w-4 mr-1" />
                          {property.location?.area || 'Unknown Location'}
                        </div>
                        <div className="flex items-center space-x-4 mt-2">
                          <span className="text-sm text-gray-600">
                            <Building className="inline h-4 w-4 mr-1" />
                            {property.bedrooms} bed, {property.bathrooms} bath
                          </span>
                          <span className="text-sm font-semibold text-primary-600">
                            {(() => {
                              const rawPrice = property.price;
                              const amount =
                                typeof rawPrice === 'number'
                                  ? rawPrice
                                  : rawPrice?.amount;
                              return `KSh ${
                                typeof amount === 'number'
                                  ? amount.toLocaleString()
                                  : '0'
                              }/month`;
                            })()}
                          </span>
                        </div>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                        property.status === 'active' 
                          ? 'bg-green-100 text-green-800'
                          : property.status === 'pending'
                          ? 'bg-yellow-100 text-yellow-800'
                          : property.status === 'rejected'
                          ? 'bg-red-100 text-red-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {property.status}
                      </span>
                    </div>

                    {/* Stats */}
                    <div className="flex flex-wrap gap-x-4 gap-y-2 mt-4 text-sm text-gray-500">
                      <span className="flex items-center">
                        <Eye className="h-4 w-4 mr-1" />
                        {property.stats?.views || 0} views
                      </span>
                      <span className="flex items-center">
                        <TrendingUp className="h-4 w-4 mr-1" />
                        {property.stats?.inquiries || 0} inquiries
                      </span>
                      <span className="flex items-center">
                        <Shield className="h-4 w-4 mr-1" />
                        {property.stats?.unlocks || 0} unlocks
                      </span>
                      {property.reports?.length > 0 && (
                        <span className="flex items-center text-red-600">
                          <AlertTriangle className="h-4 w-4 mr-1" />
                          {property.reports.length} reports
                        </span>
                      )}
                    </div>

                    {/* Landlord Info */}
                    <div className="flex flex-wrap items-center mt-3 text-sm text-gray-600">
                      <span className="font-medium mr-2">Landlord:</span>
                      {property.landlord?.name || 'Unknown'}
                      <span className="mx-2">•</span>
                      {property.landlord?.email}
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="mt-4 lg:mt-0 flex flex-col space-y-2">
                  {property.status === 'pending' && (
                    <>
                      <button
                        onClick={() => handlePropertyAction(property._id, 'approve')}
                        className="px-4 py-2 bg-green-600 text-white rounded-md text-sm hover:bg-green-700"
                      >
                        Approve
                      </button>
                      <button
                        onClick={() => handlePropertyAction(property._id, 'reject')}
                        className="px-4 py-2 bg-red-600 text-white rounded-md text-sm hover:bg-red-700"
                      >
                        Reject
                      </button>
                    </>
                  )}
                  <button
                    onClick={() => handlePropertyAction(property._id, property.isPinned ? 'unpin' : 'pin')}
                    className={`px-4 py-2 ${property.isPinned ? 'bg-gray-600' : 'bg-blue-600'} text-white rounded-md text-sm`}
                  >
                    {property.isPinned ? 'Unpin' : 'Pin'}
                  </button>
                  <button
                    onClick={() => handlePropertyAction(property._id, property.isFeatured ? 'unfeature' : 'feature')}
                    className={`px-4 py-2 ${property.isFeatured ? 'bg-gray-600' : 'bg-purple-600'} text-white rounded-md text-sm`}
                  >
                    {property.isFeatured ? 'Unfeature' : 'Feature'}
                  </button>
                  <button
                    onClick={() => {
                      setSelectedProperty(property);
                      setShowPropertyModal(true);
                    }}
                    className="px-4 py-2 bg-gray-600 text-white rounded-md text-sm hover:bg-gray-700"
                  >
                    View Details
                  </button>
                  <button
                    onClick={() => handlePropertyAction(property._id, 'delete')}
                    className="px-4 py-2 border border-red-600 text-red-600 rounded-md text-sm hover:bg-red-50"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredProperties.length === 0 && (
        <div className="text-center py-12 bg-white rounded-lg">
          <Home className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">No properties found</p>
        </div>
      )}

      {/* Property Detail Modal */}
      <PropertyDetailModal
        property={selectedProperty}
        isOpen={showPropertyModal}
        onClose={() => {
          setShowPropertyModal(false);
          setSelectedProperty(null);
        }}
      />
    </div>
  );
};

export default AdminPropertyManagement;
