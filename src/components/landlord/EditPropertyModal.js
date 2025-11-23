import React, { useState, useEffect } from 'react';
import { X, DollarSign, Home, Save, MapPin, Upload, Trash2 } from 'lucide-react';
import { propertiesAPI } from '../../services/api';
import toast from 'react-hot-toast';

const EditPropertyModal = ({ property, onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    area: '',
    distanceValue: '',
    nearestCampus: '',
    price: '',
    vacancies: '',
    status: 'active'
  });
  const [existingImages, setExistingImages] = useState([]);
  const [images, setImages] = useState([]);
  const [imagePreview, setImagePreview] = useState([]);
  const [removeImageIds, setRemoveImageIds] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [location, setLocation] = useState({ latitude: null, longitude: null });
  const [gettingLocation, setGettingLocation] = useState(false);

  useEffect(() => {
    if (property) {
      setFormData({
        title: property.title || '',
        description: property.description || '',
        area: property.location?.area || '',
        distanceValue: property.location?.distanceFromCampus?.value || '',
        nearestCampus: property.location?.nearestCampus || '',
        price: property.price?.amount || property.price || '',
        vacancies: property.availability?.vacancies || property.vacancies || 0,
        status: property.status || 'active'
      });
      setExistingImages(property.images || []);
      setImagePreview([]);
      setImages([]);
      setRemoveImageIds([]);
      const gps = property.premiumDetails?.gpsCoordinates || {};
      setLocation({
        latitude: gps.latitude || null,
        longitude: gps.longitude || null
      });
    }
  }, [property]);

  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      toast.error('Geolocation is not supported by your browser');
      return;
    }

    setGettingLocation(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setLocation({ latitude, longitude });
        toast.success('Location captured successfully!');
        setGettingLocation(false);
      },
      (error) => {
        console.error('Geolocation error:', error);
        toast.error('Failed to get location. Please enable location services.');
        setGettingLocation(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      }
    );
  };

  const handleNewImageUpload = (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;

    const newImages = [];
    const newPreviews = [];

    files.forEach((file) => {
      if (file.size > 15 * 1024 * 1024) {
        toast.error('Image size should be less than 15MB');
        return;
      }

      newImages.push(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        newPreviews.push(reader.result);
        if (newPreviews.length === files.length) {
          setImagePreview((prev) => [...prev, ...newPreviews]);
        }
      };
      reader.readAsDataURL(file);
    });

    setImages((prev) => [...prev, ...newImages]);
  };

  const toggleRemoveExistingImage = (image) => {
    const id = image.cloudinaryId || image._id || image.url;
    setRemoveImageIds((prev) => {
      if (prev.includes(id)) {
        return prev.filter((item) => item !== id);
      }
      return [...prev, id];
    });
  };

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
      const formDataToSend = new FormData();

      formDataToSend.append('priceAmount', parseFloat(formData.price));
      formDataToSend.append('availabilityVacancies', parseInt(formData.vacancies));
      formDataToSend.append('status', formData.status);

      if (formData.title) {
        formDataToSend.append('title', formData.title);
      }
      if (formData.description) {
        formDataToSend.append('description', formData.description);
      }
      if (formData.area) {
        formDataToSend.append('area', formData.area);
      }
      if (formData.distanceValue !== '') {
        formDataToSend.append('distanceValue', formData.distanceValue);
      }
      if (formData.nearestCampus) {
        formDataToSend.append('nearestCampus', formData.nearestCampus);
      }

      if (location.latitude && location.longitude) {
        formDataToSend.append('latitude', location.latitude);
        formDataToSend.append('longitude', location.longitude);
      }

      if (removeImageIds.length > 0) {
        formDataToSend.append('removeImageIds', removeImageIds.join(','));
      }

      if (images.length > 0) {
        images.forEach((image) => {
          formDataToSend.append('images', image);
        });
      }

      console.log('Updating property with FormData');
      const response = await propertiesAPI.updateProperty(property._id, formDataToSend);
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
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-2 sm:p-4">
      <div className="bg-white rounded-lg w-full max-w-lg max-h-[95vh] overflow-y-auto">
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

          {/* Images */}
          <div>
            <h3 className="text-sm font-semibold text-gray-900 mb-2">Property Images</h3>
            {existingImages && existingImages.length > 0 && (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-4">
                {existingImages.map((img) => {
                  const id = img.cloudinaryId || img._id || img.url;
                  const markedForRemoval = removeImageIds.includes(id);
                  return (
                    <div key={id} className="relative group border rounded-lg overflow-hidden">
                      <img
                        src={img.url}
                        alt={img.caption || 'Property image'}
                        className={`w-full h-24 object-cover ${markedForRemoval ? 'opacity-40' : ''}`}
                      />
                      <button
                        type="button"
                        onClick={() => toggleRemoveExistingImage(img)}
                        className="absolute top-1 right-1 bg-white bg-opacity-80 text-red-600 p-1 rounded-full shadow"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                      {markedForRemoval && (
                        <div className="absolute inset-0 flex items-center justify-center text-xs font-semibold text-red-700 bg-white bg-opacity-70">
                          Will be removed
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            <div className="border-2 border-dashed border-gray-300 rounded-lg p-4">
              <input
                type="file"
                multiple
                accept="image/*"
                onChange={handleNewImageUpload}
                className="hidden"
                id="edit-image-upload"
              />
              <label
                htmlFor="edit-image-upload"
                className="flex flex-col items-center cursor-pointer"
              >
                <Upload className="h-8 w-8 text-gray-400 mb-2" />
                <span className="text-sm font-medium text-gray-700">Add New Images</span>
                <span className="text-xs text-gray-500 mt-1">PNG, JPG up to 15MB each</span>
              </label>
            </div>

            {imagePreview.length > 0 && (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-4">
                {imagePreview.map((preview, index) => (
                  <div key={index} className="relative border rounded-lg overflow-hidden">
                    <img
                      src={preview}
                      alt={`New Preview ${index + 1}`}
                      className="w-full h-24 object-cover"
                    />
                  </div>
                ))}
              </div>
            )}
          </div>
          <p className="text-white text-opacity-90 mt-2">{property.title}</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-6">
          {/* Basic Info */}
          <div className="grid grid-cols-1 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Property Title
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-primary-500 focus:border-primary-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Short Description
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-primary-500 focus:border-primary-500"
                placeholder="Describe your property to students..."
              />
            </div>
          </div>

          {/* Current Property Info */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="font-semibold text-gray-900 mb-2">Current Details</h3>
            <div className="space-y-1 text-sm text-gray-600">
              <p>Location: {property.location?.area || 'N/A'}</p>
              <p>Bedrooms: {property.specifications?.bedrooms || property.bedrooms || 0}</p>
              <p>Bathrooms: {property.specifications?.bathrooms || property.bathrooms || 0}</p>
            </div>
          </div>

          {/* Location */}
          <div>
            <h3 className="text-sm font-semibold text-gray-900 mb-2">Location Details</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  <MapPin className="inline h-4 w-4 mr-1" />
                  Area / Neighborhood
                </label>
                <input
                  type="text"
                  value={formData.area}
                  onChange={(e) => setFormData({ ...formData, area: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="e.g., Ruiru, Juja"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Distance from Campus (km)
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={formData.distanceValue}
                  onChange={(e) => setFormData({ ...formData, distanceValue: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="e.g., 1.5"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nearest Campus
                </label>
                <input
                  type="text"
                  value={formData.nearestCampus}
                  onChange={(e) => setFormData({ ...formData, nearestCampus: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="e.g., JKUAT Main Campus"
                />
              </div>
              <div className="sm:col-span-2 flex items-center justify-between flex-wrap gap-2">
                <div>
                  <button
                    type="button"
                    onClick={getCurrentLocation}
                    disabled={gettingLocation}
                    className="inline-flex items-center px-3 py-2 text-sm rounded-lg bg-primary-600 text-white hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <MapPin className="h-4 w-4 mr-1" />
                    {gettingLocation ? 'Getting location...' : 'Use Current Location'}
                  </button>
                </div>
                {location.latitude && location.longitude && (
                  <p className="text-xs text-gray-600">
                    Captured GPS: {location.latitude.toFixed(5)}, {location.longitude.toFixed(5)}
                  </p>
                )}
              </div>
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
