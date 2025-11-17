import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Home, Menu, X, MapPin, User, LogOut, Heart, Unlock, Settings, Shield } from 'lucide-react';
import useAuthStore from '../stores/authStore';

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const { user, isAuthenticated, logout } = useAuthStore();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/');
    setIsProfileOpen(false);
  };

  const handlePostProperty = () => {
    if (isAuthenticated) {
      navigate('/dashboard');
    } else {
      navigate('/login');
    }
    setIsOpen(false);
  };

  return (
    <nav className="bg-white shadow-lg sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link to="/" className="flex items-center space-x-2">
              <Home className="h-8 w-8 text-primary-600" />
              <span className="text-2xl font-bold gradient-text">CampusNest</span>
            </Link>
          </div>

          <div className="hidden md:flex items-center space-x-8">
            <Link to="/" className="text-gray-700 hover:text-primary-600 transition-colors">
              Home
            </Link>
            <Link to="/listings" className="text-gray-700 hover:text-primary-600 transition-colors">
              Browse Listings
            </Link>
            <Link to="/about" className="text-gray-700 hover:text-primary-600 transition-colors">
              About
            </Link>
            <Link to="/listings" className="flex items-center space-x-1 text-gray-700 hover:text-primary-600 transition-colors">
              <MapPin className="h-4 w-4" />
              <span>Near Campus</span>
            </Link>
            <button onClick={handlePostProperty} className="btn-primary text-sm">
              Post Property
            </button>
            
            {isAuthenticated ? (
              <div className="relative">
                <button
                  onClick={() => setIsProfileOpen(!isProfileOpen)}
                  className="flex items-center space-x-2 text-gray-700 hover:text-primary-600 transition-colors"
                >
                  <div className="h-8 w-8 rounded-full bg-primary-100 flex items-center justify-center">
                    <User className="h-5 w-5 text-primary-600" />
                  </div>
                  <span className="hidden lg:block">{user?.name}</span>
                </button>
                
                {isProfileOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-50">
                    <Link
                      to="/dashboard"
                      className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      onClick={() => setIsProfileOpen(false)}
                    >
                      <Settings className="h-4 w-4 mr-2" />
                      Dashboard
                    </Link>
                    <Link
                      to="/saved-properties"
                      className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      onClick={() => setIsProfileOpen(false)}
                    >
                      <Heart className="h-4 w-4 mr-2" />
                      Saved
                    </Link>
                    <Link
                      to="/unlocked-properties"
                      className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      onClick={() => setIsProfileOpen(false)}
                    >
                      <Unlock className="h-4 w-4 mr-2" />
                      Unlocked
                    </Link>
                    {user?.role === 'admin' && (
                      <Link
                        to="/admin"
                        className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        onClick={() => setIsProfileOpen(false)}
                      >
                        <Shield className="h-4 w-4 mr-2" />
                        Admin
                      </Link>
                    )}
                    <button
                      onClick={handleLogout}
                      className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      <LogOut className="h-4 w-4 mr-2" />
                      Logout
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center space-x-4">
                <Link
                  to="/login"
                  className="text-gray-700 hover:text-primary-600 transition-colors"
                >
                  Login
                </Link>
                <Link
                  to="/register"
                  className="btn-primary text-sm"
                >
                  Sign Up
                </Link>
              </div>
            )}
          </div>

          <div className="md:hidden flex items-center">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="text-gray-700 hover:text-primary-600 transition-colors"
            >
              {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>

        {isOpen && (
          <div className="md:hidden">
            <div className="px-2 pt-2 pb-3 space-y-1">
              <Link
                to="/"
                className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-primary-600 hover:bg-gray-50"
                onClick={() => setIsOpen(false)}
              >
                Home
              </Link>
              <Link
                to="/listings"
                className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-primary-600 hover:bg-gray-50"
                onClick={() => setIsOpen(false)}
              >
                Browse Listings
              </Link>
              <Link
                to="/about"
                className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-primary-600 hover:bg-gray-50"
                onClick={() => setIsOpen(false)}
              >
                About
              </Link>
              <Link
                to="/listings"
                className="flex items-center space-x-1 px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-primary-600 hover:bg-gray-50"
                onClick={() => setIsOpen(false)}
              >
                <MapPin className="h-4 w-4" />
                <span>Near Campus</span>
              </Link>
              <button onClick={handlePostProperty} className="w-full text-left px-3 py-2 rounded-md text-base font-medium bg-primary-600 text-white hover:bg-primary-700">
                Post Property
              </button>
              
              {isAuthenticated ? (
                <>
                  <div className="border-t border-gray-200 my-2"></div>
                  <Link
                    to="/dashboard"
                    className="flex items-center px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-primary-600 hover:bg-gray-50"
                    onClick={() => setIsOpen(false)}
                  >
                    <Settings className="h-4 w-4 mr-2" />
                    Dashboard
                  </Link>
                  <Link
                    to="/saved-properties"
                    className="flex items-center px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-primary-600 hover:bg-gray-50"
                    onClick={() => setIsOpen(false)}
                  >
                    <Heart className="h-4 w-4 mr-2" />
                    Saved
                  </Link>
                  {user?.role === 'admin' && (
                    <Link
                      to="/admin"
                      className="flex items-center px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-primary-600 hover:bg-gray-50"
                      onClick={() => setIsOpen(false)}
                    >
                      <Shield className="h-4 w-4 mr-2" />
                      Admin
                    </Link>
                  )}
                  <button
                    onClick={handleLogout}
                    className="flex items-center w-full px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-primary-600 hover:bg-gray-50"
                  >
                    <LogOut className="h-4 w-4 mr-2" />
                    Logout
                  </button>
                </>
              ) : (
                <>
                  <div className="border-t border-gray-200 my-2"></div>
                  <Link
                    to="/login"
                    className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-primary-600 hover:bg-gray-50"
                    onClick={() => setIsOpen(false)}
                  >
                    Login
                  </Link>
                  <Link
                    to="/register"
                    className="block px-3 py-2 rounded-md text-base font-medium bg-primary-600 text-white hover:bg-primary-700"
                    onClick={() => setIsOpen(false)}
                  >
                    Sign Up
                  </Link>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
