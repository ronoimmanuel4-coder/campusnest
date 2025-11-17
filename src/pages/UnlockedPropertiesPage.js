import React, { useEffect, useState } from 'react';
import { Unlock, MessageSquare } from 'lucide-react';
import PropertyCard from '../components/PropertyCard';
import { usersAPI } from '../services/api';
import toast from 'react-hot-toast';

const UnlockedPropertiesPage = () => {
  const [properties, setProperties] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchUnlockedProperties();
  }, []);

  const fetchUnlockedProperties = async () => {
    try {
      const response = await usersAPI.getUnlockedProperties();
      setProperties(response.data.data);
    } catch (error) {
      console.error('Error fetching unlocked properties:', error);
      toast.error('Failed to load unlocked properties');
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
              <Unlock className="h-8 w-8 text-green-500 mr-3" />
              Unlocked Properties
            </h1>
            <p className="mt-2 text-gray-600">
              Properties you've unlocked with full access
            </p>
          </div>
          <div className="text-gray-600">
            {properties.length} {properties.length === 1 ? 'property' : 'properties'}
          </div>
        </div>

        {/* Info Banner */}
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
          <div className="flex items-start">
            <MessageSquare className="h-5 w-5 text-green-600 mt-0.5 mr-3" />
            <div>
              <h3 className="text-sm font-semibold text-green-900">
                Full Access Granted
              </h3>
              <p className="text-sm text-green-700 mt-1">
                You have full access to these properties including exact location, caretaker contact details, and can schedule viewings.
              </p>
            </div>
          </div>
        </div>

        {/* Properties Grid */}
        {properties.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {properties.map((property) => (
              <div key={property._id} className="relative">
                <PropertyCard property={property} />
                <div className="mt-2 text-xs text-gray-500">
                  Unlocked on {new Date(property.unlockedAt).toLocaleDateString()}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <Unlock className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              No unlocked properties yet
            </h3>
            <p className="text-gray-600 mb-6">
              Unlock properties to view full details and contact information
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

export default UnlockedPropertiesPage;
