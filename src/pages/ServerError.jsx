import React from 'react';
import { Link } from 'react-router-dom';

const ServerError = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-100 via-red-200 to-red-300">
      <div className="bg-white p-10 rounded-2xl shadow-2xl max-w-md w-full text-center">
        <h2 className="text-3xl font-bold text-red-700 mb-4">500 - Server Error</h2>
        <p className="text-lg text-gray-700 mb-6">Something went wrong on our end. Please try again later.</p>
        <Link
          to="/"
          className="inline-block bg-red-500 text-white px-6 py-2 rounded-lg hover:bg-red-600 transition-colors"
        >
          Go Home
        </Link>
      </div>
    </div>
  );
};

export default ServerError; 