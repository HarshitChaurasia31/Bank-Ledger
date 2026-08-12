import React, { useState } from 'react';
import { X, Copy, Check, ArrowDownLeft, ArrowUpRight, Shield, Clock, Hash, Key } from 'lucide-react';
import { useBank } from '../context/BankContext';

export function TransactionDetailModal({ transaction, isOpen, onClose }) {
  const { activeAccount, showToast } = useBank();
  const [copiedField, setCopiedField] = useState(null);

  if (!isOpen || !transaction) return null;

  const handleCopy = (text, fieldName) => {
    if (text) {
      navigator.clipboard.writeText(text);
      setCopiedField(fieldName);
      showToast(`${fieldName} copied to clipboard`, 'info');
      setTimeout(() => setCopiedField(null), 2000);
    }
  };

  const fromAccountId = typeof transaction.fromAccount === 'object'
    ? transaction.fromAccount?._id
    : transaction.fromAccount;

  const toAccountId = typeof transaction.toAccount === 'object'
    ? transaction.toAccount?._id
    : transaction.toAccount;

  const isOutflow = fromAccountId === activeAccount?._id;
  const isInitial = transaction.type === 'INITIAL_FUND';

  const formattedDate = transaction.createdAt
    ? new Date(transaction.createdAt).toLocaleString('en-IN', {
        dateStyle: 'medium',
        timeStyle: 'medium',
      })
    : 'N/A';

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-dialog" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="modal-header">
          <div className="modal-title">
            <Shield size={18} style={{ color: 'var(--primary)' }} />
            <span>Transaction Details</span>
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
          {/* Amount and Direction Banner */}
          <div
            style={{
              textAlign: 'center',
              padding: '16px 0 20px',
              borderBottom: '1px solid var(--border-subtle)',
              marginBottom: '20px',
            }}
          >
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '48px',
                height: '48px',
                borderRadius: 'var(--radius-full)',
                background: isInitial
                  ? 'rgba(99, 102, 241, 0.15)'
                  : isOutflow
                  ? 'rgba(239, 68, 68, 0.15)'
                  : 'rgba(16, 185, 129, 0.15)',
                color: isInitial ? '#a5b4fc' : isOutflow ? '#f87171' : '#34d399',
                marginBottom: '12px',
              }}
            >
              {isInitial ? (
                <Shield size={24} />
              ) : isOutflow ? (
                <ArrowUpRight size={24} />
              ) : (
                <ArrowDownLeft size={24} />
              )}
            </div>

            <div
              className="font-mono"
              style={{
                fontSize: '28px',
                fontWeight: 800,
                color: isOutflow ? '#f87171' : '#34d399',
              }}
            >
              {isOutflow ? '-' : '+'}₹{transaction.amount?.toLocaleString('en-IN') || '0'}
            </div>

            <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', marginTop: '8px' }}>
              <span className={`badge badge-${transaction.status?.toLowerCase()}`}>
                {transaction.status}
              </span>
              <span className="badge badge-initial">
                {transaction.type}
              </span>
            </div>
          </div>

          {/* Real Backend Fields */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '14px',
              fontSize: '13px',
            }}
          >
            {/* Transaction ID */}
            <div
              style={{
                background: 'var(--bg-input)',
                padding: '10px 14px',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--border-subtle)',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ color: 'var(--text-muted)', fontSize: '11px', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <Hash size={12} /> Transaction ID
                </span>
                <button
                  onClick={() => handleCopy(transaction._id, 'Transaction ID')}
                  className="btn btn-icon btn-sm"
                  style={{ width: '20px', height: '20px', background: 'transparent', border: 'none', color: copiedField === 'Transaction ID' ? 'var(--primary)' : 'var(--text-muted)' }}
                >
                  {copiedField === 'Transaction ID' ? <Check size={12} /> : <Copy size={12} />}
                </button>
              </div>
              <div className="font-mono" style={{ color: 'var(--text-primary)', marginTop: '2px', wordBreak: 'break-all' }}>
                {transaction._id}
              </div>
            </div>

            {/* From Account */}
            <div
              style={{
                background: 'var(--bg-input)',
                padding: '10px 14px',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--border-subtle)',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ color: 'var(--text-muted)', fontSize: '11px', textTransform: 'uppercase' }}>
                  Debited Account (From)
                </span>
                <button
                  onClick={() => handleCopy(fromAccountId, 'Debited Account ID')}
                  className="btn btn-icon btn-sm"
                  style={{ width: '20px', height: '20px', background: 'transparent', border: 'none', color: copiedField === 'Debited Account ID' ? 'var(--primary)' : 'var(--text-muted)' }}
                >
                  {copiedField === 'Debited Account ID' ? <Check size={12} /> : <Copy size={12} />}
                </button>
              </div>
              <div className="font-mono" style={{ color: 'var(--text-primary)', marginTop: '2px', wordBreak: 'break-all' }}>
                {fromAccountId || 'System Reserve'}
              </div>
            </div>

            {/* To Account */}
            <div
              style={{
                background: 'var(--bg-input)',
                padding: '10px 14px',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--border-subtle)',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ color: 'var(--text-muted)', fontSize: '11px', textTransform: 'uppercase' }}>
                  Credited Account (To)
                </span>
                <button
                  onClick={() => handleCopy(toAccountId, 'Credited Account ID')}
                  className="btn btn-icon btn-sm"
                  style={{ width: '20px', height: '20px', background: 'transparent', border: 'none', color: copiedField === 'Credited Account ID' ? 'var(--primary)' : 'var(--text-muted)' }}
                >
                  {copiedField === 'Credited Account ID' ? <Check size={12} /> : <Copy size={12} />}
                </button>
              </div>
              <div className="font-mono" style={{ color: 'var(--text-primary)', marginTop: '2px', wordBreak: 'break-all' }}>
                {toAccountId}
              </div>
            </div>

            {/* Idempotency Key */}
            <div
              style={{
                background: 'var(--bg-input)',
                padding: '10px 14px',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--border-subtle)',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ color: 'var(--text-muted)', fontSize: '11px', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <Key size={12} /> Idempotency Key
                </span>
                <button
                  onClick={() => handleCopy(transaction.idempotencyKey, 'Idempotency Key')}
                  className="btn btn-icon btn-sm"
                  style={{ width: '20px', height: '20px', background: 'transparent', border: 'none', color: copiedField === 'Idempotency Key' ? 'var(--primary)' : 'var(--text-muted)' }}
                >
                  {copiedField === 'Idempotency Key' ? <Check size={12} /> : <Copy size={12} />}
                </button>
              </div>
              <div className="font-mono" style={{ color: 'var(--text-secondary)', fontSize: '11px', marginTop: '2px', wordBreak: 'break-all' }}>
                {transaction.idempotencyKey}
              </div>
            </div>

            {/* Timestamp */}
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0 4px', color: 'var(--text-muted)', fontSize: '12px' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                <Clock size={13} /> Recorded Timestamp:
              </span>
              <span>{formattedDate}</span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="modal-footer">
          <button
            type="button"
            onClick={onClose}
            className="btn btn-secondary"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
