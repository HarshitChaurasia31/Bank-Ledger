import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Shield, Mail, Lock, ArrowRight, AlertCircle, Loader2, Eye, EyeOff } from 'lucide-react';
import { authApi, ApiError } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { validateEmail } from '../utils/validation';

export function AdminLoginPage() {
  const navigate = useNavigate();
  const { rateLimitCooldown } = useAuth();

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

    // 2. Password check
    if (!password) {
      setPasswordError('Password is required.');
      hasValidationError = true;
    }

    if (hasValidationError) {
      return;
    }

    setIsSubmitting(true);

    try {
      await authApi.systemLogin({
        email: email.trim().toLowerCase(),
        password,
      });

      // On success, backend sets HTTP-only cookie; navigate to admin dashboard
      navigate('/admin/dashboard');
    } catch (err) {
      if (err instanceof ApiError) {
        if (err.status === 401) {
          setGeneralError('Invalid email or password.');
        } else if (err.status === 403) {
          setGeneralError('Only admin users can access this area.');
        } else if (err.status === 429) {
          setGeneralError('Too many authentication attempts. Please wait for the cooldown to expire.');
        } else {
          setGeneralError('Unable to sign in. Please try again later.');
        }
      } else {
        setGeneralError('Unable to sign in. Please try again later.');
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
          background: 'rgba(14, 20, 36, 0.9)',
          boxShadow: 'var(--shadow-lg)',
          border: '1px solid rgba(16, 185, 129, 0.3)',
        }}
      >
        {/* Admin Brand Header */}
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <div
            style={{
              width: '54px',
              height: '54px',
              borderRadius: 'var(--radius-lg)',
              background: 'linear-gradient(135deg, #059669 0%, #0891b2 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 14px',
              boxShadow: '0 8px 24px rgba(16, 185, 129, 0.3)',
            }}
          >
            <Shield size={28} style={{ color: '#fff' }} />
          </div>

          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              background: 'rgba(16, 185, 129, 0.1)',
              border: '1px solid rgba(16, 185, 129, 0.25)',
              padding: '2px 10px',
              borderRadius: 'var(--radius-full)',
              fontSize: '11px',
              fontWeight: 700,
              color: '#34d399',
              textTransform: 'uppercase',
              letterSpacing: '0.06em',
              marginBottom: '10px',
            }}
          >
            System Administration
          </div>

          <h2 style={{ fontSize: 'clamp(20px, 4.5vw, 24px)', fontWeight: 800, marginBottom: '4px' }}>
            Lena Dena <span style={{ color: 'var(--primary)' }}>Console</span>
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>
            Restricted portal for authorized system administrators.
          </p>
        </div>

        {/* Error Alert */}
        {generalError && (
          <div className="alert alert-danger" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <AlertCircle size={16} style={{ flexShrink: 0 }} />
            <span>{generalError}</span>
          </div>
        )}

        {/* Admin Login Form */}
        <form onSubmit={handleSubmit} noValidate>
          <div className="form-group">
            <label className="form-label" htmlFor="admin-email">Administrator Email</label>
            <div className="input-with-icon">
              <Mail size={16} className="input-icon" />
              <input
                id="admin-email"
                type="email"
                value={email}
                onChange={handleEmailChange}
                placeholder="admin@lenadena.bank"
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

          <div className="form-group" style={{ marginBottom: '24px' }}>
            <label className="form-label" htmlFor="admin-password">Master Password</label>
            <div className="input-with-icon" style={{ position: 'relative' }}>
              <Lock size={16} className="input-icon" />
              <input
                id="admin-password"
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
                <span>Authenticating Console...</span>
              </>
            ) : rateLimitCooldown > 0 ? (
              <span>Rate Limit Active ({rateLimitCooldown}s)</span>
            ) : (
              <>
                <span>Admin Login</span>
                <ArrowRight size={16} />
              </>
            )}
          </button>
        </form>

        {/* Navigation Link to Normal Banking */}
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
          Customer looking for regular banking?{' '}
          <Link
            to="/login"
            style={{ color: 'var(--primary)', fontWeight: 600, textDecoration: 'none' }}
          >
            Customer Sign In
          </Link>
        </div>
      </div>
    </div>
  );
}
