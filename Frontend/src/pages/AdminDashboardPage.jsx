import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Shield,
  Search,
  RefreshCw,
  Copy,
  Check,
  User,
  CreditCard,
  AlertCircle,
  Loader2,
  Users,
  CheckCircle2,
  Lock,
  Unlock,
  X,
} from 'lucide-react';
import { accountsApi, ApiError } from '../api/client';
import { AdminNavbar } from '../components/AdminNavbar';

/**
 * Mask account ID for visual presentation only (e.g. "6a7b72 •••• •••• bb00f0")
 */
function maskAccountId(id) {
  if (!id || typeof id !== 'string') return '•••• •••• •••• ••••';
  if (id.length <= 12) return id;
  return `${id.substring(0, 6)} •••• •••• ${id.substring(id.length - 6)}`;
}

export function AdminDashboardPage() {
  const navigate = useNavigate();

  const [accounts, setAccounts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [copiedId, setCopiedId] = useState(null);
  const [toast, setToast] = useState(null); // { message, type: 'success' | 'danger' }

  // Status Change Confirmation State
  const [pendingStatusChange, setPendingStatusChange] = useState(null); // { account, targetStatus: 'Frozen' | 'Active' }
  const [updatingAccountId, setUpdatingAccountId] = useState(null);

  const showToast = (message, type = 'success') => {
    setToast({ message, type, id: Date.now() });
    setTimeout(() => setToast(null), 3500);
  };

  const handleCopy = (e, text) => {
    e.stopPropagation();
    if (text) {
      navigator.clipboard.writeText(text);
      setCopiedId(text);
      showToast('Account ID copied to clipboard', 'success');
      setTimeout(() => setCopiedId(null), 2000);
    }
  };

  /**
   * Fetch all provisioned customer accounts from GET /api/accounts/admin/dashboard
   */
  const loadAccounts = useCallback(async (isManualRefresh = false) => {
    try {
      if (isManualRefresh) {
        setIsRefreshing(true);
      } else {
        setIsLoading(true);
      }
      setError('');

      const res = await accountsApi.getAdminAccounts();
      setAccounts(res?.accounts || []);
    } catch (err) {
      if (err instanceof ApiError) {
        if (err.status === 401) {
          // Session unauthenticated -> redirect to system login
          navigate('/system-login', { replace: true });
          return;
        }
        if (err.status === 403) {
          // Non-admin user -> redirect to system login
          navigate('/system-login', { replace: true });
          return;
        }
        setError('Unable to load accounts. Please try again.');
      } else {
        setError('Unable to load accounts. Please try again.');
      }
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [navigate]);

  useEffect(() => {
    loadAccounts();
  }, [loadAccounts]);

  const handleManualRefresh = () => {
    loadAccounts(true);
  };

  /**
   * Execute PATCH /api/accounts/admin/:accountId/status with { status: 'Frozen' | 'Active' }
   */
  const handleConfirmStatusChange = async () => {
    if (!pendingStatusChange || updatingAccountId) return;

    const { account, targetStatus } = pendingStatusChange;
    try {
      setUpdatingAccountId(account._id);

      await accountsApi.updateAccountStatus(account._id, targetStatus);

      // Update existing account in local state immediately without full page reload
      setAccounts((prev) =>
        prev.map((a) => (a._id === account._id ? { ...a, status: targetStatus } : a))
      );

      showToast(
        targetStatus === 'Frozen'
          ? 'Account frozen successfully.'
          : 'Account unfrozen successfully.',
        'success'
      );

      setPendingStatusChange(null);
    } catch (err) {
      if (err instanceof ApiError) {
        if (err.status === 401) {
          navigate('/system-login', { replace: true });
          return;
        }
        if (err.status === 403) {
          showToast('Unauthorized access.', 'danger');
          return;
        }
        if (err.status === 404) {
          showToast('Account not found.', 'danger');
          return;
        }
        if (err.status === 400) {
          showToast(err.message || 'Invalid status.', 'danger');
          return;
        }
        showToast('Unable to change account status. Please try again.', 'danger');
      } else {
        showToast('Unable to change account status. Please try again.', 'danger');
      }
    } finally {
      setUpdatingAccountId(null);
    }
  };

  // Filter accounts by search query and status
  const filteredAccounts = accounts.filter((acc) => {
    const ownerName = typeof acc.user === 'object' ? acc.user?.name || '' : '';
    const ownerEmail = typeof acc.user === 'object' ? acc.user?.email || '' : '';
    const accountId = acc._id || '';
    const status = acc.status || 'Active';

    // Status Filter
    if (statusFilter !== 'ALL' && status.toUpperCase() !== statusFilter.toUpperCase()) {
      return false;
    }

    // Search Filter
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      const matchName = ownerName.toLowerCase().includes(term);
      const matchEmail = ownerEmail.toLowerCase().includes(term);
      const matchId = accountId.toLowerCase().includes(term);

      return matchName || matchEmail || matchId;
    }

    return true;
  });

  const totalActive = accounts.filter((a) => a.status === 'Active').length;

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: 'var(--bg-main)' }}>
      {/* Dedicated Admin Navbar */}
      <AdminNavbar />

      {/* Main Admin Content */}
      <main style={{ flex: 1 }}>
        <div className="container" style={{ paddingBottom: '60px', paddingTop: '28px' }}>
          {/* Toast Notification */}
          {toast && (
            <div
              style={{
                position: 'fixed',
                bottom: '24px',
                right: '24px',
                zIndex: 2000,
                background: 'var(--bg-surface-raised)',
                border: toast.type === 'danger' ? '1px solid var(--danger-border)' : '1px solid var(--success-border)',
                color: toast.type === 'danger' ? '#fca5a5' : '#ecfdf5',
                padding: '10px 18px',
                borderRadius: 'var(--radius-md)',
                boxShadow: 'var(--shadow-lg)',
                fontSize: '13px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                animation: 'slideInRight 0.3s ease-out',
              }}
            >
              {toast.type === 'danger' ? (
                <AlertCircle size={16} style={{ color: 'var(--danger)' }} />
              ) : (
                <CheckCircle2 size={16} style={{ color: 'var(--primary)' }} />
              )}
              <span>{toast.message}</span>
            </div>
          )}

          {/* Page Header */}
          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              justifyContent: 'space-between',
              alignItems: 'center',
              gap: '16px',
              marginBottom: '28px',
            }}
          >
            <div>
              <div
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  background: 'rgba(16, 185, 129, 0.1)',
                  border: '1px solid rgba(16, 185, 129, 0.25)',
                  padding: '3px 10px',
                  borderRadius: 'var(--radius-full)',
                  fontSize: '11px',
                  fontWeight: 700,
                  color: '#34d399',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  marginBottom: '8px',
                }}
              >
                <Shield size={13} />
                <span>Admin Console · Account Oversight</span>
              </div>
              <h1 className="page-title">Customer Accounts Directory</h1>
              <p className="page-subtitle">
                System oversight of all customer accounts provisioned across Lena Dena Bank.
              </p>
            </div>

            {/* Quick Actions */}
            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                onClick={handleManualRefresh}
                disabled={isRefreshing || isLoading}
                className="btn btn-secondary btn-sm"
                title="Refresh Directory"
              >
                <RefreshCw size={14} className={isRefreshing ? 'animate-pulse' : ''} />
                <span>{isRefreshing ? 'Syncing...' : 'Refresh Directory'}</span>
              </button>
            </div>
          </div>

          {/* Error Banner */}
          {error && (
            <div className="alert alert-danger" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <AlertCircle size={18} style={{ flexShrink: 0 }} />
                <span>{error}</span>
              </div>
              <button
                onClick={() => loadAccounts()}
                className="btn btn-sm btn-secondary"
                style={{ padding: '4px 12px', fontSize: '12px', minHeight: '28px' }}
              >
                Retry
              </button>
            </div>
          )}

          {/* Metric Summary Cards */}
          <div className="grid-3" style={{ marginBottom: '28px' }}>
            <div className="card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Total Customer Accounts
                </span>
                <Users size={16} style={{ color: 'var(--primary)' }} />
              </div>
              <div className="font-mono" style={{ fontSize: '28px', fontWeight: 800, color: 'var(--text-primary)' }}>
                {accounts.length}
              </div>
              <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                Excludes system reserve account
              </div>
            </div>

            <div className="card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Active Accounts
                </span>
                <CheckCircle2 size={16} style={{ color: '#34d399' }} />
              </div>
              <div className="font-mono" style={{ fontSize: '28px', fontWeight: 800, color: '#34d399' }}>
                {totalActive}
              </div>
              <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                Operational & ready for ledger transfers
              </div>
            </div>

            <div className="card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Supported Currency
                </span>
                <CreditCard size={16} style={{ color: 'var(--secondary)' }} />
              </div>
              <div className="font-mono" style={{ fontSize: '28px', fontWeight: 800, color: 'var(--secondary)' }}>
                INR (₹)
              </div>
              <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                Atomic double-entry ledger base
              </div>
            </div>
          </div>

          {/* Search & Filter Toolbar */}
          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: '12px',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '16px',
            }}
          >
            {/* Status Filter Tabs */}
            <div
              style={{
                display: 'flex',
                background: 'var(--bg-input)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-md)',
                padding: '4px',
                gap: '4px',
                flexWrap: 'wrap',
              }}
            >
              <button
                type="button"
                onClick={() => setStatusFilter('ALL')}
                className="btn btn-sm"
                style={{
                  background: statusFilter === 'ALL' ? 'var(--bg-surface-raised)' : 'transparent',
                  color: statusFilter === 'ALL' ? 'var(--text-primary)' : 'var(--text-muted)',
                  border: statusFilter === 'ALL' ? '1px solid var(--border-card)' : 'none',
                  padding: '6px 12px',
                  fontSize: '12px',
                }}
              >
                All Accounts ({accounts.length})
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter('ACTIVE')}
                className="btn btn-sm"
                style={{
                  background: statusFilter === 'ACTIVE' ? 'rgba(16, 185, 129, 0.15)' : 'transparent',
                  color: statusFilter === 'ACTIVE' ? '#34d399' : 'var(--text-muted)',
                  border: statusFilter === 'ACTIVE' ? '1px solid rgba(16, 185, 129, 0.3)' : 'none',
                  padding: '6px 12px',
                  fontSize: '12px',
                }}
              >
                Active ({totalActive})
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter('FROZEN')}
                className="btn btn-sm"
                style={{
                  background: statusFilter === 'FROZEN' ? 'rgba(56, 189, 248, 0.15)' : 'transparent',
                  color: statusFilter === 'FROZEN' ? '#38bdf8' : 'var(--text-muted)',
                  border: statusFilter === 'FROZEN' ? '1px solid rgba(56, 189, 248, 0.3)' : 'none',
                  padding: '6px 12px',
                  fontSize: '12px',
                }}
              >
                Frozen ({accounts.filter((a) => a.status === 'Frozen').length})
              </button>
            </div>

            {/* Search Input */}
            <div style={{ position: 'relative', width: '100%', maxWidth: '340px', minWidth: '220px' }}>
              <Search size={16} className="input-icon" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search by owner name, email, ID..."
                className="form-control font-mono"
                style={{ paddingLeft: '38px', paddingRight: '12px', height: '40px', fontSize: '13px' }}
              />
            </div>
          </div>

          {/* Desktop Table View (>= 768px) */}
          <div className="transaction-desktop-view">
            <div className="table-container">
              <table>
                <thead>
                  <tr>
                    <th>Account Owner</th>
                    <th>Account ID</th>
                    <th>Currency</th>
                    <th>Status</th>
                    <th>Provisioned Date</th>
                    <th style={{ textAlign: 'right' }}>Account Action</th>
                  </tr>
                </thead>
                <tbody>
                  {isLoading ? (
                    <tr>
                      <td colSpan={6} style={{ textAlign: 'center', padding: '48px', color: 'var(--text-muted)' }}>
                        <Loader2 size={24} className="animate-pulse" style={{ margin: '0 auto 8px', color: 'var(--primary)' }} />
                        <div>Loading customer accounts directory...</div>
                      </td>
                    </tr>
                  ) : accounts.length === 0 ? (
                    <tr>
                      <td colSpan={6} style={{ textAlign: 'center', padding: '48px', color: 'var(--text-muted)' }}>
                        No customer accounts found.
                      </td>
                    </tr>
                  ) : filteredAccounts.length === 0 ? (
                    <tr>
                      <td colSpan={6} style={{ textAlign: 'center', padding: '48px', color: 'var(--text-muted)' }}>
                        No customer accounts matching "{searchTerm}".
                      </td>
                    </tr>
                  ) : (
                    filteredAccounts.map((acc) => {
                      const ownerName = typeof acc.user === 'object' ? acc.user?.name || 'Customer' : 'Customer';
                      const ownerEmail = typeof acc.user === 'object' ? acc.user?.email || '—' : '—';
                      const maskedId = maskAccountId(acc._id);
                      const formattedDate = acc.createdAt
                        ? new Date(acc.createdAt).toLocaleDateString('en-IN', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                          })
                        : '—';

                      const isCurrentlyUpdating = updatingAccountId === acc._id;

                      return (
                        <tr key={acc._id}>
                          {/* Owner Name & Email */}
                          <td>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                              <div
                                style={{
                                  width: '34px',
                                  height: '34px',
                                  borderRadius: '50%',
                                  background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.15) 0%, rgba(6, 182, 212, 0.15) 100%)',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  flexShrink: 0,
                                  border: '1px solid rgba(16, 185, 129, 0.25)',
                                }}
                              >
                                <User size={16} style={{ color: 'var(--primary)' }} />
                              </div>
                              <div>
                                <div style={{ fontWeight: 700, fontSize: '14px', color: 'var(--text-primary)' }}>
                                  {ownerName}
                                </div>
                                <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                                  {ownerEmail}
                                </div>
                              </div>
                            </div>
                          </td>

                          {/* Masked Account ID */}
                          <td>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                              <span className="font-mono" style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>
                                {maskedId}
                              </span>
                              <button
                                onClick={(e) => handleCopy(e, acc._id)}
                                title="Copy 24-char Account ID"
                                className="btn btn-icon btn-sm"
                                style={{
                                  width: '22px',
                                  height: '22px',
                                  minHeight: '22px',
                                  background: 'transparent',
                                  border: 'none',
                                  color: copiedId === acc._id ? 'var(--primary)' : 'var(--text-muted)',
                                }}
                              >
                                {copiedId === acc._id ? <Check size={13} /> : <Copy size={13} />}
                              </button>
                            </div>
                          </td>

                          {/* Currency */}
                          <td>
                            <span className="font-mono" style={{ fontWeight: 600, fontSize: '13px', color: 'var(--text-primary)' }}>
                              {acc.currency || 'INR'}
                            </span>
                          </td>

                          {/* Status */}
                          <td>
                            <span className={`badge badge-${(acc.status || 'Active').toLowerCase()}`}>
                              {acc.status || 'Active'}
                            </span>
                          </td>

                          {/* Date */}
                          <td>
                            <span style={{ color: 'var(--text-muted)', fontSize: '13px' }}>
                              {formattedDate}
                            </span>
                          </td>

                          {/* Status Action */}
                          <td style={{ textAlign: 'right' }}>
                            {acc.status === 'Active' ? (
                              <button
                                type="button"
                                onClick={() => setPendingStatusChange({ account: acc, targetStatus: 'Frozen' })}
                                disabled={isCurrentlyUpdating || Boolean(updatingAccountId)}
                                className="btn btn-sm"
                                style={{
                                  padding: '5px 12px',
                                  fontSize: '12px',
                                  minHeight: '30px',
                                  background: 'rgba(239, 68, 68, 0.12)',
                                  border: '1px solid rgba(239, 68, 68, 0.3)',
                                  color: '#f87171',
                                }}
                                title="Freeze this account"
                              >
                                {isCurrentlyUpdating ? (
                                  <>
                                    <Loader2 size={13} className="animate-pulse" />
                                    <span>Freezing...</span>
                                  </>
                                ) : (
                                  <>
                                    <Lock size={13} />
                                    <span>Freeze Account</span>
                                  </>
                                )}
                              </button>
                            ) : (
                              <button
                                type="button"
                                onClick={() => setPendingStatusChange({ account: acc, targetStatus: 'Active' })}
                                disabled={isCurrentlyUpdating || Boolean(updatingAccountId)}
                                className="btn btn-sm"
                                style={{
                                  padding: '5px 12px',
                                  fontSize: '12px',
                                  minHeight: '30px',
                                  background: 'rgba(16, 185, 129, 0.12)',
                                  border: '1px solid rgba(16, 185, 129, 0.3)',
                                  color: '#34d399',
                                }}
                                title="Unfreeze this account"
                              >
                                {isCurrentlyUpdating ? (
                                  <>
                                    <Loader2 size={13} className="animate-pulse" />
                                    <span>Unfreezing...</span>
                                  </>
                                ) : (
                                  <>
                                    <Unlock size={13} />
                                    <span>Unfreeze Account</span>
                                  </>
                                )}
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Mobile Card List View (< 768px) */}
          <div className="transaction-mobile-view">
            {isLoading ? (
              <div className="card" style={{ textAlign: 'center', padding: '36px', color: 'var(--text-muted)' }}>
                <Loader2 size={24} className="animate-pulse" style={{ margin: '0 auto 8px', color: 'var(--primary)' }} />
                <div>Loading customer accounts...</div>
              </div>
            ) : accounts.length === 0 ? (
              <div className="card" style={{ textAlign: 'center', padding: '36px', color: 'var(--text-muted)' }}>
                No customer accounts found.
              </div>
            ) : filteredAccounts.length === 0 ? (
              <div className="card" style={{ textAlign: 'center', padding: '36px', color: 'var(--text-muted)' }}>
                No customer accounts matching "{searchTerm}".
              </div>
            ) : (
              filteredAccounts.map((acc) => {
                const ownerName = typeof acc.user === 'object' ? acc.user?.name || 'Customer' : 'Customer';
                const ownerEmail = typeof acc.user === 'object' ? acc.user?.email || '—' : '—';
                const maskedId = maskAccountId(acc._id);
                const formattedDate = acc.createdAt
                  ? new Date(acc.createdAt).toLocaleDateString('en-IN', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    })
                  : '—';

                const isCurrentlyUpdating = updatingAccountId === acc._id;

                return (
                  <div
                    key={acc._id}
                    className="card"
                    style={{
                      padding: '16px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '12px',
                      border: '1px solid var(--border-card)',
                      background: 'var(--bg-card)',
                    }}
                  >
                    {/* Card Top: Owner Name & Status */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div
                          style={{
                            width: '28px',
                            height: '28px',
                            borderRadius: '50%',
                            background: 'rgba(16, 185, 129, 0.15)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}
                        >
                          <User size={14} style={{ color: 'var(--primary)' }} />
                        </div>
                        <div>
                          <div style={{ fontWeight: 700, fontSize: '14px', color: 'var(--text-primary)' }}>
                            {ownerName}
                          </div>
                          <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                            {ownerEmail}
                          </div>
                        </div>
                      </div>

                      <span className={`badge badge-${(acc.status || 'Active').toLowerCase()}`} style={{ fontSize: '11px' }}>
                        {acc.status || 'Active'}
                      </span>
                    </div>

                    {/* Card Middle: Account ID & Currency */}
                    <div
                      style={{
                        background: 'var(--bg-input)',
                        padding: '10px 12px',
                        borderRadius: 'var(--radius-md)',
                        border: '1px solid var(--border-subtle)',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                      }}
                    >
                      <div>
                        <span style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase', display: 'block' }}>
                          Account Identifier
                        </span>
                        <span className="font-mono" style={{ fontSize: '12px', color: 'var(--text-primary)' }}>
                          {maskedId}
                        </span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span className="font-mono" style={{ fontSize: '12px', fontWeight: 600, color: 'var(--secondary)' }}>
                          {acc.currency || 'INR'}
                        </span>
                        <button
                          onClick={(e) => handleCopy(e, acc._id)}
                          title="Copy ID"
                          className="btn btn-icon btn-sm"
                          style={{ width: '24px', height: '24px', minHeight: '24px', background: 'transparent', border: 'none', color: copiedId === acc._id ? 'var(--primary)' : 'var(--text-muted)' }}
                        >
                          {copiedId === acc._id ? <Check size={13} /> : <Copy size={13} />}
                        </button>
                      </div>
                    </div>

                    {/* Card Bottom: Date & Action */}
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        fontSize: '11px',
                        color: 'var(--text-muted)',
                        paddingTop: '8px',
                        borderTop: '1px solid var(--border-subtle)',
                        flexWrap: 'wrap',
                        gap: '8px',
                      }}
                    >
                      <span>Provisioned: {formattedDate}</span>

                      {acc.status === 'Active' ? (
                        <button
                          type="button"
                          onClick={() => setPendingStatusChange({ account: acc, targetStatus: 'Frozen' })}
                          disabled={isCurrentlyUpdating || Boolean(updatingAccountId)}
                          className="btn btn-sm"
                          style={{
                            padding: '4px 10px',
                            fontSize: '11px',
                            minHeight: '28px',
                            background: 'rgba(239, 68, 68, 0.12)',
                            border: '1px solid rgba(239, 68, 68, 0.3)',
                            color: '#f87171',
                          }}
                        >
                          {isCurrentlyUpdating ? (
                            <>
                              <Loader2 size={12} className="animate-pulse" />
                              <span>Freezing...</span>
                            </>
                          ) : (
                            <>
                              <Lock size={12} />
                              <span>Freeze Account</span>
                            </>
                          )}
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setPendingStatusChange({ account: acc, targetStatus: 'Active' })}
                          disabled={isCurrentlyUpdating || Boolean(updatingAccountId)}
                          className="btn btn-sm"
                          style={{
                            padding: '4px 10px',
                            fontSize: '11px',
                            minHeight: '28px',
                            background: 'rgba(16, 185, 129, 0.12)',
                            border: '1px solid rgba(16, 185, 129, 0.3)',
                            color: '#34d399',
                          }}
                        >
                          {isCurrentlyUpdating ? (
                            <>
                              <Loader2 size={12} className="animate-pulse" />
                              <span>Unfreezing...</span>
                            </>
                          ) : (
                            <>
                              <Unlock size={12} />
                              <span>Unfreeze Account</span>
                            </>
                          )}
                        </button>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </main>

      {/* Confirmation Modal for Status Change */}
      {pendingStatusChange && (
        <div
          className="modal-overlay"
          onClick={() => !updatingAccountId && setPendingStatusChange(null)}
        >
          <div
            className="modal-dialog"
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: '440px' }}
          >
            <div className="modal-header">
              <div className="modal-title">
                {pendingStatusChange.targetStatus === 'Frozen' ? (
                  <Lock size={18} style={{ color: '#f87171', flexShrink: 0 }} />
                ) : (
                  <Unlock size={18} style={{ color: '#34d399', flexShrink: 0 }} />
                )}
                <span>
                  {pendingStatusChange.targetStatus === 'Frozen'
                    ? 'Freeze this account?'
                    : 'Unfreeze this account?'}
                </span>
              </div>
              <button
                onClick={() => !updatingAccountId && setPendingStatusChange(null)}
                disabled={Boolean(updatingAccountId)}
                className="btn btn-icon btn-sm btn-outline"
                style={{ border: 'none', width: '32px', height: '32px', minHeight: '32px' }}
              >
                <X size={18} />
              </button>
            </div>

            <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <p style={{ color: 'var(--text-secondary)', fontSize: '13px', lineHeight: 1.5, margin: 0 }}>
                {pendingStatusChange.targetStatus === 'Frozen'
                  ? 'Freezing the account will prevent transactions involving this account.'
                  : 'Unfreezing the account will restore full transaction capabilities.'}
              </p>

              <div
                style={{
                  background: 'var(--bg-input)',
                  padding: '12px 14px',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--border-subtle)',
                  fontSize: '12px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '6px',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Account Owner:</span>
                  <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                    {pendingStatusChange.account.user?.name || 'Customer'}
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Email:</span>
                  <span style={{ color: 'var(--text-secondary)' }}>
                    {pendingStatusChange.account.user?.email || '—'}
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Account ID:</span>
                  <span className="font-mono" style={{ color: 'var(--text-secondary)' }}>
                    {maskAccountId(pendingStatusChange.account._id)}
                  </span>
                </div>
              </div>
            </div>

            <div className="modal-footer">
              <button
                type="button"
                onClick={() => setPendingStatusChange(null)}
                disabled={Boolean(updatingAccountId)}
                className="btn btn-secondary"
                style={{ flex: 1 }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmStatusChange}
                disabled={Boolean(updatingAccountId)}
                className={pendingStatusChange.targetStatus === 'Frozen' ? 'btn btn-danger' : 'btn btn-primary'}
                style={{ flex: 1 }}
              >
                {updatingAccountId ? (
                  <>
                    <Loader2 size={15} className="animate-pulse" />
                    <span>
                      {pendingStatusChange.targetStatus === 'Frozen' ? 'Freezing...' : 'Unfreezing...'}
                    </span>
                  </>
                ) : (
                  <span>
                    {pendingStatusChange.targetStatus === 'Frozen' ? 'Freeze Account' : 'Unfreeze Account'}
                  </span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Admin Footer */}
      <footer
        style={{
          borderTop: '1px solid var(--border-subtle)',
          padding: '20px 0',
          textAlign: 'center',
          fontSize: '12px',
          color: 'var(--text-muted)',
          background: 'rgba(5, 8, 15, 0.95)',
        }}
      >
        <div className="container">
          <p>
            <strong>Lena Dena Bank Admin Console</strong> — Restricted Administrative Access. Audited double-entry ledger oversight.
          </p>
        </div>
      </footer>
    </div>
  );
}
