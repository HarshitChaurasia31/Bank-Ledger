import React, { useState } from 'react';
import { X, Landmark, ShieldCheck, ArrowRight, Loader2 } from 'lucide-react';
import { useBank } from '../context/BankContext';

export function CreateAccountModal({ isOpen, onClose }) {
  const { createAccount } = useBank();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleCreate = async () => {
    try {
      setIsSubmitting(true);
      setError('');
      await createAccount();
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to initialize account.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-dialog" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="modal-header">
          <div className="modal-title">
            <Landmark size={20} style={{ color: 'var(--primary)' }} />
            <span>Open New Bank Account</span>
          </div>
          <button
            onClick={onClose}
            className="btn btn-icon btn-sm btn-outline"
            style={{ border: 'none' }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="modal-body">
          {error && <div className="alert alert-danger">{error}</div>}

          <div
            style={{
              textAlign: 'center',
              padding: '16px 0 24px',
            }}
          >
            <div
              style={{
                width: '64px',
                height: '64px',
                borderRadius: 'var(--radius-lg)',
                background: 'rgba(16, 185, 129, 0.1)',
                border: '1px solid rgba(16, 185, 129, 0.3)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 16px',
              }}
            >
              <ShieldCheck size={32} style={{ color: 'var(--primary)' }} />
            </div>

            <h3 style={{ fontSize: '20px', marginBottom: '8px' }}>
              Create an Active Ledger Account
            </h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '14px', lineHeight: 1.5 }}>
              Your new account will be provisioned instantly with currency <strong>INR</strong> and initialized with ₹10,000 from the bank system reserve.
            </p>
          </div>

          <div
            style={{
              background: 'var(--bg-input)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-md)',
              padding: '16px',
              display: 'flex',
              flexDirection: 'column',
              gap: '10px',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
              <span style={{ color: 'var(--text-muted)' }}>Account Type:</span>
              <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>Standard Current Account</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
              <span style={{ color: 'var(--text-muted)' }}>Base Currency:</span>
              <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>INR (₹)</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
              <span style={{ color: 'var(--text-muted)' }}>Account Initialization:</span>
              <span style={{ fontWeight: 600, color: '#34d399' }}>₹10,000.00</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
              <span style={{ color: 'var(--text-muted)' }}>Accounting Protocol:</span>
              <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>Double-Entry Ledger</span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="modal-footer">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="btn btn-secondary"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleCreate}
            disabled={isSubmitting}
            className="btn btn-primary"
          >
            {isSubmitting ? (
              <>
                <Loader2 size={16} className="animate-pulse" />
                <span>Initializing Account...</span>
              </>
            ) : (
              <>
                <span>Confirm & Open Account</span>
                <ArrowRight size={16} />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
