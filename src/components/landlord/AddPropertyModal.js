import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { X, Upload, MapPin, Home, DollarSign, Bed, Bath, Car, Wifi, Shield, Plus, Trash2, Image, Navigation } from 'lucide-react';
import { propertiesAPI } from '../../services/api';
import toast from 'react-hot-toast';

const AddPropertyModal = ({ isOpen, onClose, onSuccess }) => {
  const [images, setImages] = useState([]);
  const [imagePreview, setImagePreview] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [gettingLocation, setGettingLocation] = useState(false);
  const [location, setLocation] = useState({ latitude: null, longitude: null });
  const [amenities, setAmenities] = useState({
    wifi: false,
    parking: false,
    security: false,
    laundry: false,
    furnished: false,
    electricity: false,
    water: false,
    gym: false,
    pool: false,
    balcony: false,
    kitchen: false,
    airConditioning: false
  });

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset
  } = useForm();

  const handleImageUpload = (e) => {
    const files = Array.from(e.target.files);
    const newImages = [];
    const newPreviews = [];

    files.forEach(file => {
      if (file.size > 5000000) {
        toast.error('Image size should be less than 5MB');
        return;
      }

      newImages.push(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        newPreviews.push(reader.result);
        if (newPreviews.length === files.length) {
          setImagePreview([...imagePreview, ...newPreviews]);
        }
      };
      reader.readAsDataURL(file);
    });

    setImages([...images, ...newImages]);
  };

  const removeImage = (index) => {
    setImages(images.filter((_, i) => i !== index));
    setImagePreview(imagePreview.filter((_, i) => i !== index));
  };

  const handleAmenityChange = (amenity) => {
    setAmenities({ ...amenities, [amenity]: !amenities[amenity] });
  };

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

  const onSubmit = async (data) => {
    setIsSubmitting(true);
    
    try {
      if (images.length === 0) {
        toast.error('Please upload at least one image');
        setIsSubmitting(false);
        return;
      }

      const formData = new FormData();
      
      // Add basic fields
      formData.append('title', data.title);
      formData.append('description', data.description);
      formData.append('price', data.price);
      formData.append('propertyType', data.propertyType);
      formData.append('bedrooms', data.bedrooms);
      formData.append('bathrooms', data.bathrooms);
      
      // Add location fields
      formData.append('area', data.area);
      formData.append('exactAddress', data.exactAddress);
      formData.append('distanceValue', data.distanceValue || 0);
      if (data.nearestCampus) {
        formData.append('nearestCampus', data.nearestCampus);
      }
      if (data.landmarks) {
        formData.append('landmarks', data.landmarks);
      }
      
      // Add GPS coordinates if available
      if (location.latitude && location.longitude) {
        formData.append('latitude', location.latitude);
        formData.append('longitude', location.longitude);
      }
      
      // Add caretaker information
      formData.append('caretakerName', data.caretakerName);
      // Format phone number to +254 format
      let phone = data.caretakerPhone.trim();
      if (phone.startsWith('0')) {
        phone = '+254' + phone.substring(1);
      } else if (phone.startsWith('254')) {
        phone = '+' + phone;
      } else if (!phone.startsWith('+254')) {
        phone = '+254' + phone;
      }
      formData.append('caretakerPhone', phone);
      
      // Add optional fields
      if (data.houseRules) {
        formData.append('houseRules', data.houseRules);
      }
      if (data.availableFrom) {
        formData.append('availableFrom', data.availableFrom);
      }

      // Add amenities as comma-separated values
      const selectedAmenities = Object.keys(amenities).filter(key => amenities[key]);
      if (selectedAmenities.length > 0) {
        formData.append('essentialAmenities', selectedAmenities.join(','));
      }

      // Add images
      images.forEach(image => {
        formData.append('images', image);
      });

      // Add status (pending for admin approval)
      formData.append('status', 'pending');

      const response = await propertiesAPI.createProperty(formData);
      
      toast.success('Property submitted for approval!');
      reset();
      setImages([]);
      setImagePreview([]);
      setAmenities({
        wifi: false,
        parking: false,
        security: false,
        laundry: false,
        furnished: false,
        electricity: false,
        water: false,
        gym: false,
        pool: false,
        balcony: false,
        kitchen: false,
        airConditioning: false
      });
      if (onSuccess) onSuccess(response.data);
      onClose();
    } catch (error) {
      console.error('Error creating property:', error);
      toast.error(error.response?.data?.message || 'Failed to create property');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b px-6 py-4 flex justify-between items-center">
          <h2 className="text-2xl font-bold text-gray-900">Add New Property</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="h-6 w-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-6">
          {/* Basic Information */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Basic Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Property Title *
                </label>
                <input
                  type="text"
                  {...register('title', { required: 'Title is required' })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-primary-500 focus:border-primary-500"
                  placeholder="e.g., Modern 2BR Apartment near Campus"
                />
                {errors.title && (
                  <p className="text-red-500 text-sm mt-1">{errors.title.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Property Type *
                </label>
                <select
                  {...register('propertyType', { required: 'Property type is required' })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-primary-500 focus:border-primary-500"
                >
                  <option value="">Select Type</option>
                  <option value="apartment">Apartment</option>
                  <option value="hostel">Hostel</option>
                  <option value="bedsitter">Bedsitter</option>
                  <option value="1br">1 Bedroom</option>
                  <option value="2br">2 Bedrooms</option>
                  <option value="3br">3 Bedrooms</option>
                  <option value="studio">Studio</option>
                  <option value="house">House</option>
                  <option value="shared">Shared Room</option>
                </select>
                {errors.propertyType && (
                  <p className="text-red-500 text-sm mt-1">{errors.propertyType.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Price (KSh/month) *
                </label>
                <input
                  type="number"
                  {...register('price', { 
                    required: 'Price is required',
                    min: { value: 1000, message: 'Price must be at least 1000' }
                  })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-primary-500 focus:border-primary-500"
                  placeholder="e.g., 15000"
                />
                {errors.price && (
                  <p className="text-red-500 text-sm mt-1">{errors.price.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Number of Bedrooms *
                </label>
                <input
                  type="number"
                  {...register('bedrooms', { 
                    required: 'Number of bedrooms is required',
                    min: { value: 0, message: 'Cannot be negative' }
                  })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-primary-500 focus:border-primary-500"
                  placeholder="e.g., 2"
                />
                {errors.bedrooms && (
                  <p className="text-red-500 text-sm mt-1">{errors.bedrooms.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Number of Bathrooms *
                </label>
                <input
                  type="number"
                  {...register('bathrooms', { 
                    required: 'Number of bathrooms is required',
                    min: { value: 0, message: 'Cannot be negative' }
                  })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-primary-500 focus:border-primary-500"
                  placeholder="e.g., 1"
                />
                {errors.bathrooms && (
                  <p className="text-red-500 text-sm mt-1">{errors.bathrooms.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Available From *
                </label>
                <input
                  type="date"
                  {...register('availableFrom', { required: 'Available date is required' })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-primary-500 focus:border-primary-500"
                />
                {errors.availableFrom && (
                  <p className="text-red-500 text-sm mt-1">{errors.availableFrom.message}</p>
                )}
              </div>
            </div>
          </div>

          {/* Location Information */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Location Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Area/Neighborhood *
                </label>
                <input
                  type="text"
                  {...register('area', { required: 'Area is required' })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-primary-500 focus:border-primary-500"
                  placeholder="e.g., Ruiru, Juja"
                />
                {errors.area && (
                  <p className="text-red-500 text-sm mt-1">{errors.area.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Distance from Campus (km) *
                </label>
                <input
                  type="number"
                  step="0.1"
                  {...register('distanceValue', { 
                    required: 'Distance is required',
                    min: { value: 0, message: 'Distance cannot be negative' }
                  })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-primary-500 focus:border-primary-500"
                  placeholder="e.g., 1.5"
                />
                {errors.distanceValue && (
                  <p className="text-red-500 text-sm mt-1">{errors.distanceValue.message}</p>
                )}
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Full Address *
                </label>
                <textarea
                  {...register('exactAddress', { required: 'Address is required' })}
                  rows="2"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-primary-500 focus:border-primary-500"
                  placeholder="Enter complete address"
                />
                {errors.exactAddress && (
                  <p className="text-red-500 text-sm mt-1">{errors.exactAddress.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nearest Campus
                </label>
                <input
                  type="text"
                  {...register('nearestCampus')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-primary-500 focus:border-primary-500"
                  placeholder="e.g., JKUAT Main Campus"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nearby Landmarks
                </label>
                <input
                  type="text"
                  {...register('landmarks')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-primary-500 focus:border-primary-500"
                  placeholder="e.g., Near City Mall, opposite Shell Station"
                />
              </div>

              {/* GPS Location */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  GPS Location (Optional but Recommended)
                </label>
                <div className="flex items-center space-x-4">
                  <button
                    type="button"
                    onClick={getCurrentLocation}
                    disabled={gettingLocation}
                    className="flex items-center space-x-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Navigation className="h-5 w-5" />
                    <span>{gettingLocation ? 'Getting Location...' : 'Use Current Location'}</span>
                  </button>
                  {location.latitude && location.longitude && (
                    <div className="flex items-center space-x-2 text-green-600">
                      <MapPin className="h-5 w-5" />
                      <span className="text-sm font-medium">
                        Location Captured: {location.latitude.toFixed(6)}, {location.longitude.toFixed(6)}
                      </span>
                    </div>
                  )}
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  📍 Stand at the exact location of your property and click the button to capture GPS coordinates.
                  This helps students find your property easily.
                </p>
              </div>
            </div>
          </div>

          {/* Amenities */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Amenities</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {Object.keys(amenities).map(amenity => (
                <label key={amenity} className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={amenities[amenity]}
                    onChange={() => handleAmenityChange(amenity)}
                    className="h-4 w-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                  />
                  <span className="text-sm text-gray-700 capitalize">
                    {amenity.replace(/([A-Z])/g, ' $1').trim()}
                  </span>
                </label>
              ))}
            </div>
          </div>

          {/* Property Description */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Description</h3>
            <textarea
              {...register('description', { required: 'Description is required' })}
              rows="4"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-primary-500 focus:border-primary-500"
              placeholder="Provide a detailed description of the property..."
            />
            {errors.description && (
              <p className="text-red-500 text-sm mt-1">{errors.description.message}</p>
            )}
          </div>

          {/* House Rules */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">House Rules</h3>
            <textarea
              {...register('houseRules')}
              rows="3"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-primary-500 focus:border-primary-500"
              placeholder="e.g., No pets, No smoking, Quiet hours after 10pm..."
            />
          </div>

          {/* Contact Information */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Contact Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Caretaker Name *
                </label>
                <input
                  type="text"
                  {...register('caretakerName', { required: 'Caretaker name is required' })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-primary-500 focus:border-primary-500"
                  placeholder="Enter caretaker's name"
                />
                {errors.caretakerName && (
                  <p className="text-red-500 text-sm mt-1">{errors.caretakerName.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Caretaker Phone *
                </label>
                <input
                  type="tel"
                  {...register('caretakerPhone', { 
                    required: 'Phone number is required',
                    pattern: {
                      value: /^(?:254|\+254|0)?(7\d{8})$/,
                      message: 'Enter a valid phone number'
                    }
                  })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-primary-500 focus:border-primary-500"
                  placeholder="e.g., 0712345678"
                />
                {errors.caretakerPhone && (
                  <p className="text-red-500 text-sm mt-1">{errors.caretakerPhone.message}</p>
                )}
              </div>
            </div>
          </div>

          {/* Property Images */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Property Images</h3>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6">
              <input
                type="file"
                multiple
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
                id="image-upload"
              />
              <label
                htmlFor="image-upload"
                className="flex flex-col items-center cursor-pointer"
              >
                <Upload className="h-12 w-12 text-gray-400 mb-3" />
                <span className="text-sm font-medium text-gray-700">
                  Click to upload images
                </span>
                <span className="text-xs text-gray-500 mt-1">
                  PNG, JPG up to 5MB each
                </span>
              </label>
            </div>

            {imagePreview.length > 0 && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                {imagePreview.map((preview, index) => (
                  <div key={index} className="relative group">
                    <img
                      src={preview}
                      alt={`Preview ${index + 1}`}
                      className="w-full h-24 object-cover rounded-lg"
                    />
                    <button
                      type="button"
                      onClick={() => removeImage(index)}
                      className="absolute top-1 right-1 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Submit Button */}
          <div className="flex justify-end space-x-4">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50"
            >
              {isSubmitting ? 'Submitting...' : 'Submit Property'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddPropertyModal;
