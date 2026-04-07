import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Sun, Eye, EyeOff, User, Lock, AlertCircle, Shield, Users } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [selectedRole, setSelectedRole] = useState<'admin' | 'staff'>('admin');
  
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const success = await login(email, password);
      if (success) {
        navigate('/dashboard');
      } else {
        setError('Invalid credentials. Please check your email and password.');
      }
    } catch (err) {
      setError('An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const fillDemoCredentials = (role: 'admin' | 'staff') => {
    setSelectedRole(role);
    if (role === 'admin') {
      setEmail('admin@sunrise.com');
      setPassword('admin123');
    } else {
      setEmail('staff@sunrise.com');
      setPassword('staff123');
    }
  };

  return (
    <div className="relative flex items-center justify-center min-h-screen">
      {/* Background */}
      <div 
        className="absolute inset-0 bg-center bg-no-repeat bg-cover"
        style={{
          backgroundImage: `linear-gradient(rgba(0, 0, 0, 0.7), rgba(0, 0, 0, 0.5)), url('https://images.pexels.com/photos/1108101/pexels-photo-1108101.jpeg?auto=compress&cs=tinysrgb&w=1920&h=1080&fit=crop')`
        }}
      />

      {/* Animated particles */}
      <div className="absolute inset-0 overflow-hidden">
        {[...Array(15)].map((_, i) => (
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

      {/* Back to Home */}
      <Link 
        to="/" 
        className="absolute z-20 flex items-center text-white transition-all duration-300 transform top-6 left-6 hover:text-orange-300 hover:scale-105"
      >
        <Sun className="w-6 h-6 mr-2" />
        <span className="font-semibold">← Back to Home</span>
      </Link>

      {/* Login Container */}
      <div className="relative z-10 w-full max-w-6xl px-6 mx-auto">
        <div className="grid items-center grid-cols-1 gap-8 lg:grid-cols-2">
          
          {/* Left Side - Role Selection */}
          <div className="text-center lg:text-left">
            <div className="mb-8">
              <h1 className="mb-4 text-5xl font-bold text-white">
                SmartMRP
                <span className="block text-orange-400">Login Portal</span>
              </h1>
              <p className="text-xl text-gray-300">
                Choose your access level to continue
              </p>
            </div>

            <div className="space-y-4">
              <div 
                onClick={() => fillDemoCredentials('admin')}
                className={`cursor-pointer p-6 rounded-2xl border-2 transition-all duration-300 transform hover:scale-105 ${
                  selectedRole === 'admin' 
                    ? 'border-orange-500 bg-orange-500/20 shadow-2xl shadow-orange-500/20' 
                    : 'border-white/30 bg-white/10 hover:border-orange-400'
                }`}
              >
                <div className="flex items-center space-x-4">
                  <div className={`p-3 rounded-xl ${
                    selectedRole === 'admin' ? 'bg-orange-500' : 'bg-white/20'
                  }`}>
                    <Shield className="w-8 h-8 text-white" />
                  </div>
                  <div className="text-left">
                    <h3 className="text-xl font-bold text-white">Administrator</h3>
                    <p className="text-gray-300">Full system access & management</p>
                    <div className="mt-1 text-sm text-orange-300">
                      • Complete dashboard access
                      • User management
                      • System configuration
                      • All reports & analytics
                    </div>
                  </div>
                </div>
              </div>

              <div 
                onClick={() => fillDemoCredentials('staff')}
                className={`cursor-pointer p-6 rounded-2xl border-2 transition-all duration-300 transform hover:scale-105 ${
                  selectedRole === 'staff' 
                    ? 'border-blue-500 bg-blue-500/20 shadow-2xl shadow-blue-500/20' 
                    : 'border-white/30 bg-white/10 hover:border-blue-400'
                }`}
              >
                <div className="flex items-center space-x-4">
                  <div className={`p-3 rounded-xl ${
                    selectedRole === 'staff' ? 'bg-blue-500' : 'bg-white/20'
                  }`}>
                    <Users className="w-8 h-8 text-white" />
                  </div>
                  <div className="text-left">
                    <h3 className="text-xl font-bold text-white">Staff Member</h3>
                    <p className="text-gray-300">Operational access & updates</p>
                    <div className="mt-1 text-sm text-blue-300">
                      • Stock management
                      • Purchase orders
                      • Inventory updates
                      • Basic reporting
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Side - Login Form */}
          <div className="p-8 border shadow-2xl bg-white/95 backdrop-blur-lg rounded-3xl border-white/20">
            <div className="mb-8 text-center">
              <div className="flex items-center justify-center mb-4">
                <Sun className="w-12 h-12 text-orange-500 animate-pulse" />
              </div>
              <h2 className="mb-2 text-3xl font-bold text-gray-900">Welcome Back</h2>
              <p className="text-gray-600">Sign in to access your dashboard</p>
            </div>

            {error && (
              <div className="flex items-center p-4 mb-6 border border-red-200 bg-red-50 rounded-xl animate-shake">
                <AlertCircle className="w-5 h-5 mr-3 text-red-500" />
                <span className="text-red-700">{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label htmlFor="email" className="block mb-2 text-sm font-semibold text-gray-700">
                  Email Address
                </label>
                <div className="relative">
                  <User className="absolute w-5 h-5 text-gray-400 transform -translate-y-1/2 left-3 top-1/2" />
                  <input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                    className="w-full py-4 pl-10 pr-4 text-lg transition-all duration-200 border border-gray-300 outline-none rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                    placeholder="Enter your email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
              </div>

              <div>
                <label htmlFor="password" className="block mb-2 text-sm font-semibold text-gray-700">
                  Password
                </label>
                <div className="relative">
                  <Lock className="absolute w-5 h-5 text-gray-400 transform -translate-y-1/2 left-3 top-1/2" />
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="current-password"
                    required
                    className="w-full py-4 pl-10 pr-12 text-lg transition-all duration-200 border border-gray-300 outline-none rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                  <button
                    type="button"
                    className="absolute text-gray-400 transition-colors duration-200 transform -translate-y-1/2 right-3 top-1/2 hover:text-gray-600"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white py-4 px-4 rounded-xl font-bold text-lg transition-all duration-300 transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none shadow-xl hover:shadow-2xl"
              >
                {loading ? (
                  <div className="flex items-center justify-center">
                    <div className="w-6 h-6 mr-3 border-b-2 border-white rounded-full animate-spin"></div>
                    Signing In...
                  </div>
                ) : (
                  'Sign In to Dashboard'
                )}
              </button>
            </form>

          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
