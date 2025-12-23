import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';

const Success = () => {
  const location = useLocation();
  const itemData = location.state?.itemData;
  const [showDetails, setShowDetails] = useState(false);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-800 via-gray-900 to-gray-800 flex items-center justify-center px-4 py-8">
      <motion.div 
        className="bg-white rounded-2xl shadow-2xl p-6 max-w-xl w-full"
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
      >
        <motion.div
          className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4"
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
        >
          <svg className="w-8 h-8 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
          </svg>
        </motion.div>

        <motion.h2 
          className="text-2xl font-bold text-gray-800 mb-3 text-center"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          Report Submitted Successfully!
        </motion.h2>

        {itemData && (
          <motion.div
            className="mt-4 bg-gray-50 rounded-xl p-4"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            {/* Image and Item Name Section */}
            <div className="text-center mb-4">
              {itemData.image && (
                <div className="mb-3">
                  <div className="relative w-full h-48 rounded-xl overflow-hidden">
                    <img 
                      src={typeof itemData.image === 'string' ? itemData.image : URL.createObjectURL(itemData.image)} 
                      alt="Item" 
                      className="w-full h-full object-cover"
                    />
                  </div>
                </div>
              )}
              <h3 className="text-xl font-bold text-gray-800">{itemData.itemName}</h3>
            </div>

            {/* View Details Button */}
            <div className="text-center mb-4">
              <button
                onClick={() => setShowDetails(!showDetails)}
                className="px-5 py-2 bg-blue-500 text-white rounded-xl hover:bg-blue-600 transition-colors font-medium"
              >
                {showDetails ? 'Hide Details' : 'View Details'}
              </button>
            </div>

            {/* Details Section */}
            <AnimatePresence>
              {showDetails && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.3 }}
                  className="overflow-hidden"
                >
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-3 border-t border-gray-200">
                    <div>
                      <p className="text-sm text-gray-600">Posted By</p>
                      <p className="font-medium text-gray-800">{itemData.postedBy}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Date</p>
                      <p className="font-medium text-gray-800">{new Date(itemData.date).toLocaleDateString()}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Location</p>
                      <p className="font-medium text-gray-800">{itemData.address}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Contact</p>
                      <p className="font-medium text-gray-800">{itemData.contact || 'Not provided'}</p>
                    </div>
                    <div className="col-span-2">
                      <p className="text-sm text-gray-600">Description</p>
                      <p className="font-medium text-gray-800">{itemData.description}</p>
                    </div>
                    {itemData.additionalInfo && (
                      <div className="col-span-2">
                        <p className="text-sm text-gray-600">Additional Information</p>
                        <p className="font-medium text-gray-800">{itemData.additionalInfo}</p>
                      </div>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}

        <motion.p 
          className="text-gray-600 mb-4 text-center mt-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          Thank you for your submission. We'll notify you when there's a match or update.
        </motion.p>

        <motion.div
          className="flex flex-col sm:flex-row justify-center gap-3"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
        >
          <Link
            to="/"
            className="px-5 py-2 bg-gradient-to-r from-blue-500 to-blue-700 text-white font-bold rounded-xl
                     hover:from-blue-600 hover:to-blue-800 transform hover:scale-105 transition-all duration-200
                     text-center"
          >
            Return to Home
          </Link>
          <Link
            to="/report-options"
            className="px-5 py-2 border-2 border-blue-600 text-blue-600 font-bold rounded-xl
                     hover:bg-blue-50 transform hover:scale-105 transition-all duration-200
                     text-center"
          >
            Report Another Item
          </Link>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default Success; 