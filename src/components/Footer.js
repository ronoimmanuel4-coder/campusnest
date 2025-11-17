import React from 'react';
import { Home, Mail, Phone, MapPin, Facebook, Twitter, Instagram } from 'lucide-react';

const Footer = () => {
  return (
    <footer className="bg-gray-900 text-gray-300 mt-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <div className="flex items-center space-x-2 mb-4">
              <Home className="h-8 w-8 text-primary-400" />
              <span className="text-2xl font-bold text-white">CampusNest</span>
            </div>
            <p className="text-sm">
              Your trusted platform for finding the perfect student accommodation near campus.
            </p>
          </div>

          <div>
            <h3 className="text-white font-semibold mb-4">Quick Links</h3>
            <ul className="space-y-2">
              <li><a href="/listings" className="hover:text-primary-400 transition-colors">Browse Listings</a></li>
              <li><a href="#" className="hover:text-primary-400 transition-colors">Post Property</a></li>
              <li><a href="#" className="hover:text-primary-400 transition-colors">Pricing</a></li>
              <li><a href="#" className="hover:text-primary-400 transition-colors">FAQs</a></li>
            </ul>
          </div>

          <div>
            <h3 className="text-white font-semibold mb-4">Contact Info</h3>
            <ul className="space-y-2">
              <li className="flex items-center space-x-2">
                <Phone className="h-4 w-4" />
                <span>0741218862</span>
              </li>
              <li className="flex items-center space-x-2">
                <Mail className="h-4 w-4" />
                <span>eduvault520@gmail.com</span>
              </li>
              <li className="flex items-center space-x-2">
                <MapPin className="h-4 w-4" />
                <span>Nairobi, Kenya</span>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-white font-semibold mb-4">Follow Us</h3>
            <div className="flex space-x-4">
              <a href="#" className="hover:text-primary-400 transition-colors">
                <Facebook className="h-6 w-6" />
              </a>
              <a href="#" className="hover:text-primary-400 transition-colors">
                <Twitter className="h-6 w-6" />
              </a>
              <a href="#" className="hover:text-primary-400 transition-colors">
                <Instagram className="h-6 w-6" />
              </a>
            </div>
            <div className="mt-4">
              <p className="text-sm">Subscribe to our newsletter</p>
              <div className="mt-2 flex">
                <input
                  type="email"
                  placeholder="Your email"
                  className="px-3 py-2 bg-gray-800 text-white rounded-l-md flex-1 focus:outline-none focus:bg-gray-700"
                />
                <button className="px-4 py-2 bg-primary-600 text-white rounded-r-md hover:bg-primary-700 transition-colors">
                  Subscribe
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-8 pt-8 border-t border-gray-800 text-center text-sm">
          <p>&copy; 2024 CampusNest. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
