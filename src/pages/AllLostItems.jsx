import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const AllLostItems = () => {
  const navigate = useNavigate();
  const [lostItems, setLostItems] = useState([]);

  useEffect(() => {
    // Fetch all lost items from localStorage
    const items = JSON.parse(localStorage.getItem('lostItems') || '[]');
    setLostItems(items);
  }, []);

  const handleItemClick = (item) => {
    navigate('/lost-item-details', { state: { formData: item } });
  };

  return (
    <div className="min-h-screen bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-4">All Lost Items</h1>
          <p className="text-xl text-gray-300">Browse through all reported lost items</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {lostItems.map((item, index) => (
            <div
              key={index}
              onClick={() => handleItemClick(item)}
              className="bg-gray-800 rounded-3xl shadow-2xl overflow-hidden cursor-pointer transform hover:scale-105 transition-all duration-200"
            >
              <div className="relative h-64">
                {item.image ? (
                  <img
                    src={typeof item.image === 'string' ? item.image : URL.createObjectURL(item.image)}
                    alt={item.itemName}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-gray-700 flex items-center justify-center">
                    <span className="text-gray-400">No image available</span>
                  </div>
                )}
              </div>
              
              <div className="p-6">
                <h3 className="text-xl font-bold text-white mb-2">{item.itemName}</h3>
                <p className="text-gray-300 mb-2">Category: {item.category}</p>
                <p className="text-gray-300 mb-2">Location: {item.location}</p>
                <p className="text-gray-300">Date Lost: {item.date}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AllLostItems; 