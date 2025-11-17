import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Search, MapPin, Shield, Eye, Users, TrendingUp, CheckCircle } from 'lucide-react';
import PropertyCard from '../components/PropertyCard';
import { propertiesAPI } from '../services/api';

const HomePage = () => {
  const [properties, setProperties] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchProperties();
  }, []);

  const fetchProperties = async () => {
    try {
      const response = await propertiesAPI.getAll();
      // Only show active properties
      const activeProperties = (response.data.properties || response.data.data || response.data || []).filter(
        prop => prop.status === 'active'
      );
      setProperties(activeProperties);
    } catch (error) {
      console.error('Error fetching properties:', error);
      setProperties([]);
    } finally {
      setIsLoading(false);
    }
  };

  const featuredProperties = properties.filter(p => p.isFeatured).slice(0, 3);
  const displayProperties = featuredProperties.length > 0 ? featuredProperties : properties.slice(0, 3);

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-primary-600 to-accent-600 text-white">
        <div className="absolute inset-0 bg-black opacity-10"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
          <div className="text-center">
            <h1 className="text-5xl md:text-6xl font-bold mb-6">
              Find Your Perfect <span className="text-yellow-300">Student Home</span>
            </h1>
            <p className="text-xl mb-8 text-gray-100">
              Discover verified rental apartments near campus with exclusive access to exact locations and caretaker contacts
            </p>
            
            <div className="max-w-2xl mx-auto bg-white rounded-lg shadow-xl p-2">
              <div className="flex flex-col md:flex-row gap-2">
                <div className="flex-1 flex items-center px-4 py-2">
                  <Search className="h-5 w-5 text-gray-400 mr-2" />
                  <input
                    type="text"
                    placeholder="Search area, property type..."
                    className="w-full outline-none text-gray-700"
                  />
                </div>
                <Link to="/listings" className="btn-primary rounded-md">
                  Search Properties
                </Link>
              </div>
            </div>

            <div className="mt-8 flex flex-wrap justify-center gap-6 text-sm">
              <div className="flex items-center">
                <CheckCircle className="h-5 w-5 mr-2 text-yellow-300" />
                <span>Verified Properties</span>
              </div>
              <div className="flex items-center">
                <Shield className="h-5 w-5 mr-2 text-yellow-300" />
                <span>Secure Payments</span>
              </div>
              <div className="flex items-center">
                <Eye className="h-5 w-5 mr-2 text-yellow-300" />
                <span>Exclusive Details</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-800 mb-4">How CampusNest Works</h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Get exclusive access to prime student accommodations in just 3 simple steps
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Search className="h-8 w-8 text-primary-600" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Browse Listings</h3>
              <p className="text-gray-600">
                Explore verified properties with photos, basic details, and amenities
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-accent-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Eye className="h-8 w-8 text-accent-600" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Unlock Premium Info</h3>
              <p className="text-gray-600">
                Pay a small fee to reveal exact location and caretaker contact details
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <MapPin className="h-8 w-8 text-green-600" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Visit & Book</h3>
              <p className="text-gray-600">
                Contact the caretaker directly and schedule a viewing at your convenience
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Properties */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h2 className="text-3xl font-bold text-gray-800">Featured Properties</h2>
              <p className="text-gray-600 mt-2">Hand-picked accommodations near campus</p>
            </div>
            <Link to="/listings" className="btn-secondary">
              View All Listings
            </Link>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {isLoading ? (
              <div className="col-span-full text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
                <p className="text-gray-600">Loading properties...</p>
              </div>
            ) : displayProperties.length > 0 ? (
              displayProperties.map((property) => (
                <PropertyCard key={property._id || property.id} property={property} />
              ))
            ) : (
              <div className="col-span-full text-center py-12">
                <p className="text-gray-600">No properties available yet. Check back soon!</p>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-gradient-to-r from-primary-600 to-accent-600 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8 text-center">
            <div>
              <div className="text-4xl font-bold mb-2">500+</div>
              <div className="text-primary-100">Active Listings</div>
            </div>
            <div>
              <div className="text-4xl font-bold mb-2">2,000+</div>
              <div className="text-primary-100">Happy Students</div>
            </div>
            <div>
              <div className="text-4xl font-bold mb-2">98%</div>
              <div className="text-primary-100">Success Rate</div>
            </div>
            <div>
              <div className="text-4xl font-bold mb-2">24/7</div>
              <div className="text-primary-100">Support Available</div>
            </div>
          </div>
        </div>
      </section>

      {/* Why Choose Us */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-800 mb-4">Why Students Choose CampusNest</h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              We're revolutionizing how students find accommodation near campus
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="flex items-start space-x-4">
              <div className="flex-shrink-0">
                <Shield className="h-8 w-8 text-primary-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold mb-2">Verified Properties</h3>
                <p className="text-gray-600">
                  Every listing is personally verified to ensure authenticity and quality
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-4">
              <div className="flex-shrink-0">
                <Eye className="h-8 w-8 text-primary-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold mb-2">Exclusive Access</h3>
                <p className="text-gray-600">
                  Get premium details that aren't available anywhere else
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-4">
              <div className="flex-shrink-0">
                <TrendingUp className="h-8 w-8 text-primary-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold mb-2">Fair Pricing</h3>
                <p className="text-gray-600">
                  Small one-time fee for unlimited access to property details
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-4">
              <div className="flex-shrink-0">
                <MapPin className="h-8 w-8 text-primary-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold mb-2">Exact Locations</h3>
                <p className="text-gray-600">
                  No more wasted trips - know exactly where the property is located
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-4">
              <div className="flex-shrink-0">
                <Users className="h-8 w-8 text-primary-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold mb-2">Direct Contact</h3>
                <p className="text-gray-600">
                  Connect directly with caretakers - no middlemen or delays
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-4">
              <div className="flex-shrink-0">
                <CheckCircle className="h-8 w-8 text-primary-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold mb-2">Student-Focused</h3>
                <p className="text-gray-600">
                  Built by students, for students - we understand your needs
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-gray-100">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-gray-800 mb-4">
            Ready to Find Your Perfect Student Home?
          </h2>
          <p className="text-gray-600 mb-8">
            Join thousands of students who've found their ideal accommodation through CampusNest
          </p>
          <Link to="/listings" className="btn-primary text-lg px-8 py-4">
            Browse All Properties
          </Link>
        </div>
      </section>
    </div>
  );
};

export default HomePage;
