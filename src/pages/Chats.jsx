import React, { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

export default function Chats() {
  const [matches, setMatches] = useState([]);
  const [selectedMatchId, setSelectedMatchId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [showStickers, setShowStickers] = useState(false);
  const navigate = useNavigate();

  const stickers = useMemo(() => [
    '😀','😂','😍','😇','😎','🤩','🥳','🙏','🤝','👏','🎉','🔥','💯','💖','💘','💫','🌟','✨','✅','☕','🍀','🥰','😌','😺','🤗','🫶'
  ], []);

  useEffect(() => {
    let isMounted = true;
    (async () => {
      try {
        setLoading(true);
        const data = await api.getMatches();
        if (isMounted) {
          setMatches(Array.isArray(data) ? data : []);
          if (Array.isArray(data) && data.length > 0) {
            setSelectedMatchId(data[0].id);
          }
        }
      } catch (e) {
        // noop
      } finally {
        if (isMounted) setLoading(false);
      }
    })();
    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    let isMounted = true;
    if (!selectedMatchId) return;
    (async () => {
      try {
        const data = await api.getChatMessages(selectedMatchId);
        if (isMounted) setMessages(Array.isArray(data) ? data : []);
      } catch (e) {
        // noop
      }
    })();
    return () => {
      isMounted = false;
    };
  }, [selectedMatchId]);

  const selectedMatch = useMemo(
    () => matches.find(m => m.id === selectedMatchId) || null,
    [matches, selectedMatchId]
  );

  async function sendMessage(content) {
    if (!content.trim() || !selectedMatchId) return;
    try {
      setSending(true);
      setIsTyping(true);
      const created = await api.sendChatMessage(selectedMatchId, content.trim());
      setMessages(prev => [...prev, created]);
      setTimeout(() => setIsTyping(false), 800);
    } catch (e) {
      // noop
    } finally {
      setSending(false);
    }
  }

  async function handleSend(e) {
    e.preventDefault();
    const content = newMessage;
    setNewMessage('');
    await sendMessage(content);
  }

  async function handleSendSticker(emoji) {
    setShowStickers(false);
    await sendMessage(emoji);
  }

  function handleClose() {
    navigate(-1);
  }

  const isStickerMessage = (text) => stickers.includes(text) && text.length <= 3;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/20 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.98, y: 8 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="w-full max-w-4xl bg-neutral-100 rounded-lg sm:rounded-xl md:rounded-2xl shadow-2xl border border-gray-200 overflow-hidden h-[90vh] sm:h-[95vh] md:h-auto max-h-[95vh] md:max-h-none"
        role="dialog"
        aria-modal="true"
        aria-labelledby="chat-window-title"
      >
        {/* Window Header */}
        <div className="flex items-center justify-between px-3 sm:px-4 py-2 sm:py-3 bg-white border-b">
          <h2 id="chat-window-title" className="text-sm sm:text-base font-semibold text-gray-800">Chats</h2>
          <button
            onClick={handleClose}
            className="inline-flex items-center justify-center w-8 h-8 sm:w-9 sm:h-9 rounded-full hover:bg-gray-100 text-gray-500"
            aria-label="Close chat"
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <div className="px-1 sm:px-2 md:px-4 py-1 sm:py-2 md:py-3">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-2 sm:gap-3 md:gap-4 h-[calc(90vh-100px)] sm:h-[calc(90vh-110px)] md:h-[65vh]">
            {/* Matches Sidebar */}
            <motion.aside 
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              className={`lg:col-span-1 bg-white rounded-lg sm:rounded-xl shadow border border-gray-200 overflow-hidden flex flex-col ${
                selectedMatchId ? 'hidden lg:flex' : 'flex'
              }`}
            >
              <div className="bg-gradient-to-r from-teal-400 to-sky-400 p-2 sm:p-3 flex-shrink-0">
                <h3 className="text-white font-medium text-xs sm:text-sm">🔍 Matches</h3>
              </div>
              <div className="flex-1 overflow-auto max-h-[35vh] sm:max-h-[45vh] md:max-h-none custom-scrollbar">
                {loading ? (
                  <div className="p-4 text-center">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-teal-500 mx-auto"></div>
                    <p className="text-xs text-gray-500 mt-2">Loading matches...</p>
                  </div>
                ) : matches.length === 0 ? (
                  <div className="p-4 text-center text-gray-500">
                    <div className="text-3xl mb-1">😔</div>
                    <p className="text-sm">No matches yet</p>
                  </div>
                ) : (
                  <AnimatePresence>
                    {matches.map((m, index) => (
                      <motion.button
                        key={m.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.05 }}
                        onClick={() => setSelectedMatchId(m.id)}
                        className={`w-full text-left p-2 sm:p-3 hover:bg-gray-50 transition-colors border-l-4 ${
                          selectedMatchId === m.id 
                            ? 'bg-teal-50 border-teal-400' 
                            : 'border-transparent hover:border-teal-300'
                        }`}
                      >
                        <div className="flex items-center gap-2 sm:gap-3">
                          <div className="w-8 h-8 sm:w-9 sm:h-9 bg-gradient-to-br from-teal-400 to-sky-400 rounded-full flex items-center justify-center text-white font-semibold text-[10px] sm:text-xs flex-shrink-0">
                            {m.lost_item?.item_name?.[0] || 'L'}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="text-xs sm:text-sm font-medium text-gray-800 truncate">
                              {m.lost_item?.item_name || 'Lost Item'} ↔ {m.found_item?.item_name || 'Found Item'}
                            </div>
                            <div className="text-[10px] sm:text-xs text-gray-500 capitalize">
                              {m.match_type} • {m.status}
                            </div>
                            <div className="text-[10px] sm:text-xs text-gray-400 mt-0.5 sm:mt-1 hidden sm:block">
                              📞 {m.lost_item?.contact || 'No phone'} ↔ {m.found_item?.contact || 'No phone'}
                            </div>
                          </div>
                        </div>
                      </motion.button>
                    ))}
                  </AnimatePresence>
                )}
              </div>
            </motion.aside>

            {/* Chat Area */}
            <motion.section 
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              className={`lg:col-span-2 bg-white rounded-lg sm:rounded-xl shadow border border-gray-200 flex flex-col overflow-hidden ${
                !selectedMatchId ? 'hidden lg:flex' : 'flex'
              }`}
            >
              {/* Chat Header */}
              <div className="bg-gradient-to-r from-teal-400 to-sky-400 p-2 sm:p-3 flex items-center justify-between gap-2">
                {selectedMatch ? (
                  <>
                    {/* Back button for mobile */}
                    {selectedMatchId && (
                      <button
                        onClick={() => setSelectedMatchId(null)}
                        className="lg:hidden flex-shrink-0 w-8 h-8 flex items-center justify-center text-white hover:bg-white/20 rounded-full transition-colors"
                        aria-label="Back to matches"
                      >
                        <span className="text-lg">←</span>
                      </button>
                    )}
                    <div className="flex items-start sm:items-center gap-2 sm:gap-3 flex-1 min-w-0">
                      <div className="w-8 h-8 sm:w-10 sm:h-10 bg-white rounded-full flex items-center justify-center flex-shrink-0">
                        <span className="text-lg sm:text-xl">💬</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-white font-medium text-sm sm:text-base truncate">
                          {selectedMatch.lost_item?.item_name || 'Lost Item'} ↔ {selectedMatch.found_item?.item_name || 'Found Item'}
                        </div>
                        <div className="text-white/90 text-xs capitalize">
                          {selectedMatch.match_type} • {selectedMatch.status}
                        </div>
                        <div className="text-white/90 text-[10px] sm:text-xs mt-0.5 hidden sm:block">
                          Owner: {selectedMatch.lost_item?.posted_by?.email || '—'} • Finder: {selectedMatch.found_item?.posted_by?.email || '—'}
                        </div>
                        <div className="text-white/90 text-[10px] sm:text-xs mt-0.5 sm:mt-1 hidden sm:block">
                          📞 Owner: {selectedMatch.lost_item?.contact || 'Not provided'} • Finder: {selectedMatch.found_item?.contact || 'Not provided'}
                        </div>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="text-center text-white w-full">
                    <p className="text-xs sm:text-sm md:text-base">Select a match to start chatting</p>
                  </div>
                )}
              </div>

              {/* Messages Area */}
              <div className="flex-1 overflow-auto p-2 sm:p-3 md:p-4 space-y-2 sm:space-y-3 bg-white min-h-0 custom-scrollbar">
                {selectedMatchId && messages.length === 0 && !isTyping && (
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="text-center text-gray-500 py-4 sm:py-6"
                  >
                    <div className="text-4xl sm:text-5xl mb-2">💭</div>
                    <p className="text-sm sm:text-base">No messages yet. Say hello! 👋</p>
                  </motion.div>
                )}
                
                <AnimatePresence>
                  {messages.map((msg, index) => (
                    <motion.div
                      key={msg.id}
                      initial={{ opacity: 0, y: 8, scale: 0.98 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -8, scale: 0.98 }}
                      transition={{ delay: index * 0.03 }}
                      className="flex justify-end"
                    >
                      <div className="max-w-[85%] sm:max-w-xs md:max-w-sm lg:max-w-md">
                        {isStickerMessage(msg.message) ? (
                          <motion.div 
                            className="bg-teal-50 text-gray-800 px-3 sm:px-4 py-2 sm:py-3 rounded-xl sm:rounded-2xl rounded-br-md shadow flex items-center justify-center"
                            whileHover={{ scale: 1.02 }}
                          >
                            <span className="text-3xl sm:text-4xl leading-none">{msg.message}</span>
                          </motion.div>
                        ) : (
                          <motion.div 
                            className="bg-gradient-to-r from-teal-50 to-sky-50 text-gray-800 px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl sm:rounded-2xl rounded-br-md shadow"
                            whileHover={{ scale: 1.01 }}
                          >
                            <div className="text-[10px] sm:text-[11px] text-gray-500 mb-0.5 sm:mb-1">
                              {msg.sender?.username || 'You'}
                            </div>
                            <div className="text-xs sm:text-sm leading-relaxed break-words">{msg.message}</div>
                          </motion.div>
                        )}
                        <div className="text-[10px] sm:text-[11px] text-gray-500 mt-0.5 sm:mt-1 text-right">
                          {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>

                {/* Typing Indicator */}
                {isTyping && (
                  <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex justify-start"
                  >
                    <div className="bg-gray-100 px-3 py-2 rounded-2xl rounded-bl-md shadow border border-gray-200">
                      <div className="flex space-x-1">
                        <div className="w-2 h-2 bg-teal-500 rounded-full animate-bounce"></div>
                        <div className="w-2 h-2 bg-sky-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                        <div className="w-2 h-2 bg-emerald-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                      </div>
                    </div>
                  </motion.div>
                )}
              </div>

              {/* Message Input */}
              <motion.form 
                onSubmit={handleSend} 
                className="p-2 sm:p-3 bg-white border-t"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <div className="flex gap-1.5 sm:gap-2 items-center">
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => setShowStickers(v => !v)}
                      className="inline-flex items-center justify-center w-9 h-9 sm:w-10 sm:h-10 rounded-full border border-gray-300 text-gray-600 hover:bg-gray-50 flex-shrink-0"
                      aria-label="Open stickers"
                    >
                      <span className="text-base sm:text-lg">😊</span>
                    </button>
                    {showStickers && (
                      <div className="absolute bottom-12 left-0 z-10 w-48 sm:w-56 bg-white border border-gray-200 rounded-lg sm:rounded-xl shadow-lg p-2 grid grid-cols-6 gap-1.5 sm:gap-2">
                        {stickers.map((s) => (
                          <button
                            key={s}
                            type="button"
                            className="text-xl sm:text-2xl leading-none hover:scale-110 transition"
                            onClick={() => handleSendSticker(s)}
                            aria-label={`Send ${s}`}
                          >
                            {s}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Type your message..."
                    className="flex-1 bg-white border border-gray-300 rounded-full px-3 sm:px-4 py-2 sm:py-2.5 text-sm sm:text-base text-gray-900 placeholder-gray-400 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500 transition"
                  />
                  <motion.button
                    type="submit"
                    disabled={!selectedMatchId || sending || !newMessage.trim()}
                    className="bg-gradient-to-r from-teal-500 to-sky-500 text-white px-3 sm:px-4 md:px-5 py-2 sm:py-2.5 rounded-full disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-md transition text-sm sm:text-base flex-shrink-0"
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                  >
                    {sending ? (
                      <div className="flex items-center space-x-1 sm:space-x-2">
                        <div className="w-3 h-3 sm:w-4 sm:h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        <span className="hidden sm:inline">Sending</span>
                      </div>
                    ) : (
                      <div className="flex items-center space-x-1 sm:space-x-2">
                        <span className="hidden sm:inline">Send</span>
                        <span className="sm:hidden">📤</span>
                        <span className="hidden sm:inline">📤</span>
                      </div>
                    )}
                  </motion.button>
                </div>
              </motion.form>
            </motion.section>
          </div>
        </div>
      </motion.div>
    </div>
  );
}


