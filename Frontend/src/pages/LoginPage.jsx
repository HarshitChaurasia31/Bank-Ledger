import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Landmark, Mail, Lock, ArrowRight, AlertCircle, Loader2, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { ApiError } from '../api/client';
import { validateEmail } from '../utils/validation';

export function LoginPage() {
  const { login, rateLimitCooldown } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [generalError, setGeneralError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleEmailChange = (e) => {
    setEmail(e.target.value);
    if (emailError) setEmailError('');
    if (generalError) setGeneralError('');
  };

  const handlePasswordChange = (e) => {
    setPassword(e.target.value);
    if (passwordError) setPasswordError('');
    if (generalError) setGeneralError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (rateLimitCooldown > 0 || isSubmitting) return;

    setEmailError('');
    setPasswordError('');
    setGeneralError('');

    let hasValidationError = false;

    // 1. Email validation
    const emailResult = validateEmail(email);
    if (!emailResult.isValid) {
      setEmailError(emailResult.error);
      hasValidationError = true;
    }

    // 2. Password presence check
    if (!password) {
      setPasswordError('Password is required.');
      hasValidationError = true;
    }

    // Abort submission if validation fails (no API request is made)
    if (hasValidationError) {
      return;
    }

    setIsSubmitting(true);

    try {
      await login({ email: email.trim().toLowerCase(), password });
      navigate('/');
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        setGeneralError('Invalid email or password. Please verify your credentials.');
      } else if (err instanceof ApiError && err.status === 429) {
        setGeneralError('Too many authentication attempts. Please wait for the cooldown to expire.');
      } else {
        setGeneralError(err.message || 'Login failed. Please check your connection.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
        width: '100%',
      }}
    >
      <div
        className="card"
        style={{
          width: '100%',
          maxWidth: '440px',
          padding: 'clamp(24px, 6vw, 36px)',
          background: 'rgba(14, 20, 36, 0.85)',
          boxShadow: 'var(--shadow-lg)',
        }}
      >
        {/* Brand Header */}
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <div
            style={{
              width: '50px',
              height: '50px',
              borderRadius: 'var(--radius-lg)',
              background: 'linear-gradient(135deg, #10b981 0%, #06b6d4 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 14px',
              boxShadow: '0 8px 20px rgba(16, 185, 129, 0.35)',
            }}
          >
            <Landmark size={26} style={{ color: '#fff' }} />
          </div>

          <h2 style={{ fontSize: 'clamp(20px, 4.5vw, 24px)', fontWeight: 800, marginBottom: '6px' }}>
            Lena Dena <span style={{ color: 'var(--primary)' }}>Bank</span>
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>
            Every rupee accounted for.
          </p>
        </div>

        {/* General Error Alert */}
        {generalError && (
          <div className="alert alert-danger" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <AlertCircle size={16} style={{ flexShrink: 0 }} />
            <span>{generalError}</span>
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit} noValidate>
          {/* Email Address */}
          <div className="form-group">
            <label className="form-label" htmlFor="login-email">Email Address</label>
            <div className="input-with-icon">
              <Mail size={16} className="input-icon" />
              <input
                id="login-email"
                type="email"
                value={email}
                onChange={handleEmailChange}
                placeholder="name@example.com"
                className="form-control"
                autoComplete="email"
                style={emailError ? { borderColor: 'var(--danger)' } : {}}
              />
            </div>
            {emailError && (
              <div
                style={{
                  color: 'var(--danger)',
                  fontSize: '12px',
                  marginTop: '4px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                }}
              >
                <AlertCircle size={13} style={{ flexShrink: 0 }} />
                <span>{emailError}</span>
              </div>
            )}
          </div>

          {/* Password */}
          <div className="form-group" style={{ marginBottom: '24px' }}>
            <label className="form-label" htmlFor="login-password">Password</label>
            <div className="input-with-icon" style={{ position: 'relative' }}>
              <Lock size={16} className="input-icon" />
              <input
                id="login-password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={handlePasswordChange}
                placeholder="••••••••"
                className="form-control"
                autoComplete="current-password"
                style={{
                  paddingRight: '40px',
                  ...(passwordError ? { borderColor: 'var(--danger)' } : {}),
                }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                title={showPassword ? 'Hide password' : 'Show password'}
                style={{
                  position: 'absolute',
                  right: '12px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'transparent',
                  border: 'none',
                  color: 'var(--text-muted)',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  padding: 0,
                }}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            {passwordError && (
              <div
                style={{
                  color: 'var(--danger)',
                  fontSize: '12px',
                  marginTop: '4px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                }}
              >
                <AlertCircle size={13} style={{ flexShrink: 0 }} />
                <span>{passwordError}</span>
              </div>
            )}
          </div>

          <button
            type="submit"
            disabled={isSubmitting || rateLimitCooldown > 0}
            className="btn btn-primary"
            style={{ width: '100%', padding: '12px' }}
          >
            {isSubmitting ? (
              <>
                <Loader2 size={16} className="animate-pulse" />
                <span>Authenticating...</span>
              </>
            ) : rateLimitCooldown > 0 ? (
              <span>Rate Limit Active ({rateLimitCooldown}s)</span>
            ) : (
              <>
                <span>Sign In to Account</span>
                <ArrowRight size={16} />
              </>
            )}
          </button>
        </form>

        {/* Registration Link */}
        <div
          style={{
            textAlign: 'center',
            marginTop: '24px',
            paddingTop: '20px',
            borderTop: '1px solid var(--border-subtle)',
            fontSize: '13px',
            color: 'var(--text-secondary)',
          }}
        >
          Don't have an account?{' '}
          <Link
            to="/register"
            style={{ color: 'var(--primary)', fontWeight: 600, textDecoration: 'none' }}
          >
            Open an Account
          </Link>
        </div>
      </div>
    </div>
  );
}
