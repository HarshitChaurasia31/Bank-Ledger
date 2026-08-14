import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  Landmark,
  LayoutDashboard,
  ArrowLeftRight,
  CreditCard,
  LogOut,
  RefreshCw,
  Send,
  User,
  ShieldCheck,
  Menu,
  X,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useBank } from '../context/BankContext';

export function Navbar({ onOpenTransfer }) {
  const { user, logout } = useAuth();
  const { activeAccount, balance, isBalanceLoading, canTransfer, refreshAll } = useBank();
  const location = useLocation();
  const navigate = useNavigate();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Close mobile menu whenever route changes
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location.pathname]);

  const handleManualRefresh = async () => {
    try {
      setIsRefreshing(true);
      await refreshAll();
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleLogout = async () => {
    setIsMobileMenuOpen(false);
    await logout();
    navigate('/login');
  };

  const handleOpenTransferMobile = () => {
    setIsMobileMenuOpen(false);
    if (onOpenTransfer) {
      onOpenTransfer();
    }
  };

  const isActive = (path) => location.pathname === path;

  return (
    <nav
      style={{
        background: 'rgba(10, 15, 26, 0.92)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        borderBottom: '1px solid var(--border-subtle)',
        position: 'sticky',
        top: 0,
        zIndex: 50,
        width: '100%',
      }}
    >
      <div
        className="container"
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          height: '72px',
        }}
      >
        {/* Brand Identity */}
        <Link
          to="/"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            textDecoration: 'none',
            color: 'inherit',
            flexShrink: 0,
          }}
        >
          <div
            style={{
              width: '38px',
              height: '38px',
              borderRadius: 'var(--radius-md)',
              background: 'linear-gradient(135deg, #10b981 0%, #06b6d4 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 14px rgba(16, 185, 129, 0.3)',
              flexShrink: 0,
            }}
          >
            <Landmark size={20} style={{ color: '#fff' }} />
          </div>
          <div>
            <div
              style={{
                fontFamily: 'var(--font-brand)',
                fontSize: '17px',
                fontWeight: 800,
                letterSpacing: '-0.02em',
                lineHeight: 1.1,
                color: 'var(--text-primary)',
              }}
            >
              Lena Dena <span style={{ color: 'var(--primary)' }}>Bank</span>
            </div>
            <div
              style={{
                fontSize: '10px',
                fontWeight: 500,
                color: 'var(--text-muted)',
                letterSpacing: '0.01em',
              }}
            >
              Every rupee accounted for.
            </div>
          </div>
        </Link>

        {/* Desktop Navigation Links */}
        <div className="nav-desktop-links">
          <Link
            to="/"
            className="btn btn-sm"
            style={{
              background: isActive('/') ? 'var(--bg-surface-raised)' : 'transparent',
              color: isActive('/') ? 'var(--text-primary)' : 'var(--text-secondary)',
              border: isActive('/') ? '1px solid var(--border-card)' : '1px solid transparent',
            }}
          >
            <LayoutDashboard size={16} />
            <span>Dashboard</span>
          </Link>

          <Link
            to="/transactions"
            className="btn btn-sm"
            style={{
              background: isActive('/transactions') ? 'var(--bg-surface-raised)' : 'transparent',
              color: isActive('/transactions') ? 'var(--text-primary)' : 'var(--text-secondary)',
              border: isActive('/transactions') ? '1px solid var(--border-card)' : '1px solid transparent',
            }}
          >
            <ArrowLeftRight size={16} />
            <span>Ledger History</span>
          </Link>

          <Link
            to="/accounts"
            className="btn btn-sm"
            style={{
              background: isActive('/accounts') ? 'var(--bg-surface-raised)' : 'transparent',
              color: isActive('/accounts') ? 'var(--text-primary)' : 'var(--text-secondary)',
              border: isActive('/accounts') ? '1px solid var(--border-card)' : '1px solid transparent',
            }}
          >
            <CreditCard size={16} />
            <span>Accounts</span>
          </Link>
        </div>

        {/* Desktop Financial Status & User Actions */}
        <div className="nav-desktop-actions">
          {/* Active Balance Pill with Manual Refresh */}
          {activeAccount && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                background: 'rgba(16, 185, 129, 0.08)',
                border: '1px solid rgba(16, 185, 129, 0.25)',
                padding: '6px 14px',
                borderRadius: 'var(--radius-full)',
              }}
            >
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <span style={{ fontSize: '10px', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 600 }}>
                  Active Balance
                </span>
                <span
                  className="font-mono"
                  style={{
                    fontSize: '14px',
                    fontWeight: 700,
                    color: '#34d399',
                  }}
                >
                  {isBalanceLoading ? 'Refreshing...' : balance !== null ? `₹${balance.toLocaleString('en-IN')}` : '₹0'}
                </span>
              </div>
              <button
                onClick={handleManualRefresh}
                disabled={isRefreshing}
                title="Refresh ledger balance"
                className="btn btn-icon btn-sm"
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: 'var(--text-secondary)',
                  cursor: 'pointer',
                  width: '28px',
                  height: '28px',
                }}
              >
                <RefreshCw size={14} className={isRefreshing ? 'animate-pulse' : ''} />
              </button>
            </div>
          )}

          {/* Quick Transfer Trigger with Shared canTransfer State */}
          <button
            onClick={onOpenTransfer}
            disabled={!canTransfer}
            title={!canTransfer ? 'Create and initialize an account first.' : 'Transfer Money'}
            className="btn btn-primary btn-sm"
          >
            <Send size={15} />
            <span>Transfer Money</span>
          </button>

          {/* User Identity Pill */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              background: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid var(--border-card)',
              padding: '6px 12px',
              borderRadius: 'var(--radius-full)',
            }}
          >
            <div
              style={{
                width: '24px',
                height: '24px',
                borderRadius: '50%',
                background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.25) 0%, rgba(6, 182, 212, 0.25) 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <User size={13} style={{ color: 'var(--primary)' }} />
            </div>
            <span
              style={{
                fontSize: '13px',
                fontWeight: 600,
                color: 'var(--text-primary)',
                maxWidth: '140px',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {user?.name || 'Account Holder'}
            </span>
          </div>

          {/* Sign Out Button */}
          <button
            onClick={handleLogout}
            className="btn btn-secondary btn-sm"
            title="Sign Out"
          >
            <LogOut size={15} />
            <span>Logout</span>
          </button>
        </div>

        {/* Mobile / Tablet Toggle Button */}
        <div className="nav-mobile-toggle" style={{ gap: '10px' }}>
          {/* Compact Transfer Trigger on mobile top bar if enabled */}
          <button
            onClick={onOpenTransfer}
            disabled={!canTransfer}
            title={!canTransfer ? 'Create and initialize an account first.' : 'Transfer'}
            className="btn btn-primary btn-sm"
            style={{ padding: '6px 10px', height: '36px' }}
          >
            <Send size={14} />
            <span style={{ fontSize: '12px' }}>Transfer</span>
          </button>

          {/* Hamburger Menu Button */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="btn btn-secondary btn-icon btn-sm"
            aria-label="Toggle navigation menu"
            style={{ width: '38px', height: '38px' }}
          >
            {isMobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {isMobileMenuOpen && (
        <div
          style={{
            background: 'rgba(10, 15, 26, 0.98)',
            borderBottom: '1px solid var(--border-card)',
            padding: '16px 20px 24px',
            display: 'flex',
            flexDirection: 'column',
            gap: '14px',
            animation: 'fadeIn 0.2s ease-out',
          }}
        >
          {/* User Identity Section in Mobile Drawer */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              padding: '10px 14px',
              background: 'rgba(255, 255, 255, 0.04)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-md)',
            }}
          >
            <div
              style={{
                width: '34px',
                height: '34px',
                borderRadius: '50%',
                background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.25) 0%, rgba(6, 182, 212, 0.25) 100%)',
                border: '1px solid rgba(16, 185, 129, 0.3)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <User size={16} style={{ color: 'var(--primary)' }} />
            </div>
            <div style={{ minWidth: 0 }}>
              <div
                style={{
                  fontSize: '14px',
                  fontWeight: 700,
                  color: 'var(--text-primary)',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                {user?.name || 'Account Holder'}
              </div>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                Personal Account · Active
              </div>
            </div>
          </div>

          {/* Active Balance Card in Mobile Menu */}
          {activeAccount ? (
            <div
              style={{
                background: 'rgba(16, 185, 129, 0.08)',
                border: '1px solid rgba(16, 185, 129, 0.25)',
                borderRadius: 'var(--radius-md)',
                padding: '12px 16px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <div>
                <span style={{ fontSize: '11px', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 600, display: 'block' }}>
                  Active Account Balance
                </span>
                <span
                  className="font-mono"
                  style={{
                    fontSize: '18px',
                    fontWeight: 800,
                    color: '#34d399',
                  }}
                >
                  {isBalanceLoading ? 'Refreshing...' : balance !== null ? `₹${balance.toLocaleString('en-IN')}` : '₹0'}
                </span>
              </div>
              <button
                onClick={handleManualRefresh}
                disabled={isRefreshing}
                className="btn btn-secondary btn-sm"
                style={{ padding: '6px 10px' }}
              >
                <RefreshCw size={13} className={isRefreshing ? 'animate-pulse' : ''} />
                <span>{isRefreshing ? 'Syncing...' : 'Sync'}</span>
              </button>
            </div>
          ) : null}

          {/* Navigation Links */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <Link
              to="/"
              className="btn btn-secondary"
              style={{
                justifyContent: 'flex-start',
                padding: '12px 16px',
                background: isActive('/') ? 'rgba(16, 185, 129, 0.12)' : 'var(--bg-surface-raised)',
                borderColor: isActive('/') ? 'rgba(16, 185, 129, 0.4)' : 'var(--border-subtle)',
                color: isActive('/') ? '#34d399' : 'var(--text-primary)',
              }}
            >
              <LayoutDashboard size={18} />
              <span>Dashboard</span>
            </Link>

            <Link
              to="/transactions"
              className="btn btn-secondary"
              style={{
                justifyContent: 'flex-start',
                padding: '12px 16px',
                background: isActive('/transactions') ? 'rgba(16, 185, 129, 0.12)' : 'var(--bg-surface-raised)',
                borderColor: isActive('/transactions') ? 'rgba(16, 185, 129, 0.4)' : 'var(--border-subtle)',
                color: isActive('/transactions') ? '#34d399' : 'var(--text-primary)',
              }}
            >
              <ArrowLeftRight size={18} />
              <span>Ledger History</span>
            </Link>

            <Link
              to="/accounts"
              className="btn btn-secondary"
              style={{
                justifyContent: 'flex-start',
                padding: '12px 16px',
                background: isActive('/accounts') ? 'rgba(16, 185, 129, 0.12)' : 'var(--bg-surface-raised)',
                borderColor: isActive('/accounts') ? 'rgba(16, 185, 129, 0.4)' : 'var(--border-subtle)',
                color: isActive('/accounts') ? '#34d399' : 'var(--text-primary)',
              }}
            >
              <CreditCard size={18} />
              <span>Bank Accounts</span>
            </Link>
          </div>

          {/* Quick Actions */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', paddingTop: '10px', borderTop: '1px solid var(--border-subtle)' }}>
            <button
              onClick={handleOpenTransferMobile}
              disabled={!canTransfer}
              className="btn btn-primary"
              style={{ width: '100%', padding: '12px' }}
            >
              <Send size={16} />
              <span>Transfer Money</span>
            </button>

            <button
              onClick={handleLogout}
              className="btn btn-danger"
              style={{ width: '100%', padding: '12px' }}
            >
              <LogOut size={16} />
              <span>Logout {user?.name ? `(${user.name})` : ''}</span>
            </button>
          </div>
        </div>
      )}
    </nav>
  );
}
