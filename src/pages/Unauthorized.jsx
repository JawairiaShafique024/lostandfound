import React from 'react';

const Unauthorized = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-yellow-100 via-yellow-200 to-yellow-300">
      <div className="bg-white p-10 rounded-2xl shadow-2xl max-w-md w-full text-center">
        <h2 className="text-3xl font-bold text-yellow-700 mb-4">Unauthorized</h2>
        <p className="text-lg text-gray-700">You don't have permission to access this page.</p>
      </div>
    </div>
  );
};

export default Unauthorized; 