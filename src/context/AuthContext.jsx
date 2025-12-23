import { createContext, useContext, useState, useEffect } from 'react';
import ApiService from '../services/api';

const AuthContext = createContext(); // ✅ named export AuthContext

// Custom hook for using AuthContext
export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Persist user and token in localStorage
  function persistUser(user, token) {
    if (user && token) {
      localStorage.setItem('auth_user', JSON.stringify(user));
      localStorage.setItem('auth_token', token);
    } else {
      localStorage.removeItem('auth_user');
      localStorage.removeItem('auth_token');
    }
  }

  // Signup function
  async function signup(email, password) {
    try {
      const response = await ApiService.register({ username: email, email, password });

      // Email verification flow
      return {
        success: true,
        message: response.message,
        emailSent: !!response.email_sent,
        user: response.user || null
      };
    } catch (error) {
      console.error('AuthContext: Signup error:', error);
      throw error;
    }
  }

  // Login function
  async function login(email, password) {
    try {
      const response = await ApiService.login({ username: email, password });

      if (response?.token) {
        const user = {
          id: response.user.id,
          email: response.user.email,
          username: response.user.username
        };
        setCurrentUser(user);
        persistUser(user, response.token);
        return user;
      } else {
        throw new Error('Invalid credentials');
      }
    } catch (error) {
      console.error('AuthContext: Login error:', error);
      throw error;
    }
  }

  // Logout
  function logout() {
    setCurrentUser(null);
    persistUser(null, null);
  }

  // Update profile
  async function updateProfile(updates) {
    if (!currentUser) throw new Error('Not authenticated');
    const updated = await ApiService.updateUser(currentUser.id, updates);

    const newUser = {
      id: updated.id || currentUser.id,
      email: updated.email || currentUser.email,
      username: updated.username || currentUser.username,
      first_name: updated.first_name || currentUser.first_name,
      last_name: updated.last_name || currentUser.last_name
    };

    setCurrentUser(newUser);
    const token = localStorage.getItem('auth_token');
    persistUser(newUser, token);
    return newUser;
  }

  // Change password
  async function changePassword(oldPassword, newPassword, confirmPassword) {
    return await ApiService.changePassword(oldPassword, newPassword, confirmPassword);
  }

  // Load user from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem('auth_user');
    const token = localStorage.getItem('auth_token');

    if (stored && token) {
      try {
        setCurrentUser(JSON.parse(stored));
      } catch {
        localStorage.removeItem('auth_user');
        localStorage.removeItem('auth_token');
      }
    }
    setLoading(false);
  }, []);

  const value = { currentUser, signup, login, logout, updateProfile, changePassword };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}

// ✅ Default export optional, named export already exists
export { AuthContext };
