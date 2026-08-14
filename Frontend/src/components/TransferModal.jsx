import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Send,
  ArrowRight,
  ShieldCheck,
  AlertCircle,
  Key,
  RefreshCw,
  Loader2,
  CheckCircle2,
  Search,
  ChevronDown,
  UserCheck,
} from 'lucide-react';
import { useBank } from '../context/BankContext';
import { accountsApi, ApiError } from '../api/client';

/**
 * Mask account ID for visual presentation only (e.g. "6a7b72 •••• •••• bb00f0")
 */
function maskAccountId(id) {
  if (!id || typeof id !== 'string') return '•••• •••• •••• ••••';
  if (id.length <= 12) return id;
  return `${id.substring(0, 6)} •••• •••• ${id.substring(id.length - 6)}`;
}

/**
 * Format recipient display with optional owner name in brackets safely
 * e.g. "6a7b72 •••• •••• bb00f0 (Harshit Chaurasia)" or "6a7b72 •••• •••• bb00f0"
 */
function formatRecipientDisplay(accountId, userName) {
  const masked = maskAccountId(accountId);
  if (userName && typeof userName === 'string' && userName.trim()) {
    return `${masked} (${userName.trim()})`;
  }
  return masked;
}

export function TransferModal({ isOpen, onClose }) {
  const { accounts, activeAccount, executeTransfer } = useBank();

  // Full internal MongoDB _id strings
  const [fromAccount, setFromAccount] = useState('');
  const [toAccount, setToAccount] = useState('');
  const [toAccountName, setToAccountName] = useState('');
  const [amount, setAmount] = useState('');
  const [idempotencyKey, setIdempotencyKey] = useState('');
  const [isConfirmStep, setIsConfirmStep] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [successResult, setSuccessResult] = useState(null);

  // Dedicated source account balance state tied directly to the modal's current fromAccount
  const [sourceBalance, setSourceBalance] = useState(null);
  const [isSourceBalanceLoading, setIsSourceBalanceLoading] = useState(false);

  // Searchable Recipient State
  const [isRecipientOpen, setIsRecipientOpen] = useState(false);
  const [recipientQuery, setRecipientQuery] = useState('');
  const [recipientResults, setRecipientResults] = useState([]);
  const [isSearchingRecipients, setIsSearchingRecipients] = useState(false);
  const [recipientSearchError, setRecipientSearchError] = useState('');
  const recipientDropdownRef = useRef(null);

  // Generate UUIDv4 for idempotency
  const generateNewKey = () => {
    const newKey = crypto.randomUUID ? crypto.randomUUID() : `idemp_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    setIdempotencyKey(newKey);
  };

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      const initialAccount = activeAccount?._id || (accounts[0]?._id || '');
      setFromAccount(initialAccount);
      setToAccount('');
      setToAccountName('');
      setAmount('');
      setError('');
      setIsConfirmStep(false);
      setSuccessResult(null);
      setIsRecipientOpen(false);
      setRecipientQuery('');
      setRecipientResults([]);
      setRecipientSearchError('');
      generateNewKey();
    }
  }, [isOpen, activeAccount, accounts]);

  // Synchronize balance with the currently selected fromAccount (with stale response protection)
  useEffect(() => {
    let isCancelled = false;

    if (!isOpen || !fromAccount) {
      setSourceBalance(null);
      setIsSourceBalanceLoading(false);
      return;
    }

    // Immediately reset balance to neutral loading state when account selection changes
    setSourceBalance(null);
    setIsSourceBalanceLoading(true);

    accountsApi
      .getBalance(fromAccount)
      .then((res) => {
        if (!isCancelled) {
          if (res && typeof res.balance === 'number') {
            setSourceBalance(res.balance);
          } else {
            setSourceBalance(0);
          }
          setIsSourceBalanceLoading(false);
        }
      })
      .catch((err) => {
        if (!isCancelled) {
          console.error('Failed to fetch source account balance in modal:', err);
          setIsSourceBalanceLoading(false);
        }
      });

    return () => {
      isCancelled = true;
    };
  }, [isOpen, fromAccount]);

  // Click-outside listener for recipient dropdown
  useEffect(() => {
    function handleClickOutside(event) {
      if (
        recipientDropdownRef.current &&
        !recipientDropdownRef.current.contains(event.target)
      ) {
        setIsRecipientOpen(false);
      }
    }

    if (isRecipientOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isRecipientOpen]);

  // Debounced search for recipient accounts (300ms debounce)
  useEffect(() => {
    if (!isRecipientOpen) return;

    let isCancelled = false;
    const trimmed = recipientQuery.trim();

    // Check for valid hex pattern if query is non-empty
    if (trimmed && !/^[0-9a-fA-F]{1,24}$/.test(trimmed)) {
      setRecipientSearchError('Please enter a valid hexadecimal account ID.');
      setRecipientResults([]);
      setIsSearchingRecipients(false);
      return;
    }

    setRecipientSearchError('');
    setIsSearchingRecipients(true);

    const timer = setTimeout(() => {
      accountsApi
        .searchAccounts(trimmed, 5)
        .then((data) => {
          if (!isCancelled) {
            setRecipientResults(data?.accounts || []);
            setIsSearchingRecipients(false);
          }
        })
        .catch((err) => {
          if (!isCancelled) {
            console.error('Recipient search error:', err);
            setRecipientResults([]);
            setRecipientSearchError(err.message || 'Failed to search recipient accounts');
            setIsSearchingRecipients(false);
          }
        });
    }, 300);

    return () => {
      isCancelled = true;
      clearTimeout(timer);
    };
  }, [recipientQuery, isRecipientOpen]);

  if (!isOpen) return null;

  const quickAmounts = [500, 1000, 2500, 5000];

  const handleQuickAmount = (val) => {
    setAmount(val.toString());
  };

  const handleSetMaxAmount = () => {
    if (typeof sourceBalance === 'number' && sourceBalance > 0) {
      setAmount(sourceBalance.toString());
    }
  };

  // Pre-submission validation
  const validateForm = () => {
    setError('');

    if (!fromAccount) {
      setError('Please select a source account.');
      return false;
    }
    if (!toAccount.trim()) {
      setError('Recipient Account ID is required. Please select or enter a recipient account.');
      return false;
    }
    if (toAccount.trim().length !== 24) {
      setError('Recipient Account ID must be a valid 24-character hex ID.');
      return false;
    }
    if (fromAccount === toAccount.trim()) {
      setError('Cannot transfer money to the same account.');
      return false;
    }

    const numAmount = Number(amount);
    if (!numAmount || isNaN(numAmount) || numAmount <= 0) {
      setError('Amount must be a positive number.');
      return false;
    }

    if (typeof sourceBalance === 'number' && numAmount > sourceBalance) {
      setError(`Insufficient balance. Current balance is ₹${sourceBalance.toLocaleString('en-IN')}.`);
      return false;
    }

    if (!idempotencyKey) {
      setError('Idempotency key is missing. Please generate a key.');
      return false;
    }

    return true;
  };

  const handleProceedToConfirm = (e) => {
    e.preventDefault();
    if (validateForm()) {
      setIsConfirmStep(true);
    }
  };

  const handleExecuteTransfer = async () => {
    try {
      setIsSubmitting(true);
      setError('');

      // Send the complete internal _id string to the backend
      const res = await executeTransfer({
        fromAccount,
        toAccount: toAccount.trim(),
        amount: Number(amount),
        idempotencyKey,
      });

      setSuccessResult(res);
    } catch (err) {
      if (err instanceof ApiError && err.status === 409) {
        // Idempotency key collision / retry on failed state: auto-generate a fresh key
        generateNewKey();
        setError(`${err.message} A fresh idempotency key has been generated for your retry.`);
      } else {
        setError(err.message || 'Transfer failed. Please check your credentials.');
      }
      setIsConfirmStep(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSelectRecipient = (acc) => {
    if (!acc) return;
    setToAccount(acc._id || '');
    setToAccountName(acc.user?.name || '');
    setIsRecipientOpen(false);
    setRecipientQuery('');
  };

  const handleClearRecipient = () => {
    setToAccount('');
    setToAccountName('');
    setRecipientQuery('');
    setIsRecipientOpen(true);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-dialog" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="modal-header">
          <div className="modal-title">
            <Send size={18} style={{ color: 'var(--primary)', flexShrink: 0 }} />
            <span style={{ fontSize: 'clamp(15px, 3.5vw, 18px)' }}>
              {successResult ? 'Transfer Completed' : isConfirmStep ? 'Confirm Money Transfer' : 'Transfer Money'}
            </span>
          </div>
          <button
            onClick={onClose}
            className="btn btn-icon btn-sm btn-outline"
            style={{ border: 'none', width: '32px', height: '32px', minHeight: '32px' }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="modal-body">
          {error && (
            <div className="alert alert-danger" style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <AlertCircle size={18} style={{ flexShrink: 0 }} />
              <div>{error}</div>
            </div>
          )}

          {successResult ? (
            /* Success View */
            <div style={{ textAlign: 'center', padding: '8px 0 16px' }}>
              <div
                style={{
                  width: '56px',
                  height: '56px',
                  borderRadius: 'var(--radius-full)',
                  background: 'rgba(16, 185, 129, 0.12)',
                  border: '1px solid rgba(16, 185, 129, 0.3)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 14px',
                }}
              >
                <CheckCircle2 size={32} style={{ color: 'var(--primary)' }} />
              </div>

              <h3 style={{ fontSize: 'clamp(20px, 4.5vw, 24px)', marginBottom: '6px' }}>
                ₹{Number(amount).toLocaleString('en-IN')}
              </h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '13px', marginBottom: '18px' }}>
                {successResult.message || 'Transaction executed successfully.'}
              </p>

              <div
                style={{
                  background: 'var(--bg-input)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-md)',
                  padding: '14px',
                  textAlign: 'left',
                  fontSize: '13px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '8px',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Status:</span>
                  <span className="badge badge-completed">
                    {successResult.transaction?.status || 'COMPLETED'}
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Source Account:</span>
                  <span className="font-mono" style={{ color: 'var(--text-primary)', fontSize: '12px' }}>
                    {maskAccountId(fromAccount)}
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px' }}>
                  <span style={{ color: 'var(--text-muted)', flexShrink: 0 }}>Recipient Account:</span>
                  <span className="font-mono" style={{ color: 'var(--text-primary)', fontSize: '12px', textAlign: 'right', wordBreak: 'break-all' }}>
                    {formatRecipientDisplay(toAccount, toAccountName)}
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Idempotency Key:</span>
                  <span className="font-mono" style={{ color: 'var(--text-muted)', fontSize: '11px' }}>
                    {idempotencyKey.substring(0, 12)}...
                  </span>
                </div>
              </div>
            </div>
          ) : isConfirmStep ? (
            /* Confirmation Review View */
            <div>
              <div
                style={{
                  background: 'rgba(16, 185, 129, 0.05)',
                  border: '1px solid rgba(16, 185, 129, 0.2)',
                  borderRadius: 'var(--radius-md)',
                  padding: '16px',
                  marginBottom: '18px',
                  textAlign: 'center',
                }}
              >
                <span style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                  Amount to Transfer
                </span>
                <div
                  className="font-mono"
                  style={{
                    fontSize: 'clamp(22px, 5.5vw, 28px)',
                    fontWeight: 800,
                    color: '#34d399',
                    margin: '4px 0',
                  }}
                >
                  ₹{Number(amount).toLocaleString('en-IN')}
                </div>
                <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                  Atomic multi-document ledger execution
                </span>
              </div>

              <div
                style={{
                  background: 'var(--bg-input)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-md)',
                  padding: '14px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '12px',
                  fontSize: '13px',
                }}
              >
                <div>
                  <div style={{ color: 'var(--text-muted)', fontSize: '11px', textTransform: 'uppercase' }}>
                    Debiting Source Account
                  </div>
                  <div className="font-mono" style={{ color: 'var(--text-primary)', marginTop: '2px', fontWeight: 600, fontSize: '13px' }}>
                    {maskAccountId(fromAccount)}
                  </div>
                </div>

                <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '10px' }}>
                  <div style={{ color: 'var(--text-muted)', fontSize: '11px', textTransform: 'uppercase' }}>
                    Crediting Recipient Account
                  </div>
                  <div className="font-mono" style={{ color: 'var(--text-primary)', marginTop: '2px', fontWeight: 600, fontSize: '13px' }}>
                    {formatRecipientDisplay(toAccount, toAccountName)}
                  </div>
                  {toAccountName && (
                    <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                      Beneficiary: {toAccountName}
                    </div>
                  )}
                </div>

                <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '10px' }}>
                  <div style={{ color: 'var(--text-muted)', fontSize: '11px', textTransform: 'uppercase' }}>
                    Idempotency Key (Safe Retry Token)
                  </div>
                  <div className="font-mono" style={{ color: 'var(--text-secondary)', fontSize: '11px', marginTop: '2px', wordBreak: 'break-all' }}>
                    {idempotencyKey}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            /* Input Form View */
            <form onSubmit={handleProceedToConfirm}>
              {/* Sender Account */}
              <div className="form-group">
                <label className="form-label">
                  <span>Source Account</span>
                  <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                    Balance:{' '}
                    {isSourceBalanceLoading
                      ? 'Loading...'
                      : typeof sourceBalance === 'number'
                      ? `₹${sourceBalance.toLocaleString('en-IN')}`
                      : '—'}
                  </span>
                </label>
                <select
                  value={fromAccount}
                  onChange={(e) => setFromAccount(e.target.value)}
                  className="form-control font-mono"
                  required
                >
                  {accounts.map((acc) => (
                    <option key={acc._id} value={acc._id}>
                      {maskAccountId(acc._id)} ({acc.currency || 'INR'})
                    </option>
                  ))}
                </select>
              </div>

              {/* Recipient Account Searchable Dropdown */}
              <div className="form-group" style={{ position: 'relative' }} ref={recipientDropdownRef}>
                <label className="form-label">
                  <span>Recipient Account (To Account)</span>
                  <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                    Active accounts only
                  </span>
                </label>

                {toAccount ? (
                  /* Selected Recipient Display */
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      background: 'rgba(16, 185, 129, 0.06)',
                      border: '1px solid rgba(16, 185, 129, 0.3)',
                      borderRadius: 'var(--radius-md)',
                      padding: '10px 14px',
                      gap: '8px',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 }}>
                      <UserCheck size={18} style={{ color: 'var(--primary)', flexShrink: 0 }} />
                      <div style={{ minWidth: 0 }}>
                        <div
                          className="font-mono"
                          style={{
                            fontSize: '13px',
                            fontWeight: 600,
                            color: 'var(--text-primary)',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          {formatRecipientDisplay(toAccount, toAccountName)}
                        </div>
                        <span style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block' }}>
                          {toAccountName ? `Verified Recipient · ${toAccountName}` : 'Verified Active Recipient'}
                        </span>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={handleClearRecipient}
                      className="btn btn-sm btn-secondary"
                      style={{ padding: '4px 10px', fontSize: '12px', minHeight: '30px', flexShrink: 0 }}
                    >
                      Change
                    </button>
                  </div>
                ) : (
                  /* Recipient Selector Trigger / Input */
                  <div>
                    <div
                      onClick={() => setIsRecipientOpen(true)}
                      className="form-control"
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        cursor: 'pointer',
                        color: 'var(--text-muted)',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Search size={15} style={{ color: 'var(--text-muted)' }} />
                        <span>Select recipient...</span>
                      </div>
                      <ChevronDown size={16} />
                    </div>

                    {/* Searchable Dropdown Overlay */}
                    {isRecipientOpen && (
                      <div
                        style={{
                          position: 'absolute',
                          top: '100%',
                          left: 0,
                          right: 0,
                          marginTop: '6px',
                          background: 'var(--bg-surface-raised)',
                          border: '1px solid var(--border-card)',
                          borderRadius: 'var(--radius-md)',
                          boxShadow: '0 12px 32px rgba(0, 0, 0, 0.65)',
                          zIndex: 100,
                          overflow: 'hidden',
                        }}
                      >
                        {/* Search Input Box */}
                        <div
                          style={{
                            padding: '10px 12px',
                            borderBottom: '1px solid var(--border-subtle)',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            background: 'rgba(0, 0, 0, 0.25)',
                          }}
                        >
                          <Search size={14} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
                          <input
                            type="text"
                            value={recipientQuery}
                            onChange={(e) => setRecipientQuery(e.target.value)}
                            placeholder="Search by account ID..."
                            autoFocus
                            className="font-mono"
                            style={{
                              background: 'transparent',
                              border: 'none',
                              outline: 'none',
                              color: 'var(--text-primary)',
                              fontSize: '13px',
                              width: '100%',
                            }}
                          />
                          {isSearchingRecipients && (
                            <Loader2 size={14} className="animate-pulse" style={{ color: 'var(--primary)', flexShrink: 0 }} />
                          )}
                        </div>

                        {/* Search Results List */}
                        <div style={{ maxHeight: '200px', overflowY: 'auto' }}>
                          <div
                            style={{
                              padding: '8px 12px 4px',
                              fontSize: '11px',
                              fontWeight: 600,
                              color: 'var(--text-muted)',
                              textTransform: 'uppercase',
                              letterSpacing: '0.04em',
                            }}
                          >
                            Available accounts (Max 5)
                          </div>

                          {recipientSearchError ? (
                            <div style={{ padding: '16px 12px', textAlign: 'center', color: '#f87171', fontSize: '13px' }}>
                              {recipientSearchError}
                            </div>
                          ) : isSearchingRecipients && recipientResults.length === 0 ? (
                            <div style={{ padding: '20px 12px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '13px' }}>
                              Searching accounts...
                            </div>
                          ) : recipientResults.length === 0 ? (
                            <div style={{ padding: '20px 12px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '13px' }}>
                              No matching account found
                            </div>
                          ) : (
                            recipientResults.map((acc) => {
                              const userName = acc.user?.name?.trim();
                              const maskedId = maskAccountId(acc._id);
                              const displayText = userName ? `${maskedId} (${userName})` : maskedId;

                              return (
                                <div
                                  key={acc._id}
                                  onClick={() => handleSelectRecipient(acc)}
                                  style={{
                                    padding: '10px 14px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'space-between',
                                    cursor: 'pointer',
                                    borderBottom: '1px solid var(--border-subtle)',
                                    transition: 'background var(--transition-fast)',
                                    gap: '8px',
                                  }}
                                  onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(16, 185, 129, 0.08)')}
                                  onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                                >
                                  <div style={{ minWidth: 0 }}>
                                    <div
                                      className="font-mono"
                                      style={{
                                        fontSize: '13px',
                                        color: 'var(--text-primary)',
                                        fontWeight: 600,
                                        overflow: 'hidden',
                                        textOverflow: 'ellipsis',
                                        whiteSpace: 'nowrap',
                                      }}
                                    >
                                      {displayText}
                                    </div>
                                    <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                                      {userName ? `Account Owner: ${userName}` : 'Lena Dena Premier Account'}
                                    </span>
                                  </div>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
                                    <span className="badge badge-active" style={{ fontSize: '10px', padding: '2px 8px' }}>
                                      {acc.status || 'Active'}
                                    </span>
                                    <span className="font-mono" style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                                      {acc.currency || 'INR'}
                                    </span>
                                  </div>
                                </div>
                              );
                            })
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Amount */}
              <div className="form-group">
                <div className="form-label">
                  <span>Transfer Amount (₹ INR)</span>
                  <button
                    type="button"
                    onClick={handleSetMaxAmount}
                    className="btn btn-sm btn-outline"
                    style={{ padding: '2px 8px', fontSize: '11px', minHeight: '26px' }}
                    disabled={isSourceBalanceLoading || typeof sourceBalance !== 'number' || sourceBalance <= 0}
                  >
                    MAX
                  </button>
                </div>
                <input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0.00"
                  min="1"
                  step="any"
                  className="form-control font-mono"
                  required
                />
                {/* Quick Chips Grid */}
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(4, 1fr)',
                    gap: '6px',
                    marginTop: '8px',
                  }}
                >
                  {quickAmounts.map((q) => (
                    <button
                      key={q}
                      type="button"
                      onClick={() => handleQuickAmount(q)}
                      className="btn btn-secondary btn-sm"
                      style={{ padding: '6px 4px', fontSize: '12px', minHeight: '32px' }}
                    >
                      +₹{q}
                    </button>
                  ))}
                </div>
              </div>

              {/* Idempotency Token Section */}
              <div
                style={{
                  background: 'var(--bg-input)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-md)',
                  padding: '12px',
                  marginTop: '16px',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                  <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '5px' }}>
                    <Key size={13} style={{ color: 'var(--primary)' }} />
                    Idempotency Key
                  </span>
                  <button
                    type="button"
                    onClick={generateNewKey}
                    title="Generate fresh idempotency key"
                    className="btn btn-icon btn-sm"
                    style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', width: '22px', height: '22px', minHeight: '22px' }}
                  >
                    <RefreshCw size={12} />
                  </button>
                </div>
                <div
                  className="font-mono"
                  style={{
                    fontSize: '11px',
                    color: 'var(--text-muted)',
                    wordBreak: 'break-all',
                  }}
                >
                  {idempotencyKey}
                </div>
              </div>
            </form>
          )}
        </div>

        {/* Footer */}
        <div className="modal-footer">
          {successResult ? (
            <button
              type="button"
              onClick={onClose}
              className="btn btn-primary"
              style={{ minWidth: '100px' }}
            >
              Done
            </button>
          ) : isConfirmStep ? (
            <>
              <button
                type="button"
                onClick={() => setIsConfirmStep(false)}
                disabled={isSubmitting}
                className="btn btn-secondary"
              >
                Back
              </button>
              <button
                type="button"
                onClick={handleExecuteTransfer}
                disabled={isSubmitting}
                className="btn btn-primary"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 size={16} className="animate-pulse" />
                    <span>Executing Transfer...</span>
                  </>
                ) : (
                  <>
                    <ShieldCheck size={16} />
                    <span>Authorize Transfer</span>
                  </>
                )}
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={onClose}
                className="btn btn-secondary"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleProceedToConfirm}
                className="btn btn-primary"
              >
                <span>Continue</span>
                <ArrowRight size={16} />
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
