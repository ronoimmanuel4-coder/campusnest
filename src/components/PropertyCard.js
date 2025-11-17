import React from 'react';
import { Link } from 'react-router-dom';
import { Bed, Bath, Maximize, MapPin, Lock, Star } from 'lucide-react';

const PropertyCard = ({ property }) => {
  // Handle both old and new data structures
  const propertyId = property._id || property.id;
  const images = property.images || [];
  const firstImage = typeof images[0] === 'string' ? images[0] : images[0]?.url || '/placeholder-property.jpg';
  const area = property.location?.area || property.area || 'Unknown Area';
  const bedrooms = property.specifications?.bedrooms || property.bedrooms || 0;
  const bathrooms = property.specifications?.bathrooms || property.bathrooms || 0;
  const size = property.specifications?.size?.value 
    ? `${property.specifications.size.value} ${property.specifications.size.unit}` 
    : property.size || 'N/A';
  const distanceFromCampus = property.location?.distanceFromCampus?.value 
    ? `${property.location.distanceFromCampus.value} ${property.location.distanceFromCampus.unit}` 
    : property.distanceFromCampus || '0 km';
  
  // Get amenities list
  const amenitiesList = property.amenities 
    ? (Array.isArray(property.amenities) 
        ? property.amenities 
        : Object.entries(property.amenities).filter(([_, value]) => value).map(([key]) => key))
    : [];

  const availableFrom = property.availability?.availableFrom 
    ? new Date(property.availability.availableFrom).toLocaleDateString()
    : property.availableFrom || 'Available Now';

  return (
    <Link to={`/property/${propertyId}`} className="block">
      <div className="bg-white rounded-lg shadow-md overflow-hidden card-hover">
        <div className="relative">
          <img
            src={firstImage}
            alt={property.title}
            className="w-full h-48 object-cover"
            onError={(e) => {
              e.target.src = '/placeholder-property.jpg';
            }}
          />
          {(property.isFeatured || property.isPremium) && (
            <div className="absolute top-2 right-2 bg-gradient-to-r from-accent-500 to-primary-600 text-white px-3 py-1 rounded-full text-xs font-semibold flex items-center">
              <Star className="h-3 w-3 mr-1" />
              Featured
            </div>
          )}
          <div className="absolute bottom-2 left-2 bg-black bg-opacity-70 text-white px-3 py-1 rounded-md">
            <span className="font-bold">KSh {(property.price?.amount || property.price || 0).toLocaleString()}</span>
            <span className="text-sm">/month</span>
          </div>
        </div>

        <div className="p-4">
          <h3 className="text-lg font-semibold text-gray-800 mb-2">{property.title}</h3>
          
          <div className="flex items-center text-sm text-gray-600 mb-2">
            <MapPin className="h-4 w-4 mr-1" />
            <span>{area} • {distanceFromCampus} from campus</span>
          </div>

          <div className="flex items-center space-x-4 text-sm text-gray-600 mb-3">
            <div className="flex items-center">
              <Bed className="h-4 w-4 mr-1" />
              <span>{bedrooms} {bedrooms === 1 ? 'Bed' : 'Beds'}</span>
            </div>
            <div className="flex items-center">
              <Bath className="h-4 w-4 mr-1" />
              <span>{bathrooms} {bathrooms === 1 ? 'Bath' : 'Baths'}</span>
            </div>
            <div className="flex items-center">
              <Maximize className="h-4 w-4 mr-1" />
              <span>{size}</span>
            </div>
          </div>

          {amenitiesList.length > 0 && (
            <div className="flex flex-wrap gap-1 mb-3">
              {amenitiesList.slice(0, 3).map((amenity, index) => (
                <span
                  key={index}
                  className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-md capitalize"
                >
                  {typeof amenity === 'string' ? amenity.replace(/([A-Z])/g, ' $1').trim() : amenity}
                </span>
              ))}
              {amenitiesList.length > 3 && (
                <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-md">
                  +{amenitiesList.length - 3} more
                </span>
              )}
            </div>
          )}

          <div className="flex items-center justify-between">
            <span className="text-sm text-green-600 font-medium">
              {availableFrom}
            </span>
            {!property.unlocked && (
              <div className="flex items-center text-primary-600">
                <Lock className="h-4 w-4 mr-1" />
                <span className="text-sm font-medium">Unlock Details</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
};

export default PropertyCard;
