import React from 'react';
import { motion } from 'framer-motion';

const ContactUs = () => {
  return (
    <div id="contact" className="relative py-32">
      {/* Dark gray background */}
      <div className="absolute inset-0 bg-gray-900"></div>
      {/* Background Image with 50% opacity */}
      <div className="absolute inset-0 bg-[url('/contact-bg.jpg')] bg-cover bg-center bg-no-repeat opacity-50"></div>
      {/* Slight black overlay for readability */}
      <div className="absolute inset-0 bg-black opacity-40"></div>
      
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          className="text-center mb-12"
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
        >
          <h1 className="text-4xl font-bold text-blue-400">Contact Us</h1>
          <div className="h-1 w-20 bg-blue-400 mx-auto mt-3"></div>
          <p className="text-lg text-blue-100 mt-6 max-w-3xl mx-auto">
            We're here to help. Send us a message and we'll respond as soon as possible.
          </p>
        </motion.div>
        
        <div className="grid grid-cols-1 md:grid-cols-5 gap-12 items-start">
          {/* Left Side - Text Content */}
          <motion.div
            className="text-white text-left md:pl-0 md:pt-24 md:col-span-3"
            initial={{ opacity: 0, x: -40 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.7 }}
          >
            <h2 className="text-xl font-bold mb-6 text-left">Get in Touch</h2>
            <h3 className="text-5xl font-bold text-white mb-4 text-left">
              Discover the Power of <span className="text-blue-400">Lost & Found Hub</span>
            </h3>
            <p className="text-lg mb-8 text-left">
              Have questions or need more information? Reach out to us, and we'll be happy to assist you with your queries or demo requests.
            </p>
          </motion.div>
          
          {/* Right Side - Contact Form */}
          <motion.div
            className="bg-white/10 backdrop-blur-sm p-8 rounded-xl shadow-lg md:col-span-2 md:ml-0 md:mt-24"
            initial={{ opacity: 0, x: 40 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.7, delay: 0.2 }}
          >
            <h3 className="text-2xl font-bold text-white mb-6">Contact Information</h3>
            <div className="space-y-6">
              <div className="flex items-center space-x-4">
                <span className="text-2xl">📧</span>
                <div>
                  <p className="text-gray-300 text-sm">Email</p>
                  <p className="text-white font-medium">jawairia@gmail.com</p>
                </div>
              </div>
              <div className="flex items-center space-x-4">
                <span className="text-2xl">📞</span>
                <div>
                  <p className="text-gray-300 text-sm">Phone</p>
                  <p className="text-white font-medium">+92 300 1234567</p>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default ContactUs;