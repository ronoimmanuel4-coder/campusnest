import React, { useEffect, useState } from 'react';
import { Heart } from 'lucide-react';
import PropertyCard from '../components/PropertyCard';
import { usersAPI } from '../services/api';
import toast from 'react-hot-toast';

const SavedPropertiesPage = () => {
  const [properties, setProperties] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchSavedProperties();
  }, []);

  const fetchSavedProperties = async () => {
    try {
      const response = await usersAPI.getSavedProperties();
      setProperties(response.data.data);
    } catch (error) {
      console.error('Error fetching saved properties:', error);
      toast.error('Failed to load saved properties');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center">
              <Heart className="h-8 w-8 text-red-500 mr-3" />
              Saved Properties
            </h1>
            <p className="mt-2 text-gray-600">
              Properties you've saved for later
            </p>
          </div>
          <div className="text-gray-600">
            {properties.length} {properties.length === 1 ? 'property' : 'properties'}
          </div>
        </div>

        {/* Properties Grid */}
        {properties.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {properties.map((property) => (
              <PropertyCard key={property._id} property={property} />
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <Heart className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              No saved properties yet
            </h3>
            <p className="text-gray-600 mb-6">
              Start browsing and save properties you're interested in
            </p>
            <a
              href="/listings"
              className="btn-primary inline-block"
            >
              Browse Properties
            </a>
          </div>
        )}
      </div>
    </div>
  );
};

export default SavedPropertiesPage;
