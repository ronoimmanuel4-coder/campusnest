import React from 'react';
import { X, MapPin, Bed, Bath, DollarSign, Home, Navigation, ExternalLink, Calendar, User, Phone, Mail } from 'lucide-react';

const PropertyDetailModal = ({ property, isOpen, onClose }) => {
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
                  {property.images.map((img, index) => (
                    <div key={index} className="relative aspect-video rounded-lg overflow-hidden">
                      <img
                        src={typeof img === 'string' ? img : img.url}
                        alt={`${property.title} - ${index + 1}`}
                        className="w-full h-full object-cover hover:scale-110 transition-transform duration-300"
                      />
                    </div>
                  ))}
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
                      KSh {property.price?.toLocaleString()}/month
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
