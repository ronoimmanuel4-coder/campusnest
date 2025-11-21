import React from 'react';
import { Link } from 'react-router-dom';
import { 
  Home, Mail, Linkedin, Github, Twitter, 
  Heart, Code, Sparkles, ArrowRight, Award,
  Users, Building, Shield, Target
} from 'lucide-react';

const AboutPage = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 overflow-x-hidden">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-primary-600 via-primary-700 to-accent-600 text-white overflow-hidden">
        <div className="absolute inset-0 bg-black/10"></div>
        <div className="absolute inset-0">
          <div className="absolute w-96 h-96 bg-white/5 rounded-full blur-3xl top-0 right-0 animate-pulse"></div>
          <div className="absolute w-96 h-96 bg-accent-400/10 rounded-full blur-3xl bottom-0 left-0 animate-pulse animation-delay-2000"></div>
        </div>
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20 lg:py-24">
          <div className="text-center">
            <div className="inline-block mb-6">
              <div className="flex items-center space-x-2 bg-white/10 backdrop-blur-sm px-4 py-2 rounded-full">
                <Sparkles className="h-4 w-4 text-yellow-300" />
                <span className="text-sm font-medium">About CampusNest</span>
              </div>
            </div>
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-black mb-6 tracking-tight">
              You Decide Your <span className="text-yellow-300">Perfect Home</span>
            </h1>
            <p className="text-xl text-gray-100 max-w-3xl mx-auto">
              Empowering students to find verified, affordable housing near campus with transparency and trust
            </p>
          </div>
        </div>
      </section>

      {/* Creator Section */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
            <div className="grid md:grid-cols-2 gap-0">
              {/* Image Side */}
              <div className="relative bg-gradient-to-br from-primary-600 to-accent-600 p-8 md:p-12 flex items-center justify-center">
                <div className="absolute inset-0 bg-black/5"></div>
                <div className="relative">
                  {/* Placeholder for your photo */}
                  <div className="relative group">
                    <div className="absolute -inset-4 bg-gradient-to-r from-yellow-400 to-accent-500 rounded-full blur-xl opacity-50 group-hover:opacity-75 transition-opacity"></div>
                    <div className="relative w-64 h-64 bg-white rounded-full flex items-center justify-center shadow-2xl overflow-hidden">
                      <img 
                        src="/profile.jpg" 
                        alt="Immanuel K. Ronoh"
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.target.style.display = 'none';
                          e.target.nextSibling.style.display = 'flex';
                        }}
                      />
                      <div className="w-full h-full bg-gradient-to-br from-primary-100 to-accent-100 flex items-center justify-center" style={{display: 'none'}}>
                        <div className="text-center">
                          <div className="text-6xl font-black text-primary-600 mb-2">IKR</div>
                          <p className="text-sm text-gray-600">Add Your Photo</p>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Floating elements */}
                  <div className="absolute -top-4 -right-4 bg-yellow-400 rounded-full p-3 shadow-lg animate-bounce-slow">
                    <Code className="h-6 w-6 text-primary-600" />
                  </div>
                  <div className="absolute -bottom-4 -left-4 bg-white rounded-full p-3 shadow-lg animate-bounce-slow animation-delay-500">
                    <Heart className="h-6 w-6 text-red-500" />
                  </div>
                </div>
              </div>

              {/* Content Side */}
              <div className="p-8 md:p-12">
                <div className="mb-6">
                  <div className="inline-flex items-center space-x-2 bg-primary-50 px-4 py-2 rounded-full mb-4">
                    <Award className="h-4 w-4 text-primary-600" />
                    <span className="text-sm font-semibold text-primary-600">Creator & Developer</span>
                  </div>
                  <h2 className="text-4xl font-black text-gray-900 mb-2">
                    Immanuel K. Ronoh
                  </h2>
                  <p className="text-xl text-primary-600 font-semibold mb-6">
                    Full-Stack Developer & Student Advocate
                  </p>
                </div>

                <div className="space-y-4 mb-8">
                  <p className="text-gray-700 leading-relaxed">
                    As a student who experienced the challenges of finding safe, affordable housing near campus, 
                    I created CampusNest to solve a real problem that affects thousands of students every semester.
                  </p>
                  <p className="text-gray-700 leading-relaxed">
                    This platform is built with transparency at its core—giving you verified listings, exact locations, 
                    and direct contact with landlords and caretakers. No more middlemen, no more hidden fees, 
                    no more uncertainty.
                  </p>
                  <div className="bg-gradient-to-r from-primary-50 to-accent-50 border-l-4 border-primary-600 p-4 rounded-r-lg">
                    <p className="text-gray-800 font-medium italic">
                      "You decide where you live. We just make it easier to find the perfect place."
                    </p>
                  </div>
                </div>

                {/* Social Links */}
                <div className="flex flex-wrap gap-3">
                  <a 
                    href="mailto:immanuel.ronoh@example.com" 
                    className="flex items-center space-x-2 bg-gray-100 hover:bg-primary-600 hover:text-white px-4 py-2 rounded-lg transition-all group"
                  >
                    <Mail className="h-4 w-4" />
                    <span className="text-sm font-medium">Email</span>
                  </a>
                  <a 
                    href="https://linkedin.com" 
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center space-x-2 bg-gray-100 hover:bg-blue-600 hover:text-white px-4 py-2 rounded-lg transition-all group"
                  >
                    <Linkedin className="h-4 w-4" />
                    <span className="text-sm font-medium">LinkedIn</span>
                  </a>
                  <a 
                    href="https://github.com" 
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center space-x-2 bg-gray-100 hover:bg-gray-800 hover:text-white px-4 py-2 rounded-lg transition-all group"
                  >
                    <Github className="h-4 w-4" />
                    <span className="text-sm font-medium">GitHub</span>
                  </a>
                  <a 
                    href="https://twitter.com" 
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center space-x-2 bg-gray-100 hover:bg-blue-400 hover:text-white px-4 py-2 rounded-lg transition-all group"
                  >
                    <Twitter className="h-4 w-4" />
                    <span className="text-sm font-medium">Twitter</span>
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Mission & Vision */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-black text-gray-900 mb-4">
              Our Mission & Vision
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Building a transparent, trustworthy platform for student housing
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            {/* Mission */}
            <div className="bg-gradient-to-br from-primary-50 to-primary-100 rounded-2xl p-8 border-2 border-primary-200">
              <div className="bg-primary-600 rounded-full w-16 h-16 flex items-center justify-center mb-6">
                <Target className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">Our Mission</h3>
              <p className="text-gray-700 leading-relaxed">
                To empower students with transparent, verified housing options near campus, 
                eliminating uncertainty and providing direct access to landlords and property details. 
                We believe every student deserves a safe, affordable home where they can focus on their studies.
              </p>
            </div>

            {/* Vision */}
            <div className="bg-gradient-to-br from-accent-50 to-accent-100 rounded-2xl p-8 border-2 border-accent-200">
              <div className="bg-accent-600 rounded-full w-16 h-16 flex items-center justify-center mb-6">
                <Sparkles className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">Our Vision</h3>
              <p className="text-gray-700 leading-relaxed">
                To become the most trusted student housing platform in Kenya, where transparency, 
                affordability, and student welfare come first. We envision a future where finding 
                quality student accommodation is simple, secure, and stress-free.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Key Features */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-black text-gray-900 mb-4">
              Why CampusNest?
            </h2>
            <p className="text-xl text-gray-600">
              Built by students, for students
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <div className="bg-white rounded-xl p-8 shadow-lg hover:shadow-xl transition-shadow">
              <div className="bg-primary-100 rounded-full w-14 h-14 flex items-center justify-center mb-6">
                <Shield className="h-7 w-7 text-primary-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Verified Listings</h3>
              <p className="text-gray-600">
                Every property is verified by our admin team. No fake listings, no scams—just real homes from real landlords.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="bg-white rounded-xl p-8 shadow-lg hover:shadow-xl transition-shadow">
              <div className="bg-accent-100 rounded-full w-14 h-14 flex items-center justify-center mb-6">
                <Building className="h-7 w-7 text-accent-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Exact Locations</h3>
              <p className="text-gray-600">
                Unlock properties to see exact addresses and GPS coordinates. Navigate directly to your future home with Google Maps.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="bg-white rounded-xl p-8 shadow-lg hover:shadow-xl transition-shadow">
              <div className="bg-yellow-100 rounded-full w-14 h-14 flex items-center justify-center mb-6">
                <Users className="h-7 w-7 text-yellow-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Direct Contact</h3>
              <p className="text-gray-600">
                Connect directly with landlords and caretakers. No middlemen, no extra fees—just straightforward communication.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-br from-primary-600 via-primary-700 to-accent-600 text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <Home className="h-16 w-16 mx-auto mb-6 text-yellow-300" />
          <h2 className="text-4xl md:text-5xl font-black mb-6">
            Ready to Find Your Perfect Home?
          </h2>
          <p className="text-xl text-gray-100 mb-8">
            Join thousands of students who have found their ideal accommodation through CampusNest
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link 
              to="/listings" 
              className="inline-flex items-center justify-center px-8 py-4 bg-white text-primary-600 rounded-lg font-bold hover:bg-gray-100 transition-colors group"
            >
              Browse Properties
              <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link 
              to="/register" 
              className="inline-flex items-center justify-center px-8 py-4 bg-transparent border-2 border-white text-white rounded-lg font-bold hover:bg-white hover:text-primary-600 transition-colors"
            >
              Get Started Free
            </Link>
          </div>
        </div>
      </section>

      <style jsx>{`
        @keyframes bounce-slow {
          0%, 100% {
            transform: translateY(0);
          }
          50% {
            transform: translateY(-10px);
          }
        }

        .animate-bounce-slow {
          animation: bounce-slow 3s ease-in-out infinite;
        }

        .animation-delay-500 {
          animation-delay: 500ms;
        }

        .animation-delay-2000 {
          animation-delay: 2000ms;
        }
      `}</style>
    </div>
  );
};

export default AboutPage;
