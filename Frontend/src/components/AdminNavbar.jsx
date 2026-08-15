import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Shield, LogOut, ExternalLink, User } from 'lucide-react';
import { authApi } from '../api/client';

export function AdminNavbar({ adminUser }) {
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await authApi.logout();
    } catch (err) {
      console.error('Admin logout error:', err);
    } finally {
      navigate('/system-login');
    }
  };

  return (
    <nav
      style={{
        background: 'rgba(8, 12, 22, 0.95)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        borderBottom: '1px solid rgba(16, 185, 129, 0.25)',
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
          to="/admin/dashboard"
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
              background: 'linear-gradient(135deg, #059669 0%, #0891b2 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 14px rgba(16, 185, 129, 0.3)',
              flexShrink: 0,
            }}
          >
            <Shield size={20} style={{ color: '#fff' }} />
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
              Lena Dena <span style={{ color: 'var(--primary)' }}>Console</span>
            </div>
            <div
              style={{
                fontSize: '10px',
                fontWeight: 600,
                color: '#34d399',
                letterSpacing: '0.04em',
                textTransform: 'uppercase',
              }}
            >
              Admin Dashboard
            </div>
          </div>
        </Link>

        {/* Admin Actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {/* Admin Identity Badge */}
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
              {adminUser?.name || 'System Admin'}
            </span>
          </div>

          {/* Customer Portal Quick Link */}
          <Link
            to="/"
            className="btn btn-outline btn-sm"
            title="Switch to Customer Banking"
            style={{ fontSize: '12px' }}
          >
            <ExternalLink size={14} />
            <span className="nav-desktop-links" style={{ display: 'inline' }}>Customer App</span>
          </Link>

          {/* Admin Logout Button */}
          <button
            onClick={handleLogout}
            className="btn btn-secondary btn-sm"
            title="Sign Out of Admin Console"
          >
            <LogOut size={15} />
            <span>Logout</span>
          </button>
        </div>
      </div>
    </nav>
  );
}
