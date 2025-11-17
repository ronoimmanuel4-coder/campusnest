import React, { useState, useEffect } from 'react';
import { Search, Filter, Grid, List, ChevronDown } from 'lucide-react';
import PropertyCard from '../components/PropertyCard';
import { propertiesAPI } from '../services/api';
import toast from 'react-hot-toast';
import Loader from '../components/Loader';

const ListingsPage = () => {
  const [properties, setProperties] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [priceRange, setPriceRange] = useState('all');
  const [bedrooms, setBedrooms] = useState('all');
  const [area, setArea] = useState('all');
  const [viewMode, setViewMode] = useState('grid');
  const [sortBy, setSortBy] = useState('featured');

  useEffect(() => {
    fetchProperties();
  }, []);

  const fetchProperties = async () => {
    try {
      setIsLoading(true);
      const response = await propertiesAPI.getAll();
      console.log('Fetched properties:', response.data);
      // Only show active properties to students
      const activeProperties = (response.data.properties || response.data.data || response.data || []).filter(
        prop => prop.status === 'active'
      );
      setProperties(activeProperties);
    } catch (error) {
      console.error('Error fetching properties:', error);
      toast.error('Failed to load properties');
      setProperties([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Get unique areas from properties
  const areas = [...new Set(properties.map(p => p.location?.area || p.area).filter(Boolean))];

  // Filter properties
  const filteredProperties = properties.filter(property => {
    const propertyArea = property.location?.area || property.area || '';
    const propertyBedrooms = property.specifications?.bedrooms || property.bedrooms || 0;
    
    const matchesSearch = property.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          (property.description || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                          propertyArea.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesPrice = priceRange === 'all' ||
                        (priceRange === 'budget' && property.price <= 10000) ||
                        (priceRange === 'mid' && property.price > 10000 && property.price <= 20000) ||
                        (priceRange === 'premium' && property.price > 20000);
    
    const matchesBedrooms = bedrooms === 'all' || propertyBedrooms === parseInt(bedrooms);
    const matchesArea = area === 'all' || propertyArea === area;

    return matchesSearch && matchesPrice && matchesBedrooms && matchesArea;
  });

  // Sort properties
  const sortedProperties = [...filteredProperties].sort((a, b) => {
    if (sortBy === 'price-low') return a.price - b.price;
    if (sortBy === 'price-high') return b.price - a.price;
    if (sortBy === 'featured') return (b.isFeatured ? 1 : 0) - (a.isFeatured ? 1 : 0);
    return 0;
  });

  if (isLoading) {
    return <Loader />;
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Browse All Properties</h1>
          <p className="text-gray-600">Find your perfect student accommodation near campus</p>
        </div>

        {/* Search and Filters */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="grid md:grid-cols-5 gap-4">
            {/* Search Bar */}
            <div className="md:col-span-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search properties..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-primary-500"
                />
              </div>
            </div>

            {/* Price Range Filter */}
            <div>
              <select
                value={priceRange}
                onChange={(e) => setPriceRange(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-primary-500"
              >
                <option value="all">All Prices</option>
                <option value="budget">Under KSh 10,000</option>
                <option value="mid">KSh 10,000 - 20,000</option>
                <option value="premium">Above KSh 20,000</option>
              </select>
            </div>

            {/* Bedrooms Filter */}
            <div>
              <select
                value={bedrooms}
                onChange={(e) => setBedrooms(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-primary-500"
              >
                <option value="all">All Bedrooms</option>
                <option value="1">1 Bedroom</option>
                <option value="2">2 Bedrooms</option>
                <option value="3">3 Bedrooms</option>
              </select>
            </div>

            {/* Area Filter */}
            <div>
              <select
                value={area}
                onChange={(e) => setArea(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-primary-500"
              >
                <option value="all">All Areas</option>
                {areas.map(a => (
                  <option key={a} value={a}>{a}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Results Header */}
        <div className="flex justify-between items-center mb-6">
          <p className="text-gray-600">
            Found <span className="font-semibold text-gray-800">{sortedProperties.length}</span> properties
          </p>

          <div className="flex items-center space-x-4">
            {/* Sort Dropdown */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-primary-500"
            >
              <option value="featured">Featured First</option>
              <option value="price-low">Price: Low to High</option>
              <option value="price-high">Price: High to Low</option>
            </select>

            {/* View Mode Toggle */}
            <div className="flex border border-gray-300 rounded-lg overflow-hidden">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 ${viewMode === 'grid' ? 'bg-primary-600 text-white' : 'bg-white text-gray-600'}`}
              >
                <Grid className="h-5 w-5" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 ${viewMode === 'list' ? 'bg-primary-600 text-white' : 'bg-white text-gray-600'}`}
              >
                <List className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>

        {/* Properties Grid/List */}
        {sortedProperties.length > 0 ? (
          <div className={viewMode === 'grid' ? 'grid md:grid-cols-2 lg:grid-cols-3 gap-6' : 'space-y-6'}>
            {sortedProperties.map((property) => (
              <PropertyCard key={property.id} property={property} />
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-gray-500 text-lg">No properties found matching your criteria.</p>
            <button
              onClick={() => {
                setSearchTerm('');
                setPriceRange('all');
                setBedrooms('all');
                setArea('all');
              }}
              className="mt-4 text-primary-600 hover:text-primary-700 font-medium"
            >
              Clear all filters
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ListingsPage;
