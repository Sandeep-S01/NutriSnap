'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { logTracker } from '@/lib/logger';

interface AuthProps {
  onAuthSuccess: (session: any) => void;
}

const INPUT_STYLE: React.CSSProperties = {
  background: 'var(--surface-container-low)',
  border: '1px solid var(--outline-variant)',
  borderRadius: '0.75rem',
  padding: '12px 14px',
  color: 'var(--on-surface)',
  fontSize: '0.9rem',
  outline: 'none',
  width: '100%',
  fontFamily: 'var(--font-inter)',
  transition: 'border-color 0.2s',
};

export default function Auth({ onAuthSuccess }: AuthProps) {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    if (!supabase) {
      logTracker.warn('Auth bypass — Supabase not configured (guest demo mode)');
      setTimeout(() => {
        setLoading(false);
        onAuthSuccess({
          user: {
            id: 'demo-user',
            email: email || 'demo@nutriscan.ai',
            user_metadata: { full_name: displayName || 'Demo User' },
          },
        });
      }, 800);
      return;
    }

    try {
      if (isSignUp) {
        const { error } = await supabase.auth.signUp({
          email, password,
          options: { data: { full_name: displayName } },
        });
        if (error) throw error;
        setSuccessMsg('Check your email for a verification link!');
      } else {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        if (data.session) onAuthSuccess(data.session);
      }
    } catch (err: any) {
      logTracker.apiError('auth', err);
      setErrorMsg(err.message || 'Authentication failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleOAuth = async (provider: 'google') => {
    setLoading(true);
    setErrorMsg(null);

    if (!supabase) {
      setTimeout(() => {
        setLoading(false);
        onAuthSuccess({
          user: { id: 'demo-google', email: 'google@nutriscan.ai', user_metadata: { full_name: 'Google User' } },
        });
      }, 800);
      return;
    }

    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: { redirectTo: window.location.origin },
      });
      if (error) throw error;
    } catch (err: any) {
      setErrorMsg(err.message || 'Google sign-in failed.');
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100dvh',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'var(--background)', padding: '24px 20px',
    }}>
      <div style={{
        width: '100%', maxWidth: 400,
        background: 'var(--surface-container-lowest)',
        borderRadius: '1.5rem',
        boxShadow: '0 8px 40px rgba(100,116,139,0.12)',
        padding: '36px 28px',
      }}>

        {/* Branding */}
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <div style={{
            width: 56, height: 56, borderRadius: '1rem',
            background: 'rgba(0,110,47,0.08)',
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            marginBottom: 14,
          }}>
            <span className="material-symbols-outlined icon-fill" style={{ color: 'var(--primary)', fontSize: 30 }}>nutrition</span>
          </div>
          <div className="top-bar-logo" style={{ marginBottom: 4 }}>NutriScan</div>
          <p style={{ fontSize: 14, color: 'var(--on-surface-variant)' }}>
            {isSignUp ? 'Create your account' : 'Sign in to your account'}
          </p>
        </div>

        {/* Banners */}
        {errorMsg && (
          <div style={{
            padding: '10px 14px', borderRadius: 10, marginBottom: 16,
            background: 'var(--error-container)', color: 'var(--on-error-container)',
            fontSize: 13, fontWeight: 500, lineHeight: 1.5,
          }}>⚠️ {errorMsg}</div>
        )}
        {successMsg && (
          <div style={{
            padding: '10px 14px', borderRadius: 10, marginBottom: 16,
            background: 'rgba(0,110,47,0.08)', color: 'var(--primary)',
            border: '1px solid rgba(0,110,47,0.2)',
            fontSize: 13, fontWeight: 500, lineHeight: 1.5,
          }}>✓ {successMsg}</div>
        )}

        {/* Form */}
        <form onSubmit={handleEmailAuth} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {isSignUp && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--on-surface-variant)', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
                Full Name
              </label>
              <input
                type="text" required placeholder="John Doe" value={displayName}
                onChange={e => setDisplayName(e.target.value)}
                style={INPUT_STYLE}
                onFocus={e => (e.currentTarget.style.borderColor = 'var(--primary)')}
                onBlur={e => (e.currentTarget.style.borderColor = 'var(--outline-variant)')}
              />
            </div>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--on-surface-variant)', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
              Email
            </label>
            <input
              type="email" required placeholder="you@example.com" value={email}
              onChange={e => setEmail(e.target.value)}
              style={INPUT_STYLE}
              onFocus={e => (e.currentTarget.style.borderColor = 'var(--primary)')}
              onBlur={e => (e.currentTarget.style.borderColor = 'var(--outline-variant)')}
            />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--on-surface-variant)', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
              Password
            </label>
            <input
              type="password" required placeholder="••••••••" value={password}
              onChange={e => setPassword(e.target.value)}
              style={INPUT_STYLE}
              onFocus={e => (e.currentTarget.style.borderColor = 'var(--primary)')}
              onBlur={e => (e.currentTarget.style.borderColor = 'var(--outline-variant)')}
            />
          </div>

          <button
            type="submit" disabled={loading}
            className="btn-cta"
            style={{ marginTop: 4 }}
          >
            {loading ? (
              <div className="spinner" style={{ width: 20, height: 20, border: '2px solid rgba(255,255,255,0.4)', borderTop: '2px solid white', borderRadius: '50%' }} />
            ) : isSignUp ? 'Create Account' : 'Sign In'}
          </button>
        </form>

        {/* Divider */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '20px 0' }}>
          <div style={{ flex: 1, height: 1, background: 'var(--outline-variant)' }} />
          <span style={{ fontSize: 11, color: 'var(--outline)', fontWeight: 600, letterSpacing: '0.05em' }}>OR</span>
          <div style={{ flex: 1, height: 1, background: 'var(--outline-variant)' }} />
        </div>

        {/* Google OAuth */}
        <button
          onClick={() => handleOAuth('google')} disabled={loading}
          className="btn-outline"
          style={{ width: '100%', marginBottom: 16 }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05"/>
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335"/>
          </svg>
          Continue with Google
        </button>

        {/* Toggle */}
        <div style={{ textAlign: 'center' }}>
          <button
            onClick={() => { setIsSignUp(!isSignUp); setErrorMsg(null); setSuccessMsg(null); }}
            style={{ background: 'none', border: 'none', color: 'var(--primary)', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-inter)' }}
          >
            {isSignUp ? 'Already have an account? Sign In' : "Don't have an account? Sign Up"}
          </button>
        </div>
      </div>
    </div>
  );
}
