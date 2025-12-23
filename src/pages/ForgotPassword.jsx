import React, { useState } from 'react';
import api from '../services/api';
import { useNavigate } from 'react-router-dom';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();
    setStatus('');
    try {
      setLoading(true);
      const res = await api.requestPasswordReset(email);
      setStatus(res.status || 'If the email exists, a reset code has been sent.');
      // Direct the user to Reset page to enter the 6-digit code
      navigate('/reset');
    } catch (e) {
      setStatus('Failed to request reset.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow p-8">
        <h1 className="text-2xl font-bold mb-2">Forgot Password</h1>
        <p className="text-sm text-gray-600 mb-6">Enter your account email. We'll send a reset code.</p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email"
            className="w-full border rounded-lg px-3 py-3"
            autoComplete="email"
          />
          <button type="submit" disabled={loading} className="w-full bg-teal-600 text-white rounded-lg py-3 disabled:opacity-60">
            {loading ? 'Sending…' : 'Send Reset Code'}
          </button>
        </form>
        {status && <div className="mt-4 text-sm text-gray-700">{status}</div>}
      </div>
    </div>
  );
}


