import React, { useState, useEffect } from 'react';
import { X, MapPin, Bed, Bath, DollarSign, Home, Navigation, ExternalLink, Calendar, User, Phone, Mail } from 'lucide-react';
import { adminAPI, propertiesAPI } from '../../services/api';
import toast from 'react-hot-toast';

const PropertyDetailModal = ({ property, isOpen, onClose, onUpdated }) => {
  const [form, setForm] = useState({
    title: '',
    priceAmount: '',
    bedrooms: '',
    bathrooms: '',
    propertyType: '',
    area: '',
    nearestCampus: '',
    exactAddress: '',
    latitude: '',
    longitude: '',
    description: '',
    houseRules: '',
    videoUrl: '',
    amenitiesEssential: '',
    amenitiesSecurity: '',
    amenitiesExtras: '',
    caretakerName: '',
    caretakerPhone: '',
    status: '',
    vacancies: '',
    availableFrom: ''
  });

  const [saving, setSaving] = useState(false);
  const [imagesState, setImagesState] = useState([]);
  const [newImages, setNewImages] = useState([]);

  useEffect(() => {
    if (!property) return;

    const rawPrice = property.price;
    const priceValue =
      typeof rawPrice === 'number'
        ? rawPrice
        : rawPrice?.amount || '';

    const availableFromRaw = property.availability?.availableFrom;
    let availableFrom = '';
    if (availableFromRaw) {
      const d = new Date(availableFromRaw);
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      availableFrom = `${year}-${month}-${day}`;
    }

    setForm({
      title: property.title || '',
      priceAmount: priceValue,
      bedrooms: property.specifications?.bedrooms || property.bedrooms || '',
      bathrooms: property.specifications?.bathrooms || property.bathrooms || '',
      propertyType: property.specifications?.propertyType || property.propertyType || '',
      area: property.location?.area || '',
      nearestCampus: property.location?.nearestCampus || '',
      exactAddress: property.premiumDetails?.exactAddress || '',
      latitude: property.premiumDetails?.gpsCoordinates?.latitude ?? '',
      longitude: property.premiumDetails?.gpsCoordinates?.longitude ?? '',
      description: property.description || '',
      houseRules: property.houseRules || '',
       videoUrl: property.videoUrl || '',
      amenitiesEssential: Array.isArray(property.amenities?.essential)
        ? property.amenities.essential.join(', ')
        : '',
      amenitiesSecurity: Array.isArray(property.amenities?.security)
        ? property.amenities.security.join(', ')
        : '',
      amenitiesExtras: Array.isArray(property.amenities?.extras)
        ? property.amenities.extras.join(', ')
        : '',
      caretakerName: property.premiumDetails?.caretaker?.name || '',
      caretakerPhone: property.premiumDetails?.caretaker?.phone || '',
      status: property.status || '',
      vacancies: property.availability?.vacancies ?? '',
      availableFrom
    });

    // Initialize images state for admin management
    const normalizedImages = (property.images || []).map((img, index) => {
      const obj = typeof img === 'string' ? { url: img } : img;
      const key = (obj.cloudinaryId || obj._id || obj.url || index).toString();
      return {
        key,
        url: obj.url || (typeof img === 'string' ? img : ''),
        cloudinaryId: obj.cloudinaryId,
        _id: obj._id,
        markedForRemoval: false
      };
    });
    setImagesState(normalizedImages);
    setNewImages([]);
  }, [property]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const toggleRemoveImage = (key) => {
    setImagesState((prev) =>
      prev.map((img) =>
        img.key === key ? { ...img, markedForRemoval: !img.markedForRemoval } : img
      )
    );
  };

  const handleNewImagesChange = (e) => {
    const files = Array.from(e.target.files || []);
    setNewImages(files);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!property) return;

    try {
      setSaving(true);
      // First, handle image updates via main properties API using FormData
      const removeImageIds = imagesState
        .filter((img) => img.markedForRemoval)
        .map((img) => img.cloudinaryId || (img._id && img._id.toString()) || img.url)
        .filter(Boolean);

      if (removeImageIds.length > 0 || newImages.length > 0) {
        const formData = new FormData();
        if (removeImageIds.length > 0) {
          formData.append('removeImageIds', removeImageIds.join(','));
        }
        newImages.forEach((file) => {
          formData.append('images', file);
        });

        await propertiesAPI.updateProperty(property._id, formData);
      }

      // Then update core fields through admin API
      await adminAPI.updateProperty(property._id, {
        title: form.title,
        description: form.description,
        houseRules: form.houseRules,
        videoUrl: form.videoUrl,
        priceAmount: form.priceAmount,
        propertyType: form.propertyType,
        bedrooms: form.bedrooms,
        bathrooms: form.bathrooms,
        area: form.area,
        nearestCampus: form.nearestCampus,
        exactAddress: form.exactAddress,
        latitude: form.latitude,
        longitude: form.longitude,
        caretakerName: form.caretakerName,
        caretakerPhone: form.caretakerPhone,
        amenitiesEssential: form.amenitiesEssential,
        amenitiesSecurity: form.amenitiesSecurity,
        amenitiesExtras: form.amenitiesExtras,
        vacancies: form.vacancies,
        status: form.status,
        availableFrom: form.availableFrom
      });

      toast.success('Property updated successfully');
      if (onUpdated) onUpdated();
    } catch (error) {
      console.error('Admin update property error:', error);
      toast.error('Failed to update property');
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen || !property) return null;

  const openGoogleMaps = () => {
    const lat = property.premiumDetails?.gpsCoordinates?.latitude;
    const lng = property.premiumDetails?.gpsCoordinates?.longitude;
    
    if (lat && lng) {
      // Opens Google Maps with navigation to the coordinates
      window.open(`https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`, '_blank');
    } else {
      // Fallback to search by address
      const address = encodeURIComponent(
        property.premiumDetails?.exactAddress || 
        `${property.title}, ${property.location?.area}`
      );
      window.open(`https://www.google.com/maps/search/?api=1&query=${address}`, '_blank');
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        {/* Background overlay */}
        <div 
          className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75" 
          onClick={onClose}
        ></div>

        {/* Center modal */}
        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-4xl sm:w-full">
          {/* Header */}
          <div className="bg-gradient-to-r from-primary-600 to-primary-700 px-6 py-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-bold text-white">Property Details</h3>
              <button
                onClick={onClose}
                className="text-white hover:text-gray-200 transition-colors"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="px-6 py-4 max-h-[80vh] overflow-y-auto">
            {/* Property Images */}
            {property.images && property.images.length > 0 && (
              <div className="mb-6">
                <h4 className="text-lg font-semibold text-gray-900 mb-3">Property Images</h4>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {imagesState.map((img) => (
                    <div
                      key={img.key}
                      className="relative aspect-video rounded-lg overflow-hidden group border border-gray-200"
                    >
                      <img
                        src={img.url}
                        alt={property.title}
                        className={`w-full h-full object-cover transition-transform duration-300 group-hover:scale-110 ${
                          img.markedForRemoval ? 'opacity-40' : ''
                        }`}
                      />
                      <button
                        type="button"
                        onClick={() => toggleRemoveImage(img.key)}
                        className={`absolute top-2 right-2 px-2 py-1 text-xs rounded-md ${
                          img.markedForRemoval
                            ? 'bg-red-600 text-white'
                            : 'bg-black/60 text-white hover:bg-black'
                        }`}
                      >
                        {img.markedForRemoval ? 'Undo' : 'Remove'}
                      </button>
                    </div>
                  ))}
                </div>
                <div className="mt-3">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Add New Images (Admin)
                  </label>
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleNewImagesChange}
                    className="block w-full text-sm text-gray-700 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100"
                  />
                  {newImages.length > 0 && (
                    <p className="mt-1 text-xs text-gray-500">
                      {newImages.length} new image{newImages.length > 1 ? 's' : ''} selected
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Basic Information */}
            <div className="mb-6">
              <h4 className="text-lg font-semibold text-gray-900 mb-3">Basic Information</h4>
              <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                <div className="flex items-start">
                  <Home className="h-5 w-5 text-gray-400 mr-3 mt-0.5" />
                  <div>
                    <p className="text-sm text-gray-600">Title</p>
                    <p className="text-base font-semibold text-gray-900">{property.title}</p>
                  </div>
                </div>
                
                <div className="flex items-start">
                  <DollarSign className="h-5 w-5 text-gray-400 mr-3 mt-0.5" />
                  <div>
                    <p className="text-sm text-gray-600">Price</p>
                    <p className="text-base font-semibold text-primary-600">
                      KSh {(
                        typeof (property.price?.amount ?? property.price) === 'number'
                          ? (property.price?.amount ?? property.price).toLocaleString()
                          : '0'
                      )}/month
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-start">
                    <Bed className="h-5 w-5 text-gray-400 mr-3 mt-0.5" />
                    <div>
                      <p className="text-sm text-gray-600">Bedrooms</p>
                      <p className="text-base font-semibold text-gray-900">{property.specifications?.bedrooms || property.bedrooms || 'N/A'}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start">
                    <Bath className="h-5 w-5 text-gray-400 mr-3 mt-0.5" />
                    <div>
                      <p className="text-sm text-gray-600">Bathrooms</p>
                      <p className="text-base font-semibold text-gray-900">{property.specifications?.bathrooms || property.bathrooms || 'N/A'}</p>
                    </div>
                  </div>
                </div>

                <div className="flex items-start">
                  <Home className="h-5 w-5 text-gray-400 mr-3 mt-0.5" />
                  <div>
                    <p className="text-sm text-gray-600">Property Type</p>
                    <p className="text-base font-semibold text-gray-900 capitalize">
                      {property.specifications?.propertyType || property.propertyType || 'N/A'}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Location Information */}
            <div className="mb-6">
              <h4 className="text-lg font-semibold text-gray-900 mb-3">Location Information</h4>
              <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                <div className="flex items-start">
                  <MapPin className="h-5 w-5 text-gray-400 mr-3 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm text-gray-600">Area</p>
                    <p className="text-base font-semibold text-gray-900">{property.location?.area || 'N/A'}</p>
                  </div>
                </div>

                {property.premiumDetails?.exactAddress && (
                  <div className="flex items-start">
                    <MapPin className="h-5 w-5 text-gray-400 mr-3 mt-0.5" />
                    <div className="flex-1">
                      <p className="text-sm text-gray-600">Exact Address</p>
                      <p className="text-base text-gray-900">{property.premiumDetails.exactAddress}</p>
                    </div>
                  </div>
                )}

                {property.premiumDetails?.gpsCoordinates?.latitude && property.premiumDetails?.gpsCoordinates?.longitude && (
                  <div className="flex items-start">
                    <Navigation className="h-5 w-5 text-green-500 mr-3 mt-0.5" />
                    <div className="flex-1">
                      <p className="text-sm text-gray-600">GPS Coordinates</p>
                      <p className="text-base text-gray-900 font-mono">
                        {property.premiumDetails.gpsCoordinates.latitude.toFixed(6)}, {property.premiumDetails.gpsCoordinates.longitude.toFixed(6)}
                      </p>
                      <button
                        onClick={openGoogleMaps}
                        className="mt-2 inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
                      >
                        <Navigation className="h-4 w-4 mr-2" />
                        Open in Google Maps
                        <ExternalLink className="h-4 w-4 ml-2" />
                      </button>
                    </div>
                  </div>
                )}

                {!property.premiumDetails?.gpsCoordinates?.latitude && (
                  <div className="flex items-start">
                    <Navigation className="h-5 w-5 text-gray-400 mr-3 mt-0.5" />
                    <div className="flex-1">
                      <p className="text-sm text-gray-600">GPS Location</p>
                      <p className="text-base text-gray-500 italic">Not available</p>
                      <button
                        onClick={openGoogleMaps}
                        className="mt-2 inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
                      >
                        <MapPin className="h-4 w-4 mr-2" />
                        Search on Google Maps
                        <ExternalLink className="h-4 w-4 ml-2" />
                      </button>
                    </div>
                  </div>
                )}

                {property.location?.nearestCampus && (
                  <div className="flex items-start">
                    <Home className="h-5 w-5 text-gray-400 mr-3 mt-0.5" />
                    <div>
                      <p className="text-sm text-gray-600">Nearest Campus</p>
                      <p className="text-base text-gray-900">{property.location.nearestCampus}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Description */}
            {property.description && (
              <div className="mb-6">
                <h4 className="text-lg font-semibold text-gray-900 mb-3">Description</h4>
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-gray-700 whitespace-pre-line">{property.description}</p>
                </div>
              </div>
            )}

            {/* Amenities */}
            {property.amenities && Object.keys(property.amenities).length > 0 && (
              <div className="mb-6">
                <h4 className="text-lg font-semibold text-gray-900 mb-3">Amenities</h4>
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                    {Object.entries(property.amenities).map(([key, value]) => {
                      if (value) {
                        return (
                          <div key={key} className="flex items-center text-sm text-gray-700">
                            <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                            <span className="capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}</span>
                          </div>
                        );
                      }
                      return null;
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* Caretaker Information */}
            {property.premiumDetails?.caretaker && (
              <div className="mb-6">
                <h4 className="text-lg font-semibold text-gray-900 mb-3">Caretaker Contact</h4>
                <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                  <div className="flex items-start">
                    <User className="h-5 w-5 text-gray-400 mr-3 mt-0.5" />
                    <div>
                      <p className="text-sm text-gray-600">Name</p>
                      <p className="text-base text-gray-900">{property.premiumDetails.caretaker.name}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start">
                    <Phone className="h-5 w-5 text-gray-400 mr-3 mt-0.5" />
                    <div>
                      <p className="text-sm text-gray-600">Phone</p>
                      <a 
                        href={`tel:${property.premiumDetails.caretaker.phone}`}
                        className="text-base text-primary-600 hover:underline"
                      >
                        {property.premiumDetails.caretaker.phone}
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Landlord Information */}
            {property.landlord && (
              <div className="mb-6">
                <h4 className="text-lg font-semibold text-gray-900 mb-3">Landlord Information</h4>
                <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                  <div className="flex items-start">
                    <User className="h-5 w-5 text-gray-400 mr-3 mt-0.5" />
                    <div>
                      <p className="text-sm text-gray-600">Name</p>
                      <p className="text-base text-gray-900">{property.landlord.name || 'N/A'}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start">
                    <Mail className="h-5 w-5 text-gray-400 mr-3 mt-0.5" />
                    <div>
                      <p className="text-sm text-gray-600">Email</p>
                      <a 
                        href={`mailto:${property.landlord.email}`}
                        className="text-base text-primary-600 hover:underline"
                      >
                        {property.landlord.email || 'N/A'}
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Admin Edit */}
            <div className="mb-6 mt-4 border-t pt-4">
              <h4 className="text-lg font-semibold text-gray-900 mb-3">Admin Edit</h4>
              <form onSubmit={handleSave} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                    <input
                      type="text"
                      name="title"
                      value={form.title}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Price (KSh/month)</label>
                    <input
                      type="number"
                      name="priceAmount"
                      value={form.priceAmount}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Bedrooms</label>
                    <input
                      type="number"
                      name="bedrooms"
                      value={form.bedrooms}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Bathrooms</label>
                    <input
                      type="number"
                      name="bathrooms"
                      value={form.bathrooms}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Property Type</label>
                    <input
                      type="text"
                      name="propertyType"
                      value={form.propertyType}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Area</label>
                    <input
                      type="text"
                      name="area"
                      value={form.area}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Exact Address</label>
                    <input
                      type="text"
                      name="exactAddress"
                      value={form.exactAddress}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Nearest Campus</label>
                    <input
                      type="text"
                      name="nearestCampus"
                      value={form.nearestCampus}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Latitude</label>
                    <input
                      type="number"
                      step="0.000001"
                      name="latitude"
                      value={form.latitude}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Longitude</label>
                    <input
                      type="number"
                      step="0.000001"
                      name="longitude"
                      value={form.longitude}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Caretaker Name</label>
                    <input
                      type="text"
                      name="caretakerName"
                      value={form.caretakerName}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Caretaker Phone</label>
                    <input
                      type="text"
                      name="caretakerPhone"
                      value={form.caretakerPhone}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500 text-sm"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                  <textarea
                    name="description"
                    rows="3"
                    value={form.description}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500 text-sm"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">House Rules</label>
                  <textarea
                    name="houseRules"
                    rows="3"
                    value={form.houseRules}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500 text-sm"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">TikTok Video URL</label>
                  <input
                    type="url"
                    name="videoUrl"
                    value={form.videoUrl}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500 text-sm"
                    placeholder="Paste TikTok link for this property (optional)"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Amenities (Essential)</label>
                    <textarea
                      name="amenitiesEssential"
                      rows="2"
                      value={form.amenitiesEssential}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500 text-sm"
                      placeholder="Comma-separated"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Amenities (Security)</label>
                    <textarea
                      name="amenitiesSecurity"
                      rows="2"
                      value={form.amenitiesSecurity}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500 text-sm"
                      placeholder="Comma-separated"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Amenities (Extras)</label>
                    <textarea
                      name="amenitiesExtras"
                      rows="2"
                      value={form.amenitiesExtras}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500 text-sm"
                      placeholder="Comma-separated"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                    <select
                      name="status"
                      value={form.status}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500 text-sm"
                    >
                      <option value="">Select status</option>
                      <option value="active">Active</option>
                      <option value="pending">Pending</option>
                      <option value="rejected">Rejected</option>
                      <option value="inactive">Inactive</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Available From</label>
                    <input
                      type="date"
                      name="availableFrom"
                      value={form.availableFrom}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500 text-sm"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Vacancies</label>
                  <input
                    type="number"
                    min="0"
                    name="vacancies"
                    value={form.vacancies}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500 text-sm"
                  />
                </div>

                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={saving}
                    className={`px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 text-sm ${saving ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    {saving ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              </form>
            </div>

            {/* Status & Dates */}
            <div className="mb-6">
              <h4 className="text-lg font-semibold text-gray-900 mb-3">Status & Dates</h4>
              <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Status</span>
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                    property.status === 'active' 
                      ? 'bg-green-100 text-green-800'
                      : property.status === 'pending'
                      ? 'bg-yellow-100 text-yellow-800'
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {property.status}
                  </span>
                </div>
                
                {property.availability?.availableFrom && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Available From</span>
                    <span className="text-sm text-gray-900">
                      {new Date(property.availability.availableFrom).toLocaleDateString()}
                    </span>
                  </div>
                )}
                
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Created At</span>
                  <span className="text-sm text-gray-900">
                    {new Date(property.createdAt).toLocaleDateString()}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="bg-gray-50 px-6 py-4 flex justify-end">
            <button
              onClick={onClose}
              className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PropertyDetailModal;
