import React from 'react';
import { motion } from 'framer-motion';

const Footer = () => {
  return (
    <footer className="bg-white text-gray-800 pt-8 sm:pt-12 pb-6 sm:pb-8 shadow-md">
      <div className="container mx-auto px-4 sm:px-6 lg:px-10">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8 lg:gap-10">
          {/* Brand Section - Matching header's alignment */}
          <motion.div
            className="mb-4 md:mb-0 text-left"
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
          >
            <h2 className="text-xl sm:text-2xl font-bold text-blue-600">Lost & Found Hub</h2>
            <p className="text-sm sm:text-base text-gray-600 font-bold">Connecting Lost Items with Their Owners</p>
          </motion.div>

          {/* Quick Links */}
          <motion.div
            className="mb-4 md:mb-0 text-left"
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.2 }}
          >
            <h3 className="text-base sm:text-lg font-bold mb-3 sm:mb-4 text-blue-600">Quick Links</h3>
            <ul className="space-y-1.5 sm:space-y-2">
              <li><a href="/" className="text-sm sm:text-base text-gray-700 font-bold hover:text-blue-600 transition-colors">Home</a></li>
              <li><a href="/solutions" className="text-sm sm:text-base text-gray-700 font-bold hover:text-blue-600 transition-colors">Solutions</a></li>
              <li><a href="/about" className="text-sm sm:text-base text-gray-700 font-bold hover:text-blue-600 transition-colors">About</a></li>
              <li><a href="/faq" className="text-sm sm:text-base text-gray-700 font-bold hover:text-blue-600 transition-colors">FAQ</a></li>
              <li><a href="/contact" className="text-sm sm:text-base text-gray-700 font-bold hover:text-blue-600 transition-colors">Contact Us</a></li>
            </ul>
          </motion.div>

          {/* Contact Information */}
          <motion.div
            className="text-left"
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.4 }}
          >
            <h3 className="text-base sm:text-lg font-bold mb-3 sm:mb-4 text-blue-600">Contact Us</h3>
            <ul className="space-y-1.5 sm:space-y-2 text-gray-700">
              <li className="flex items-start">
                <span className="mr-2">📧</span>
                <span className="text-sm sm:text-base font-bold break-words">Email: jawairia@gmail.com</span>
              </li>
              <li className="flex items-start">
                <span className="mr-2">📞</span>
                <span className="text-sm sm:text-base font-bold">Phone: +92 000 0000000</span>
              </li>
              <li className="flex items-start">
                <span className="mr-2">📍</span>
                <span className="text-sm sm:text-base font-bold">Address: 123 New Street, Rawalpindi, PK</span>
              </li>
            </ul>
          </motion.div>
        </div>

        {/* Copyright */}
        <motion.div
          className="border-t border-gray-200 mt-6 sm:mt-10 -mx-4 sm:-mx-6 lg:-mx-10"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ duration: 1, delay: 0.6 }}
        >
          <div className="w-screen bg-gray-800 text-white text-center text-xs sm:text-sm font-bold py-3 sm:py-4 relative left-1/2 right-1/2 -translate-x-1/2">
            © 2025 Lost & Found Hub. All rights reserved.
          </div>
        </motion.div>
      </div>
    </footer>
  );
};

export default Footer;
