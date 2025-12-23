import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Login = ({ embedded = false, onSuccess }) => {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });

  const [errors, setErrors] = useState({
    email: '',
    password: '',
    general: ''
  });
  const [showPassword, setShowPassword] = useState(false);

  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();

  const from = location.state?.from?.pathname || '/';

  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return 'Please enter a valid email address';
    }
    return '';
  };

  const validatePassword = (password) => {
    if (password.length < 8) {
      return 'Password must be at least 8 characters long';
    }
    if (!/[A-Z]/.test(password)) {
      return 'Password must contain at least one uppercase letter';
    }
    if (!/[0-9]/.test(password)) {
      return 'Password must contain at least one number';
    }
    if (!/[!@#$%^&*]/.test(password)) {
      return 'Password must contain at least one special character (!@#$%^&*)';
    }
    return '';
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    setErrors(prev => ({
      ...prev,
      [name]: ''
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const emailError = validateEmail(formData.email);
    const passwordError = validatePassword(formData.password);

    setErrors({
      email: emailError,
      password: passwordError,
      general: ''
    });

    if (!emailError && !passwordError) {
      try {
        await login(formData.email, formData.password);
        if (onSuccess) {
          onSuccess();
        }
        navigate(from, { replace: true });
      } catch (error) {
        setErrors(prev => ({ ...prev, general: 'Failed to sign in.' }));
      }
    }
  };

  const Card = (
        <div className={`bg-white/10 backdrop-blur border border-gray-700 rounded-2xl shadow-2xl anim-fade-in-up hover-lift ${embedded ? 'p-4 space-y-4' : 'p-10 space-y-8'}`}>
        <div>
            <h2 className={`mt-2 text-center font-extrabold text-white ${embedded ? 'text-xl' : 'text-3xl'}`}>
            Log in to your account
          </h2>
            <p className="mt-2 text-center text-xs text-gray-400">
            Or{' '}
            <Link to="/signup" className="font-medium text-blue-300 hover:text-blue-200">
              create a new account
            </Link>
          </p>
        </div>
          <form className={`${embedded ? 'mt-4 space-y-4' : 'mt-8 space-y-6'}`} onSubmit={handleSubmit}>
          {errors.general && (
              <div className="bg-red-100/80 border border-red-400 text-red-800 px-3 py-2 rounded relative text-sm" role="alert">
              <span className="block sm:inline">{errors.general}</span>
            </div>
          )}
          <div className="rounded-md shadow-sm space-y-4">
            <div>
              <label htmlFor="email" className="sr-only">
                Email address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="username"
                required
                  className={`appearance-none rounded-lg relative block w-full ${embedded ? 'px-3 py-2' : 'px-3 py-3'} border ${
                  errors.email ? 'border-red-500' : 'border-gray-300'
                } placeholder-gray-400 text-gray-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm hover-lift`}
                placeholder="Email address"
                value={formData.email}
                onChange={handleChange}
              />
              {errors.email && (
                <p className="mt-1 text-sm text-red-500">{errors.email}</p>
              )}
            </div>
            <div>
              <label htmlFor="password" className="sr-only">
                Password
              </label>
              <div className="relative">
                <input
                id="password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                required
                  className={`appearance-none rounded-lg relative block w-full ${embedded ? 'px-3 py-2' : 'px-3 py-3'} border ${
                  errors.password ? 'border-red-500' : 'border-gray-300'
                } placeholder-gray-400 text-gray-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm hover-lift`}
                placeholder="Password"
                value={formData.password}
                onChange={handleChange}
              />
                <button
                  type="button"
                  onClick={() => setShowPassword(v => !v)}
                    className="absolute inset-y-0 right-2 flex items-center text-gray-500 hover:text-gray-700"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M3 3l18 18"/>
                      <path d="M10.58 10.58A2 2 0 0012 14a2 2 0 001.42-.58M9.88 9.88a4 4 0 015.66 5.66"/>
                      <path d="M2 12s4-7 10-7c1.99 0 3.78.66 5.25 1.69M22 12s-4 7-10 7c-1.61 0-3.11-.42-4.46-1.12"/>
                    </svg>
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7S1 12 1 12z"/>
                      <circle cx="12" cy="12" r="3"/>
                    </svg>
                  )}
                </button>
              </div>
              {errors.password && (
                <p className="mt-1 text-sm text-red-500">{errors.password}</p>
              )}
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <input
                id="remember-me"
                name="remember-me"
                type="checkbox"
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
                 <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-900">
                Remember me
              </label>
            </div>

            <div className="text-sm">
              <Link to="/forgot" className="font-medium text-blue-300 hover:text-blue-200">
                Forgot your password?
              </Link>
            </div>
          </div>

          <div>
              <button
              type="submit"
                className={`group relative w-full flex justify-center ${embedded ? 'py-2' : 'py-3'} px-4 border border-white/20 text-sm font-medium rounded-lg text-white bg-gradient-to-r from-blue-600 to-teal-500 hover:from-blue-500 hover:to-teal-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200 hover-lift`}
            >
              Log in
            </button>
          </div>
        </form>
        </div>
  );

  if (embedded) {
    return (
      <div className="max-w-md w-full">
        {Card}
      </div>
    );
  }

  return (
    <div className="min-h-screen relative overflow-hidden flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-gray-900 via-blue-950 to-gray-900 anim-fade-in-up">
      <div className="absolute -top-32 -left-24 w-96 h-96 bg-blue-600 rounded-full blur-3xl opacity-20 animate-pulse"></div>
      <div className="absolute -bottom-32 -right-24 w-96 h-96 bg-teal-500 rounded-full blur-3xl opacity-20 animate-pulse"></div>
      <div className="relative max-w-md w-full">
        <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-500 via-teal-400 to-indigo-500 rounded-2xl opacity-60 animate-pulse anim-pulse-glow"></div>
        <div className="relative">
          {Card}
        </div>
      </div>
    </div>
  );
};

export default Login; 