import { useEffect, useState } from 'react'
import { AuthContext } from "./context/AuthContext";

import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom'
import './App.css'
import Landing_page from './pages/Landing_page'
import SignUp from './pages/SignUp'
import Login from './pages/Login'
import Header from './components/Header'
import ReportOptions from './pages/ReportOptions'
import ReportLostItem from './pages/ReportLostItem'
import ReportFoundItem from './pages/ReportFoundItem'
import Success from './pages/Success'
import { AuthProvider, useAuth } from './context/AuthContext'
import Chats from './pages/Chats'
import Profile from './pages/Profile'
import ForgotPassword from './pages/ForgotPassword'
import ResetPassword from './pages/ResetPassword'
import EmailVerification from './pages/EmailVerification'

// Protected Route component
function ProtectedRoute({ children }) {
  const { currentUser } = useAuth();
  const location = useLocation();

  console.log("ProtectedRoute - Current Location:", location.pathname);
  console.log("ProtectedRoute - User:", currentUser ? currentUser.email : "null");

  if (!currentUser) {
    console.log("ProtectedRoute - User not logged in, redirecting to /login with state:", location.pathname);
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  console.log("ProtectedRoute - User logged in, rendering children for:", location.pathname);
  return children;
}

function App() {
  const [count, setCount] = useState(0)
  const [authModalOpen, setAuthModalOpen] = useState(false)
  const [authModalType, setAuthModalType] = useState('login') // 'login' | 'signup'

  return (
    <Router>
      <AuthProvider>
        <div className="min-h-screen">
          <Header onOpenAuthModal={(type) => { setAuthModalType(type || 'login'); setAuthModalOpen(true); }} />
          <ScrollToHash />
          <main className="pt-16"> {/* Add padding-top to account for fixed header */}
            <Routes>
              <Route path="/" element={<Landing_page />} />
              <Route path="/signup" element={<SignUp />} />
              <Route path="/login" element={<Login />} />
              <Route path="/verify-email" element={<EmailVerification />} />
              <Route path="/forgot" element={<ForgotPassword />} />
              <Route path="/reset" element={<ResetPassword />} />
              <Route path="/report-options" element={<ReportOptions />} />
              <Route 
                path="/report-lost" 
                element={
                  <ProtectedRoute>
                    <ReportLostItem />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/report-found" 
                element={
                  <ProtectedRoute>
                    <ReportFoundItem />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/success" 
                element={
                  <ProtectedRoute>
                    <Success />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/chats" 
                element={
                  <ProtectedRoute>
                    <Chats />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/profile" 
                element={
                  <ProtectedRoute>
                    <Profile />
                  </ProtectedRoute>
                } 
              />
            </Routes>
          </main>
          {authModalOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
              <div className="relative w-full max-w-md mx-4">
                <div className="absolute -inset-0.5 bg-gradient-to-r from-gray-800 via-gray-900 to-gray-800 rounded-2xl opacity-80 blur-sm"></div>
                <div className="relative bg-white/10 backdrop-blur border border-gray-700 rounded-2xl shadow-2xl p-4">
                  <button
                    aria-label="Close"
                    className="absolute top-2 right-2 text-white/80 hover:text-white"
                    onClick={() => setAuthModalOpen(false)}
                  >
                    ✕
                  </button>
                  
                  <div className="grid grid-cols-2 gap-2 mb-3">
                  <button
                    className={`px-2 py-1.5 text-sm rounded-lg border ${authModalType==='login' ? 'bg-blue-600 text-white border-blue-600' : 'border-white/30 text-white/80'}`}
                    onClick={() => setAuthModalType('login')}
                  >Login</button>
                  <button
                    className={`px-2 py-1.5 text-sm rounded-lg border ${authModalType==='signup' ? 'bg-blue-600 text-white border-blue-600' : 'border-white/30 text-white/80'}`}
                    onClick={() => setAuthModalType('signup')}
                  >Sign Up</button>
                  </div>
                  <div className="space-y-3">
                    {authModalType === 'signup' ? (
                      <SignUp embedded />
                    ) : (
                      <Login embedded onSuccess={() => setAuthModalOpen(false)} />
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </AuthProvider>
    </Router>
  )
}

export default App

// Smooth-scroll to hash sections when route changes like /#about
function ScrollToHash() {
  const location = useLocation();
  useEffect(() => {
    if (location.hash) {
      const id = location.hash.replace('#', '');
      const el = document.getElementById(id);
      if (el) {
        const y = el.getBoundingClientRect().top + window.scrollY - 70; // account for fixed header
        window.scrollTo({ top: y, behavior: 'smooth' });
      }
    }
  }, [location.hash]);
  return null;
}
