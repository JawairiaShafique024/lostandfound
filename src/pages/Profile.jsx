import React, { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

export default function Profile() {
  const { currentUser, changePassword } = useAuth();
  const [lostItems, setLostItems] = useState([]);
  const [foundItems, setFoundItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [pwd, setPwd] = useState({ old: '', next: '', confirm: '' });
  const [showPwd, setShowPwd] = useState({ old: false, next: false, confirm: false });
  const [pwdSaving, setPwdSaving] = useState(false);
  const [pwdError, setPwdError] = useState('');
  const [pwdSuccess, setPwdSuccess] = useState('');
  const [statusUpdating, setStatusUpdating] = useState({});
  const [showFeedbackModal, setShowFeedbackModal] = useState(null);
  const [feedback, setFeedback] = useState('');
  const [feedbackRating, setFeedbackRating] = useState(0);
  const [selectedEmojis, setSelectedEmojis] = useState([]);
  const [matches, setMatches] = useState([]);
  const [isMinimized, setIsMinimized] = useState(false);
  const [isMaximized, setIsMaximized] = useState(false);
  const navigate = useNavigate();

  // Load items function
  const loadItems = React.useCallback(async () => {
    try {
      setLoading(true);
      console.log('[PROFILE] Loading items for user:', currentUser);
      const [lost, found, matchList] = await Promise.all([
        api.getLostItems(),
        api.getFoundItems(),
        api.getMatches()
      ]);
      console.log('[PROFILE] Lost items received:', lost);
      console.log('[PROFILE] Found items received:', found);
      setLostItems(Array.isArray(lost) ? lost : []);
      setFoundItems(Array.isArray(found) ? found : []);
      setMatches(Array.isArray(matchList) ? matchList : []);
    } catch (error) {
      console.error('[PROFILE] Error loading items:', error);
    } finally {
      setLoading(false);
    }
  }, [currentUser]);

  // Load items on mount and when currentUser changes
  useEffect(() => {
    let isMounted = true;
    loadItems().then(() => {
      if (!isMounted) return;
    });
    return () => { isMounted = false; };
  }, [loadItems]);

  // Auto-refresh when page becomes visible (user comes back from submitting a post)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden && currentUser) {
        console.log('[PROFILE] Page visible, refreshing items...');
        loadItems();
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [loadItems, currentUser]);

  // Also refresh when window gets focus
  useEffect(() => {
    const handleFocus = () => {
      if (currentUser) {
        console.log('[PROFILE] Window focused, refreshing items...');
        loadItems();
      }
    };
    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [loadItems, currentUser]);

  // Keyboard shortcuts for window controls
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.ctrlKey || e.metaKey) {
        switch (e.key) {
          case 'm':
            e.preventDefault();
            handleMinimize();
            break;
          case '=':
          case '+':
            e.preventDefault();
            handleMaximize();
            break;
          case 'w':
            e.preventDefault();
            handleClose();
            break;
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isMaximized]);

  // Status update function (uses centralized API service and correct token)
  const updateItemStatus = async (itemType, itemId, newStatus, userFeedback = '') => {
    const key = `${itemType}-${itemId}`;
    setStatusUpdating(prev => ({ ...prev, [key]: true }));

    try {
      console.log(`[STATUS UPDATE] Updating ${itemType} item ${itemId} to ${newStatus}`);

      let result;
      if (itemType === 'Lost') {
        result = await api.updateLostItemStatus(itemId, newStatus, userFeedback);
      } else {
        result = await api.updateFoundItemStatus(itemId, newStatus, userFeedback);
      }
      console.log('[STATUS UPDATE] Success:', result);

      // Update local state
      if (itemType === 'Lost') {
        setLostItems(prev => prev.map(item => (
          item.id === itemId ? { ...item, status: newStatus } : item
        )));
      } else {
        setFoundItems(prev => prev.map(item => (
          item.id === itemId ? { ...item, status: newStatus } : item
        )));
      }

      alert(`✅ Status updated to "${newStatus}" successfully!`);
    } catch (error) {
      console.error('[STATUS UPDATE] Failed:', error);
      alert(`❌ ${error.message || 'Request failed'}`);
    } finally {
      setStatusUpdating(prev => ({ ...prev, [key]: false }));
      setShowFeedbackModal(null);
      setFeedback('');
      setFeedbackRating(0);
      setSelectedEmojis([]);
    }
  };

  // Handle status change with feedback
  const handleStatusChange = (itemType, itemId, newStatus) => {
    if (newStatus === 'found' || newStatus === 'returned') {
      setShowFeedbackModal({ itemType, itemId, newStatus });
    } else {
      updateItemStatus(itemType, itemId, newStatus);
    }
  };

  const deleteItem = async (itemType, itemId) => {
    const label = itemType === 'Lost' ? 'lost' : 'found';
    const confirmed = window.confirm(`Are you sure you want to delete this ${label} item? This cannot be undone.`);
    if (!confirmed) return;
    const key = `${itemType}-${itemId}`;
    setStatusUpdating(prev => ({ ...prev, [key]: true }));
    try {
      if (itemType === 'Lost') {
        await api.deleteLostItem(itemId);
        setLostItems(prev => prev.filter(it => it.id !== itemId));
      } else {
        await api.deleteFoundItem(itemId);
        setFoundItems(prev => prev.filter(it => it.id !== itemId));
      }
      alert('✅ Item deleted successfully');
    } catch (error) {
      console.error('[DELETE] Failed:', error);
      alert(`❌ ${error.message || 'Failed to delete item'}`);
    } finally {
      setStatusUpdating(prev => ({ ...prev, [key]: false }));
    }
  };

  const myLostItems = useMemo(() => {
    if (!currentUser) {
      console.log('[PROFILE] No currentUser for lost items filtering');
      return [];
    }
    const filtered = lostItems.filter(li => li.posted_by?.id === currentUser.id);
    console.log('[PROFILE] Filtered lost items:', filtered.length, 'from', lostItems.length, 'total');
    console.log('[PROFILE] Current user ID:', currentUser.id);
    console.log('[PROFILE] Sample lost item posted_by:', lostItems[0]?.posted_by);
    return filtered;
  }, [lostItems, currentUser]);

  const myFoundItems = useMemo(() => {
    if (!currentUser) {
      console.log('[PROFILE] No currentUser for found items filtering');
      return [];
    }
    const filtered = foundItems.filter(fi => fi.posted_by?.id === currentUser.id);
    console.log('[PROFILE] Filtered found items:', filtered.length, 'from', foundItems.length, 'total');
    console.log('[PROFILE] Sample found item posted_by:', foundItems[0]?.posted_by);
    return filtered;
  }, [foundItems, currentUser]);

  const totalUploads = myLostItems.length + myFoundItems.length;

  // Most recent uploaded image (from user's own lost/found items)
  const latestUploadedImage = useMemo(() => {
    const mine = [
      ...myLostItems.map(it => ({ created_at: it.created_at, image: it.image })),
      ...myFoundItems.map(it => ({ created_at: it.created_at, image: it.image }))
    ].filter(it => !!it.image);
    if (mine.length === 0) return null;
    mine.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    return mine[0].image;
  }, [myLostItems, myFoundItems]);

  const lostIdHasReturnedMatch = useMemo(() => {
    const set = new Set();
    for (const m of matches) {
      const lostId = m?.lost_item?.id;
      const foundStatus = m?.found_item?.status;
      if (lostId && foundStatus === 'returned') set.add(lostId);
    }
    return set;
  }, [matches]);

  const foundIdConfirmedByOwner = useMemo(() => {
    const set = new Set();
    for (const m of matches) {
      const foundId = m?.found_item?.id;
      const lostStatus = m?.lost_item?.status;
      if (foundId && lostStatus === 'inactive') set.add(foundId);
    }
    return set;
  }, [matches]);

  const lostIdToReturnedFoundIds = useMemo(() => {
    const map = new Map();
    for (const m of matches) {
      const lostId = m?.lost_item?.id;
      const foundId = m?.found_item?.id;
      const foundStatus = m?.found_item?.status;
      if (lostId && foundId && foundStatus === 'returned') {
        if (!map.has(lostId)) map.set(lostId, new Set());
        map.get(lostId).add(foundId);
      }
    }
    return map;
  }, [matches]);

  async function onChangePassword(e) {
    e.preventDefault();
    setPwdError('');
    setPwdSuccess('');
    if (!pwd.old || !pwd.next || !pwd.confirm) {
      setPwdError('Please fill all password fields');
      return;
    }
    if (pwd.next !== pwd.confirm) {
      setPwdError('New password and confirm password do not match');
      return;
    }
    if (pwd.next.length < 8) {
      setPwdError('New password must be at least 8 characters');
      return;
    }
    try {
      setPwdSaving(true);
      await changePassword(pwd.old, pwd.next, pwd.confirm);
      setPwdSuccess('Password changed successfully');
      setPwd({ old: '', next: '', confirm: '' });
    } catch (err) {
      setPwdError(err.message || 'Failed to change password');
    } finally {
      setPwdSaving(false);
    }
  }

  function handleClose() {
    navigate(-1);
  }

  function handleMinimize() {
    setIsMinimized(true);
  }

  function handleMaximize() {
    setIsMaximized(!isMaximized);
  }

  function handleRestore() {
    setIsMinimized(false);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/20 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ 
          opacity: 1, 
          scale: isMinimized ? 0.1 : 1, 
          y: isMinimized ? 100 : 0,
          width: isMaximized ? '100vw' : 'auto',
          height: isMaximized ? '100vh' : 'auto'
        }}
        className={`bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden transition-all duration-300 ${
          isMaximized ? 'w-full h-full max-w-none max-h-none' : 'w-full max-w-6xl'
        } ${isMinimized ? 'pointer-events-none' : ''}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="profile-window-title"
      >
        {/* Window Header */}
        <div className="flex items-center justify-between px-3 sm:px-4 md:px-6 py-3 sm:py-4 bg-gradient-to-r from-teal-500 to-sky-500">
          <div className="flex-1 min-w-0">
            <h1 id="profile-window-title" className="text-base sm:text-lg md:text-xl font-bold text-white truncate">👤 Profile Management</h1>
            <p className="text-xs sm:text-sm text-white/90 mt-0.5 sm:mt-1 hidden sm:block">Manage your account and items</p>
          </div>
          <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
            {/* Window Controls */}
            <div className="flex items-center gap-0.5 sm:gap-1">
              <button
                onClick={handleMinimize}
                className="inline-flex items-center justify-center w-7 h-7 sm:w-8 sm:h-8 rounded-full hover:bg-white/20 text-white transition-colors"
                aria-label="Minimize window"
                title="Minimize (Ctrl+M)"
              >
                <span className="text-sm sm:text-base">➖</span>
              </button>
              <button
                onClick={handleMaximize}
                className="inline-flex items-center justify-center w-7 h-7 sm:w-8 sm:h-8 rounded-full hover:bg-white/20 text-white transition-colors"
                aria-label={isMaximized ? "Restore window" : "Maximize window"}
                title={isMaximized ? "Restore (Ctrl+Plus)" : "Maximize (Ctrl+Plus)"}
              >
                <span className="text-sm sm:text-base">{isMaximized ? '⤡' : '⤢'}</span>
              </button>
              <button
                onClick={handleClose}
                className="inline-flex items-center justify-center w-7 h-7 sm:w-8 sm:h-8 rounded-full hover:bg-red-500/80 text-white transition-colors"
                aria-label="Close profile"
                title="Close (Ctrl+W)"
              >
                <span className="text-sm sm:text-base">✕</span>
              </button>
            </div>
          </div>
        </div>

        {/* Content */}
        {!isMinimized && (
          <div className="p-3 sm:p-4 md:p-6 bg-gray-50 custom-scrollbar max-h-[calc(90vh-120px)] sm:max-h-[calc(95vh-120px)] md:max-h-none overflow-y-auto">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 sm:gap-6">
            {/* Sidebar */}
            <motion.aside 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="lg:col-span-1"
            >
              <div className="rounded-lg sm:rounded-xl border border-gray-200 bg-white shadow-lg overflow-hidden">
                <div className="p-4 sm:p-6 border-b bg-gradient-to-r from-teal-500 to-sky-500 text-white">
                  <div className="flex items-center gap-3 sm:gap-4">
                    <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-white/20 flex items-center justify-center text-lg sm:text-xl font-bold overflow-hidden">
                      {latestUploadedImage ? (
                        <img 
                          src={typeof latestUploadedImage === 'string' ? latestUploadedImage : URL.createObjectURL(latestUploadedImage)} 
                          alt="Profile" 
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        (currentUser?.username?.[0] || currentUser?.email?.[0] || '?').toUpperCase()
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-base sm:text-lg font-semibold leading-tight truncate">{currentUser?.username || 'User'}</div>
                      <div className="text-xs sm:text-sm opacity-90 truncate">{currentUser?.email}</div>
                    </div>
                  </div>
                </div>
                <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
                  <div>
                    <div className="text-xs uppercase tracking-wide text-gray-500 mb-2">User ID</div>
                    <div className="text-xs sm:text-sm font-medium text-gray-800 bg-gray-100 px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg break-all">{currentUser?.id}</div>
                  </div>
                  
                  <div className="grid grid-cols-3 gap-2 sm:gap-3">
                    <motion.div 
                      whileHover={{ scale: 1.05 }}
                      className="rounded-lg sm:rounded-xl p-0.5 sm:p-1 bg-gradient-to-r from-teal-400 to-sky-400"
                    >
                      <div className="rounded-lg sm:rounded-xl bg-white p-2 sm:p-3 md:p-4 text-center">
                        <div className="text-[10px] sm:text-xs text-teal-700 font-semibold">Total</div>
                        <div className="text-lg sm:text-xl md:text-2xl font-bold text-teal-700">{totalUploads}</div>
                      </div>
                    </motion.div>
                    <motion.div 
                      whileHover={{ scale: 1.05 }}
                      className="rounded-lg sm:rounded-xl p-0.5 sm:p-1 bg-gradient-to-r from-blue-400 to-teal-400"
                    >
                      <div className="rounded-lg sm:rounded-xl bg-white p-2 sm:p-3 md:p-4 text-center">
                        <div className="text-[10px] sm:text-xs text-blue-700 font-semibold">Lost</div>
                        <div className="text-lg sm:text-xl md:text-2xl font-bold text-blue-700">{myLostItems.length}</div>
                      </div>
                    </motion.div>
                    <motion.div 
                      whileHover={{ scale: 1.05 }}
                      className="rounded-lg sm:rounded-xl p-0.5 sm:p-1 bg-gradient-to-r from-emerald-400 to-teal-400"
                    >
                      <div className="rounded-lg sm:rounded-xl bg-white p-2 sm:p-3 md:p-4 text-center">
                        <div className="text-[10px] sm:text-xs text-emerald-700 font-semibold">Found</div>
                        <div className="text-lg sm:text-xl md:text-2xl font-bold text-emerald-700">{myFoundItems.length}</div>
                      </div>
                    </motion.div>
                  </div>
                  
                  <div className="pt-2">
                    <motion.button 
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => setIsEditOpen(true)} 
                      className="w-full px-3 sm:px-4 py-2.5 sm:py-3 rounded-lg sm:rounded-xl bg-gradient-to-r from-teal-500 to-sky-500 text-white text-sm sm:text-base font-semibold hover:shadow-lg transition-all duration-200"
                    >
                      🔐 Change Password
                    </motion.button>
                  </div>
                </div>
              </div>
            </motion.aside>

            {/* Content */}
            <motion.section 
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="lg:col-span-3"
            >
              <div className="rounded-lg sm:rounded-xl md:rounded-2xl bg-white shadow-lg overflow-hidden border border-gray-200">
                <div className="px-3 sm:px-4 md:px-6 py-3 sm:py-4 border-b bg-gradient-to-r from-teal-500 to-sky-500 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-3">
                  <div>
                    <h2 className="text-base sm:text-lg font-bold text-white">📋 My Items</h2>
                    <p className="text-xs sm:text-sm text-white/90">All your Lost and Found submissions</p>
                  </div>
                  <div className="flex items-center gap-2 sm:gap-3 w-full sm:w-auto">
                    <button
                      onClick={loadItems}
                      disabled={loading}
                      className="flex-1 sm:flex-none px-3 py-1.5 rounded-lg bg-white/20 hover:bg-white/30 text-white border border-white/30 text-xs sm:text-sm font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                      title="Refresh items"
                    >
                      {loading ? '⏳' : '🔄 Refresh'}
                    </button>
                    <span className="text-xs sm:text-sm px-2 sm:px-3 py-1 rounded-full bg-white/20 text-white border border-white/30 whitespace-nowrap">{totalUploads} items</span>
                  </div>
                </div>
                <div className="px-2 sm:px-4 md:px-6 py-4 sm:py-6 custom-scrollbar max-h-[60vh] sm:max-h-[70vh] md:max-h-none overflow-y-auto">
                  {loading ? (
                    <div className="flex items-center justify-center py-12">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-500"></div>
                      <span className="ml-3 text-gray-500">Loading your items…</span>
                    </div>
                  ) : (
                  (() => {
                    const combined = [
                      ...myLostItems.map((it) => ({
                        id: it.id,
                        item_name: it.item_name,
                        location: it.location,
                        dateLabel: 'Date Lost',
                        dateValue: it.date_lost,
                        created_at: it.created_at,
                        status: it.status,
                        type: 'Lost',
                        image: it.image
                      })),
                      ...myFoundItems.map((it) => ({
                        id: it.id,
                        item_name: it.item_name,
                        location: it.location,
                        dateLabel: 'Date Found',
                        dateValue: it.date_found,
                        created_at: it.created_at,
                        status: it.status,
                        type: 'Found',
                        image: it.image
                      }))
                    ];
                    const total = combined.length;
                    if (total === 0) {
                      return (
                        <div className="text-center py-12">
                          <div className="text-6xl mb-4">📦</div>
                          <p className="text-lg text-gray-500">No items uploaded yet.</p>
                          <p className="text-sm text-gray-400 mt-2">Start by reporting a lost or found item!</p>
                        </div>
                      );
                    }
                    return (
                      <section>
                        {/* Desktop Table View */}
                        <div className="hidden md:block overflow-auto rounded-lg border border-gray-200 custom-scrollbar">
                          <table className="min-w-full">
                            <thead className="bg-gradient-to-r from-teal-500 to-sky-500 text-white">
                              <tr>
                                <th className="text-left p-3 sm:p-4 text-xs font-bold uppercase tracking-wide">#</th>
                                <th className="text-left p-3 sm:p-4 text-xs font-bold uppercase tracking-wide">Item</th>
                                <th className="text-left p-3 sm:p-4 text-xs font-bold uppercase tracking-wide">Type</th>
                                <th className="text-left p-3 sm:p-4 text-xs font-bold uppercase tracking-wide">Location</th>
                                <th className="text-left p-3 sm:p-4 text-xs font-bold uppercase tracking-wide">Date</th>
                                <th className="text-left p-3 sm:p-4 text-xs font-bold uppercase tracking-wide">Status</th>
                                <th className="text-center p-3 sm:p-4 text-xs font-bold uppercase tracking-wide">Actions</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                              {combined.map((item, idx) => (
                                <motion.tr
                                  key={`${item.type}-${item.id}`}
                                  initial={{ opacity: 0, y: 10 }}
                                  animate={{ opacity: 1, y: 0 }}
                                  transition={{ delay: idx * 0.05 }}
                                  className={`transition-colors hover:bg-gray-50 ${
                                    item.type === 'Lost'
                                      ? 'border-l-4 border-blue-400 bg-blue-50/30'
                                      : 'border-l-4 border-teal-400 bg-teal-50/30'
                                  }`}
                                >
                                  <td className="p-3 sm:p-4 text-sm text-gray-700 font-medium">{idx + 1}</td>
                                  <td className="p-3 sm:p-4 text-sm font-semibold text-gray-900">
                                    <div className="flex items-center gap-2 sm:gap-3">
                                      {item.image && (
                                        <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg overflow-hidden border border-gray-200 bg-gray-100 flex-shrink-0">
                                          <img 
                                            src={typeof item.image === 'string' ? item.image : URL.createObjectURL(item.image)} 
                                            alt={item.item_name || 'Item'} 
                                            className="w-full h-full object-cover"
                                          />
                                        </div>
                                      )}
                                      <span className="truncate max-w-[150px] sm:max-w-none">{item.item_name}</span>
                                    </div>
                                  </td>
                                  <td className="p-3 sm:p-4 text-sm">
                                    <span className={`inline-flex items-center px-2 sm:px-3 py-1 rounded-full text-xs font-bold ${
                                      item.type === 'Lost' 
                                        ? 'bg-blue-500 text-white' 
                                        : 'bg-teal-500 text-white'
                                    }`}>
                                      {item.type}
                                    </span>
                                  </td>
                                  <td className="p-3 sm:p-4 text-sm text-gray-800 truncate max-w-[120px]">{item.location}</td>
                                  <td className="p-3 sm:p-4 text-sm text-gray-800">{item.dateValue}</td>
                                  <td className="p-3 sm:p-4 text-sm">
                                    <span className={`inline-flex items-center px-2 sm:px-3 py-1 rounded-full text-xs font-bold capitalize ${
                                      item.status === 'active' ? 'bg-green-500 text-white' :
                                      item.status === 'found' ? 'bg-blue-500 text-white' :
                                      item.status === 'returned' ? 'bg-purple-500 text-white' :
                                      item.status === 'inactive' ? 'bg-gray-500 text-white' :
                                      'bg-gray-500 text-white'
                                    }`}>
                                      {item.type === 'Found' && item.status === 'returned'
                                        ? (foundIdConfirmedByOwner.has(item.id) ? 'returned' : 'pending')
                                        : item.status}
                                    </span>
                                  </td>
                                  <td className="p-3 sm:p-4 text-sm">
                                    <div className="flex gap-1 justify-center">
                                      {item.status === 'active' && (
                                        <>
                                          {item.type === 'Lost' ? (
                                            <button
                                              onClick={() => handleStatusChange('Lost', item.id, 'found')}
                                              disabled={statusUpdating[`Lost-${item.id}`]}
                                              className="px-2 py-1 text-xs font-medium text-white bg-blue-500 rounded hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
                                              title="Mark as found"
                                            >
                                              {statusUpdating[`Lost-${item.id}`] ? '⏳' : '✅'}
                                            </button>
                                          ) : (
                                            <button
                                              onClick={() => handleStatusChange('Found', item.id, 'returned')}
                                              disabled={statusUpdating[`Found-${item.id}`]}
                                              className="px-2 py-1 text-xs font-medium text-white bg-purple-500 rounded hover:bg-purple-600 disabled:opacity-50 disabled:cursor-not-allowed"
                                              title="Mark as returned"
                                            >
                                              {statusUpdating[`Found-${item.id}`] ? '⏳' : '↩️'}
                                            </button>
                                          )}
                                          <button
                                            onClick={() => deleteItem(item.type, item.id)}
                                            disabled={statusUpdating[`${item.type}-${item.id}`]}
                                            className="px-2 py-1 text-xs font-medium text-white bg-red-600 rounded hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
                                            title="Delete item"
                                          >
                                            {statusUpdating[`${item.type}-${item.id}`] ? '⏳' : '🗑️'}
                                          </button>
                                        </>
                                      )}
                                      {item.type === 'Lost' && item.status !== 'inactive' && lostIdHasReturnedMatch.has(item.id) && (
                                        <button
                                          onClick={async () => {
                                            const key = `Lost-${item.id}`;
                                            setStatusUpdating(prev => ({ ...prev, [key]: true }));
                                            try {
                                              // 1) Inactivate the lost item (owner confirm)
                                              await updateItemStatus('Lost', item.id, 'inactive');
                                              // 2) Also inactivate any related returned found items so they never match again
                                              const relatedFoundIds = Array.from(lostIdToReturnedFoundIds.get(item.id) || []);
                                              for (const fid of relatedFoundIds) {
                                                try {
                                                  await api.updateFoundItemStatus(fid, 'inactive');
                                                  setFoundItems(prev => prev.map(fi => fi.id === fid ? { ...fi, status: 'inactive' } : fi));
                                                } catch (e) {
                                                  console.error('[CONFIRM] Failed to inactivate found item', fid, e);
                                                }
                                              }
                                            } finally {
                                              setStatusUpdating(prev => ({ ...prev, [key]: false }));
                                            }
                                          }}
                                          disabled={statusUpdating[`Lost-${item.id}`]}
                                          className="px-2 py-1 text-xs font-medium text-white bg-emerald-600 rounded hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                          {statusUpdating[`Lost-${item.id}`] ? '⏳' : '✅ Received'}
                                        </button>
                                      )}
                                      {(item.status === 'found' || item.status === 'returned' || item.status === 'inactive') && (
                                        <button
                                          onClick={() => handleStatusChange(item.type, item.id, 'active')}
                                          disabled={statusUpdating[`${item.type}-${item.id}`]}
                                          className="px-2 py-1 text-xs font-medium text-white bg-green-500 rounded hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                          {statusUpdating[`${item.type}-${item.id}`] ? '⏳' : '🔄 Reopen'}
                                        </button>
                                      )}
                                    </div>
                                  </td>
                                </motion.tr>
                              ))}
                            </tbody>
                          </table>
                        </div>

                        {/* Mobile Card View */}
                        <div className="md:hidden space-y-3 custom-scrollbar max-h-[50vh] sm:max-h-[60vh] overflow-y-auto">
                          {combined.map((item, idx) => (
                            <motion.div
                              key={`${item.type}-${item.id}`}
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ delay: idx * 0.05 }}
                              className={`rounded-lg border-2 p-3 sm:p-4 ${
                                item.type === 'Lost'
                                  ? 'border-blue-400 bg-blue-50/30'
                                  : 'border-teal-400 bg-teal-50/30'
                              }`}
                            >
                              <div className="flex items-start gap-3 mb-3">
                                {item.image && (
                                  <div className="w-16 h-16 rounded-lg overflow-hidden border border-gray-200 bg-gray-100 flex-shrink-0">
                                    <img 
                                      src={typeof item.image === 'string' ? item.image : URL.createObjectURL(item.image)} 
                                      alt={item.item_name || 'Item'} 
                                      className="w-full h-full object-cover"
                                    />
                                  </div>
                                )}
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-start justify-between gap-2 mb-1">
                                    <h3 className="text-base font-semibold text-gray-900 truncate">{item.item_name}</h3>
                                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold flex-shrink-0 ${
                                      item.type === 'Lost' 
                                        ? 'bg-blue-500 text-white' 
                                        : 'bg-teal-500 text-white'
                                    }`}>
                                      {item.type}
                                    </span>
                                  </div>
                                  <p className="text-xs text-gray-600 mb-2">📍 {item.location}</p>
                                  <div className="flex flex-wrap items-center gap-2 text-xs text-gray-500">
                                    <span>📅 {item.dateLabel}: {item.dateValue}</span>
                                  </div>
                                </div>
                              </div>
                              <div className="flex items-center justify-between pt-2 border-t border-gray-200">
                                <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-bold capitalize ${
                                  item.status === 'active' ? 'bg-green-500 text-white' :
                                  item.status === 'found' ? 'bg-blue-500 text-white' :
                                  item.status === 'returned' ? 'bg-purple-500 text-white' :
                                  item.status === 'inactive' ? 'bg-gray-500 text-white' :
                                  'bg-gray-500 text-white'
                                }`}>
                                  {item.type === 'Found' && item.status === 'returned'
                                    ? (foundIdConfirmedByOwner.has(item.id) ? 'returned' : 'pending')
                                    : item.status}
                                </span>
                                <div className="flex gap-2">
                                  {item.status === 'active' && (
                                    <>
                                      {item.type === 'Lost' ? (
                                        <button
                                          onClick={() => handleStatusChange('Lost', item.id, 'found')}
                                          disabled={statusUpdating[`Lost-${item.id}`]}
                                          className="px-3 py-1.5 text-xs font-medium text-white bg-blue-500 rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                          {statusUpdating[`Lost-${item.id}`] ? '⏳' : '✅ Found'}
                                        </button>
                                      ) : (
                                        <button
                                          onClick={() => handleStatusChange('Found', item.id, 'returned')}
                                          disabled={statusUpdating[`Found-${item.id}`]}
                                          className="px-3 py-1.5 text-xs font-medium text-white bg-purple-500 rounded-lg hover:bg-purple-600 disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                          {statusUpdating[`Found-${item.id}`] ? '⏳' : '↩️ Returned'}
                                        </button>
                                      )}
                                      <button
                                        onClick={() => deleteItem(item.type, item.id)}
                                        disabled={statusUpdating[`${item.type}-${item.id}`]}
                                        className="px-3 py-1.5 text-xs font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
                                      >
                                        {statusUpdating[`${item.type}-${item.id}`] ? '⏳' : '🗑️'}
                                      </button>
                                    </>
                                  )}
                                  {item.status !== 'active' && (
                                    <button
                                      onClick={() => deleteItem(item.type, item.id)}
                                      disabled={statusUpdating[`${item.type}-${item.id}`]}
                                      className="px-3 py-1.5 text-xs font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                      {statusUpdating[`${item.type}-${item.id}`] ? '⏳' : '🗑️ Delete'}
                                    </button>
                                  )}
                                </div>
                              </div>
                            </motion.div>
                          ))}
                        </div>
                      </section>
                    );
                    })()
                  )}
                </div>
              </div>
            </motion.section>
          </div>
          </div>
        )}

        {/* Minimized State Indicator */}
        {isMinimized && (
          <div className="p-4 bg-gray-100 border-t border-gray-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-teal-500 flex items-center justify-center text-white text-sm font-bold">
                  {(currentUser?.username?.[0] || currentUser?.email?.[0] || '?').toUpperCase()}
                </div>
                <div>
                  <div className="text-sm font-semibold text-gray-800">Profile Management</div>
                  <div className="text-xs text-gray-500">Minimized - Click to restore</div>
                </div>
              </div>
              <button
                onClick={handleRestore}
                className="px-3 py-1 text-sm bg-teal-500 text-white rounded-lg hover:bg-teal-600 transition-colors"
                title="Restore window"
              >
                Restore
              </button>
            </div>
          </div>
        )}

        {/* Change Password Modal */}
        <AnimatePresence>
          {isEditOpen && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
            >
              <motion.div 
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                className="w-full max-w-md rounded-2xl overflow-hidden shadow-2xl"
              >
                <div className="bg-white">
                  <div className="px-6 py-4 border-b bg-gradient-to-r from-teal-500 to-sky-500 flex items-center justify-between">
                    <h3 className="text-lg font-bold text-white">🔐 Change Password</h3>
                    <button 
                      onClick={() => setIsEditOpen(false)} 
                      className="text-white hover:bg-white/20 rounded-full p-2 transition-colors"
                    >
                      ✕
                    </button>
                  </div>
                  <form onSubmit={onChangePassword} className="p-6 space-y-4">
                    {pwdError && (
                      <motion.div 
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-sm text-red-600 bg-red-50 p-3 rounded-lg border border-red-200"
                      >
                        {pwdError}
                      </motion.div>
                    )}
                    {pwdSuccess && (
                      <motion.div 
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-sm text-green-600 bg-green-50 p-3 rounded-lg border border-green-200"
                      >
                        {pwdSuccess}
                      </motion.div>
                    )}
                    
                    <div>
                      <label className="block text-sm text-gray-700 mb-2 font-medium">Old Password</label>
                      <div className="relative">
                        <input 
                          autoFocus 
                          type={showPwd.old ? 'text' : 'password'} 
                          value={pwd.old} 
                          onChange={(e) => setPwd({ ...pwd, old: e.target.value })} 
                          className="w-full border border-gray-300 rounded-lg px-4 py-3 pr-12 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500" 
                        />
                        <button 
                          type="button" 
                          onClick={() => setShowPwd({ ...showPwd, old: !showPwd.old })} 
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                        >
                          {showPwd.old ? '👁️' : '👁️‍🗨️'}
                        </button>
                      </div>
                    </div>
                    
                    <div>
                      <label className="block text-sm text-gray-700 mb-2 font-medium">New Password</label>
                      <div className="relative">
                        <input 
                          type={showPwd.next ? 'text' : 'password'} 
                          value={pwd.next} 
                          onChange={(e) => setPwd({ ...pwd, next: e.target.value })} 
                          className="w-full border border-gray-300 rounded-lg px-4 py-3 pr-12 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500" 
                        />
                        <button 
                          type="button" 
                          onClick={() => setShowPwd({ ...showPwd, next: !showPwd.next })} 
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                        >
                          {showPwd.next ? '👁️' : '👁️‍🗨️'}
                        </button>
                      </div>
                    </div>
                    
                    <div>
                      <label className="block text-sm text-gray-700 mb-2 font-medium">Confirm Password</label>
                      <div className="relative">
                        <input 
                          type={showPwd.confirm ? 'text' : 'password'} 
                          value={pwd.confirm} 
                          onChange={(e) => setPwd({ ...pwd, confirm: e.target.value })} 
                          className="w-full border border-gray-300 rounded-lg px-4 py-3 pr-12 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500" 
                        />
                        <button 
                          type="button" 
                          onClick={() => setShowPwd({ ...showPwd, confirm: !showPwd.confirm })} 
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                        >
                          {showPwd.confirm ? '👁️' : '👁️‍🗨️'}
                        </button>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-end gap-3 pt-4">
                      <motion.button 
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        type="submit" 
                        disabled={pwdSaving} 
                        className="px-6 py-3 rounded-lg bg-gradient-to-r from-teal-500 to-sky-500 text-white font-semibold hover:shadow-lg disabled:opacity-60 transition-all duration-200"
                      >
                        {pwdSaving ? 'Updating…' : 'Update Password'}
                      </motion.button>
                    </div>
                  </form>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
      
      {/* Feedback Modal */}
      <AnimatePresence>
        {showFeedbackModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
            onClick={() => setShowFeedbackModal(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-gradient-to-br from-white to-teal-50 rounded-2xl p-6 max-w-md w-full shadow-2xl border border-teal-100"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-xl font-bold text-gray-900">
                  {showFeedbackModal.newStatus === 'found' ? '🎉 Found it!' : '🤝 Returned it!'}
                </h3>
                <button
                  onClick={() => { setShowFeedbackModal(null); setFeedback(''); setFeedbackRating(0); setSelectedEmojis([]); }}
                  className="text-gray-400 hover:text-gray-600"
                  aria-label="Close feedback"
                >
                  ✕
                </button>
              </div>
              <p className="text-gray-600 mb-4">
                {showFeedbackModal.newStatus === 'found' 
                  ? 'Apna experience share karein — dusre users ke liye helpful hoga.'
                  : 'Return experience share karein — community ko motivate karta hai!'}
              </p>

              {/* Emoji picker */}
              {(() => {
                const emojiOptions = ['😀','🥳','🙏','❤️','👍','🎉','🙌','💯'];
                const toggleEmoji = (em) => {
                  setSelectedEmojis((prev) => prev.includes(em) ? prev.filter(e => e !== em) : [...prev, em]);
                };
                return (
                  <div className="mb-4">
                    <div className="text-sm font-medium text-gray-700 mb-2">Feeling</div>
                    <div className="flex flex-wrap gap-2">
                      {emojiOptions.map((em) => (
                        <button
                          key={em}
                          type="button"
                          onClick={() => toggleEmoji(em)}
                          className={`px-3 py-2 rounded-xl border transition ${selectedEmojis.includes(em) ? 'bg-teal-500 text-white border-teal-500' : 'bg-white text-gray-700 border-gray-200 hover:border-teal-300'}`}
                        >
                          {em}
                        </button>
                      ))}
                    </div>
                  </div>
                );
              })()}

              {/* Star Rating */}
              <div className="mb-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700">Rate your experience</span>
                  <span className="text-xs text-gray-500">{feedbackRating || 0}/5</span>
                </div>
                <div className="mt-2 flex gap-1">
                  {[1,2,3,4,5].map((r) => (
                    <button
                      key={r}
                      type="button"
                      onClick={() => setFeedbackRating(r)}
                      className="text-2xl"
                      aria-label={`Rate ${r}`}
                    >
                      <span className={r <= feedbackRating ? 'text-yellow-400' : 'text-gray-300'}>★</span>
                    </button>
                  ))}
                </div>
              </div>
              
              <textarea
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                placeholder="Share your feedback... (optional)"
                className="w-full p-3 border border-gray-200 rounded-xl bg-white/70 backdrop-blur resize-none h-24 focus:ring-2 focus:ring-teal-500 focus:border-transparent"
              />
              
              <div className="flex gap-3 mt-4">
                <button
                  onClick={() => updateItemStatus(
                    showFeedbackModal.itemType, 
                    showFeedbackModal.itemId, 
                    showFeedbackModal.newStatus,
                    `${feedback}${selectedEmojis.length ? ' ' + selectedEmojis.join(' ') : ''}${feedbackRating ? ` (Rating: ${feedbackRating}/5)` : ''}`
                  )}
                  disabled={statusUpdating[`${showFeedbackModal.itemType}-${showFeedbackModal.itemId}`]}
                  className="flex-1 bg-teal-600 text-white py-2 px-4 rounded-xl hover:bg-teal-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium shadow"
                >
                  {statusUpdating[`${showFeedbackModal.itemType}-${showFeedbackModal.itemId}`] 
                    ? '⏳ Updating...' 
                    : `✅ Mark as ${showFeedbackModal.newStatus}`}
                </button>
                <button
                  onClick={() => {
                    setShowFeedbackModal(null);
                    setFeedback('');
                    setFeedbackRating(0);
                    setSelectedEmojis([]);
                  }}
                  className="px-4 py-2 text-gray-700 border border-gray-200 rounded-xl hover:bg-white"
                >
                  Cancel
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}


