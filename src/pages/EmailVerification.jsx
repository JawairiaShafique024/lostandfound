import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import api from '../services/api';

const EmailVerification = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState('verifying'); // verifying, success, error, expired
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [resendLoading, setResendLoading] = useState(false);
  const [email, setEmail] = useState('');

  useEffect(() => {
    const token = searchParams.get('token');
    if (token) {
      verifyEmail(token);
    } else {
      setStatus('error');
      setMessage('No verification token provided');
      setLoading(false);
    }
  }, [searchParams]);

  const verifyEmail = async (token) => {
    try {
      setLoading(true);
      const response = await api.verifyEmail(token);
      
      if (response.verified) {
        setStatus('success');
        setMessage(response.message);
        
        // Store user data and token for auto-login
        if (response.token && response.user) {
          localStorage.setItem('auth_token', response.token);
          localStorage.setItem('auth_user', JSON.stringify(response.user));
        }
        
        // Redirect to home after 3 seconds
        setTimeout(() => {
          navigate('/');
        }, 3000);
      }
    } catch (error) {
      console.error('Verification error:', error);
      setStatus('error');
      setMessage(error.message || 'Verification failed');
    } finally {
      setLoading(false);
    }
  };

  const handleResendVerification = async () => {
    if (!email.trim()) {
      alert('Please enter your email address');
      return;
    }

    try {
      setResendLoading(true);
      const response = await api.resendVerification(email);
      
      if (response.email_sent) {
        alert('Verification email sent successfully! Please check your inbox.');
      } else {
        alert('Failed to send verification email. Please try again later.');
      }
    } catch (error) {
      console.error('Resend error:', error);
      alert(error.message || 'Failed to resend verification email');
    } finally {
      setResendLoading(false);
    }
  };

  const getStatusIcon = () => {
    switch (status) {
      case 'verifying':
        return '⏳';
      case 'success':
        return '✅';
      case 'error':
        return '❌';
      case 'expired':
        return '⏰';
      default:
        return '❓';
    }
  };

  const getStatusColor = () => {
    switch (status) {
      case 'verifying':
        return 'text-blue-600';
      case 'success':
        return 'text-green-600';
      case 'error':
        return 'text-red-600';
      case 'expired':
        return 'text-orange-600';
      default:
        return 'text-gray-600';
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-teal-50 to-sky-50 py-12 px-4 sm:px-6 lg:px-8">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="max-w-md w-full space-y-8"
      >
        <div className="bg-white/80 backdrop-blur-sm border border-gray-200 rounded-2xl shadow-2xl p-8">
          <div className="text-center">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
              className="text-6xl mb-6"
            >
              {getStatusIcon()}
            </motion.div>
            
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className={`text-2xl font-bold mb-4 ${getStatusColor()}`}
            >
              {status === 'verifying' && 'Verifying Your Email...'}
              {status === 'success' && 'Email Verified Successfully!'}
              {status === 'error' && 'Verification Failed'}
              {status === 'expired' && 'Verification Expired'}
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="text-gray-600 mb-6"
            >
              {message}
            </motion.p>

            {status === 'verifying' && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
                className="flex justify-center"
              >
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-500"></div>
              </motion.div>
            )}

            {status === 'success' && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="space-y-4"
              >
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <p className="text-green-800 text-sm">
                    🎉 Your account is now active! You'll be redirected to the home page shortly.
                  </p>
                </div>
                <button
                  onClick={() => navigate('/')}
                  className="w-full bg-gradient-to-r from-teal-500 to-sky-500 text-white py-3 px-6 rounded-lg font-semibold hover:shadow-lg transition-all duration-200"
                >
                  Go to Home Page
                </button>
              </motion.div>
            )}

            {(status === 'error' || status === 'expired') && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="space-y-4"
              >
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <p className="text-red-800 text-sm">
                    {status === 'error' 
                      ? 'The verification link is invalid or has already been used.'
                      : 'The verification link has expired. Please request a new one.'
                    }
                  </p>
                </div>

                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Enter your email to resend verification:
                    </label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="your@email.com"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                    />
                  </div>
                  
                  <button
                    onClick={handleResendVerification}
                    disabled={resendLoading}
                    className="w-full bg-gradient-to-r from-teal-500 to-sky-500 text-white py-3 px-6 rounded-lg font-semibold hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                  >
                    {resendLoading ? 'Sending...' : 'Resend Verification Email'}
                  </button>
                </div>

                <div className="text-center">
                  <button
                    onClick={() => navigate('/login')}
                    className="text-teal-600 hover:text-teal-800 font-medium"
                  >
                    Back to Login
                  </button>
                </div>
              </motion.div>
            )}
          </div>
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="text-center text-sm text-gray-500"
        >
          <p>Lost & Found Hub - Connecting People, Reuniting Items</p>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default EmailVerification;
