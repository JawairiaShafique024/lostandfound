import React from 'react';

const Error = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-100 via-red-200 to-red-300">
      <div className="bg-white p-10 rounded-2xl shadow-2xl max-w-md w-full text-center">
        <h2 className="text-3xl font-bold text-red-700 mb-4">Error</h2>
        <p className="text-lg text-gray-700">Something went wrong. Please try again later.</p>
      </div>
    </div>
  );
};

export default Error; 