import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';

const AboutUs = () => {
  return (
    <div id="about" className="bg-gradient-to-br from-gray-800 via-gray-900 to-gray-800 py-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header Section */}
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-white mb-4">About Lost & Found Hub</h2>
          <div className="w-24 h-1 bg-gradient-to-r from-blue-400 via-teal-400 to-indigo-400 mx-auto rounded-full"></div>
        </div>
        
        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Left Side - Image */}
          <div className="relative">
            <div className="absolute -inset-4 bg-gradient-to-r from-blue-400 via-teal-400 to-indigo-400 rounded-2xl opacity-20 blur-xl"></div>
            <img 
              src="https://img.freepik.com/free-vector/lost-found-concept-illustration_114360-1108.jpg" 
              alt="Lost and Found Illustration" 
              className="relative rounded-2xl shadow-2xl transform hover:scale-105 transition duration-300"
            />
          </div>
          
          {/* Right Side - Content */}
          <div className="space-y-8">
            <div className="bg-gray-800/80 backdrop-blur-sm p-8 rounded-2xl shadow-lg border border-gray-700">
              <h3 className="text-2xl font-bold text-white mb-4">Our Mission</h3>
              <p className="text-gray-300 leading-relaxed mb-4">
                At Lost & Found Hub, we're on a mission to revolutionize how lost items are reunited with their owners. We believe that every lost item has a story and a rightful owner waiting to be reunited.
              </p>
              <p className="text-gray-300 leading-relaxed mb-4">
                Our platform combines cutting-edge technology with community power to create a seamless experience for reporting and finding lost items. 
              </p>
             
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="bg-gray-800/80 backdrop-blur-sm p-6 rounded-xl shadow-lg border border-gray-700">
                <div className="text-4xl mb-4">🔍</div>
                <h4 className="font-semibold text-white mb-2">Smart Search</h4>
                <p className="text-sm text-gray-300">Advanced search capabilities with AI-powered matching</p>
              </div>
              <div className="bg-gray-800/80 backdrop-blur-sm p-6 rounded-xl shadow-lg border border-gray-700">
                <div className="text-4xl mb-4">🤝</div>
                <h4 className="font-semibold text-white mb-2">Community</h4>
                <p className="text-sm text-gray-300">Active user community helping each other</p>
              </div>
            </div>

            <div className="flex space-x-4">
              {/* Buttons removed as per request */}
            </div>
          </div>
        </div>

        {/* Stats Section */}
        <div className="mt-10 grid grid-cols-2 md:grid-cols-4 gap-8">
          {[
            { value: '10K+', label: 'Items Found' },
            { value: '5K+', label: 'Happy Users' },
            { value: '95%', label: 'Success Rate' },
            { value: '24/7', label: 'Support' }
          ].map((stat, idx) => (
            <motion.div
              key={stat.label}
              className="bg-gray-800/80 backdrop-blur-sm p-6 rounded-xl shadow-lg text-center border border-gray-700"
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: idx * 0.2 }}
            >
              <div className="text-3xl font-bold bg-gradient-to-r from-blue-400 via-teal-400 to-indigo-400 bg-clip-text text-transparent mb-2">{stat.value}</div>
              <div className="text-gray-300">{stat.label}</div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AboutUs;
