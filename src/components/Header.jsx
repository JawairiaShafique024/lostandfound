import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const Header = ({ onOpenAuthModal }) => {
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/');
      setMobileMenuOpen(false);
    } catch (error) {
      console.error('Failed to log out:', error);
    }
  };

  const handleProfileClick = () => {
    navigate('/profile');
    setMobileMenuOpen(false);
  };

  return (
    <header className="bg-white w-full fixed top-0 left-0 z-50 shadow-md py-4">
      <div className="flex items-center justify-between h-16 px-4 sm:px-6 lg:px-8">
        {/* Logo */}
        <Link to="/" className="flex items-center space-x-2 group" onClick={() => setMobileMenuOpen(false)}>
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-extrabold bg-gradient-to-r from-blue-600 to-teal-500 bg-clip-text text-transparent tracking-tight drop-shadow-md flex items-center">
            <span className="mr-1 inline-block" style={{ display: 'inline-block', animation: 'runleft 2s infinite' }}>
              {/* Larger person icon with both legs animated for running effect */}
              <svg className="w-6 h-6 sm:w-8 sm:h-8 lg:w-10 lg:h-10 text-blue-400" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="20" cy="11" r="6" fill="#60a5fa" />
                <rect x="15" y="17" width="10" height="14" rx="5" fill="#60a5fa" />
                <rect x="12" y="31" width="4" height="8" rx="2" fill="#60a5fa" className="origin-top" style={{ transformOrigin: 'top center', animation: 'legmoveleft 2s infinite' }} />
                <rect x="24" y="31" width="4" height="8" rx="2" fill="#60a5fa" className="origin-top" style={{ transformOrigin: 'top center', animation: 'legmoveright 2s infinite' }} />
                <rect x="28" y="19" width="3" height="10" rx="1.5" fill="#60a5fa" />
                <rect x="9" y="19" width="3" height="10" rx="1.5" fill="#60a5fa" />
                <style>{`
                  @keyframes runleft { 0%, 100% { transform: translateX(0); } 20% { transform: translateX(-18px); } 50% { transform: translateX(-18px); } 80% { transform: translateX(0); } }
                  @keyframes legmoveleft { 0%, 100% { transform: rotate(0deg); } 20% { transform: rotate(-30deg); } 50% { transform: rotate(-30deg); } 80% { transform: rotate(0deg); } }
                  @keyframes legmoveright { 0%, 100% { transform: rotate(0deg); } 20% { transform: rotate(30deg); } 50% { transform: rotate(30deg); } 80% { transform: rotate(0deg); } }
                `}</style>
              </svg>
            </span>
            <span className="mr-2 inline-block animate-bounce">
              <svg className="w-4 h-4 sm:w-5 sm:h-5 lg:w-7 lg:h-7 text-blue-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="2" />
                <line x1="16.65" y1="16.65" x2="21" y2="21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              </svg>
            </span>
            <span className="hidden sm:inline">Lost & Found</span>
            <span className="sm:hidden">L&F</span>
          </h1>
        </Link>
        
        {/* Desktop Navigation Links - Hidden on mobile */}
        <nav className="hidden lg:flex flex-1 items-center justify-center space-x-6 xl:space-x-8 text-lg xl:text-xl">
          <Link to="/" className="text-gray-700 hover:text-blue-600 transition-colors font-bold">Home</Link>
          <Link to="/#about" className="text-gray-700 hover:text-blue-600 transition-colors font-bold">About</Link>
          <Link to="/#faqs" className="text-gray-700 hover:text-blue-600 transition-colors font-bold">FAQs</Link>
          <Link to="/#guidelines" className="text-gray-700 hover:text-blue-600 transition-colors font-bold">Guidelines</Link>
          <Link to="/#contact" className="text-gray-700 hover:text-blue-600 transition-colors font-bold">Contact</Link>
          <Link to="/#feedback" className="text-gray-700 hover:text-blue-600 transition-colors font-bold">Feedback</Link>
          {currentUser && (
            <>
              <Link to="/profile" className="text-gray-700 hover:text-blue-600 transition-colors font-bold">Profile</Link>
              <Link to="/chats" className="text-gray-700 hover:text-blue-600 transition-colors font-bold">Chats</Link>
            </>
          )}
        </nav>
        
        {/* Desktop Auth / Avatar - Hidden on mobile */}
        <div className="hidden lg:flex items-center space-x-3 xl:space-x-4">
          {currentUser ? (
            <>
              <button
                onClick={handleProfileClick}
                aria-label="Open profile"
                className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-600 to-teal-500 text-white text-sm font-semibold flex items-center justify-center hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-blue-400"
                title={currentUser.email}
              >
                {(currentUser.username?.[0] || currentUser.email?.[0] || '?').toUpperCase()}
              </button>
              <button
                onClick={handleLogout}
                className="bg-red-500 text-white px-4 py-2 rounded-full hover:bg-red-600 transition-all duration-200 text-sm"
              >
                Logout
              </button>
            </>
          ) : (
            <>
              <button onClick={() => onOpenAuthModal && onOpenAuthModal('login')} className="border-2 border-blue-600 text-blue-600 px-4 xl:px-6 py-2 rounded-full hover:bg-gradient-to-r hover:from-blue-500 hover:to-blue-700 hover:text-white hover:border-transparent transition-all duration-200 hover:shadow-lg text-sm xl:text-base">
                Login
              </button>
              <button onClick={() => onOpenAuthModal && onOpenAuthModal('signup')} className="bg-gradient-to-r from-blue-500 to-blue-700 text-white px-4 xl:px-6 py-2 rounded-full hover:shadow-lg transform hover:scale-105 transition-all duration-200 text-sm xl:text-base">
                Sign Up
              </button>
            </>
          )}
        </div>

        {/* Mobile Menu Button */}
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="lg:hidden p-2 rounded-md text-gray-700 hover:text-blue-600 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-400"
          aria-label="Toggle menu"
        >
          {mobileMenuOpen ? (
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          ) : (
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          )}
        </button>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-t border-gray-200 bg-white shadow-lg">
          <nav className="px-4 py-4 space-y-3">
            <Link to="/" onClick={() => setMobileMenuOpen(false)} className="block text-gray-700 hover:text-blue-600 transition-colors font-bold py-2">Home</Link>
            <Link to="/#about" onClick={() => setMobileMenuOpen(false)} className="block text-gray-700 hover:text-blue-600 transition-colors font-bold py-2">About</Link>
            <Link to="/#faqs" onClick={() => setMobileMenuOpen(false)} className="block text-gray-700 hover:text-blue-600 transition-colors font-bold py-2">FAQs</Link>
            <Link to="/#guidelines" onClick={() => setMobileMenuOpen(false)} className="block text-gray-700 hover:text-blue-600 transition-colors font-bold py-2">Guidelines</Link>
            <Link to="/#contact" onClick={() => setMobileMenuOpen(false)} className="block text-gray-700 hover:text-blue-600 transition-colors font-bold py-2">Contact Us</Link>
            <Link to="/#feedback" onClick={() => setMobileMenuOpen(false)} className="block text-gray-700 hover:text-blue-600 transition-colors font-bold py-2">Feedback</Link>
            {currentUser ? (
              <>
                <Link to="/profile" onClick={() => setMobileMenuOpen(false)} className="block text-gray-700 hover:text-blue-600 transition-colors font-bold py-2">Profile</Link>
                <Link to="/chats" onClick={() => setMobileMenuOpen(false)} className="block text-gray-700 hover:text-blue-600 transition-colors font-bold py-2">Chats</Link>
                <div className="pt-3 border-t border-gray-200 space-y-3">
                  <button
                    onClick={handleProfileClick}
                    className="w-full flex items-center justify-center space-x-2 px-4 py-2 rounded-full bg-gradient-to-br from-blue-600 to-teal-500 text-white font-semibold hover:opacity-90"
                  >
                    <span className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
                      {(currentUser.username?.[0] || currentUser.email?.[0] || '?').toUpperCase()}
                    </span>
                    <span>Profile</span>
                  </button>
                  <button
                    onClick={handleLogout}
                    className="w-full bg-red-500 text-white px-4 py-2 rounded-full hover:bg-red-600 transition-all duration-200"
                  >
                    Logout
                  </button>
                </div>
              </>
            ) : (
              <div className="pt-3 border-t border-gray-200 space-y-3">
                <button onClick={() => { onOpenAuthModal && onOpenAuthModal('login'); setMobileMenuOpen(false); }} className="w-full border-2 border-blue-600 text-blue-600 px-4 py-2 rounded-full hover:bg-gradient-to-r hover:from-blue-500 hover:to-blue-700 hover:text-white hover:border-transparent transition-all duration-200">
                  Login
                </button>
                <button onClick={() => { onOpenAuthModal && onOpenAuthModal('signup'); setMobileMenuOpen(false); }} className="w-full bg-gradient-to-r from-blue-500 to-blue-700 text-white px-4 py-2 rounded-full hover:shadow-lg transform hover:scale-105 transition-all duration-200">
                  Sign Up
                </button>
              </div>
            )}
          </nav>
        </div>
      )}
    </header>
  )
}

export default Header