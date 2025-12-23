import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';

const steps = [
  {
    icon: '📢',
    title: 'Report Lost/Found Item',
    desc: 'Easily submit details and photos of lost or found items.'
  },
  {
    icon: '🤖',
    title: 'Smart AI Matching',
    desc: 'Our AI matches lost and found reports for quick results.'
  },
  {
    icon: '🔒',
    title: 'Secure Communication',
    desc: 'Chat safely with finders/owners without sharing personal info.'
  },
  {
    icon: '🎉',
    title: 'Reunite & Celebrate',
    desc: 'Get your item back and celebrate the reunion!'
  }
];

const HeroSection = () => {
  const navigate = useNavigate();
  return (
    <>
      <div className="relative py-20 px-6 flex items-center justify-center min-h-[700px] overflow-hidden bg-gray-900">
        {/* Background Image with 50% visibility */}
        <div className="absolute inset-0 bg-[url('/hero-bg.jpg')] bg-cover bg-center bg-no-repeat opacity-10 z-0"></div>
        <div className="max-w-5xl mx-auto text-center relative z-10">
          <motion.h1
            className="text-white text-4xl font-bold mb-8 md:text-5xl lg:text-6xl leading-tight"
            initial={{ opacity: 0, y: -40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            Lost Something? Found Something?<br />
            <span className="text-blue-400">Let's Reconnect Them!</span>
          </motion.h1>
      
          <motion.p
            className="text-white text-xl mb-10 max-w-3xl mx-auto leading-relaxed"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.3 }}
          >
            Easily report lost or found items and reunite them with their owners.
            Our platform helps connect people and their belongings.
          </motion.p>
          
          <motion.div
            className="flex justify-center"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.7, delay: 0.6 }}
          >
            <button 
              className="bg-gradient-to-r from-blue-500 to-teal-500 text-white font-medium py-4 px-8 rounded-full hover:shadow-lg transform hover:scale-105 transition-all duration-200 text-lg"
              onClick={() => navigate('/report-options')}
            >
              Report Lost and Found Item
            </button>
          </motion.div>
        </div>
      </div>

      {/* White Section - How It Works */}
      <div className="bg-white py-16 px-4 min-h-[400px]">
        <div className="max-w-4xl mx-auto text-center">
          <motion.h2
            className="text-3xl font-bold text-gray-900 mb-8"
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
          >
            How It Works
          </motion.h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-8 mb-8">
            {steps.map((step, idx) => (
              <motion.div
                key={step.title}
                className="bg-gradient-to-br from-blue-200 via-blue-100 to-blue-400 rounded-xl shadow-md p-6 flex flex-col items-center"
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: idx * 0.2 }}
              >
                <div className="text-4xl mb-3 animate-bounce-slow">{step.icon}</div>
                <h3 className="font-semibold text-lg text-gray-800 mb-2">{step.title}</h3>
                <p className="text-gray-600 text-sm">{step.desc}</p>
              </motion.div>
            ))}
          </div>
          <motion.p
            className="text-gray-500 mt-6"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            transition={{ duration: 1, delay: 0.5 }}
          >
            Join thousands of users who have successfully found or returned lost items with Lost & Found Hub!
          </motion.p>
        </div>
      </div>
    </>
  );
};

export default HeroSection;