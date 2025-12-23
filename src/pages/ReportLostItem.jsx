import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Popup, GeoJSON, useMapEvents, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import ApiService from '../services/api';
import { useAuth } from '../context/AuthContext';

// Fix for default marker icon
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Map click handler component
function LocationMarker({ setSelectedLocation }) {
  const map = useMapEvents({
    click(e) {
      setSelectedLocation(e.latlng);
    },
  });
  return null;
}

// Programmatic map control to mimic Google Maps area zoom (fit bounds)
function BoundsSetter({ bounds, center }) {
  const map = useMap();
  useEffect(() => {
    if (bounds && Array.isArray(bounds) && bounds.length === 2) {
      map.fitBounds(bounds, { padding: [40, 40] });
    } else if (center) {
      map.setView(center, 13);
    }
  }, [bounds, center, map]);
  return null;
}

const ReportLostItem = () => {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const [currentPosition, setCurrentPosition] = useState({ lat: 33.6844, lng: 73.0479 }); // Default map center to Islamabad (just for map view, not selected)
  const [selectedLocation, setSelectedLocation] = useState(null); // No location selected by default
  const [selectedBounds, setSelectedBounds] = useState(null);
  const [selectedAreaGeometry, setSelectedAreaGeometry] = useState(null);
  const [selectedPlaceName, setSelectedPlaceName] = useState('');
  const [imagePreview, setImagePreview] = useState(null);
  const [locationSearch, setLocationSearch] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const searchAbortRef = useRef(null);
  const searchDebounceRef = useRef(null);
  
  // Country codes for phone validation
  const countryCodes = [
    { code: '+92', country: 'Pakistan', flag: '🇵🇰' },
    { code: '+1', country: 'USA', flag: '🇺🇸' },
    { code: '+44', country: 'UK', flag: '🇬🇧' },
    { code: '+91', country: 'India', flag: '🇮🇳' },
    { code: '+971', country: 'UAE', flag: '🇦🇪' },
    { code: '+966', country: 'Saudi Arabia', flag: '🇸🇦' },
  ];
  
  const [formData, setFormData] = useState({
    itemName: '',
    address: '',
    postedBy: currentUser?.username || '',
    email: currentUser?.email || '',
    countryCode: '+92', // Default to Pakistan
    contact: '',
    date: '',
    description: '',
    location: '',
    additionalInfo: '',
    latitude: '',
    longitude: '',
    image: null
  });

  // Don't automatically fetch location on mount - let user choose manually
  // User can use "Use my location" button if they want GPS location

  useEffect(() => {
    if (selectedLocation) {
      setFormData(prev => ({
        ...prev,
        latitude: selectedLocation.lat,
        longitude: selectedLocation.lng
      }));
      // Update map center to selected location
      setCurrentPosition(selectedLocation);
      // Reverse geocoding to get address
      reverseGeocode(selectedLocation.lat, selectedLocation.lng);
    }
  }, [selectedLocation]);

  // Auto-fill user data when currentUser changes
  useEffect(() => {
    if (currentUser) {
      setFormData(prev => ({
        ...prev,
        postedBy: currentUser.username || '',
        email: currentUser.email || ''
      }));
    }
  }, [currentUser]);

  // Helper: fetch polygon/geojson for a single place when needed
  const fetchPlaceGeometry = async (result) => {
    try {
      const osmType = (result.osm_type || '').toUpperCase(); // node/way/relation
      const osmId = result.osm_id;
      const prefix = osmType === 'NODE' ? 'N' : osmType === 'WAY' ? 'W' : 'R';
      if (!osmId || !prefix) return null;
      const resp = await fetch(`https://nominatim.openstreetmap.org/lookup?format=json&osm_ids=${prefix}${osmId}&polygon_geojson=1`);
      const data = await resp.json();
      return Array.isArray(data) && data[0] ? data[0] : null;
    } catch (_) {
      return null;
    }
  };

  // Location search function (enhanced with auto-map display)
  const searchLocation = async (query) => {
    if (!query || query.length < 3) {
      setSearchResults([]);
      return [];
    }
    
    setIsSearching(true);
    try {
      // cancel previous in-flight request
      if (searchAbortRef.current) {
        searchAbortRef.current.abort();
      }
      const aborter = new AbortController();
      searchAbortRef.current = aborter;

      // Better normalization with common variations
      let normalized = query
        .replace(/\bislamabd\b/gi, 'islamabad')
        .replace(/\bcantt\b/gi, 'cantonment')
        .replace(/\bcants?\b/gi, 'cantonment')
        .replace(/\bcomsat\b/gi, 'comsats')
        .replace(/\buniversty\b/gi, 'university')
        .replace(/\buni\b/gi, 'university')
        .replace(/\bcampus\b/gi, '')
        .replace(/\barea\b/gi, '')
        .replace(/\s{2,}/g, ' ')
        .trim();

      // Extract key location words (like wah, cantonment, comsats)
      const words = normalized.split(/\s+/).filter(w => w.length > 2);
      const keyWords = words.slice(0, 3).join(' '); // Take first 3 meaningful words

      const candidates = Array.from(new Set([
        normalized, // Full query
        keyWords, // Key words only
        `${normalized}, Pakistan`,
        `${keyWords}, Pakistan`,
        normalized.replace(/\s+/g, ' '), // Clean spaces
        keyWords + ' cantonment Pakistan',
        keyWords + ' Wah Pakistan',
        words.join(', '), // Comma separated
        words.slice(0, 2).join(' '), // First 2 words
      ])).filter(Boolean);

      let results = [];
      for (const q of candidates) {
        let response = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(q)}&limit=5&countrycodes=pk&polygon_geojson=1`,
          { signal: aborter.signal }
        );
        results = await response.json();
        if (Array.isArray(results) && results.length > 0) break;
        response = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(q)}&limit=5&polygon_geojson=1`,
          { signal: aborter.signal }
        );
        results = await response.json();
        if (Array.isArray(results) && results.length > 0) break;
      }

      const finalResults = Array.isArray(results) ? results : [];
      setSearchResults(finalResults);
      
      // Auto-apply first result to map (Google Maps style behavior)
      if (finalResults.length > 0) {
        await selectSearchResult(finalResults[0]);
      }
      
      return finalResults;
    } catch (error) {
      if (error.name !== 'AbortError') {
        console.error('Location search error:', error);
      }
      setSearchResults([]);
      return [];
    } finally {
      setIsSearching(false);
    }
  };

  // Reverse geocoding to get address from coordinates
  const reverseGeocode = async (lat, lng) => {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`
      );
      const result = await response.json();
      if (result.display_name) {
        setFormData(prev => ({
          ...prev,
          address: result.display_name
        }));
      }
    } catch (error) {
      console.error('Reverse geocoding error:', error);
    }
  };

  // Phone number validation
  const validatePhoneNumber = (phone, countryCode) => {
    const phoneRegex = {
      '+92': /^[0-9]{10}$/, // Pakistan: 10 digits after +92
      '+1': /^[0-9]{10}$/, // USA: 10 digits
      '+44': /^[0-9]{10,11}$/, // UK: 10-11 digits
      '+91': /^[0-9]{10}$/, // India: 10 digits
      '+971': /^[0-9]{9}$/, // UAE: 9 digits
      '+966': /^[0-9]{9}$/, // Saudi: 9 digits
    };
    
    return phoneRegex[countryCode]?.test(phone) || false;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleLocationSearch = (e) => {
    const query = e.target.value;
    setLocationSearch(query);
    // debounce to reduce requests
    if (searchDebounceRef.current) {
      clearTimeout(searchDebounceRef.current);
    }
    searchDebounceRef.current = setTimeout(async () => {
      await searchLocation(query);
    }, 350);
  };

  // Quickly apply the typed/searched address onto the map
  const applySearchLocation = async () => {
    const query = (locationSearch || '').trim();
    if (query.length < 2) return;
    try {
      // Better normalization with common variations
      let normalized = query
        .replace(/\bislamabd\b/gi, 'islamabad')
        .replace(/\bcantt\b/gi, 'cantonment')
        .replace(/\bcants?\b/gi, 'cantonment')
        .replace(/\bcomsat\b/gi, 'comsats')
        .replace(/\buniversty\b/gi, 'university')
        .replace(/\buni\b/gi, 'university')
        .replace(/\bcampus\b/gi, '')
        .replace(/\barea\b/gi, '')
        .replace(/\s{2,}/g, ' ')
        .trim();

      // Extract key location words (like wah, cantonment, comsats)
      const words = normalized.split(/\s+/).filter(w => w.length > 2);
      const keyWords = words.slice(0, 3).join(' '); // Take first 3 meaningful words

      const candidates = Array.from(new Set([
        normalized, // Full query
        keyWords, // Key words only
        `${normalized}, Pakistan`,
        `${keyWords}, Pakistan`,
        normalized.replace(/\s+/g, ' '), // Clean spaces
        keyWords + ' cantonment Pakistan',
        keyWords + ' Wah Pakistan',
        words.join(', '), // Comma separated
        words.slice(0, 2).join(' '), // First 2 words
      ])).filter(Boolean);

      let results = [];
      for (const q of candidates) {
        let response = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(q)}&limit=1&countrycodes=pk&polygon_geojson=1`
        );
        results = await response.json();
        if (Array.isArray(results) && results.length > 0) break;
        response = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(q)}&limit=1&polygon_geojson=1`
        );
        results = await response.json();
        if (Array.isArray(results) && results.length > 0) break;
      }
      if (Array.isArray(results) && results.length > 0) {
        const best = results[0];
        const lat = parseFloat(best.lat);
        const lng = parseFloat(best.lon);
        const pos = { lat, lng };
        // Apply bounding box if available
        const bbox = best.boundingbox;
        if (bbox && bbox.length === 4) {
          const south = parseFloat(bbox[0]);
          const north = parseFloat(bbox[1]);
          const west = parseFloat(bbox[2]);
          const east = parseFloat(bbox[3]);
          setSelectedBounds([[south, west], [north, east]]);
        } else {
          setSelectedBounds(null);
        }
        setSelectedLocation(pos);
        setCurrentPosition(pos);
        setLocationSearch(best.display_name || query);
        setSelectedPlaceName(best.display_name || 'Selected place');
        setSelectedAreaGeometry(best.geojson || null);
        setSearchResults([]);
        // also set address immediately
        setFormData(prev => ({ ...prev, address: best.display_name || prev.address }));
      } else {
        alert('Location not found. Try a different name or spelling.');
      }
    } catch (err) {
      console.error('Apply search location failed:', err);
    }
  };

  // Allow Enter key to apply search quickly
  const handleLocationKeyDown = async (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (searchResults && searchResults.length > 0) {
        await selectSearchResult(searchResults[0]);
      } else {
        await applySearchLocation();
      }
    }
  };

  // Manually trigger current location (GPS) on demand
  const useMyLocation = () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser. Please use location search instead.');
      return;
    }
    
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const pos = {
          lat: position.coords.latitude,
          lng: position.coords.longitude
        };
        setCurrentPosition(pos);
        setSelectedLocation(pos);
        reverseGeocode(pos.lat, pos.lng);
        // Show success message briefly
        console.log('Location retrieved successfully:', pos);
      },
      (error) => {
        // Handle different error types with specific messages
        let errorMessage = 'Unable to retrieve your location. ';
        switch(error.code) {
          case error.PERMISSION_DENIED:
            errorMessage += 'Location access was denied. Please enable location permissions in your browser settings and try again.';
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage += 'Location information is unavailable. Please try using location search instead.';
            break;
          case error.TIMEOUT:
            errorMessage += 'The request to get your location timed out. Please try again or use location search.';
            break;
          default:
            errorMessage += 'An unknown error occurred. Please try using location search instead.';
            break;
        }
        alert(errorMessage);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      }
    );
  };

  const selectSearchResult = async (result) => {
    const lat = parseFloat(result.lat);
    const lng = parseFloat(result.lon);
    // If result has bounding box, fit to it
    const bbox = result.boundingbox;
    if (bbox && bbox.length === 4) {
      const south = parseFloat(bbox[0]);
      const north = parseFloat(bbox[1]);
      const west = parseFloat(bbox[2]);
      const east = parseFloat(bbox[3]);
      setSelectedBounds([[south, west], [north, east]]);
    } else {
      setSelectedBounds(null);
    }
    setSelectedLocation({ lat, lng });
    setCurrentPosition({ lat, lng }); // Update map center
    setLocationSearch(result.display_name);
    setSelectedPlaceName(result.display_name || 'Selected place');
    // Update address field in formData
    setFormData(prev => ({ ...prev, address: result.display_name || prev.address }));
    if (result.geojson) {
      setSelectedAreaGeometry(result.geojson);
    } else {
      const detailed = await fetchPlaceGeometry(result);
      setSelectedAreaGeometry(detailed?.geojson || null);
    }
    setSearchResults([]);
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFormData(prev => ({
        ...prev,
        image: file
      }));

      // Create preview URL
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate phone number
    if (formData.contact && !validatePhoneNumber(formData.contact, formData.countryCode)) {
      alert(`Please enter a valid phone number for ${formData.countryCode}`);
      return;
    }
    
    // Create a complete item object with additional metadata
    const itemData = {
      ...formData,
      fullPhoneNumber: formData.contact ? `${formData.countryCode}${formData.contact}` : '',
      id: Date.now(), // Unique ID
      timestamp: new Date().toISOString(),
      status: 'active', // Status of the report
      type: 'lost' // Type of report
    };

    // Get existing items from localStorage
    const lostItems = JSON.parse(localStorage.getItem('lostItems') || '[]');
    
    // Add new item to the array
    lostItems.push(itemData);
    
    // Save back to localStorage
    localStorage.setItem('lostItems', JSON.stringify(lostItems));
    
    // Log success message
    console.log('Lost item report saved successfully:', itemData);
    
    // Also persist to backend (admin can see it)
    try {
      const form = new FormData();
      form.append('item_name', itemData.itemName);
      form.append('description', itemData.description);
      form.append('location', itemData.address);
      form.append('latitude', String(itemData.latitude));
      form.append('longitude', String(itemData.longitude));
      form.append('date_lost', itemData.date);
      form.append('contact', itemData.fullPhoneNumber || '');
      form.append('reporter_name', itemData.postedBy || '');
      form.append('reporter_email', itemData.email || '');
      form.append('additional_info', itemData.additionalInfo || '');
      if (itemData.image) {
        form.append('image', itemData.image);
      }
      await ApiService.createLostItem(form);
    } catch (err) {
      console.error('API save failed (lost item):', err);
      // keep UI flow; data is still in localStorage and success page
    }

    // Navigate to success page with the form data
    navigate('/success', { state: { itemData } });
  };

  return (
    <div className="min-h-screen bg-gray-900 py-12 px-4 sm:px-6 lg:px-8 relative anim-fade-in-up">
      {/* Decorative background elements */}
      <div className="absolute inset-0 bg-gradient-to-br from-gray-800 to-gray-900 opacity-80"></div>
      <div className="absolute inset-0 bg-[url('/grid.svg')] bg-center [mask-image:linear-gradient(180deg,white,rgba(255,255,255,0))]"></div>

      <div className="max-w-4xl mx-auto relative z-10">
        {/* Header Section */}
        <div className="text-center mb-6 sm:mb-10 anim-fade-in-up">
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white mb-2 sm:mb-4 drop-shadow-lg px-2">
            Report Lost Item
          </h1>
          <p className="text-base sm:text-lg md:text-xl text-gray-300 max-w-2xl mx-auto px-4">
            Please provide details about your lost item to help us find it
          </p>
        </div>

        {/* Main Form Card */}
        <div className="backdrop-blur-md bg-gray-800 rounded-3xl shadow-2xl border border-gray-600 anim-fade-in-up-delayed">
          {/* Form Header Accent */}
          <div className="h-2 bg-gradient-to-r from-blue-500 to-purple-600 rounded-t-3xl"></div>
          
          <div className="p-4 sm:p-6 md:p-8 lg:p-10">
            <form onSubmit={handleSubmit} className="space-y-6 sm:space-y-8">
              {/* Two Column Layout for Form Fields */}
              <div className="grid md:grid-cols-2 gap-x-4 sm:gap-x-6 md:gap-x-8 gap-y-4 sm:gap-y-6">
                {/* Item Name */}
                <div className="col-span-2 md:col-span-1">
                  <label htmlFor="itemName" className="block text-sm font-bold text-gray-300 mb-2 uppercase tracking-wider">
                    Item Name *
                  </label>
                  <input
                    type="text"
                    id="itemName"
                    name="itemName"
                    required
                    value={formData.itemName}
                    onChange={handleChange}
                    className="w-full px-4 py-3 rounded-xl bg-gray-700/50 border border-gray-600 text-white placeholder-gray-400
                             focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-200 hover-lift"
                    placeholder="Enter item name"
                  />
                </div>

                {/* Posted By */}
                <div className="col-span-2 md:col-span-1">
                  <label htmlFor="postedBy" className="block text-sm font-bold text-gray-300 mb-2 uppercase tracking-wider">
                    Posted By *
                  </label>
                  <input
                    type="text"
                    id="postedBy"
                    name="postedBy"
                    required
                    value={formData.postedBy}
                    onChange={handleChange}
                    className="w-full px-4 py-3 rounded-xl bg-gray-700/50 border border-gray-600 text-white placeholder-gray-400
                             focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-200 hover-lift"
                    placeholder="Your name"
                  />
                </div>

                {/* Email */}
                <div className="col-span-2 md:col-span-1">
                  <label htmlFor="email" className="block text-sm font-bold text-gray-300 mb-2 uppercase tracking-wider">
                    Email *
                  </label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    required
                    value={formData.email}
                    onChange={handleChange}
                    className="w-full px-4 py-3 rounded-xl bg-gray-700/50 border border-gray-600 text-white placeholder-gray-400
                             focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-200 hover-lift"
                    placeholder="your.email@example.com"
                  />
                </div>

                {/* Contact with Country Code */}
                <div className="col-span-2 md:col-span-1">
                  <label htmlFor="contact" className="block text-sm font-bold text-gray-300 mb-2 uppercase tracking-wider">
                    Contact Number
                  </label>
                  <div className="flex">
                    <select
                      name="countryCode"
                      value={formData.countryCode}
                      onChange={handleChange}
                      className="px-3 py-3 rounded-l-xl bg-gray-700/50 border border-gray-600 text-white
                               focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-200 hover-lift"
                    >
                      {countryCodes.map((country) => (
                        <option key={country.code} value={country.code}>
                          {country.flag} {country.code}
                        </option>
                      ))}
                    </select>
                  <input
                    type="tel"
                    id="contact"
                    name="contact"
                    value={formData.contact}
                    onChange={handleChange}
                      className="flex-1 px-4 py-3 rounded-r-xl bg-gray-700/50 border border-gray-600 text-white placeholder-gray-400
                             focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-200 hover-lift"
                      placeholder="3001234567"
                    />
                  </div>
                  {formData.contact && !validatePhoneNumber(formData.contact, formData.countryCode) && (
                    <p className="mt-1 text-sm text-red-400">
                      Please enter a valid phone number for {formData.countryCode}
                    </p>
                  )}
                </div>

                {/* Date */}
                <div className="col-span-2 md:col-span-1">
                  <label htmlFor="date" className="block text-sm font-bold text-gray-300 mb-2 uppercase tracking-wider">
                    Date Lost *
                  </label>
                  <input
                    type="date"
                    id="date"
                    name="date"
                    required
                    value={formData.date}
                    onChange={handleChange}
                    className="w-full px-4 py-3 rounded-xl bg-gray-700/50 border border-gray-600 text-white placeholder-gray-400
                             focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-200 hover-lift"
                  />
                </div>

                {/* Location Search + Actions and Address */}
                <div className="col-span-2">
                  <label htmlFor="locationSearch" className="block text-sm font-bold text-gray-300 mb-2 uppercase tracking-wider">
                    Search Location
                  </label>
                  <div className="relative">
                    <div className="flex flex-col sm:flex-row gap-2">
                      <input
                        type="text"
                        id="locationSearch"
                        value={locationSearch}
                        onChange={handleLocationSearch}
                        onKeyDown={handleLocationKeyDown}
                        className="w-full px-3 sm:px-4 py-2 sm:py-3 rounded-xl bg-gray-700/50 border border-gray-600 text-white placeholder-gray-400 text-sm sm:text-base
                                 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-200 hover-lift"
                        placeholder="Type location name (e.g., Wah Cantt, Islamabad)"
                      />
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={applySearchLocation}
                          className="flex-1 sm:flex-none px-3 sm:px-4 py-2 sm:py-3 rounded-xl bg-blue-600 text-white hover:bg-blue-500 transition hover-lift text-sm sm:text-base whitespace-nowrap"
                          title="Set on map"
                        >
                          <span className="hidden sm:inline">Set on map</span>
                          <span className="sm:hidden">Set</span>
                        </button>
                        <button
                          type="button"
                          onClick={useMyLocation}
                          className="flex-1 sm:flex-none px-3 sm:px-4 py-2 sm:py-3 rounded-xl bg-indigo-600 text-white hover:bg-indigo-500 transition hover-lift text-sm sm:text-base whitespace-nowrap"
                          title="Use my current location"
                        >
                          <span className="hidden sm:inline">Use my location</span>
                          <span className="sm:hidden">📍 GPS</span>
                        </button>
                      </div>
                    </div>
                    {isSearching && (
                      <div className="absolute right-3 top-3">
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
                      </div>
                    )}
                    {/* Search Results Dropdown */}
                    {searchResults.length > 0 && (
                      <div className="absolute z-50 w-full mt-1 bg-gray-800 border border-gray-600 rounded-xl shadow-lg max-h-60 overflow-y-auto">
                        {searchResults.map((result, index) => (
                          <div
                            key={index}
                            onClick={() => selectSearchResult(result)}
                            className="px-4 py-3 hover:bg-gray-700 cursor-pointer border-b border-gray-700 last:border-b-0"
                          >
                            <div className="text-white font-medium">{result.display_name}</div>
                            <div className="text-gray-400 text-sm">📍 {result.lat}, {result.lon}</div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-3">
                    {/* Additional location actions can go here */}
                  </div>
                  <div className="mt-4">
                    <label htmlFor="address" className="block text-sm font-bold text-gray-300 mb-2 uppercase tracking-wider">
                      Selected Address
                    </label>
                    <input
                      type="text"
                      id="address"
                      name="address"
                      value={formData.address}
                      onChange={handleChange}
                      className="w-full px-4 py-3 rounded-xl bg-gray-700/50 border border-gray-600 text-white placeholder-gray-400
                               focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-200"
                      placeholder="Address will be auto-filled when you pick on map or use GPS"
                      readOnly
                    />
                  </div>
                </div>

                {/* Image Upload - Full Width */}
                <div className="col-span-2">
                  <label className="block text-sm font-bold text-gray-300 mb-2 uppercase tracking-wider">
                    Upload Image
                  </label>
                  <div className="flex flex-col items-center justify-center w-full">
                    <label className="flex flex-col items-center justify-center w-full h-64 border-2 border-gray-600 border-dashed rounded-xl cursor-pointer bg-gray-700/50 hover:bg-gray-700/70 transition duration-200">
                      <div className="flex flex-col items-center justify-center pt-5 pb-6">
                        {imagePreview ? (
                          <div className="relative">
                            <img src={imagePreview} alt="Preview" className="max-h-48 rounded-lg" />
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setImagePreview(null);
                                setFormData(prev => ({ ...prev, image: null }));
                              }}
                              className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                              </svg>
                            </button>
                          </div>
                        ) : (
                          <>
                            <svg className="w-12 h-12 mb-4 text-gray-400" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 20 16">
                              <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 13h3a3 3 0 0 0 0-6h-.025A5.56 5.56 0 0 0 16 6.5 5.5 5.5 0 0 0 5.207 5.021C5.137 5.017 5.071 5 5 5a4 4 0 0 0 0 8h2.167M10 15V6m0 0L8 8m2-2 2 2"/>
                            </svg>
                            <p className="mb-2 text-sm text-gray-400">
                              <span className="font-semibold">Click to upload</span> or drag and drop
                            </p>
                            <p className="text-xs text-gray-400">PNG, JPG or JPEG (MAX. 5MB)</p>
                          </>
                        )}
                      </div>
                      <input
                        type="file"
                        className="hidden"
                        accept="image/*"
                        onChange={handleImageChange}
                      />
                    </label>
                  </div>
                </div>

                {/* Description - Full Width */}
                <div className="col-span-2">
                  <label htmlFor="description" className="block text-sm font-bold text-gray-300 mb-2 uppercase tracking-wider">
                    Description *
                  </label>
                  <textarea
                    id="description"
                    name="description"
                    required
                    rows={4}
                    value={formData.description}
                    onChange={handleChange}
                    className="w-full px-4 py-3 rounded-xl bg-gray-700/50 border border-gray-600 text-white placeholder-gray-400
                             focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-200"
                    placeholder="Please provide detailed description of the lost item..."
                  />
                </div>

                {/* Map - Full Width */}
                <div className="col-span-2">
                  <label className="block text-sm font-bold text-gray-300 mb-2 uppercase tracking-wider">
                    Pin Location on Map *
                  </label>
                  <div className="h-64 sm:h-80 md:h-96 lg:h-[400px] rounded-xl overflow-hidden border border-gray-600 shadow-lg anim-pulse-glow">
                    <MapContainer
                      key={`${currentPosition.lat}-${currentPosition.lng}`}
                      center={currentPosition}
                      zoom={13}
                      style={{ height: '100%', width: '100%' }}
                    >
                      <TileLayer
                        url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
                        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                      />
                      <BoundsSetter bounds={selectedBounds} center={currentPosition} />
                      <LocationMarker setSelectedLocation={setSelectedLocation} />
                      {selectedAreaGeometry && (
                        <GeoJSON 
                          data={selectedAreaGeometry} 
                          style={{ 
                            color: '#3B82F6', 
                            weight: 3, 
                            fillColor: '#3B82F6',
                            fillOpacity: 0.25,
                            opacity: 0.8
                          }} 
                        />
                      )}
                      {selectedLocation && (
                        <Marker position={selectedLocation}>
                          {selectedPlaceName && (
                            <Popup>{selectedPlaceName}</Popup>
                          )}
                        </Marker>
                      )}
                    </MapContainer>
                  </div>
                  <p className="mt-2 text-sm text-gray-400">🔍 Search a place, press Set on map, or tap the map to pin the exact spot. You can also use "Use my location".</p>
                </div>

                {/* Additional Information - Full Width */}
                <div className="col-span-2">
                  <label htmlFor="additionalInfo" className="block text-sm font-bold text-gray-300 mb-2 uppercase tracking-wider">
                    Additional Information
                  </label>
                  <textarea
                    id="additionalInfo"
                    name="additionalInfo"
                    rows={3}
                    value={formData.additionalInfo}
                    onChange={handleChange}
                    className="w-full px-4 py-3 rounded-xl bg-gray-700/50 border border-gray-600 text-white placeholder-gray-400
                             focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-200"
                    placeholder="Any additional details that might help..."
                  />
                </div>
              </div>

              {/* Hidden Location Fields */}
              <input type="hidden" name="latitude" value={formData.latitude} />
              <input type="hidden" name="longitude" value={formData.longitude} />

              {/* Submit Button */}
              <div className="flex justify-end mt-8">
                <button
                  type="submit"
                  className="px-8 py-4 bg-gradient-to-r from-blue-500 to-purple-600 text-white text-lg font-bold rounded-xl 
                            hover:from-blue-600 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 
                            focus:ring-offset-2 focus:ring-offset-gray-900 transform transition-all duration-200 
                            hover:scale-105 shadow-lg shadow-purple-500/20 hover-lift"
                >
                  Submit Report
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReportLostItem; 