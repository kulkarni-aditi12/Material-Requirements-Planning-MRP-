import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  Sun, 
  Users, 
  Cog, 
  HelpCircle, 
  Mail, 
  Phone, 
  MapPin, 
  ArrowRight,
  Factory,
  Wrench,
  Shield,
  Award,
  Send,
  CheckCircle,
  Snowflake,
  Wind,
  Zap
} from 'lucide-react';

const WelcomePage: React.FC = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    company: '',
    subject: '',
    message: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    // Simulate form submission
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    setIsSubmitting(false);
    setIsSubmitted(true);
    
    // Reset form after 3 seconds
    setTimeout(() => {
      setIsSubmitted(false);
      setFormData({
        name: '',
        email: '',
        phone: '',
        company: '',
        subject: '',
        message: ''
      });
    }, 3000);
  };

  const products = [
    {
      name: 'Refrigerator Components',
      description: 'Precision-engineered compressor parts, cooling coils, and control systems',
      icon: Snowflake,
      applications: ['Home Refrigerators', 'Commercial Freezers', 'Industrial Cooling']
    },
    {
      name: 'Air Conditioning Parts',
      description: 'High-quality condensers, evaporators, and HVAC control components',
      icon: Wind,
      applications: ['Split AC Units', 'Central Air Systems', 'Industrial HVAC']
    },
    {
      name: 'Electrical Components',
      description: 'Specialized electrical parts for appliance manufacturers',
      icon: Zap,
      applications: ['Control Panels', 'Motor Components', 'Wiring Harnesses']
    },
    {
      name: 'Custom Manufacturing',
      description: 'Bespoke manufacturing solutions for major appliance brands',
      icon: Factory,
      applications: ['OEM Parts', 'Prototype Development', 'Mass Production']
    }
  ];

  return (
    <div className="relative min-h-screen overflow-x-hidden">
      {/* Hero Section with Worker Background */}
      <div className="relative min-h-screen">
        {/* Background with overlay */}
        <div 
          className="absolute inset-0 bg-center bg-no-repeat bg-cover"
          style={{
            backgroundImage: `linear-gradient(rgba(0, 0, 0, 0.5), rgba(0, 0, 0, 0.3)), url('https://images.pexels.com/photos/1108101/pexels-photo-1108101.jpeg?auto=compress&cs=tinysrgb&w=1920&h=1080&fit=crop')`
          }}
        />
        
        {/* Animated particles effect */}
        <div className="absolute inset-0 overflow-hidden">
          {[...Array(20)].map((_, i) => (
            <div
              key={i}
              className="absolute w-2 h-2 bg-orange-400 rounded-full opacity-20 animate-pulse"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 3}s`,
                animationDuration: `${3 + Math.random() * 2}s`
              }}
            />
          ))}
        </div>

        {/* Navigation Bar */}
        <nav className="relative z-50 border-b bg-black/20 backdrop-blur-md border-white/10">
          <div className="px-4 mx-auto max-w-7xl sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-20">
              <div className="flex items-center space-x-3">
                <div className="relative">
                  <Sun className="w-10 h-10 text-orange-400 animate-pulse" />
                  <div className="absolute inset-0 w-10 h-10 text-orange-400 animate-spin opacity-30">
                    <Cog className="w-10 h-10" />
                  </div>
                </div>
                <div>
                  <span className="text-2xl font-bold text-white">Sunrise Technologies</span>
                  <p className="text-sm text-orange-300">Manufacturing Excellence Since 1995</p>
                </div>
              </div>
              
              <div className="items-center hidden space-x-8 lg:flex">
                <a href="#home" className="text-white transition-all duration-300 transform hover:text-orange-300 hover:scale-105">Home</a>
                <a href="#about" className="text-white transition-all duration-300 transform hover:text-orange-300 hover:scale-105">About</a>
                <a href="#products" className="text-white transition-all duration-300 transform hover:text-orange-300 hover:scale-105">Products</a>
                <a href="#help" className="text-white transition-all duration-300 transform hover:text-orange-300 hover:scale-105">Help</a>
                <a href="#contact" className="text-white transition-all duration-300 transform hover:text-orange-300 hover:scale-105">Contact</a>
                <Link 
                  to="/login" 
                  className="px-8 py-3 font-semibold text-white transition-all duration-300 transform shadow-2xl bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 rounded-xl hover:scale-105 hover:shadow-orange-500/25"
                >
                  Login Portal
                </Link>
              </div>

              {/* Mobile menu button */}
              <div className="lg:hidden">
                <Link 
                  to="/login" 
                  className="px-6 py-2 font-medium text-white rounded-lg bg-gradient-to-r from-orange-500 to-red-500"
                >
                  Login
                </Link>
              </div>
            </div>
          </div>
        </nav>

        {/* Hero Content */}
        <div className="relative z-10 flex items-center justify-center min-h-[80vh] text-center px-4">
          <div className="max-w-6xl mx-auto">
            <div className="animate-fade-in">
              <h1 className="mb-8 text-6xl font-bold leading-tight text-white md:text-8xl">
                Welcome to 
                <span className="block text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-red-500 animate-pulse">
                  Sunrise Technologies
                </span>
              </h1>
              <p className="max-w-4xl mx-auto mb-12 text-2xl leading-relaxed text-gray-200 md:text-3xl">
                Precision Manufacturing Partner for Leading Appliance Brands
                <span className="block mt-4 text-lg text-orange-300">
                  Specializing in Refrigeration, Air Conditioning & Electrical Components
                </span>
              </p>
              
              <div className="flex flex-col items-center justify-center gap-6 sm:flex-row">
                <Link 
                  to="/login" 
                  className="inline-flex items-center px-10 py-5 text-xl font-bold text-white transition-all duration-300 transform shadow-2xl group bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 rounded-2xl hover:scale-105 hover:shadow-orange-500/30"
                >
                  Access SmartMRP System
                  <ArrowRight className="w-6 h-6 ml-3 transition-transform duration-300 group-hover:translate-x-1" />
                </Link>
                
                <a 
                  href="#products" 
                  className="inline-flex items-center px-10 py-5 text-xl font-bold text-white transition-all duration-300 transform border-2 border-white hover:bg-white hover:text-gray-900 rounded-2xl hover:scale-105"
                >
                  View Our Products
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* About Company Section */}
      <section id="about" className="relative py-24 overflow-hidden bg-white">
        <div className="absolute inset-0 opacity-50 bg-gradient-to-br from-orange-50 to-red-50"></div>
        <div className="relative z-10 px-4 mx-auto max-w-7xl sm:px-6 lg:px-8">
          <div className="grid items-center grid-cols-1 gap-16 lg:grid-cols-2">
            <div className="animate-slide-up">
              <div className="flex items-center mb-8">
                <Factory className="w-12 h-12 mr-4 text-orange-500" />
                <h2 className="text-5xl font-bold text-gray-900">About Sunrise Technologies</h2>
              </div>
              <div className="space-y-6 text-lg leading-relaxed text-gray-700">
                <p>
                  <strong>Established in 1995</strong>, Sunrise Technologies has been a trusted manufacturing partner 
                  for leading appliance manufacturers across India and internationally. Our company has grown from a small workshop to a 
                  state-of-the-art manufacturing facility.
                </p>
                <p>
                  We specialize in precision manufacturing of critical components for refrigerators, 
                  air conditioning systems, and electrical appliances. Our expertise lies in producing 
                  high-quality parts that meet the stringent requirements of major brands in the home 
                  appliance industry.
                </p>
                <p>
                  With over <strong>28 years of experience</strong>, we have built lasting partnerships 
                  with leading companies, delivering excellence through innovation, quality, and reliability.
                </p>
              </div>
              
              <div className="grid grid-cols-2 gap-8 mt-12">
                <div className="p-6 text-center transition-shadow duration-300 bg-white shadow-lg rounded-2xl hover:shadow-xl">
                  <div className="mb-2 text-4xl font-bold text-orange-600">28+</div>
                  <div className="text-gray-600">Years Experience</div>
                </div>
                <div className="p-6 text-center transition-shadow duration-300 bg-white shadow-lg rounded-2xl hover:shadow-xl">
                  <div className="mb-2 text-4xl font-bold text-orange-600">500+</div>
                  <div className="text-gray-600">Happy Clients</div>
                </div>
                <div className="p-6 text-center transition-shadow duration-300 bg-white shadow-lg rounded-2xl hover:shadow-xl">
                  <div className="mb-2 text-4xl font-bold text-orange-600">99.8%</div>
                  <div className="text-gray-600">Quality Rate</div>
                </div>
                <div className="p-6 text-center transition-shadow duration-300 bg-white shadow-lg rounded-2xl hover:shadow-xl">
                  <div className="mb-2 text-4xl font-bold text-orange-600">24/7</div>
                  <div className="text-gray-600">Support</div>
                </div>
              </div>
            </div>
            
            <div className="relative">
              <div className="absolute inset-0 transform bg-gradient-to-r from-orange-400 to-red-500 rounded-3xl rotate-3"></div>
              <img 
                src="https://images.pexels.com/photos/1108101/pexels-photo-1108101.jpeg?auto=compress&cs=tinysrgb&w=800&h=600&fit=crop"
                alt="Manufacturing Facility"
                className="relative z-10 object-cover w-full shadow-2xl h-96 rounded-3xl"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Products Section */}
      <section id="products" className="relative py-24 overflow-hidden text-white bg-gray-900">
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900"></div>
        </div>
        
        <div className="relative z-10 px-4 mx-auto max-w-7xl sm:px-6 lg:px-8">
          <div className="mb-20 text-center">
            <h2 className="mb-6 text-5xl font-bold">Our Manufacturing Expertise</h2>
            <p className="max-w-3xl mx-auto text-xl leading-relaxed text-gray-300">
              Precision-engineered components for the world's leading appliance manufacturers
            </p>
          </div>
          
          <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
            {products.map((product, index) => (
              <div
                key={index}
                className="p-8 transition-all duration-500 transform shadow-2xl group bg-gradient-to-br from-gray-800 to-gray-700 rounded-2xl hover:shadow-orange-500/20 hover:scale-105 hover:-translate-y-2"
              >
                <div className="flex items-center mb-6">
                  <div className="p-4 mr-4 transition-transform duration-300 bg-gradient-to-r from-orange-500 to-red-500 rounded-2xl group-hover:scale-110">
                    <product.icon className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-2xl font-bold">{product.name}</h3>
                </div>
                
                <p className="mb-6 leading-relaxed text-gray-300">{product.description}</p>
                
                <div className="space-y-3">
                  <h4 className="font-semibold text-orange-400">Applications:</h4>
                  <div className="flex flex-wrap gap-2">
                    {product.applications.map((app, appIndex) => (
                      <span
                        key={appIndex}
                        className="px-3 py-1 text-sm text-orange-300 border rounded-full bg-orange-500/20 border-orange-500/30"
                      >
                        {app}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* SmartMRP System Section */}
      <section className="py-24 bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="px-4 mx-auto max-w-7xl sm:px-6 lg:px-8">
          <div className="mb-16 text-center">
            <div className="flex items-center justify-center mb-6">
              <Cog className="w-12 h-12 mr-4 text-orange-500 animate-spin" />
              <h2 className="text-5xl font-bold text-gray-900">SmartMRP System</h2>
            </div>
            <p className="max-w-4xl mx-auto text-xl leading-relaxed text-gray-600">
              Our revolutionary Material Requirements Planning system that transforms manufacturing operations 
              with intelligent automation, predictive analytics, and real-time insights.
            </p>
          </div>
          
          <div className="grid grid-cols-1 gap-8 mb-16 md:grid-cols-3">
            {[
              {
                icon: Zap,
                title: 'AI-Powered Planning',
                description: 'Machine learning algorithms predict material requirements with 99.5% accuracy, reducing waste and optimizing inventory levels.',
                color: 'from-yellow-400 to-orange-500'
              },
              {
                icon: Shield,
                title: 'Real-time Monitoring',
                description: 'Live dashboards provide instant insights into stock levels, purchase needs, and production schedules across all facilities.',
                color: 'from-blue-400 to-blue-600'
              },
              {
                icon: Award,
                title: 'Automated Workflows',
                description: 'Streamline purchase orders, supplier management, and inventory tracking with intelligent automation and approval workflows.',
                color: 'from-green-400 to-green-600'
              }
            ].map((feature, index) => (
              <div
                key={index}
                className="p-8 transition-all duration-500 transform bg-white shadow-xl group rounded-2xl hover:shadow-2xl hover:scale-105"
              >
                <div className={`bg-gradient-to-r ${feature.color} w-16 h-16 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300`}>
                  <feature.icon className="w-8 h-8 text-white" />
                </div>
                <h3 className="mb-4 text-xl font-bold text-gray-900">{feature.title}</h3>
                <p className="leading-relaxed text-gray-600">{feature.description}</p>
              </div>
            ))}
          </div>

          <div className="text-center">
            <Link 
              to="/login" 
              className="inline-flex items-center px-10 py-4 text-lg font-bold text-white transition-all duration-300 transform shadow-2xl bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 rounded-xl hover:scale-105"
            >
              Access SmartMRP Dashboard
              <ArrowRight className="w-5 h-5 ml-3" />
            </Link>
          </div>
        </div>
      </section>

      {/* Help & Support Section */}
      <section id="help" className="py-24 bg-white">
        <div className="px-4 mx-auto max-w-7xl sm:px-6 lg:px-8">
          <div className="mb-16 text-center">
            <div className="flex items-center justify-center mb-6">
              <HelpCircle className="w-12 h-12 mr-4 text-orange-500" />
              <h2 className="text-5xl font-bold text-gray-900">Help & Support</h2>
            </div>
            <p className="max-w-3xl mx-auto text-xl text-gray-600">
              Get the assistance you need to maximize your manufacturing efficiency
            </p>
          </div>
          
          <div className="grid grid-cols-1 gap-8 mb-16 md:grid-cols-2 lg:grid-cols-4">
            {[
              { icon: HelpCircle, title: 'User Guides', description: 'Comprehensive documentation and video tutorials' },
              { icon: Users, title: 'Live Chat', description: '24/7 instant support from our expert team' },
              { icon: Phone, title: 'Phone Support', description: 'Direct technical assistance hotline' },
              { icon: Wrench, title: 'Training', description: 'Personalized onboarding and training sessions' }
            ].map((item, index) => (
              <div
                key={index}
                className="text-center transition-transform duration-300 group hover:scale-105"
              >
                <div className="flex items-center justify-center w-20 h-20 mx-auto mb-4 transition-colors duration-300 rounded-full bg-gradient-to-r from-orange-100 to-red-100 group-hover:from-orange-200 group-hover:to-red-200">
                  <item.icon className="w-10 h-10 text-orange-600" />
                </div>
                <h3 className="mb-2 text-lg font-semibold text-gray-900">{item.title}</h3>
                <p className="text-gray-600">{item.description}</p>
              </div>
            ))}
          </div>

          {/* Query Form */}
          <div className="max-w-4xl mx-auto">
            <div className="p-8 shadow-xl bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl">
              <div className="mb-8 text-center">
                <h3 className="mb-4 text-3xl font-bold text-gray-900">Have Questions? We're Here to Help!</h3>
                <p className="text-gray-600">Send us your queries and our expert team will get back to you within 24 hours.</p>
              </div>

              {isSubmitted ? (
                <div className="py-12 text-center">
                  <CheckCircle className="w-16 h-16 mx-auto mb-4 text-green-500 animate-bounce" />
                  <h4 className="mb-2 text-2xl font-bold text-green-600">Thank You!</h4>
                  <p className="text-gray-600">Your query has been submitted successfully. We'll get back to you soon.</p>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-6 md:grid-cols-2">
                  <div>
                    <label className="block mb-2 text-sm font-semibold text-gray-700">Full Name *</label>
                    <input
                      type="text"
                      name="name"
                      required
                      value={formData.name}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 transition-colors duration-200 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                      placeholder="Enter your full name"
                    />
                  </div>

                  <div>
                    <label className="block mb-2 text-sm font-semibold text-gray-700">Email Address *</label>
                    <input
                      type="email"
                      name="email"
                      required
                      value={formData.email}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 transition-colors duration-200 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                      placeholder="Enter your email"
                    />
                  </div>

                  <div>
                    <label className="block mb-2 text-sm font-semibold text-gray-700">Phone Number</label>
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 transition-colors duration-200 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                      placeholder="Enter your phone number"
                    />
                  </div>

                  <div>
                    <label className="block mb-2 text-sm font-semibold text-gray-700">Company Name</label>
                    <input
                      type="text"
                      name="company"
                      value={formData.company}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 transition-colors duration-200 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                      placeholder="Enter your company name"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block mb-2 text-sm font-semibold text-gray-700">Subject *</label>
                    <select
                      name="subject"
                      required
                      value={formData.subject}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 transition-colors duration-200 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                    >
                      <option value="">Select a subject</option>
                      <option value="smartmrp">SmartMRP System Inquiry</option>
                      <option value="manufacturing">Manufacturing Services</option>
                      <option value="partnership">Partnership Opportunities</option>
                      <option value="technical">Technical Support</option>
                      <option value="other">Other</option>
                    </select>
                  </div>

                  <div className="md:col-span-2">
                    <label className="block mb-2 text-sm font-semibold text-gray-700">Message *</label>
                    <textarea
                      name="message"
                      required
                      rows={5}
                      value={formData.message}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 transition-colors duration-200 border border-gray-300 rounded-lg outline-none resize-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                      placeholder="Please describe your query in detail..."
                    />
                  </div>

                  <div className="text-center md:col-span-2">
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="inline-flex items-center px-8 py-4 text-lg font-bold text-white transition-all duration-300 transform shadow-xl bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 rounded-xl hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                    >
                      {isSubmitting ? (
                        <>
                          <div className="w-5 h-5 mr-3 border-b-2 border-white rounded-full animate-spin"></div>
                          Sending...
                        </>
                      ) : (
                        <>
                          <Send className="w-5 h-5 mr-3" />
                          Send Query
                        </>
                      )}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section id="contact" className="relative py-24 overflow-hidden text-white bg-gray-900">
        <div className="absolute inset-0 bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900"></div>
        
        <div className="relative z-10 px-4 mx-auto max-w-7xl sm:px-6 lg:px-8">
          <div className="mb-16 text-center">
            <div className="flex items-center justify-center mb-6">
              <Mail className="w-12 h-12 mr-4 text-orange-400" />
              <h2 className="text-5xl font-bold">Get In Touch</h2>
            </div>
            <p className="max-w-3xl mx-auto text-xl text-gray-300">
              Ready to transform your manufacturing operations? Contact our experts today.
            </p>
          </div>
          
          <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
            <div className="text-center group">
              <div className="flex items-center justify-center w-20 h-20 mx-auto mb-6 transition-colors duration-300 rounded-full bg-orange-500/20 group-hover:bg-orange-500/30">
                <Phone className="w-10 h-10 text-orange-400" />
              </div>
              <h3 className="mb-4 text-xl font-semibold">Phone</h3>
              <p className="mb-2 text-gray-300">+91 80 2345 6789</p>
              <p className="text-gray-300">+91 80 2345 6790</p>
            </div>
            
            <div className="text-center group">
              <div className="flex items-center justify-center w-20 h-20 mx-auto mb-6 transition-colors duration-300 rounded-full bg-orange-500/20 group-hover:bg-orange-500/30">
                <Mail className="w-10 h-10 text-orange-400" />
              </div>
              <h3 className="mb-4 text-xl font-semibold">Email</h3>
              <p className="mb-2 text-gray-300">info@sunrisetech.in</p>
              <p className="text-gray-300">support@sunrisetech.in</p>
            </div>
            
            <div className="text-center group">
              <div className="flex items-center justify-center w-20 h-20 mx-auto mb-6 transition-colors duration-300 rounded-full bg-orange-500/20 group-hover:bg-orange-500/30">
                <MapPin className="w-10 h-10 text-orange-400" />
              </div>
              <h3 className="mb-4 text-xl font-semibold">Address</h3>
              <p className="mb-2 text-gray-300">Industrial Area, Phase II</p>
              <p className="text-gray-300">Bangalore, Karnataka 560058</p>
            </div>
          </div>

          <div className="mt-16 text-center">
            <Link 
              to="/login" 
              className="inline-flex items-center px-10 py-4 text-lg font-bold text-white transition-all duration-300 transform shadow-2xl bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 rounded-xl hover:scale-105"
            >
              Access SmartMRP System
              <ArrowRight className="w-5 h-5 ml-3" />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};

export default WelcomePage;