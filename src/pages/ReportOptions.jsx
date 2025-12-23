import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const ReportOptions = () => {
  const navigate = useNavigate();
  const [showPrompt, setShowPrompt] = useState(false);
  const [targetRoute, setTargetRoute] = useState(null);

  const handleNavigateWithPrompt = (route) => {
    setTargetRoute(route);
    setShowPrompt(true);
  };

  const handlePromptChoice = (enableLocation) => {
    setShowPrompt(false);
    if (enableLocation) {
      if (navigator && navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          () => {
            navigate(targetRoute || '/');
          },
          () => {
            navigate(targetRoute || '/');
          },
          { enableHighAccuracy: true, timeout: 8000, maximumAge: 0 }
        );
        return;
      }
    }
    navigate(targetRoute || '/');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-800 via-gray-900 to-gray-800 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-white mb-4">What would you like to report?</h1>
          <p className="text-xl text-gray-300">Choose an option below to proceed with your report</p>
        </div>

        <div className="grid md:grid-cols-2 gap-40 max-w-4xl mx-auto relative items-center">
          {/* Lost Item Card */}
          <div 
            className="bg-white rounded-2xl shadow-lg overflow-hidden transform transition-all duration-300 hover:scale-105 hover:-translate-y-1 hover:shadow-2xl hover:bg-gray-100 cursor-pointer"
            onClick={() => handleNavigateWithPrompt('/report-lost')}
          >
            <div className="p-8">
              <div className="w-24 h-24 bg-red-600 rounded-full flex items-center justify-center mb-6 shadow-lg">
                {/* Bold search icon for lost */}
                <svg className="w-16 h-16 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="2" fill="none"/>
                  <line x1="16.65" y1="16.65" x2="21" y2="21" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-red-600 mb-4">Report A Lost Item</h2>
              <p className="text-gray-600 mb-6">Lost something? Report it here and let our community help you find it.</p>
              <div className="inline-flex items-center text-red-600">
                <span className="font-medium">Get Started</span>
                <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </div>
            </div>
          </div>

          {/* Found Item Card */}
          <div 
            className="bg-white rounded-2xl shadow-lg overflow-hidden transform transition-all duration-300 hover:scale-105 hover:-translate-y-1 hover:shadow-2xl hover:bg-gray-100 cursor-pointer"
            onClick={() => handleNavigateWithPrompt('/report-found')}
          >
            <div className="p-8">
              <div className="w-24 h-24 bg-green-600 rounded-full flex items-center justify-center mb-6 shadow-lg">
                {/* Bold checkmark badge icon for found */}
                <svg className="w-16 h-16 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" fill="none"/>
                  <path d="M8 12l2 2l4-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-green-600 mb-4">Report A Found Item</h2>
              <p className="text-gray-600 mb-6">Found something? Help us reunite it with its rightful owner.</p>
              <div className="inline-flex items-center text-green-600">
                <span className="font-medium">Get Started</span>
                <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </div>
            </div>
          </div>
          {/* 3 white dots in the center of the gap, only on md and up */}
          <div className="hidden md:flex absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-10 text-2xl space-x-2 select-none pointer-events-none">
            <span className="text-white">●</span>
            <span className="text-white">●</span>
            <span className="text-white">●</span>
          </div>
        </div>
      </div>

      {showPrompt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full mx-4 p-6 transform transition-all duration-200 ease-out scale-100 opacity-100">
            <div className="flex items-center mb-3">
              <span className="text-2xl mr-2">📍</span>
              <h3 className="text-xl font-semibold text-gray-900">Enable Location?</h3>
            </div>
            <p className="text-gray-700 mb-5">
              If you are at the same place where the item was lost or found, please turn on your location for better accuracy. If you are far from that place, keep location off and set the correct spot manually in the form.
            </p>
            <div className="flex items-center justify-end space-x-3">
              <button
                className="px-4 py-2 rounded-lg bg-gray-100 text-gray-800 hover:bg-gray-200"
                onClick={() => handlePromptChoice(false)}
              >
                🚫 Keep Off
              </button>
              <button
                className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700"
                onClick={() => handlePromptChoice(true)}
              >
                🔓 Turn On
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReportOptions; 