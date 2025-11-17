import React, { useState, useEffect } from 'react';
import { X, DollarSign, Home, Save } from 'lucide-react';
import { propertiesAPI } from '../../services/api';
import toast from 'react-hot-toast';

const EditPropertyModal = ({ property, onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    price: '',
    vacancies: '',
    status: 'active'
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (property) {
      setFormData({
        price: property.price?.amount || property.price || '',
        vacancies: property.availability?.vacancies || property.vacancies || 0,
        status: property.status || 'active'
      });
    }
  }, [property]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.price || formData.price <= 0) {
      toast.error('Please enter a valid price');
      return;
    }

    if (formData.vacancies < 0) {
      toast.error('Vacancies cannot be negative');
      return;
    }

    setIsSubmitting(true);
    try {
      const updateData = {
        price: {
          amount: parseFloat(formData.price),
          currency: property.price?.currency || 'KES',
          period: property.price?.period || 'month',
          negotiable: property.price?.negotiable || false
        },
        status: formData.status,
        availability: {
          ...property.availability,
          vacancies: parseInt(formData.vacancies)
        }
      };

      console.log('Updating property with data:', updateData);
      const response = await propertiesAPI.updateProperty(property._id, updateData);
      console.log('Update response:', response.data);
      toast.success('Property updated successfully!');
      onSuccess();
      onClose();
    } catch (error) {
      console.error('Error updating property:', error);
      console.error('Error response:', error.response?.data);
      toast.error(error.response?.data?.message || 'Failed to update property');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!property) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-gradient-to-r from-primary-600 to-accent-600 text-white p-6 rounded-t-lg">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold">Edit Property</h2>
            <button
              onClick={onClose}
              className="p-1 hover:bg-white hover:bg-opacity-20 rounded-full transition-colors"
            >
              <X className="h-6 w-6" />
            </button>
          </div>
          <p className="text-white text-opacity-90 mt-2">{property.title}</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Current Property Info */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="font-semibold text-gray-900 mb-2">Current Details</h3>
            <div className="space-y-1 text-sm text-gray-600">
              <p>Location: {property.location?.area || 'N/A'}</p>
              <p>Bedrooms: {property.specifications?.bedrooms || property.bedrooms || 0}</p>
              <p>Bathrooms: {property.specifications?.bathrooms || property.bathrooms || 0}</p>
            </div>
          </div>

          {/* Price */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <DollarSign className="inline h-4 w-4 mr-1" />
              Monthly Rent (KSh)
            </label>
            <input
              type="number"
              value={formData.price}
              onChange={(e) => setFormData({ ...formData, price: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              placeholder="e.g., 15000"
              required
              min="0"
              step="100"
            />
            <p className="text-xs text-gray-500 mt-1">
              Current: KSh {(property.price?.amount || property.price || 0).toLocaleString()}
            </p>
          </div>

          {/* Vacancies */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Home className="inline h-4 w-4 mr-1" />
              Available Vacancies
            </label>
            <input
              type="number"
              value={formData.vacancies}
              onChange={(e) => setFormData({ ...formData, vacancies: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              placeholder="e.g., 2"
              required
              min="0"
            />
            <p className="text-xs text-gray-500 mt-1">
              Number of units currently available for rent
            </p>
          </div>

          {/* Status */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Property Status
            </label>
            <select
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            >
              <option value="active">Active (Available)</option>
              <option value="occupied">Fully Occupied</option>
              <option value="maintenance">Under Maintenance</option>
            </select>
          </div>

          {/* Info Box */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm text-blue-800">
              <strong>Note:</strong> Updating the price will be reflected immediately to all students viewing your property. Set vacancies to 0 if fully occupied.
            </p>
          </div>

          {/* Actions */}
          <div className="flex space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
            >
              {isSubmitting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Updating...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Save Changes
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditPropertyModal;
