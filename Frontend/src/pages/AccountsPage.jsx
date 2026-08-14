import React, { useState } from 'react';
import { CreditCard, PlusCircle, RefreshCw, ShieldCheck } from 'lucide-react';
import { useBank } from '../context/BankContext';
import { AccountCard } from '../components/AccountCard';
import { CreateAccountModal } from '../components/CreateAccountModal';
import { TransferModal } from '../components/TransferModal';

export function AccountsPage() {
  const { accounts, activeAccount, balance, selectActiveAccount, refreshAll } = useBank();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
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

  const activeAccountId = activeAccount?._id;

  return (
    <div className="container" style={{ paddingBottom: '60px', paddingTop: '24px' }}>
      {/* Header */}
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
          <h1 className="page-title" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <CreditCard size={24} style={{ color: 'var(--primary)', flexShrink: 0 }} />
            <span>Bank Accounts</span>
          </h1>
          <p className="page-subtitle">
            Manage your Lena Dena premier bank accounts, active statuses, and double-entry ledgers.
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
            <span>{isRefreshing ? 'Syncing...' : 'Refresh Accounts'}</span>
          </button>

          <button
            onClick={() => setIsCreateOpen(true)}
            className="btn btn-primary btn-sm"
          >
            <PlusCircle size={14} />
            <span>Open New Account</span>
          </button>
        </div>
      </div>

      {/* Account Grid */}
      {accounts.length === 0 ? (
        <div
          className="card"
          style={{
            textAlign: 'center',
            padding: '36px 20px',
            background: 'var(--bg-card)',
          }}
        >
          <CreditCard size={36} style={{ color: 'var(--text-muted)', margin: '0 auto 12px' }} />
          <h3 style={{ fontSize: '18px', marginBottom: '6px' }}>No Active Bank Accounts</h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '13px', maxWidth: '420px', margin: '0 auto 18px' }}>
            Initialize your first account to receive system reserve funding of ₹10,000.
          </p>
          <button
            onClick={() => setIsCreateOpen(true)}
            className="btn btn-primary"
          >
            <PlusCircle size={16} />
            <span>Open First Account</span>
          </button>
        </div>
      ) : (
        <div className="grid-3" style={{ marginBottom: '28px' }}>
          {accounts.map((acc) => (
            <AccountCard
              key={acc._id}
              account={acc}
              balance={acc._id === activeAccountId ? balance : null}
              isSelected={acc._id === activeAccountId}
              onSelect={() => selectActiveAccount(acc)}
            />
          ))}
        </div>
      )}

      {/* Architecture Note */}
      <div
        className="card"
        style={{
          padding: '20px',
          background: 'rgba(14, 20, 36, 0.6)',
          border: '1px solid var(--border-subtle)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
          <ShieldCheck size={18} style={{ color: 'var(--primary)', flexShrink: 0 }} />
          <h3 style={{ fontSize: '15px', fontWeight: 700 }}>Account & Reserve Isolation</h3>
        </div>
        <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
          Each Lena Dena bank account maintains an independent, immutable ledger trail in MongoDB. When transferring funds to another account holder, provide their 24-character hexadecimal Account ID.
        </p>
      </div>

      {/* Modals */}
      <CreateAccountModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
      />

      <TransferModal
        isOpen={isTransferOpen}
        onClose={() => setIsTransferOpen(false)}
      />
    </div>
  );
}
