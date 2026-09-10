import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Landmark,
  Mail,
  Lock,
  User,
  ArrowRight,
  AlertCircle,
  Loader2,
  Check,
  Eye,
  EyeOff,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { ApiError } from '../api/client';
import { validateEmail, validateStrongPassword } from '../utils/validation';

export function RegisterPage() {
  const { register, rateLimitCooldown } = useAuth();
  const navigate = useNavigate();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Field-specific validation errors
  const [nameError, setNameError] = useState('');
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [generalError, setGeneralError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Live password validation state
  const passwordValidation = validateStrongPassword(password);
  const { rules: pwdRules } = passwordValidation;

  const handleNameChange = (e) => {
    setName(e.target.value);
    if (nameError) setNameError('');
    if (generalError) setGeneralError('');
  };

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

    // Reset error states
    setNameError('');
    setEmailError('');
    setPasswordError('');
    setGeneralError('');

    let hasValidationError = false;

    // 1. Name validation
    if (!name.trim()) {
      setNameError('Please enter your full name.');
      hasValidationError = true;
    }

    // 2. Email validation
    const emailResult = validateEmail(email);
    if (!emailResult.isValid) {
      setEmailError(emailResult.error);
      hasValidationError = true;
    }

    // 3. Strong password validation
    if (!passwordValidation.isValid) {
      setPasswordError(passwordValidation.error);
      hasValidationError = true;
    }

    // Block submission if any validation failed (no API request is made)
    if (hasValidationError) {
      return;
    }

    setIsSubmitting(true);

    try {
      await register({
        name: name.trim(),
        email: email.trim().toLowerCase(),
        password,
      });
      navigate('/');
    } catch (err) {
      if (err instanceof ApiError && err.status === 422) {
        setEmailError('An account with this email address already exists.');
        setGeneralError('An account with this email address already exists.');
      } else if (err instanceof ApiError && err.status === 429) {
        setGeneralError('Too many registration attempts. Please wait for the cooldown.');
      } else if (err instanceof ApiError && err.status === 400) {
        setGeneralError(err.message || 'Validation failed on server. Please check your details.');
      } else {
        setGeneralError(err.message || 'Registration failed. Please try again.');
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
          maxWidth: '460px',
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
            Open Your <span style={{ color: 'var(--primary)' }}>Account</span>
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>
            Join Lena Dena Bank. Every rupee accounted for.
          </p>
        </div>

        {/* General Error Banner (Server / API errors) */}
        {generalError && (
          <div className="alert alert-danger" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <AlertCircle size={16} style={{ flexShrink: 0 }} />
            <span>{generalError}</span>
          </div>
        )}

        {/* Registration Form */}
        <form onSubmit={handleSubmit} noValidate>
          {/* Full Name Input */}
          <div className="form-group">
            <label className="form-label" htmlFor="register-name">Full Name</label>
            <div className="input-with-icon">
              <User size={16} className="input-icon" />
              <input
                id="register-name"
                type="text"
                value={name}
                onChange={handleNameChange}
                placeholder="e.g. Rahul Sharma"
                className="form-control"
                autoComplete="name"
                style={nameError ? { borderColor: 'var(--danger)' } : {}}
              />
            </div>
            {nameError && (
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
                <span>{nameError}</span>
              </div>
            )}
          </div>

          {/* Email Address Input */}
          <div className="form-group">
            <label className="form-label" htmlFor="register-email">Email Address</label>
            <div className="input-with-icon">
              <Mail size={16} className="input-icon" />
              <input
                id="register-email"
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

          {/* Password Input */}
          <div className="form-group" style={{ marginBottom: '20px' }}>
            <label className="form-label" htmlFor="register-password">
              <span>Password</span>
              <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Must be strong</span>
            </label>
            <div className="input-with-icon" style={{ position: 'relative' }}>
              <Lock size={16} className="input-icon" />
              <input
                id="register-password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={handlePasswordChange}
                placeholder="••••••••"
                className="form-control"
                autoComplete="new-password"
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

            {/* Error Message close to Password input */}
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

            {/* Password Strength Checklist */}
            <div
              style={{
                marginTop: '10px',
                padding: '10px 12px',
                background: 'rgba(10, 15, 26, 0.6)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-md)',
                display: 'flex',
                flexDirection: 'column',
                gap: '6px',
                fontSize: '12px',
              }}
            >
              <span style={{ color: 'var(--text-muted)', fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Password Requirements:
              </span>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: '6px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: pwdRules.minLength ? '#34d399' : 'var(--text-muted)' }}>
                  <div
                    style={{
                      width: '14px',
                      height: '14px',
                      borderRadius: '50%',
                      background: pwdRules.minLength ? 'rgba(16, 185, 129, 0.2)' : 'rgba(255, 255, 255, 0.08)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    {pwdRules.minLength ? <Check size={10} style={{ color: '#34d399' }} /> : <span style={{ width: '4px', height: '4px', borderRadius: '50%', background: 'var(--text-muted)' }} />}
                  </div>
                  <span>At least 8 characters</span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: pwdRules.hasUpper ? '#34d399' : 'var(--text-muted)' }}>
                  <div
                    style={{
                      width: '14px',
                      height: '14px',
                      borderRadius: '50%',
                      background: pwdRules.hasUpper ? 'rgba(16, 185, 129, 0.2)' : 'rgba(255, 255, 255, 0.08)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    {pwdRules.hasUpper ? <Check size={10} style={{ color: '#34d399' }} /> : <span style={{ width: '4px', height: '4px', borderRadius: '50%', background: 'var(--text-muted)' }} />}
                  </div>
                  <span>One uppercase letter</span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: pwdRules.hasLower ? '#34d399' : 'var(--text-muted)' }}>
                  <div
                    style={{
                      width: '14px',
                      height: '14px',
                      borderRadius: '50%',
                      background: pwdRules.hasLower ? 'rgba(16, 185, 129, 0.2)' : 'rgba(255, 255, 255, 0.08)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    {pwdRules.hasLower ? <Check size={10} style={{ color: '#34d399' }} /> : <span style={{ width: '4px', height: '4px', borderRadius: '50%', background: 'var(--text-muted)' }} />}
                  </div>
                  <span>One lowercase letter</span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: pwdRules.hasNumber ? '#34d399' : 'var(--text-muted)' }}>
                  <div
                    style={{
                      width: '14px',
                      height: '14px',
                      borderRadius: '50%',
                      background: pwdRules.hasNumber ? 'rgba(16, 185, 129, 0.2)' : 'rgba(255, 255, 255, 0.08)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    {pwdRules.hasNumber ? <Check size={10} style={{ color: '#34d399' }} /> : <span style={{ width: '4px', height: '4px', borderRadius: '50%', background: 'var(--text-muted)' }} />}
                  </div>
                  <span>One number</span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: pwdRules.hasSpecial ? '#34d399' : 'var(--text-muted)' }}>
                  <div
                    style={{
                      width: '14px',
                      height: '14px',
                      borderRadius: '50%',
                      background: pwdRules.hasSpecial ? 'rgba(16, 185, 129, 0.2)' : 'rgba(255, 255, 255, 0.08)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    {pwdRules.hasSpecial ? <Check size={10} style={{ color: '#34d399' }} /> : <span style={{ width: '4px', height: '4px', borderRadius: '50%', background: 'var(--text-muted)' }} />}
                  </div>
                  <span>One special character</span>
                </div>
              </div>
            </div>
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
                <span>Creating Account...</span>
              </>
            ) : rateLimitCooldown > 0 ? (
              <span>Rate Limit Active ({rateLimitCooldown}s)</span>
            ) : (
              <>
                <span>Register & Open Account</span>
                <ArrowRight size={16} />
              </>
            )}
          </button>
        </form>

        {/* Login Link */}
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
          Already registered?{' '}
          <Link
            to="/login"
            style={{ color: 'var(--primary)', fontWeight: 600, textDecoration: 'none' }}
          >
            Sign In
          </Link>
        </div>
      </div>
    </div>
  );
}
