import React, { useEffect, useState } from 'react';
import api from '../services/api';
import { useNavigate, useLocation } from 'react-router-dom';

export default function ResetPassword() {
  const [code, setCode] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [show1, setShow1] = useState(false);
  const [show2, setShow2] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const initial = params.get('code');
    if (initial) setCode(initial);
  }, [location.search]);

  const isCodeValid = code.length === 6;

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    if (password !== confirm) {
      setError('Passwords do not match');
      return;
    }
    try {
      setLoading(true);
      await api.resetPasswordWithCode(code, password, confirm);
      navigate('/login');
    } catch (e) {
      setError(e.message || 'Failed to reset password');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow p-8">
        <h1 className="text-2xl font-bold mb-2">Reset Password</h1>
        <p className="text-sm text-gray-600 mb-6">Paste the code you received and set a new password.</p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="text"
            inputMode="numeric"
            pattern="[0-9]{6}"
            minLength={6}
            maxLength={6}
            required
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/[^0-9]/g, '').slice(0, 6))}
            placeholder="6-digit reset code"
            className="w-full border rounded-lg px-3 py-3"
            autoComplete="one-time-code"
          />
          {!isCodeValid && (
            <div className="text-xs text-red-600 mt-1">Code must be 6 digits.</div>
          )}
          <div className="relative">
            <input
              type={show1 ? 'text' : 'password'}
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="New password"
              className="w-full border rounded-lg px-3 py-3"
            />
            <button type="button" onClick={() => setShow1(v => !v)} className="absolute inset-y-0 right-3 text-gray-500">{show1 ? '🙈' : '👁️'}</button>
          </div>
          <div className="relative">
            <input
              type={show2 ? 'text' : 'password'}
              required
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              placeholder="Confirm new password"
              className="w-full border rounded-lg px-3 py-3"
            />
            <button type="button" onClick={() => setShow2(v => !v)} className="absolute inset-y-0 right-3 text-gray-500">{show2 ? '🙈' : '👁️'}</button>
          </div>
          {error && <div className="text-sm text-red-600">{error}</div>}
          <button type="submit" disabled={loading || !isCodeValid} className="w-full bg-teal-600 text-white rounded-lg py-3 disabled:opacity-60">
            {loading ? 'Resetting…' : 'Reset Password'}
          </button>
        </form>
      </div>
    </div>
  );
}


