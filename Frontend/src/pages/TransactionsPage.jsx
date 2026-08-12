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
    <div className="container" style={{ paddingBottom: '60px', paddingTop: '32px' }}>
      {/* Page Header */}
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          gap: '20px',
          marginBottom: '32px',
        }}
      >
        <div>
          <h1 className="page-title" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <ArrowLeftRight size={26} style={{ color: 'var(--primary)' }} />
            <span>Double-Entry Ledger History</span>
          </h1>
          <p className="page-subtitle">
            Audited transaction ledger records for account{' '}
            <span className="font-mono" style={{ color: 'var(--text-primary)' }}>
              {activeAccount?._id || 'Primary Account'}
            </span>
          </p>
        </div>

        {/* Quick Actions */}
        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="btn btn-secondary"
          >
            <RefreshCw size={15} className={isRefreshing ? 'animate-pulse' : ''} />
            <span>{isRefreshing ? 'Syncing...' : 'Refresh History'}</span>
          </button>

          <button
            onClick={() => setIsTransferOpen(true)}
            className="btn btn-primary"
            disabled={!canTransfer}
            title={!canTransfer ? 'Create and initialize an account first.' : 'Transfer Money'}
          >
            <Send size={15} />
            <span>Transfer Money</span>
          </button>
        </div>
      </div>

      {/* Summary Chips */}
      <div
        style={{
          display: 'flex',
          gap: '16px',
          marginBottom: '24px',
          flexWrap: 'wrap',
        }}
      >
        <div
          style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border-card)',
            borderRadius: 'var(--radius-md)',
            padding: '12px 20px',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
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
            padding: '12px 20px',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
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
