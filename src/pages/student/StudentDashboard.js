import React, { useState, useEffect } from 'react';
import {
  Home, Search, Heart, Map, Users, Calendar, Bell, BookOpen,
  Coffee, Bus, Wifi, ShoppingCart, Clock, Star, TrendingUp,
  MapPin, DollarSign, Filter, MessageSquare, Shield, AlertCircle,
  Navigation, Building, Utensils, Library, Activity, Zap,
  Phone, Bookmark, Share2, Calculator, CreditCard, Award, Settings
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { propertiesAPI, usersAPI } from '../../services/api';
import toast from 'react-hot-toast';

const StudentDashboard = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('discover');
  const [nearbyProperties, setNearbyProperties] = useState([]);
  const [savedProperties, setSavedProperties] = useState([]);
  const [campusServices, setCampusServices] = useState([]);
  const [studentServices, setStudentServices] = useState([]);
  const [roommates, setRoommates] = useState([]);
  const [events, setEvents] = useState([]);
  const [transportInfo, setTransportInfo] = useState({});
  const [budget, setBudget] = useState({ min: 0, max: 15000 });
  const [showBudgetCalculator, setShowBudgetCalculator] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showQuiz, setShowQuiz] = useState(false);
  const [quizForm, setQuizForm] = useState({
    budget: 8000,
    lifestyle: 'quiet',
    smoking: 'non-smoker',
    studyHabit: 'studious'
  });
  const [activeChatUser, setActiveChatUser] = useState(null);
  const [chatMessages, setChatMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [isChatLoading, setIsChatLoading] = useState(false);
  const [selectedRoommate, setSelectedRoommate] = useState(null);
  const [supportSubject, setSupportSubject] = useState('');
  const [supportMessage, setSupportMessage] = useState('');
  const [isSubmittingSupport, setIsSubmittingSupport] = useState(false);

  useEffect(() => {
    fetchDashboardData();
    fetchNotifications();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const [propsRes, savedRes, servicesRes, roommatesRes] = await Promise.all([
        propertiesAPI.getNearby(),
        usersAPI.getSavedProperties(),
        usersAPI.getCampusServices(),
        usersAPI.getRoommates()
      ]);
      
      setNearbyProperties(propsRes.data.properties || []);
      setSavedProperties(savedRes.data.properties || []);

      const servicesData = servicesRes.data.data || servicesRes.data || {};
      setCampusServices(servicesData.services || []);
      setEvents(servicesData.events || [
        { id: 1, title: 'Campus Housing Fair', date: 'Nov 20', location: 'Student Center' },
        { id: 2, title: 'Roommate Meetup', date: 'Nov 22', location: 'Library Lawn' }
      ]);
      setStudentServices(servicesData.studentServices || []);
      
      const roommateItems = roommatesRes.data.data || roommatesRes.data.users || roommatesRes.data || [];

      const mapped = Array.isArray(roommateItems)
        ? roommateItems.map((u) => ({
            id: u._id || u.id,
            name: u.name,
            course: u.university || 'Student',
            email: u.email,
            phone: u.phone,
            profilePicture: u.profilePicture || (u.avatar && u.avatar.url),
            budget: 'N/A',
            budgetRange: { min: 5000, max: 8000 },
            preferences: [],
            traits: {
              lifestyle: 'quiet',
              smokingPreference: 'non-smoker',
              studyHabit: 'studious'
            },
            matchScore: 80
          }))
        : [];

      setRoommates(mapped);

      setTransportInfo({
        nextBus: '5 minutes',
        busRoute: 'Route 14 - Campus Loop',
        matatu: 'KSh 30 to CBD'
      });
    } catch (error) {
      console.error('Failed to load dashboard data');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmitSupport = async (e) => {
    e.preventDefault();
    if (!supportSubject.trim() || !supportMessage.trim()) {
      toast.error('Please enter a subject and message');
      return;
    }
    try {
      setIsSubmittingSupport(true);
      await usersAPI.createSupportTicket({
        subject: supportSubject.trim(),
        message: supportMessage.trim()
      });
      toast.success('Your message has been sent to the admin');
      setSupportSubject('');
      setSupportMessage('');
    } catch (error) {
      console.error('Failed to submit support ticket');
      toast.error('Failed to send message to admin');
    } finally {
      setIsSubmittingSupport(false);
    }
  };

  const fetchNotifications = async () => {
    try {
      const res = await usersAPI.getNotifications();
      const items = res.data.data || res.data.notifications || [];
      setNotifications(items);
      setUnreadCount(items.filter((n) => !n.read).length);
    } catch (error) {
      console.error('Failed to load notifications');
    }
  };

  const calculateRoommateMatch = (answers, roommate) => {
    let score = 50;
    const roommateBudget = roommate.budgetRange || { min: 0, max: 0 };
    const roommateMid = (roommateBudget.min + roommateBudget.max) / 2 || 0;
    const diff = Math.abs((answers.budget || 0) - roommateMid);

    if (diff <= 1000) {
      score += 25;
    } else if (diff <= 3000) {
      score += 15;
    } else if (diff <= 5000) {
      score += 5;
    }

    const traits = roommate.traits || {};

    if (answers.lifestyle && answers.lifestyle === traits.lifestyle) {
      score += 10;
    }
    if (answers.smoking && answers.smoking === traits.smokingPreference) {
      score += 10;
    }
    if (answers.studyHabit && answers.studyHabit === traits.studyHabit) {
      score += 10;
    }

    if (score > 98) score = 98;
    if (score < 40) score = 40;
    return Math.round(score);
  };

  const handleQuizChange = (field, value) => {
    setQuizForm(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleQuizSubmit = (e) => {
    e.preventDefault();
    const updated = roommates.map(roommate => ({
      ...roommate,
      matchScore: calculateRoommateMatch(quizForm, roommate)
    }));
    setRoommates(updated);
    toast.success('Roommate matches updated');
    setShowQuiz(false);
  };

  const isValidObjectId = (id) => {
    return typeof id === 'string' && id.length === 24 && /^[0-9a-fA-F]+$/.test(id);
  };

  const openProfile = (roommate) => {
    setSelectedRoommate(roommate);
  };

  const openChat = async (roommate) => {
    if (!roommate || !roommate.id || !isValidObjectId(roommate.id)) {
      toast.error('Messaging is only available with valid student profiles.');
      return;
    }

    setActiveChatUser(roommate);
    setIsChatLoading(true);
    try {
      const res = await usersAPI.getMessagesWithUser(roommate.id);
      const items = res.data.data || res.data.messages || [];
      setChatMessages(items);
    } catch (error) {
      console.error('Failed to load messages');
    } finally {
      setIsChatLoading(false);
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !activeChatUser || !isValidObjectId(activeChatUser.id)) {
      if (!newMessage.trim()) return;
      toast.error('Cannot send message. Please select a valid student profile.');
      return;
    }
    try {
      const res = await usersAPI.sendMessage({
        recipientId: activeChatUser.id,
        content: newMessage.trim()
      });
      const raw = res.data.data || res.data.message || res.data;
      const msg = {
        _id: raw._id,
        sender: raw.sender,
        recipient: raw.recipient,
        content: raw.content,
        createdAt: raw.createdAt,
        read: raw.read,
        isMine: true
      };
      setChatMessages((prev) => [...prev, msg]);
      setNewMessage('');
    } catch (error) {
      console.error('Failed to send message');
      toast.error('Failed to send message');
    }
  };

  const handleStudentServiceClick = (service) => {
    if (!service) return;
    if (service.url) {
      const url = service.url;
      if (url.startsWith('/')) {
        window.location.href = url;
      } else {
        window.open(url, '_blank', 'noopener,noreferrer');
      }
      return;
    }
    toast('This service will be available soon. Please check back later.');
  };

  const calculateAffordability = (price) => {
    const monthlyBudget = budget.max > 0 ? budget.max : (price || 1);
    const percentage = (price / monthlyBudget) * 100;
    if (percentage <= 30) return { color: 'green', text: 'Excellent' };
    if (percentage <= 50) return { color: 'yellow', text: 'Good' };
    if (percentage <= 70) return { color: 'orange', text: 'Stretch' };
    return { color: 'red', text: 'Over Budget' };
  };

  const filteredNearbyProperties = nearbyProperties.filter((property) => {
    if (!property || typeof property.price !== 'number') return true;
    if (budget.min && property.price < budget.min) return false;
    if (budget.max && property.price > budget.max) return false;
    return true;
  });

  const visibleStudentServices = (studentServices || []).filter((service) =>
    service && service.enabled !== false && (service.title || service.name)
  );

  const tabs = [
    { id: 'discover', label: 'Discover', icon: Search },
    { id: 'saved', label: 'Saved', icon: Heart },
    { id: 'roommates', label: 'Find Roommates', icon: Users },
    { id: 'campus', label: 'Campus Life', icon: Building },
    { id: 'transport', label: 'Transport', icon: Bus },
    { id: 'services', label: 'Services', icon: Zap }
  ];

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-primary-600 to-primary-700 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold">Student Hub</h1>
              <p className="text-primary-100">Your campus living companion</p>
            </div>
            <div className="flex items-center space-x-4">
              <div className="relative">
                <button
                  className="p-2 text-white/80 hover:text-white relative"
                  onClick={() => setShowNotifications(!showNotifications)}
                >
                  <Bell className="h-6 w-6" />
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 h-4 w-4 bg-red-500 rounded-full text-xs flex items-center justify-center">
                      {unreadCount}
                    </span>
                  )}
                </button>
                {showNotifications && (
                  <div className="absolute right-0 mt-2 w-80 bg-white text-gray-900 rounded-lg shadow-lg z-50 max-h-80 overflow-y-auto">
                    <div className="px-4 py-2 border-b flex items-center justify-between">
                      <span className="font-semibold text-sm">Notifications</span>
                      {unreadCount > 0 && (
                        <span className="text-xs text-gray-500">{unreadCount} unread</span>
                      )}
                    </div>
                    <div className="divide-y divide-gray-100">
                      {notifications.length === 0 ? (
                        <div className="px-4 py-3 text-sm text-gray-500 flex items-center">
                          <AlertCircle className="h-4 w-4 mr-2 text-gray-400" />
                          No notifications yet
                        </div>
                      ) : (
                        notifications.slice(0, 10).map((n) => (
                          <div
                            key={n._id || n.id}
                            className={`px-4 py-3 text-sm ${
                              n.read ? 'bg-white' : 'bg-primary-50'
                            }`}
                          >
                            <p className="font-medium truncate">{n.title || 'CampusNest Update'}</p>
                            <p className="text-xs text-gray-600 mt-1 line-clamp-2">{n.message}</p>
                            <p className="text-xs text-gray-400 mt-1">
                              {n.createdAt ? new Date(n.createdAt).toLocaleString() : ''}
                            </p>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>
              <button
                type="button"
                onClick={() => navigate('/profile')}
                className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center"
                title="Settings"
              >
                <Settings className="h-5 w-5" />
              </button>
              <div className="bg-white/20 rounded-lg px-4 py-2">
                <p className="text-sm">Budget Range</p>
                <p className="font-semibold">KSh {budget.min} - {budget.max}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Stats Bar */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center space-x-6">
              <span className="flex items-center text-gray-600">
                <MapPin className="h-4 w-4 mr-1 text-primary-600" />
                Within 2km of campus
              </span>
              <span className="flex items-center text-gray-600">
                <Clock className="h-4 w-4 mr-1 text-green-600" />
                Next bus: {transportInfo.nextBus}
              </span>
              <span className="flex items-center text-gray-600">
                <Wifi className="h-4 w-4 mr-1 text-blue-600" />
                Campus WiFi zones nearby
              </span>
            </div>
            <button
              className="flex items-center text-primary-600 font-medium"
              onClick={() => setShowBudgetCalculator(true)}
            >
              <Calculator className="h-4 w-4 mr-1" />
              Budget Calculator
            </button>
          </div>
        </div>
      </div>

      {showBudgetCalculator && (
        <div className="bg-white border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex flex-col md:flex-row md:items-end md:space-x-6 space-y-3 md:space-y-0">
              <div>
                <p className="text-sm font-medium text-gray-700">Adjust your monthly budget</p>
                <p className="text-xs text-gray-500">This will personalize your property matches.</p>
              </div>
              <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Min (KSh)</label>
                  <input
                    type="number"
                    min={0}
                    value={budget.min}
                    onChange={(e) =>
                      setBudget((prev) => ({
                        ...prev,
                        min: Number(e.target.value) || 0
                      }))
                    }
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Max (KSh)</label>
                  <input
                    type="number"
                    min={0}
                    value={budget.max}
                    onChange={(e) => {
                      const value = Number(e.target.value) || 0;
                      setBudget((prev) => ({
                        ...prev,
                        max: value < prev.min ? prev.min : value
                      }));
                    }}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={() => setShowBudgetCalculator(false)}
                  className="px-3 py-2 text-xs font-medium text-gray-600 hover:text-gray-800"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="bg-white shadow-sm border-b sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-8 overflow-x-auto">
            {tabs.map(tab => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center space-x-2 py-3 border-b-2 transition-colors whitespace-nowrap ${
                    activeTab === tab.id
                      ? 'border-primary-600 text-primary-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <Icon className="h-5 w-5" />
                  <span className="font-medium">{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Discover Tab */}
        {activeTab === 'discover' && (
          <div>
            {/* Smart Search Bar */}
            <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
              <div className="flex items-center space-x-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search by area, amenities, or budget..."
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                  />
                </div>
                <button className="px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700">
                  <Filter className="inline h-5 w-5 mr-2" />
                  Smart Filter
                </button>
              </div>
            </div>

            {/* Property Recommendations */}
            <div className="mb-8">
              <h2 className="text-xl font-bold text-gray-900 mb-4">
                🎯 Perfect Matches for You
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {filteredNearbyProperties.slice(0, 3).map((property) => {
                  const affordability = calculateAffordability(property.price);
                  const ratingObj = property.rating;
                  const ratingValue =
                    typeof ratingObj === 'number'
                      ? ratingObj
                      : typeof ratingObj?.average === 'number'
                      ? ratingObj.average
                      : null;

                  return (
                    <div key={property._id || property.id} className="bg-white rounded-lg shadow hover:shadow-lg transition-shadow">
                      <div className="relative">
                        {property.images?.[0] && (
                          <img 
                            src={property.images[0]} 
                            alt={property.title}
                            className="w-full h-48 object-cover rounded-t-lg"
                          />
                        )}
                        <div className="absolute top-2 right-2">
                          <button className="p-2 bg-white rounded-full shadow">
                            <Heart className="h-5 w-5 text-gray-600" />
                          </button>
                        </div>
                        <div className={`absolute top-2 left-2 px-2 py-1 rounded text-xs font-semibold text-white ${
                          affordability.color === 'green' ? 'bg-green-500' :
                          affordability.color === 'yellow' ? 'bg-yellow-500' :
                          affordability.color === 'orange' ? 'bg-orange-500' :
                          'bg-red-500'
                        }`}>
                          {affordability.text}
                        </div>
                      </div>
                      <div className="p-4">
                        <h3 className="font-semibold text-gray-900 mb-2">{property.title}</h3>
                        <div className="flex items-center text-sm text-gray-600 mb-2">
                          <MapPin className="h-4 w-4 mr-1" />
                          {property.walkTime || '10 min'} walk to campus
                        </div>
                        <div className="flex items-center justify-between mb-3">
                          <span className="text-lg font-bold text-primary-600">
                            KSh {property.price?.toLocaleString()}/month
                          </span>
                          <div className="flex items-center">
                            <Star className="h-4 w-4 text-yellow-400 fill-current" />
                            <span className="ml-1 text-sm text-gray-600">
                              {ratingValue != null ? ratingValue.toFixed(1) : '4.5'}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2 text-xs text-gray-500">
                          {property.amenities?.includes('wifi') && (
                            <span className="flex items-center bg-gray-100 px-2 py-1 rounded">
                              <Wifi className="h-3 w-3 mr-1" />
                              WiFi
                            </span>
                          )}
                          {property.amenities?.includes('security') && (
                            <span className="flex items-center bg-gray-100 px-2 py-1 rounded">
                              <Shield className="h-3 w-3 mr-1" />
                              Security
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Interactive Map */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">
                <Map className="inline h-6 w-6 mr-2" />
                Interactive Campus Map
              </h2>
              <div className="h-96 bg-gray-100 rounded-lg flex items-center justify-center">
                <div className="text-center">
                  <Navigation className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                  <p className="text-gray-600">Interactive map showing:</p>
                  <ul className="text-sm text-gray-500 mt-2">
                    <li>• Available properties</li>
                    <li>• Campus buildings</li>
                    <li>• Bus stops & routes</li>
                    <li>• Shops & amenities</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Find Roommates Tab */}
        {activeTab === 'roommates' && (
          <div>
            <h2 className="text-xl font-bold text-gray-900 mb-6">Find Compatible Roommates</h2>
            
            {/* Compatibility Quiz */}
            <div className="bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg p-6 mb-8">
              <h3 className="text-lg font-semibold mb-2">🎯 Take the Compatibility Quiz</h3>
              <p className="mb-4">Answer a few questions to find your perfect roommate match!</p>
              {!showQuiz ? (
                <button
                  className="bg-white text-purple-600 px-6 py-2 rounded-lg font-semibold hover:bg-gray-100"
                  onClick={() => setShowQuiz(true)}
                >
                  Start Quiz
                </button>
              ) : (
                <form onSubmit={handleQuizSubmit} className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Monthly Budget (KSh)</label>
                    <input
                      type="number"
                      min={0}
                      value={quizForm.budget}
                      onChange={(e) => handleQuizChange('budget', Number(e.target.value))}
                      className="w-full rounded-md px-3 py-2 text-gray-900 border border-purple-200 focus:outline-none focus:ring-2 focus:ring-white/70"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Lifestyle</label>
                    <select
                      value={quizForm.lifestyle}
                      onChange={(e) => handleQuizChange('lifestyle', e.target.value)}
                      className="w-full rounded-md px-3 py-2 text-gray-900 border border-purple-200 focus:outline-none focus:ring-2 focus:ring-white/70"
                    >
                      <option value="quiet">Quiet / Calm</option>
                      <option value="social">Social / Outgoing</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Smoking Preference</label>
                    <select
                      value={quizForm.smoking}
                      onChange={(e) => handleQuizChange('smoking', e.target.value)}
                      className="w-full rounded-md px-3 py-2 text-gray-900 border border-purple-200 focus:outline-none focus:ring-2 focus:ring-white/70"
                    >
                      <option value="non-smoker">Non-smoker only</option>
                      <option value="no-preference">No preference</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Study Habit</label>
                    <select
                      value={quizForm.studyHabit}
                      onChange={(e) => handleQuizChange('studyHabit', e.target.value)}
                      className="w-full rounded-md px-3 py-2 text-gray-900 border border-purple-200 focus:outline-none focus:ring-2 focus:ring-white/70"
                    >
                      <option value="studious">Mostly studying</option>
                      <option value="relaxed">More relaxed</option>
                    </select>
                  </div>
                  <div className="md:col-span-2 flex space-x-3 mt-2">
                    <button
                      type="submit"
                      className="bg-white text-purple-600 px-4 py-2 rounded-lg font-semibold hover:bg-gray-100"
                    >
                      Update Matches
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowQuiz(false)}
                      className="bg-white/20 text-white px-4 py-2 rounded-lg font-semibold hover:bg-white/10"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              )}
            </div>

            {/* Potential Roommates */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {roommates.map((roommate) => (
                <div key={roommate.id} className="bg-white rounded-lg shadow p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center">
                      <div className="h-12 w-12 bg-primary-100 rounded-full flex items-center justify-center">
                        <Users className="h-6 w-6 text-primary-600" />
                      </div>
                      <div className="ml-4">
                        <h3 className="font-semibold text-gray-900">{roommate.name}</h3>
                        <p className="text-sm text-gray-600">{roommate.course}</p>
                      </div>
                    </div>
                    <span className="bg-green-100 text-green-600 px-3 py-1 rounded-full text-sm font-semibold">
                      {(roommate.matchScore || 80)}% Match
                    </span>
                  </div>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center text-gray-600">
                      <DollarSign className="h-4 w-4 mr-2" />
                      Budget: KSh {roommate.budget}
                    </div>
                    <div className="flex items-center text-gray-600">
                      <BookOpen className="h-4 w-4 mr-2" />
                      Preferences: {roommate.preferences.join(', ')}
                    </div>
                  </div>
                  <div className="mt-4 flex space-x-2">
                    <button
                      className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
                      onClick={() => openChat(roommate)}
                    >
                      <MessageSquare className="inline h-4 w-4 mr-1" />
                      Message
                    </button>
                    <button
                      className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                      onClick={() => openProfile(roommate)}
                    >
                      View Profile
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {selectedRoommate && (
              <div className="mt-8 bg-white rounded-lg shadow p-6">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">
                    Roommate Profile
                  </h3>
                  <button
                    className="text-sm text-gray-500 hover:text-gray-700"
                    onClick={() => setSelectedRoommate(null)}
                  >
                    Close
                  </button>
                </div>
                <div className="flex items-start space-x-4">
                  <div className="h-16 w-16 rounded-full bg-primary-100 flex items-center justify-center text-xl font-semibold text-primary-700 overflow-hidden">
                    {selectedRoommate.profilePicture ? (
                      <img
                        src={selectedRoommate.profilePicture}
                        alt={selectedRoommate.name}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      selectedRoommate.name?.charAt(0)
                    )}
                  </div>
                  <div className="flex-1 space-y-1 text-sm">
                    <p className="text-base font-semibold text-gray-900">{selectedRoommate.name}</p>
                    <p className="text-gray-600">{selectedRoommate.course}</p>
                    {selectedRoommate.university && (
                      <p className="text-gray-600">{selectedRoommate.university}</p>
                    )}
                    {selectedRoommate.email && (
                      <p className="text-gray-600">Email: {selectedRoommate.email}</p>
                    )}
                    {selectedRoommate.phone && (
                      <p className="text-gray-600">Phone: {selectedRoommate.phone}</p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {activeChatUser && (
              <div className="mt-8 bg-white rounded-lg shadow p-6">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">
                    Chat with {activeChatUser.name}
                  </h3>
                  <button
                    className="text-sm text-gray-500 hover:text-gray-700"
                    onClick={() => {
                      setActiveChatUser(null);
                      setChatMessages([]);
                    }}
                  >
                    Close
                  </button>
                </div>
                <div className="border rounded-lg h-64 overflow-y-auto mb-4 p-3 bg-gray-50">
                  {isChatLoading ? (
                    <div className="h-full flex items-center justify-center text-gray-500 text-sm">
                      Loading messages...
                    </div>
                  ) : chatMessages.length === 0 ? (
                    <div className="h-full flex items-center justify-center text-gray-500 text-sm">
                      No messages yet. Say hi!
                    </div>
                  ) : (
                    chatMessages.map((m) => (
                      <div
                        key={m._id}
                        className={`mb-2 flex ${m.isMine ? 'justify-end' : 'justify-start'}`}
                      >
                        <div
                          className={`max-w-xs px-3 py-2 rounded-lg text-sm ${
                            m.isMine
                              ? 'bg-primary-600 text-white'
                              : 'bg-white text-gray-800 border border-gray-200'
                          }`}
                        >
                          <p>{m.content}</p>
                          <p className="mt-1 text-[10px] opacity-75">
                            {m.createdAt ? new Date(m.createdAt).toLocaleTimeString() : ''}
                          </p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
                <form onSubmit={handleSendMessage} className="flex items-center space-x-2">
                  <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Type a message..."
                    className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                  <button
                    type="submit"
                    className="px-4 py-2 bg-primary-600 text-white rounded-lg text-sm hover:bg-primary-700"
                  >
                    Send
                  </button>
                </form>
              </div>
            )}
          </div>
        )}

        {/* Campus Life Tab */}
        {activeTab === 'campus' && (
          <div>
            <h2 className="text-xl font-bold text-gray-900 mb-6">Campus Life & Events</h2>
            
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Events */}
              <div className="lg:col-span-2">
                <div className="bg-white rounded-lg shadow p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    <Calendar className="inline h-5 w-5 mr-2" />
                    Upcoming Events
                  </h3>
                  <div className="space-y-4">
                    {events.map((event) => (
                      <div key={event.id} className="flex items-start space-x-4 p-4 bg-gray-50 rounded-lg">
                        <div className="bg-primary-100 rounded-lg p-3">
                          <Calendar className="h-6 w-6 text-primary-600" />
                        </div>
                        <div className="flex-1">
                          <h4 className="font-semibold text-gray-900">{event.title}</h4>
                          <p className="text-sm text-gray-600">{event.date} • {event.location}</p>
                          <button className="mt-2 text-primary-600 text-sm font-medium">
                            Learn More →
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Campus Services + Contact Admin */}
              <div className="space-y-6">
                <div className="bg-white rounded-lg shadow p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    Quick Links
                  </h3>
                  <div className="space-y-3">
                    {campusServices.slice(0, 4).map((service) => (
                      <button
                        key={service.id}
                        className="w-full flex items-center p-3 bg-gray-50 rounded-lg hover:bg-gray-100 text-left"
                      >
                        <Library className="h-5 w-5 text-blue-600 mr-3" />
                        <span className="text-sm font-medium text-gray-900">{service.name}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="bg-white rounded-lg shadow p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    Contact Admin
                  </h3>
                  <p className="text-sm text-gray-600 mb-3">
                    Have an issue or suggestion? Send a message to the CampusNest admin team.
                  </p>
                  <form onSubmit={handleSubmitSupport} className="space-y-3">
                    <input
                      type="text"
                      value={supportSubject}
                      onChange={(e) => setSupportSubject(e.target.value)}
                      placeholder="Subject"
                      className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                    <textarea
                      rows={3}
                      value={supportMessage}
                      onChange={(e) => setSupportMessage(e.target.value)}
                      placeholder="Describe your issue or question..."
                      className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                    <button
                      type="submit"
                      disabled={isSubmittingSupport}
                      className="w-full px-4 py-2 bg-primary-600 text-white rounded-md text-sm font-medium hover:bg-primary-700 disabled:opacity-60 disabled:cursor-not-allowed"
                    >
                      {isSubmittingSupport ? 'Sending...' : 'Send Message'}
                    </button>
                  </form>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Transport Tab */}
        {activeTab === 'transport' && (
          <div>
            <h2 className="text-xl font-bold text-gray-900 mb-6">Campus Transportation</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Live Bus Tracking */}
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  <Bus className="inline h-5 w-5 mr-2" />
                  Live Bus Tracking
                </h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg">
                    <div>
                      <p className="font-semibold text-gray-900">{transportInfo.busRoute}</p>
                      <p className="text-sm text-gray-600">Next arrival: {transportInfo.nextBus}</p>
                    </div>
                    <div className="bg-green-500 text-white px-3 py-1 rounded-full text-sm font-semibold">
                      On Time
                    </div>
                  </div>
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <p className="text-sm font-semibold text-gray-900 mb-2">Popular Routes:</p>
                    <ul className="space-y-1 text-sm text-gray-600">
                      <li>• Route 14: Campus → CBD (KSh 50)</li>
                      <li>• Route 23: Campus → Westlands (KSh 40)</li>
                      <li>• Route 7: Campus → Karen (KSh 60)</li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* Matatu Info */}
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Matatu & Taxi Options
                </h3>
                <div className="space-y-3">
                  <div className="p-4 bg-blue-50 rounded-lg">
                    <p className="font-semibold text-gray-900">Matatu to CBD</p>
                    <p className="text-sm text-gray-600">{transportInfo.matatu}</p>
                  </div>
                  <div className="p-4 bg-purple-50 rounded-lg">
                    <p className="font-semibold text-gray-900">Uber/Bolt Estimate</p>
                    <p className="text-sm text-gray-600">KSh 150-250 to CBD</p>
                  </div>
                  <div className="p-4 bg-yellow-50 rounded-lg">
                    <p className="font-semibold text-gray-900">Bike Sharing</p>
                    <p className="text-sm text-gray-600">KSh 20/hour • 5 stations nearby</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Services Tab */}
        {activeTab === 'services' && (
          <div>
            <h2 className="text-xl font-bold text-gray-900 mb-6">Student Services</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {visibleStudentServices.length === 0 ? (
                <div className="col-span-1 md:col-span-2 lg:col-span-3 text-sm text-gray-500">
                  No student services available at the moment. Please check back later.
                </div>
              ) : (
                visibleStudentServices.map((service) => {
                  const key = (service.key || service.title || '').toLowerCase();
                  let Icon = ShoppingCart;
                  let iconColorClass = 'text-blue-600';
                  if (key.includes('tutor')) {
                    Icon = BookOpen;
                    iconColorClass = 'text-green-600';
                  } else if (key.includes('discount')) {
                    Icon = Award;
                    iconColorClass = 'text-purple-600';
                  }
                  return (
                    <div key={service.id} className="bg-white rounded-lg shadow p-6">
                      <Icon className={`h-8 w-8 mb-3 ${iconColorClass}`} />
                      <h3 className="font-semibold text-gray-900 mb-2">{service.title || service.name}</h3>
                      <p className="text-sm text-gray-600 mb-4">
                        {service.description}
                      </p>
                      <button
                        className="text-primary-600 font-medium text-sm"
                        onClick={() => handleStudentServiceClick(service)}
                      >
                        {service.ctaLabel || 'Learn more'}
                      </button>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default StudentDashboard;
