import React, { useState } from 'react';
import { ArrowLeftRight, RefreshCw, Send, Shield } from 'lucide-react';
import { useBank } from '../context/BankContext';
import { TransactionTable } from '../components/TransactionTable';
import { TransferModal } from '../components/TransferModal';

export function TransactionsPage() {
  const { transactions, isHistoryLoading, refreshAll, activeAccount, canTransfer } = useBank();
  const [isTransferOpen, setIsTransferOpen] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = async () => {
    try {
      setIsRefreshing(true);
      await refreshAll();
    } finally {
      setIsRefreshing(false);
    }
  };

  const totalCompleted = transactions.filter((t) => t.status === 'COMPLETED').length;

  return (
    <div className="container" style={{ paddingBottom: '60px', paddingTop: '24px' }}>
      {/* Page Header */}
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: '16px',
          marginBottom: '24px',
        }}
      >
        <div>
          <h1 className="page-title" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <ArrowLeftRight size={24} style={{ color: 'var(--primary)', flexShrink: 0 }} />
            <span>Double-Entry Ledger History</span>
          </h1>
          <p className="page-subtitle">
            Audited transaction ledger records for account{' '}
            <span className="font-mono" style={{ color: 'var(--text-primary)', wordBreak: 'break-all' }}>
              {activeAccount?._id || 'Primary Account'}
            </span>
          </p>
        </div>

        {/* Quick Actions */}
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="btn btn-secondary btn-sm"
          >
            <RefreshCw size={14} className={isRefreshing ? 'animate-pulse' : ''} />
            <span>{isRefreshing ? 'Syncing...' : 'Refresh History'}</span>
          </button>

          <button
            onClick={() => setIsTransferOpen(true)}
            className="btn btn-primary btn-sm"
            disabled={!canTransfer}
            title={!canTransfer ? 'Create and initialize an account first.' : 'Transfer Money'}
          >
            <Send size={14} />
            <span>Transfer Money</span>
          </button>
        </div>
      </div>

      {/* Summary Chips */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          gap: '12px',
          marginBottom: '20px',
        }}
      >
        <div
          style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border-card)',
            borderRadius: 'var(--radius-md)',
            padding: '12px 16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Total Transactions:</span>
          <span className="font-mono" style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)' }}>
            {transactions.length}
          </span>
        </div>

        <div
          style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border-card)',
            borderRadius: 'var(--radius-md)',
            padding: '12px 16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Completed Audits:</span>
          <span className="font-mono" style={{ fontSize: '16px', fontWeight: 700, color: '#34d399' }}>
            {totalCompleted}
          </span>
        </div>
      </div>

      {/* Main Transactions Table */}
      <TransactionTable
        transactions={transactions}
        isLoading={isHistoryLoading}
      />

      {/* Transfer Modal */}
      <TransferModal
        isOpen={isTransferOpen}
        onClose={() => setIsTransferOpen(false)}
      />
    </div>
  );
}
