import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { 
  ArrowLeft, Bed, Bath, Maximize, MapPin, Phone, User, 
  Calendar, Wifi, Car, Shield, Lock, Unlock, Check,
  ChevronLeft, ChevronRight, Star, CreditCard, Navigation, ExternalLink
} from 'lucide-react';
import { propertiesAPI, paymentsAPI, whatsappAPI } from '../services/api';
import toast from 'react-hot-toast';
import Loader from '../components/Loader';

const PropertyDetailPage = () => {
  const { id } = useParams();
  const [property, setProperty] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [scheduleForm, setScheduleForm] = useState({
    date: '',
    time: '',
    numberOfPeople: 1,
    specialRequests: ''
  });
  const [scheduleLoading, setScheduleLoading] = useState(false);

  useEffect(() => {
    fetchProperty();
  }, [id]);

  const fetchProperty = async () => {
    try {
      setIsLoading(true);
      const response = await propertiesAPI.getById(id);
      console.log('Fetched property:', response.data);
      setProperty(response.data.property || response.data.data || response.data);
    } catch (error) {
      console.error('Error fetching property:', error);
      toast.error('Property not found');
      setProperty(null);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return <Loader />;
  }

  if (!property) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-semibold text-gray-800 mb-2">Property not found</h2>
          <Link to="/listings" className="text-primary-600 hover:text-primary-700">
            Back to listings
          </Link>
        </div>
      </div>
    );
  }

  // Handle both old and new data structures
  const images = property.images || [];
  const propertyImages = images.map(img => typeof img === 'string' ? img : img.url);
  const bedrooms = property.specifications?.bedrooms || property.bedrooms || 0;
  const bathrooms = property.specifications?.bathrooms || property.bathrooms || 0;
  const size = property.specifications?.size?.value 
    ? `${property.specifications.size.value} ${property.specifications.size.unit}` 
    : property.size || 'N/A';
  const area = property.location?.area || property.area || 'Unknown Area';

  const priceAmount = property.price?.amount || property.price || 0;
  const pricePeriod = property.price?.period || 'month';

  const availableFromText = property.availability?.availableFrom 
    ? new Date(property.availability.availableFrom).toLocaleDateString()
    : property.availableFrom || 'Now';

  const distanceFromCampusText = property.location?.distanceFromCampus?.value
    ? `${property.location.distanceFromCampus.value} ${property.location.distanceFromCampus.unit || 'km'}`
    : property.distanceFromCampus || 'N/A';

  const propertyType = property.specifications?.propertyType || property.propertyType || 'Apartment';
  
  // Check if property is unlocked
  const isUnlocked = property.unlocked || property.isUnlocked || false;
  
  // Extract premium details
  const exactLocation = isUnlocked 
    ? (property.premiumDetails?.exactAddress || property.exactLocation || property.location?.exactAddress || 'Not provided')
    : 'Address hidden';
  const caretakerName = isUnlocked
    ? (property.premiumDetails?.caretaker?.name || property.caretakerName || 'Not provided')
    : 'Contact hidden';
  const caretakerPhone = isUnlocked
    ? (property.premiumDetails?.caretaker?.phone || property.caretakerPhone || 'Not provided')
    : '+254 XXX XXX XXX';
  const hasGPS = property.premiumDetails?.gpsCoordinates?.latitude && property.premiumDetails?.gpsCoordinates?.longitude;
  const supportContactName = 'Immanuel';
  const supportContactPhone = '0741218862';
  const supportContactWhatsApp = 'https://wa.me/254741218862';
  
  console.log('=== PROPERTY DETAIL DEBUG ===');
  console.log('Property ID:', property._id);
  console.log('Is Unlocked:', isUnlocked);
  console.log('Premium Details:', property.premiumDetails);
  console.log('Exact Location:', exactLocation);
  console.log('Caretaker Name:', caretakerName);
  console.log('Caretaker Phone:', caretakerPhone);
  console.log('Has GPS:', hasGPS);
  
  // Get amenities list
  const amenitiesList = property.amenities 
    ? (Array.isArray(property.amenities) 
        ? property.amenities 
        : Object.entries(property.amenities).filter(([_, value]) => value).map(([key]) => key))
    : [];

  const handleUnlock = () => {
    setShowPaymentModal(true);
  };

  const processPayment = async () => {
    setProcessing(true);
    try {
      const response = await paymentsAPI.unlockProperty(id, {
        paymentMethod: 'paystack'
      });

      console.log('Paystack init response:', response.data);

      const authorizationUrl =
        response.data?.data?.authorizationUrl ||
        response.data?.data?.authorization_url;

      if (!authorizationUrl) {
        throw new Error('Missing Paystack authorization URL');
      }

      window.location.href = authorizationUrl;
    } catch (error) {
      console.error('Paystack init error:', error);
      toast.error(error.response?.data?.message || 'Failed to initiate payment');
    } finally {
      setProcessing(false);
    }
  };

  const nextImage = () => {
    setCurrentImageIndex((prev) => (prev + 1) % propertyImages.length);
  };

  const prevImage = () => {
    setCurrentImageIndex((prev) => (prev - 1 + propertyImages.length) % propertyImages.length);
  };

  const openGoogleMaps = () => {
    const lat = property.gpsCoordinates?.latitude || property.premiumDetails?.gpsCoordinates?.latitude;
    const lng = property.gpsCoordinates?.longitude || property.premiumDetails?.gpsCoordinates?.longitude;
    
    if (lat && lng) {
      // Opens Google Maps with navigation to the coordinates
      window.open(`https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`, '_blank');
    } else {
      // Fallback to search by address
      const address = encodeURIComponent(exactLocation || `${property.title}, ${area}`);
      window.open(`https://www.google.com/maps/search/?api=1&query=${address}`, '_blank');
    }
  };

  const openScheduleModal = () => {
    if (!isUnlocked) {
      toast.error('Please unlock premium details before scheduling a viewing.');
      return;
    }
    setShowScheduleModal(true);
  };

  const handleScheduleChange = (e) => {
    const { name, value } = e.target;
    setScheduleForm((prev) => ({
      ...prev,
      [name]: name === 'numberOfPeople' ? Number(value) : value
    }));
  };

  const handleScheduleSubmit = async (e) => {
    e.preventDefault();

    if (!scheduleForm.date || !scheduleForm.time) {
      toast.error('Please select a date and time for viewing.');
      return;
    }

    setScheduleLoading(true);
    try {
      await whatsappAPI.scheduleViewing({
        propertyId: property._id,
        date: scheduleForm.date,
        time: scheduleForm.time,
        numberOfPeople: scheduleForm.numberOfPeople,
        specialRequests: scheduleForm.specialRequests
      });

      toast.success('Viewing request sent to the caretaker via WhatsApp');
      setShowScheduleModal(false);
    } catch (error) {
      console.error('Schedule viewing error:', error);
      toast.error(
        error.response?.data?.message ||
        'Failed to schedule viewing. Please try again.'
      );
    } finally {
      setScheduleLoading(false);
    }
  };

  const amenityIcons = {
    'WiFi': <Wifi className="h-5 w-5" />,
    'Parking': <Car className="h-5 w-5" />,
    'Security': <Shield className="h-5 w-5" />,
    'Furnished': <Check className="h-5 w-5" />,
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Back Button */}
        <Link to="/listings" className="inline-flex items-center text-gray-600 hover:text-primary-600 mb-6">
          <ArrowLeft className="h-5 w-5 mr-2" />
          Back to listings
        </Link>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2">
            {/* Image Gallery */}
            <div className="relative bg-white rounded-lg overflow-hidden shadow-lg mb-6">
              {propertyImages.length > 0 ? (
                <img
                  src={propertyImages[currentImageIndex]}
                  alt={property.title}
                  className="w-full h-96 object-cover"
                  onError={(e) => {
                    e.target.src = '/placeholder-property.jpg';
                  }}
                />
              ) : (
                <div className="w-full h-96 bg-gray-200 flex items-center justify-center">
                  <p className="text-gray-500">No image available</p>
                </div>
              )}
              <button
                onClick={prevImage}
                className="absolute left-4 top-1/2 -translate-y-1/2 bg-black bg-opacity-50 text-white p-2 rounded-full hover:bg-opacity-70"
              >
                <ChevronLeft className="h-6 w-6" />
              </button>
              <button
                onClick={nextImage}
                className="absolute right-4 top-1/2 -translate-y-1/2 bg-black bg-opacity-50 text-white p-2 rounded-full hover:bg-opacity-70"
              >
                <ChevronRight className="h-6 w-6" />
              </button>
              {propertyImages.length > 1 && (
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex space-x-2">
                  {propertyImages.map((_, index) => (
                    <button
                      key={index}
                      onClick={() => setCurrentImageIndex(index)}
                      className={`w-2 h-2 rounded-full ${
                        index === currentImageIndex ? 'bg-white' : 'bg-white bg-opacity-50'
                      }`}
                    />
                  ))}
                </div>
              )}
              {(property.isFeatured || property.isPremium) && (
                <div className="absolute top-4 right-4 bg-gradient-to-r from-accent-500 to-primary-600 text-white px-3 py-1 rounded-full text-sm font-semibold flex items-center">
                  <Star className="h-4 w-4 mr-1" />
                  Premium Listing
                </div>
              )}
            </div>

            {/* Property Details */}
            <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
              <h1 className="text-3xl font-bold text-gray-800 mb-4">{property.title}</h1>
              
              <div className="flex flex-wrap items-center gap-4 mb-6 text-gray-600">
                <div className="flex items-center">
                  <MapPin className="h-5 w-5 mr-2" />
                  <span>{area}</span>
                </div>
                <div className="flex items-center">
                  <Calendar className="h-5 w-5 mr-2" />
                  <span>Available {availableFromText}</span>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4 mb-6">
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <Bed className="h-6 w-6 mx-auto mb-2 text-primary-600" />
                  <p className="text-sm text-gray-600">Bedrooms</p>
                  <p className="font-semibold">{bedrooms}</p>
                </div>
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <Bath className="h-6 w-6 mx-auto mb-2 text-primary-600" />
                  <p className="text-sm text-gray-600">Bathrooms</p>
                  <p className="font-semibold">{bathrooms}</p>
                </div>
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <Maximize className="h-6 w-6 mx-auto mb-2 text-primary-600" />
                  <p className="text-sm text-gray-600">Size</p>
                  <p className="font-semibold">{size}</p>
                </div>
              </div>

              <div>
                <h3 className="text-xl font-semibold mb-3">Description</h3>
                <p className="text-gray-600 leading-relaxed">{property.description}</p>
              </div>
            </div>

            {/* Amenities */}
            {amenitiesList.length > 0 && (
              <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
                <h3 className="text-xl font-semibold mb-4">Amenities</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {amenitiesList.map((amenity, index) => (
                    <div key={index} className="flex items-center space-x-2 text-gray-600">
                      {amenityIcons[amenity] || <Check className="h-5 w-5" />}
                      <span className="capitalize">{typeof amenity === 'string' ? amenity.replace(/([A-Z])/g, ' $1').trim() : amenity}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Premium Information */}
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h3 className="text-xl font-semibold mb-4 flex items-center">
                <Lock className={`h-5 w-5 mr-2 ${isUnlocked ? 'text-green-600' : 'text-gray-400'}`} />
                Premium Information
              </h3>
              
              {isUnlocked ? (
                <div className="space-y-4">
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <p className="text-green-800 font-medium mb-2 flex items-center">
                      <Unlock className="h-5 w-5 mr-2" />
                      Details Unlocked Successfully!
                    </p>
                  </div>
                  
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="border rounded-lg p-4">
                      <h4 className="font-semibold mb-2 flex items-center text-gray-700">
                        <MapPin className="h-5 w-5 mr-2 text-primary-600" />
                        Exact Location
                      </h4>
                      <p className="text-gray-800 mb-3">{exactLocation}</p>
                      {hasGPS && (
                        <div className="mb-3">
                          <p className="text-sm text-gray-600 mb-2">GPS Coordinates:</p>
                          <p className="text-xs font-mono text-gray-700">
                            {(property.gpsCoordinates?.latitude || property.premiumDetails?.gpsCoordinates?.latitude).toFixed(6)}, {(property.gpsCoordinates?.longitude || property.premiumDetails?.gpsCoordinates?.longitude).toFixed(6)}
                          </p>
                        </div>
                      )}
                      <button
                        onClick={openGoogleMaps}
                        className="w-full flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
                      >
                        <Navigation className="h-4 w-4 mr-2" />
                        Navigate with Google Maps
                        <ExternalLink className="h-3 w-3 ml-2" />
                      </button>
                    </div>
                    
                    <div className="border rounded-lg p-4">
                      <h4 className="font-semibold mb-2 flex items-center text-gray-700">
                        <User className="h-5 w-5 mr-2 text-primary-600" />
                        Caretaker Contact
                      </h4>
                      <p className="text-gray-800">{caretakerName}</p>
                      <a 
                        href={`tel:${caretakerPhone}`}
                        className="text-primary-600 font-semibold flex items-center mt-2 hover:underline"
                      >
                        <Phone className="h-4 w-4 mr-1" />
                        {caretakerPhone}
                      </a>
                    </div>
                  </div>

                  <div className="border rounded-lg p-4 bg-blue-50">
                    <h4 className="font-semibold mb-2 text-gray-700">
                      Need help with directions?
                    </h4>
                    <p className="text-gray-700 text-sm mb-3">
                      If you are not sure how to use the GPS or need assistance finding this house,
                      you can contact CampusNest support ({supportContactName}).
                    </p>
                    <div className="flex flex-col sm:flex-row sm:space-x-3 space-y-2 sm:space-y-0">
                      <a
                        href={`tel:${supportContactPhone}`}
                        className="flex-1 btn-secondary text-center"
                      >
                        Call {supportContactName}
                      </a>
                      <a
                        href={supportContactWhatsApp}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex-1 btn-primary text-center"
                      >
                        WhatsApp {supportContactName}
                      </a>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="relative">
                  <div className="absolute inset-0 bg-white bg-opacity-90 backdrop-blur-md rounded-lg flex items-center justify-center z-10">
                    <div className="text-center">
                      <Lock className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                      <p className="text-gray-700 font-semibold mb-2">Unlock Premium Details</p>
                      <p className="text-gray-600 text-sm mb-4">
                        Get exact location and caretaker contact
                      </p>
                      <button onClick={handleUnlock} className="btn-primary">
                        Unlock for KSh 200
                      </button>
                    </div>
                  </div>
                  
                  {/* Blurred Content Preview */}
                  <div className="filter blur-sm pointer-events-none select-none">
                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="border rounded-lg p-4">
                        <h4 className="font-semibold mb-2">Exact Location</h4>
                        <p className="text-gray-600">████████████████</p>
                      </div>
                      <div className="border rounded-lg p-4">
                        <h4 className="font-semibold mb-2">Caretaker Contact</h4>
                        <p className="text-gray-600">████████████</p>
                        <p className="text-gray-600">+254 ███ ███ ███</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            {/* Price Card */}
            <div className="bg-white rounded-lg shadow-lg p-6 sticky top-24">
              <div className="mb-6">
                <p className="text-3xl font-bold text-gray-800">
                  KSh {priceAmount.toLocaleString()}
                  <span className="text-lg font-normal text-gray-600">/{pricePeriod}</span>
                </p>
              </div>

              {!isUnlocked ? (
                <button onClick={handleUnlock} className="w-full btn-primary mb-4">
                  <Lock className="h-5 w-5 mr-2 inline" />
                  Unlock Full Details
                </button>
              ) : (
                <a 
                  href={`tel:${caretakerPhone}`} 
                  className="w-full btn-primary mb-4 block text-center"
                >
                  <Phone className="h-5 w-5 mr-2 inline" />
                  Call Caretaker
                </a>
              )}

              <button className="w-full btn-secondary" onClick={openScheduleModal}>
                Schedule Viewing
              </button>

              <div className="mt-6 pt-6 border-t">
                <h4 className="font-semibold mb-3">Quick Info</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Property Type</span>
                    <span className="font-medium">{propertyType}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Available</span>
                    <span className="font-medium text-green-600">{availableFromText}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Distance</span>
                    <span className="font-medium">{distanceFromCampusText}</span>
                  </div>
                </div>
              </div>

              {property.isPremium && (
                <div className="mt-6 p-4 bg-gradient-to-r from-accent-50 to-primary-50 rounded-lg">
                  <p className="text-sm font-semibold text-primary-700 mb-1">Premium Listing</p>
                  <p className="text-xs text-gray-600">Verified and recommended property</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Payment Modal */}
      {showPaymentModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h3 className="text-xl font-semibold mb-4">Unlock Premium Details</h3>
            
            <div className="bg-gray-50 rounded-lg p-4 mb-6">
              <p className="font-semibold mb-2">What you'll get:</p>
              <ul className="space-y-2 text-sm text-gray-600">
                <li className="flex items-start">
                  <Check className="h-4 w-4 text-green-600 mr-2 mt-0.5" />
                  <span>Exact property address and location</span>
                </li>
                <li className="flex items-start">
                  <Check className="h-4 w-4 text-green-600 mr-2 mt-0.5" />
                  <span>Caretaker's direct phone number</span>
                </li>
                <li className="flex items-start">
                  <Check className="h-4 w-4 text-green-600 mr-2 mt-0.5" />
                  <span>Ability to schedule immediate viewing</span>
                </li>
              </ul>
            </div>

            <div className="border rounded-lg p-4 mb-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-gray-600">One-time payment</span>
                <span className="text-2xl font-bold">KSh 200</span>
              </div>
              <p className="text-sm text-gray-600">
                When you click <span className="font-semibold">Pay &amp; Unlock</span>, you will be
                redirected to <span className="font-semibold">Paystack</span> secure checkout to
                complete your payment. We do not store your card details.
              </p>
            </div>

            <div className="flex space-x-3">
              <button
                onClick={processPayment}
                disabled={processing}
                className={`flex-1 btn-primary ${processing ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                {processing ? (
                  <>Processing...</>
                ) : (
                  <>
                    <CreditCard className="h-5 w-5 mr-2 inline" />
                    Pay & Unlock
                  </>
                )}
              </button>
              <button
                onClick={() => setShowPaymentModal(false)}
                disabled={processing}
                className="flex-1 btn-secondary"
              >
                Cancel
              </button>
            </div>

            <p className="text-xs text-gray-500 text-center mt-4">
              Secure payment processed by CampusNest
            </p>
          </div>
        </div>
      )}

      {showScheduleModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h3 className="text-xl font-semibold mb-4">Schedule Viewing</h3>

            <form onSubmit={handleScheduleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Preferred Date
                </label>
                <input
                  type="date"
                  name="date"
                  value={scheduleForm.date}
                  onChange={handleScheduleChange}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Preferred Time
                </label>
                <input
                  type="time"
                  name="time"
                  value={scheduleForm.time}
                  onChange={handleScheduleChange}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Number of People
                </label>
                <input
                  type="number"
                  min="1"
                  name="numberOfPeople"
                  value={scheduleForm.numberOfPeople}
                  onChange={handleScheduleChange}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Special Requests (optional)
                </label>
                <textarea
                  name="specialRequests"
                  rows="3"
                  value={scheduleForm.specialRequests}
                  onChange={handleScheduleChange}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                />
              </div>

              <div className="flex space-x-3 pt-2">
                <button
                  type="submit"
                  disabled={scheduleLoading}
                  className={`flex-1 btn-primary ${scheduleLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  {scheduleLoading ? 'Sending...' : 'Send Request'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowScheduleModal(false)}
                  disabled={scheduleLoading}
                  className="flex-1 btn-secondary"
                >
                  Cancel
                </button>
              </div>
            </form>

            <p className="text-xs text-gray-500 text-center mt-4">
              We will send your viewing request to the caretaker via WhatsApp.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default PropertyDetailPage;
