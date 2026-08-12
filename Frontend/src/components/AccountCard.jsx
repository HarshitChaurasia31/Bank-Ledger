import React, { useState } from 'react';
import { Copy, Check, Shield, Cpu, ArrowUpRight } from 'lucide-react';
import { useBank } from '../context/BankContext';

export function AccountCard({ account, balance, isSelected, onSelect }) {
  const { showToast } = useBank();
  const [copied, setCopied] = useState(false);

  const handleCopy = (e) => {
    e.stopPropagation();
    if (account?._id) {
      navigator.clipboard.writeText(account._id);
      setCopied(true);
      showToast('Account ID copied to clipboard', 'info');
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const formattedId = account?._id
    ? `${account._id.substring(0, 6)} •••• •••• ${account._id.substring(account._id.length - 6)}`
    : '•••• •••• •••• ••••';

  // Exactly one revealed account at any time: strictly the currently selected active account with loaded balance
  const isRevealed = Boolean(isSelected && typeof balance === 'number');

  return (
    <div
      onClick={onSelect}
      className={`card ${isSelected ? 'card-glowing' : ''}`}
      style={{
        background: isSelected
          ? 'linear-gradient(135deg, rgba(16, 26, 46, 0.95) 0%, rgba(13, 20, 36, 0.95) 100%)'
          : 'var(--bg-card)',
        cursor: 'pointer',
        position: 'relative',
        overflow: 'hidden',
        border: isSelected ? '1px solid rgba(16, 185, 129, 0.5)' : '1px solid var(--border-card)',
        transition: 'all var(--transition-normal)',
      }}
    >
      {/* Background Holographic Glow */}
      <div
        style={{
          position: 'absolute',
          top: '-40px',
          right: '-40px',
          width: '140px',
          height: '140px',
          background: isSelected
            ? 'radial-gradient(circle, rgba(16, 185, 129, 0.18) 0%, transparent 70%)'
            : 'radial-gradient(circle, rgba(255, 255, 255, 0.04) 0%, transparent 70%)',
          pointerEvents: 'none',
        }}
      />

      {/* Card Header: Brand & Status */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Shield size={18} style={{ color: 'var(--primary)' }} />
          <span style={{ fontFamily: 'var(--font-brand)', fontWeight: 700, fontSize: '14px', letterSpacing: '0.02em' }}>
            LENA DENA <span style={{ color: 'var(--primary)' }}>PREMIER</span>
          </span>
        </div>

        <span className={`badge badge-${account.status.toLowerCase()}`}>
          {account.status}
        </span>
      </div>

      {/* EMV Chip & Currency Icon */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
        <div
          style={{
            width: '38px',
            height: '28px',
            background: 'linear-gradient(135deg, #d97706 0%, #f59e0b 50%, #fbbf24 100%)',
            borderRadius: '5px',
            boxShadow: 'inset 0 1px 2px rgba(255,255,255,0.4), 0 2px 6px rgba(0,0,0,0.3)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Cpu size={18} style={{ color: '#78350f', opacity: 0.85 }} />
        </div>
        <span
          className="font-mono"
          style={{
            fontSize: '12px',
            fontWeight: 600,
            color: 'var(--text-muted)',
            letterSpacing: '0.05em',
          }}
        >
          {account.currency || 'INR'}
        </span>
      </div>

      {/* Account Number with Copy Action */}
      <div style={{ marginBottom: '18px' }}>
        <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '4px' }}>
          Account Number (ID)
        </div>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'rgba(0, 0, 0, 0.25)',
            padding: '8px 12px',
            borderRadius: 'var(--radius-sm)',
            border: '1px solid var(--border-subtle)',
          }}
        >
          <span className="font-mono" style={{ fontSize: '13px', letterSpacing: '0.08em', color: 'var(--text-primary)' }}>
            {formattedId}
          </span>
          <button
            onClick={handleCopy}
            title="Copy full 24-char Account ID"
            className="btn btn-icon btn-sm"
            style={{
              background: 'transparent',
              border: 'none',
              color: copied ? 'var(--primary)' : 'var(--text-muted)',
              cursor: 'pointer',
              width: '24px',
              height: '24px',
            }}
          >
            {copied ? <Check size={14} /> : <Copy size={14} />}
          </button>
        </div>
      </div>

      {/* Balance & Selection State */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-end',
          paddingTop: '12px',
          borderTop: '1px solid var(--border-subtle)',
        }}
      >
        <div>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
            Ledger Balance
          </div>
          <div
            className="font-mono"
            style={{
              fontSize: '22px',
              fontWeight: 800,
              color: isRevealed ? '#34d399' : 'var(--text-muted)',
              lineHeight: 1.2,
              letterSpacing: isRevealed ? 'normal' : '0.05em',
            }}
          >
            {isRevealed ? `₹${balance.toLocaleString('en-IN')}` : '₹••••••'}
          </div>
        </div>

        {isSelected ? (
          <span style={{ fontSize: '12px', color: 'var(--primary)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>
            Active Card <Check size={14} />
          </span>
        ) : (
          <span style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
            Select to Reveal <ArrowUpRight size={14} />
          </span>
        )}
      </div>
    </div>
  );
}
