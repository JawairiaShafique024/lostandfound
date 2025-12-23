  import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const LostItemDetails = () => {
  const navigate = useNavigate();
  const [items, setItems] = useState([]);

  useEffect(() => {
    const stored = JSON.parse(localStorage.getItem('lostItems') || '[]');
    setItems(stored);
  }, []);

  if (!items.length) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-white">No lost items found.</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-4">All Lost Items</h1>
          <p className="text-xl text-gray-300">Here are all the lost items you have submitted</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {items.map((item, idx) => (
            <div key={idx} className="bg-gray-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col cursor-pointer hover:scale-105 transition-transform duration-200" onClick={() => navigate(`/lost-item-details/${idx}`)}>
              {/* Image Section */}
              <div className="relative h-60">
                {item.image ? (
                  <img
                    src={typeof item.image === 'string' ? item.image : URL.createObjectURL(item.image)}
                    alt="Lost Item"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-gray-700 flex items-center justify-center">
                    <span className="text-gray-400">No image available</span>
                  </div>
                )}
              </div>

              {/* Details Section */}
              <div className="p-6 flex-1 flex flex-col">
                <h2 className="text-2xl font-bold text-white mb-2">{item.itemName}</h2>
                <p className="text-gray-300 mb-1"><span className="font-semibold">Category:</span> {item.category || '-'}</p>
                <p className="text-gray-300 mb-1"><span className="font-semibold">Location:</span> {item.location || '-'}</p>
                <p className="text-gray-300 mb-1"><span className="font-semibold">Date Lost:</span> {item.date || '-'}</p>
                <p className="text-gray-300 mb-1"><span className="font-semibold">Posted By:</span> {item.postedBy || '-'}</p>
                <p className="text-gray-300 mb-1"><span className="font-semibold">Email:</span> {item.email || '-'}</p>
                {item.contact && <p className="text-gray-300 mb-1"><span className="font-semibold">Contact:</span> {item.contact}</p>}
                {item.description && <p className="text-gray-300 mt-2"><span className="font-semibold">Description:</span> {item.description}</p>}
                {item.additionalInfo && <p className="text-gray-300 mt-2"><span className="font-semibold">Additional Info:</span> {item.additionalInfo}</p>}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-10 flex justify-center">
          <button
            onClick={() => navigate('/')}
            className="px-6 py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transform hover:scale-105 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-900"
          >
            Back to Home
          </button>
        </div>
      </div>
    </div>
  );
};

export default LostItemDetails; 