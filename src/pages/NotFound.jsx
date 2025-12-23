import React from 'react';
import { Link } from 'react-router-dom';

const NotFound = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-yellow-100 via-yellow-200 to-yellow-300">
      <div className="bg-white p-10 rounded-2xl shadow-2xl max-w-md w-full text-center">
        <h2 className="text-3xl font-bold text-yellow-700 mb-4">404 - Page Not Found</h2>
        <p className="text-lg text-gray-700 mb-6">The page you're looking for doesn't exist.</p>
        <Link
          to="/"
          className="inline-block bg-yellow-500 text-white px-6 py-2 rounded-lg hover:bg-yellow-600 transition-colors"
        >
          Go Home
        </Link>
      </div>
    </div>
  );
};

export default NotFound; 