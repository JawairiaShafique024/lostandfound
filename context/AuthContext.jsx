import { createContext, useContext, useState, useEffect } from 'react';
import ApiService from '../services/api';

const AuthContext = createContext();

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);

  function persistUser(user, token) {
    if (user && token) {
      localStorage.setItem('auth_user', JSON.stringify(user));
      localStorage.setItem('auth_token', token);
    } else {
      localStorage.removeItem('auth_user');
      localStorage.removeItem('auth_token');
    }
  }

  async function signup(email, password) {
    try {
      console.log('AuthContext: Starting signup process...');
      const response = await ApiService.register({
        username: email,
        email: email,
        password: password
      });
      
      console.log('AuthContext: API response received:', response);
      
      // New registration flow - user needs to verify email
      if (response.email_sent) {
        console.log('AuthContext: Email sent successfully');
        return {
          success: true,
          message: response.message,
          emailSent: true,
          user: response.user
        };
      } else {
        console.log('AuthContext: Email failed to send');
        return {
          success: true,
          message: response.message,
          emailSent: false,
          user: response.user
        };
      }
    } catch (error) {
      console.error('AuthContext: Signup error:', error);
      throw error;
    }
  }

  async function login(email, password) {
    try {
      const response = await ApiService.login({
        username: email,
        password: password
      });
      
      if (response.token) {
        const user = {
          id: response.user.id,
          email: response.user.email,
          username: response.user.username
        };
        setCurrentUser(user);
        persistUser(user, response.token);
        return user;
      }
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  }

  async function logout() {
    setCurrentUser(null);
    persistUser(null, null);
  }

  async function updateProfile(updates) {
    if (!currentUser) throw new Error('Not authenticated');
    const updated = await ApiService.updateUser(currentUser.id, updates);
    const newUser = {
      id: updated.id || currentUser.id,
      email: updated.email || currentUser.email,
      username: updated.username || currentUser.username,
      first_name: updated.first_name,
      last_name: updated.last_name
    };
    setCurrentUser(newUser);
    const token = localStorage.getItem('auth_token');
    persistUser(newUser, token);
    return newUser;
  }

  async function changePassword(oldPassword, newPassword, confirmPassword) {
    const result = await ApiService.changePassword(oldPassword, newPassword, confirmPassword);
    // token may be refreshed inside changePassword
    return result;
  }

  useEffect(() => {
    const stored = localStorage.getItem('auth_user');
    const token = localStorage.getItem('auth_token');
    if (stored && token) {
      try {
        setCurrentUser(JSON.parse(stored));
      } catch (_) {
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