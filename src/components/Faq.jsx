import React, { useState } from 'react';
import { motion } from 'framer-motion';

const Faq = () => {
  const faqs = [
    {
      question: "What is Lost & Found Hub?",
      answer: "Lost & Found Hub is a web platform where users can report lost or found items, helping to reconnect lost belongings with their rightful owners through secure communication and AI-based matching."
    },
    {
      question: "How do I report a lost or found item?",
      answer: "Simply click on the \"Report Lost Item\" or \"Report Found Item\" button, fill out the form with item details, upload a photo, and submit. Your post will be visible to other users immediately."
    },
    {
      question: "How does the system match lost and found items?",
      answer: "Our platform uses AI-powered image recognition and item descriptions to suggest possible matches between lost and found reports, increasing the chances of successful recovery."
    },
    {
      question: "Is it safe to communicate with others on the platform?",
      answer: "Yes, we provide a secure messaging system where you can chat with other users without revealing your personal contact information, ensuring your privacy and safety."
    },
    
    
  ];

  const [activeIndex, setActiveIndex] = useState(null);

  const toggleAccordion = (index) => {
    setActiveIndex(activeIndex === index ? null : index);
  };

  return (
    <div id="faqs" className="relative bg-gray-50 py-16">
      {/* Background Image with 30% opacity */}
      <div className="absolute inset-0 bg-[url('/faq-bg.jpg')] bg-cover bg-center bg-no-repeat opacity-30"></div>
      <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          className="text-center mb-12"
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
        >
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Frequently Asked Questions</h1>
          <div className="h-1 w-20 bg-blue-600 mx-auto mt-3"></div>
          <p className="text-lg text-gray-600 mt-6 max-w-3xl mx-auto">
            Find answers to common questions about the Lost & Found Hub platform and how it works.
          </p>
        </motion.div>

        <div className="space-y-6">
          {faqs.map((faq, index) => (
            <motion.div
              key={index}
              className="rounded-lg shadow-md overflow-hidden"
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: index * 0.15 }}
            >
              <button
                className={`w-full px-6 py-5 text-left text-lg font-medium bg-gradient-to-r from-blue-500 to-blue-700 text-white transition-all duration-300 ${
                  activeIndex === index 
                    ? 'from-blue-600 to-blue-800 shadow-md' 
                    : ''
                }`}
                onClick={() => toggleAccordion(index)}
              >
                <div className="flex justify-between items-center">
                  <span>{faq.question}</span>
                  <svg 
                    className={`w-6 h-6 text-white transform ${activeIndex === index ? 'rotate-180' : 'rotate-0'} transition-transform duration-200`} 
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </button>
              <div 
                className={`transition-all duration-300 ${
                  activeIndex === index 
                    ? 'block bg-gradient-to-r from-blue-500 to-blue-700 px-6 py-5' 
                    : 'hidden'
                }`}
              >
                <p className="text-white">{faq.answer}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Faq;
