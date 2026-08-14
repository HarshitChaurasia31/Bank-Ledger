import React, { useState } from 'react';
import { X, Copy, Check, ArrowDownLeft, ArrowUpRight, Shield, Clock, Hash, Key, RotateCcw, Loader2 } from 'lucide-react';
import { useBank } from '../context/BankContext';

export function TransactionDetailModal({ transaction, isOpen, onClose }) {
  const { activeAccount, showToast, retryTransaction } = useBank();
  const [copiedField, setCopiedField] = useState(null);
  const [isRetrying, setIsRetrying] = useState(false);

  if (!isOpen || !transaction) return null;

  const handleCopy = (text, fieldName) => {
    if (text) {
      navigator.clipboard.writeText(text);
      setCopiedField(fieldName);
      showToast(`${fieldName} copied to clipboard`, 'info');
      setTimeout(() => setCopiedField(null), 2000);
    }
  };

  const handleRetryPayment = async () => {
    if (!transaction || transaction.status !== 'PENDING' || !transaction.idempotencyKey) return;
    try {
      setIsRetrying(true);
      await retryTransaction(transaction.idempotencyKey);
      onClose();
    } catch (err) {
      console.error('Failed to retry payment:', err);
    } finally {
      setIsRetrying(false);
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
  const isPending = transaction.status === 'PENDING';

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
            <Shield size={18} style={{ color: 'var(--primary)', flexShrink: 0 }} />
            <span style={{ fontSize: 'clamp(15px, 3.5vw, 18px)' }}>Transaction Details</span>
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
          {/* Amount and Direction Banner */}
          <div
            style={{
              textAlign: 'center',
              padding: '12px 0 16px',
              borderBottom: '1px solid var(--border-subtle)',
              marginBottom: '16px',
            }}
          >
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '44px',
                height: '44px',
                borderRadius: 'var(--radius-full)',
                background: isInitial
                  ? 'rgba(99, 102, 241, 0.15)'
                  : isOutflow
                  ? 'rgba(239, 68, 68, 0.15)'
                  : 'rgba(16, 185, 129, 0.15)',
                color: isInitial ? '#a5b4fc' : isOutflow ? '#f87171' : '#34d399',
                marginBottom: '10px',
              }}
            >
              {isInitial ? (
                <Shield size={22} />
              ) : isOutflow ? (
                <ArrowUpRight size={22} />
              ) : (
                <ArrowDownLeft size={22} />
              )}
            </div>

            <div
              className="font-mono"
              style={{
                fontSize: 'clamp(22px, 5.5vw, 28px)',
                fontWeight: 800,
                color: isOutflow ? '#f87171' : '#34d399',
              }}
            >
              {isOutflow ? '-' : '+'}₹{transaction.amount?.toLocaleString('en-IN') || '0'}
            </div>

            <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', marginTop: '8px', flexWrap: 'wrap' }}>
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
              gap: '12px',
              fontSize: '13px',
            }}
          >
            {/* Transaction ID */}
            <div
              style={{
                background: 'var(--bg-input)',
                padding: '10px 12px',
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
                  style={{ width: '22px', height: '22px', minHeight: '22px', background: 'transparent', border: 'none', color: copiedField === 'Transaction ID' ? 'var(--primary)' : 'var(--text-muted)' }}
                >
                  {copiedField === 'Transaction ID' ? <Check size={12} /> : <Copy size={12} />}
                </button>
              </div>
              <div className="font-mono" style={{ color: 'var(--text-primary)', marginTop: '2px', wordBreak: 'break-all', fontSize: '12px' }}>
                {transaction._id}
              </div>
            </div>

            {/* From Account */}
            <div
              style={{
                background: 'var(--bg-input)',
                padding: '10px 12px',
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
                  style={{ width: '22px', height: '22px', minHeight: '22px', background: 'transparent', border: 'none', color: copiedField === 'Debited Account ID' ? 'var(--primary)' : 'var(--text-muted)' }}
                >
                  {copiedField === 'Debited Account ID' ? <Check size={12} /> : <Copy size={12} />}
                </button>
              </div>
              <div className="font-mono" style={{ color: 'var(--text-primary)', marginTop: '2px', wordBreak: 'break-all', fontSize: '12px' }}>
                {fromAccountId || 'System Reserve'}
              </div>
            </div>

            {/* To Account */}
            <div
              style={{
                background: 'var(--bg-input)',
                padding: '10px 12px',
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
                  style={{ width: '22px', height: '22px', minHeight: '22px', background: 'transparent', border: 'none', color: copiedField === 'Credited Account ID' ? 'var(--primary)' : 'var(--text-muted)' }}
                >
                  {copiedField === 'Credited Account ID' ? <Check size={12} /> : <Copy size={12} />}
                </button>
              </div>
              <div className="font-mono" style={{ color: 'var(--text-primary)', marginTop: '2px', wordBreak: 'break-all', fontSize: '12px' }}>
                {toAccountId}
              </div>
            </div>

            {/* Idempotency Key */}
            <div
              style={{
                background: 'var(--bg-input)',
                padding: '10px 12px',
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
                  style={{ width: '22px', height: '22px', minHeight: '22px', background: 'transparent', border: 'none', color: copiedField === 'Idempotency Key' ? 'var(--primary)' : 'var(--text-muted)' }}
                >
                  {copiedField === 'Idempotency Key' ? <Check size={12} /> : <Copy size={12} />}
                </button>
              </div>
              <div className="font-mono" style={{ color: 'var(--text-secondary)', fontSize: '11px', marginTop: '2px', wordBreak: 'break-all' }}>
                {transaction.idempotencyKey}
              </div>
            </div>

            {/* Timestamp */}
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0 4px', color: 'var(--text-muted)', fontSize: '12px', flexWrap: 'wrap', gap: '4px' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                <Clock size={13} /> Recorded Timestamp:
              </span>
              <span>{formattedDate}</span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="modal-footer">
          {isPending ? (
            <>
              <button
                type="button"
                onClick={handleRetryPayment}
                disabled={isRetrying}
                className="btn btn-primary"
                style={{ flex: 1 }}
              >
                {isRetrying ? (
                  <>
                    <Loader2 size={16} className="animate-pulse" />
                    <span>Retrying Payment...</span>
                  </>
                ) : (
                  <>
                    <RotateCcw size={16} />
                    <span>Retry Payment</span>
                  </>
                )}
              </button>
              <button
                type="button"
                onClick={onClose}
                disabled={isRetrying}
                className="btn btn-secondary"
              >
                Close
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={onClose}
              className="btn btn-secondary"
              style={{ width: '100%' }}
            >
              Close
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
