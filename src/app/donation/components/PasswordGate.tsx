'use client';

import React, { useState, useEffect } from 'react';
import { Lock, AlertCircle, Loader2 } from 'lucide-react';

export default function PasswordGate({ children }: { children: React.ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [checking, setChecking] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const sessionAuth = sessionStorage.getItem('donation_admin_auth');
    if (sessionAuth === 'true') {
      setIsAuthenticated(true);
    }
    setChecking(false);
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    try {
      const res = await fetch('/api/donation/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password })
      });
      if (res.ok) {
        sessionStorage.setItem('donation_admin_auth', 'true');
        sessionStorage.setItem('donation_admin_pwd', password);
        setIsAuthenticated(true);
      } else {
        setError('Incorrect password. Please try again.');
      }
    } catch {
      setError('Failed to verify password. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (checking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#fcf9f6]">
        <Loader2 className="w-8 h-8 text-[#e8734a] animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-[#fcf9f6]">
        <div className="w-full max-w-md bg-white rounded-3xl p-8 border border-[#f0e6df] shadow-[0_10px_30px_rgba(232,115,74,0.05)]">
          <div className="flex flex-col items-center text-center mb-8">
            <div className="w-16 h-16 rounded-2xl bg-[#fbebe4] flex items-center justify-center text-[#e8734a] mb-4">
              <Lock className="w-8 h-8" />
            </div>
            <h1 className="text-2xl font-bold text-[#2d3436]">Admin Access</h1>
            <p className="text-sm text-[#7f8c8d] mt-1">Enter the password to access the admin panel</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-[#2d3436] mb-2">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password..."
                className="don-input w-full text-center tracking-widest text-lg font-mono focus:border-[#e8734a]"
                autoFocus
              />
            </div>

            {error && (
              <div className="flex items-center gap-2 p-3 bg-red-50 text-red-600 rounded-xl text-sm border border-red-100">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <button type="submit" disabled={submitting} className="don-btn-primary w-full py-3.5 mt-2 flex items-center justify-center gap-2 disabled:opacity-50">
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Verifying...</span>
                </>
              ) : (
                <span>Unlock Panel</span>
              )}
            </button>
          </form>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
