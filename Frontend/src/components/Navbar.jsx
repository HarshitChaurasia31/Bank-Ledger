import React, { useState } from 'react';
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
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useBank } from '../context/BankContext';

export function Navbar({ onOpenTransfer }) {
  const { user, logout } = useAuth();
  const { activeAccount, balance, isBalanceLoading, canTransfer, refreshAll } = useBank();
  const location = useLocation();
  const navigate = useNavigate();
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleManualRefresh = async () => {
    try {
      setIsRefreshing(true);
      await refreshAll();
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const isActive = (path) => location.pathname === path;

  return (
    <nav
      style={{
        background: 'rgba(10, 15, 26, 0.85)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        borderBottom: '1px solid var(--border-subtle)',
        position: 'sticky',
        top: 0,
        zIndex: 50,
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
            gap: '12px',
            textDecoration: 'none',
            color: 'inherit',
          }}
        >
          <div
            style={{
              width: '42px',
              height: '42px',
              borderRadius: 'var(--radius-md)',
              background: 'linear-gradient(135deg, #10b981 0%, #06b6d4 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 14px rgba(16, 185, 129, 0.3)',
            }}
          >
            <Landmark size={22} style={{ color: '#fff' }} />
          </div>
          <div>
            <div
              style={{
                fontFamily: 'var(--font-brand)',
                fontSize: '18px',
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
                fontSize: '11px',
                fontWeight: 500,
                color: 'var(--text-muted)',
                letterSpacing: '0.01em',
              }}
            >
              Every rupee accounted for.
            </div>
          </div>
        </Link>

        {/* Navigation Links */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
          }}
        >
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

        {/* Financial Status & User Actions */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
          }}
        >
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
      </div>
    </nav>
  );
}
