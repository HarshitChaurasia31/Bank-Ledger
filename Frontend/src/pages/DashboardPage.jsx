import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Send,
  PlusCircle,
  RefreshCw,
  ArrowDownLeft,
  ArrowUpRight,
  TrendingUp,
  CreditCard,
  ShieldCheck,
  Building2,
  Lock,
} from 'lucide-react';
import { useBank } from '../context/BankContext';
import { useAuth } from '../context/AuthContext';
import { AccountCard } from '../components/AccountCard';
import { TransactionTable } from '../components/TransactionTable';
import { TransferModal } from '../components/TransferModal';
import { CreateAccountModal } from '../components/CreateAccountModal';

export function DashboardPage() {
  const { user } = useAuth();
  const {
    accounts,
    activeAccount,
    balance,
    canTransfer,
    isBalanceLoading,
    transactions,
    isHistoryLoading,
    selectActiveAccount,
    refreshAll,
  } = useBank();

  const [isTransferOpen, setIsTransferOpen] = useState(false);
  const [isCreateAccountOpen, setIsCreateAccountOpen] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = async () => {
    try {
      setIsRefreshing(true);
      await refreshAll();
    } finally {
      setIsRefreshing(false);
    }
  };

  // Derive Inflow/Outflow summary stats from transaction history
  const activeAccountId = activeAccount?._id;
  let totalCredits = 0;
  let totalDebits = 0;

  transactions.forEach((tx) => {
    const fromId = typeof tx.fromAccount === 'object' ? tx.fromAccount?._id : tx.fromAccount;
    const toId = typeof tx.toAccount === 'object' ? tx.toAccount?._id : tx.toAccount;

    if (tx.status === 'COMPLETED') {
      if (toId === activeAccountId) {
        totalCredits += tx.amount || 0;
      }
      if (fromId === activeAccountId) {
        totalDebits += tx.amount || 0;
      }
    }
  });

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
          <h1 className="page-title">
            Banking Dashboard
          </h1>
          <p className="page-subtitle">
            Welcome back{user?.name ? `, ${user.name}` : ''}. Lena Dena Bank — Every rupee accounted for.
          </p>
        </div>

        {/* Top Quick Actions */}
        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="btn btn-secondary"
            title="Refresh Account Data"
          >
            <RefreshCw size={15} className={isRefreshing ? 'animate-pulse' : ''} />
            <span>{isRefreshing ? 'Syncing...' : 'Refresh'}</span>
          </button>

          <button
            onClick={() => setIsCreateAccountOpen(true)}
            className="btn btn-secondary"
          >
            <PlusCircle size={15} />
            <span>Open Account</span>
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

      {/* Financial Metrics Row */}
      <div className="grid-3" style={{ marginBottom: '32px' }}>
        {/* Main Ledger Balance Card */}
        <div
          className="card card-glowing"
          style={{
            background: 'linear-gradient(135deg, rgba(16, 30, 54, 0.9) 0%, rgba(10, 18, 34, 0.9) 100%)',
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Active Ledger Balance
            </span>
            <span className="badge badge-success">Live Audited</span>
          </div>

          <div
            className="font-mono"
            style={{
              fontSize: '36px',
              fontWeight: 800,
              color: '#34d399',
              marginBottom: '6px',
            }}
          >
            {isBalanceLoading ? 'Syncing...' : typeof balance === 'number' ? `₹${balance.toLocaleString('en-IN')}` : '₹••••••'}
          </div>

          <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
            Calculated dynamically: <span className="font-mono" style={{ color: 'var(--text-primary)' }}>Σ(Credits) - Σ(Debits)</span>
          </div>
        </div>

        {/* Total Inflow (Credits) */}
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Total Inflow (Credits)
            </span>
            <div
              style={{
                width: '28px',
                height: '28px',
                borderRadius: 'var(--radius-sm)',
                background: 'rgba(16, 185, 129, 0.15)',
                color: '#34d399',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <ArrowDownLeft size={16} />
            </div>
          </div>

          <div
            className="font-mono"
            style={{
              fontSize: '28px',
              fontWeight: 700,
              color: '#34d399',
              marginBottom: '6px',
            }}
          >
            +₹{totalCredits.toLocaleString('en-IN')}
          </div>

          <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
            Total incoming transfers & initialization
          </div>
        </div>

        {/* Total Outflow (Debits) */}
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Total Outflow (Debits)
            </span>
            <div
              style={{
                width: '28px',
                height: '28px',
                borderRadius: 'var(--radius-sm)',
                background: 'rgba(239, 68, 68, 0.15)',
                color: '#f87171',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <ArrowUpRight size={16} />
            </div>
          </div>

          <div
            className="font-mono"
            style={{
              fontSize: '28px',
              fontWeight: 700,
              color: '#f87171',
              marginBottom: '6px',
            }}
          >
            -₹{totalDebits.toLocaleString('en-IN')}
          </div>

          <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
            Total money transferred out
          </div>
        </div>
      </div>

      {/* Your Bank Accounts Section */}
      <div style={{ marginBottom: '36px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <div>
            <h2 style={{ fontSize: '20px', fontWeight: 700 }}>Your Bank Accounts</h2>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
              Select an account to view transactions and transfer funds.
            </p>
          </div>
          <button
            onClick={() => setIsCreateAccountOpen(true)}
            className="btn btn-secondary btn-sm"
          >
            <PlusCircle size={14} />
            <span>New Account</span>
          </button>
        </div>

        {accounts.length === 0 ? (
          <div
            className="card"
            style={{
              textAlign: 'center',
              padding: '48px 24px',
              background: 'var(--bg-card)',
            }}
          >
            <CreditCard size={40} style={{ color: 'var(--text-muted)', margin: '0 auto 12px' }} />
            <h3 style={{ fontSize: '18px', marginBottom: '6px' }}>No Active Bank Accounts</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '14px', maxWidth: '420px', margin: '0 auto 20px' }}>
              Open your first Lena Dena Bank account to receive initial reserve funding of ₹10,000.
            </p>
            <button
              onClick={() => setIsCreateAccountOpen(true)}
              className="btn btn-primary"
            >
              <PlusCircle size={16} />
              <span>Initialize First Account</span>
            </button>
          </div>
        ) : (
          <div className="grid-3">
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
      </div>

      {/* Recent Activity Table */}
      <div style={{ marginBottom: '36px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <div>
            <h2 style={{ fontSize: '20px', fontWeight: 700 }}>Recent Ledger Activity</h2>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
              Live audit trail of immutable debit and credit records.
            </p>
          </div>
          <Link to="/transactions" className="btn btn-secondary btn-sm">
            <span>View Full Ledger</span>
          </Link>
        </div>

        <TransactionTable
          transactions={transactions.slice(0, 5)}
          isLoading={isHistoryLoading}
        />
      </div>

      {/* Lena Dena Core Principles Info Card */}
      <div
        className="card"
        style={{
          background: 'linear-gradient(135deg, rgba(14, 22, 40, 0.6) 0%, rgba(10, 16, 30, 0.6) 100%)',
          border: '1px solid var(--border-subtle)',
          padding: '24px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
          <ShieldCheck size={20} style={{ color: 'var(--primary)' }} />
          <h3 style={{ fontSize: '16px', fontWeight: 700 }}>
            Lena Dena Core Philosophy — Every Rupee Accounted For
          </h3>
        </div>
        <div className="grid-3" style={{ fontSize: '13px', color: 'var(--text-secondary)', gap: '20px' }}>
          <div>
            <strong style={{ color: 'var(--text-primary)', display: 'block', marginBottom: '4px' }}>
              1. Double-Entry Invariance
            </strong>
            Every transaction generates synchronized DEBIT and CREDIT entries. Money is never created or destroyed arbitrarily.
          </div>
          <div>
            <strong style={{ color: 'var(--text-primary)', display: 'block', marginBottom: '4px' }}>
              2. Immutable Audit Trail
            </strong>
            Ledger records cannot be modified or deleted. Balances are derived dynamically via deterministic aggregation.
          </div>
          <div>
            <strong style={{ color: 'var(--text-primary)', display: 'block', marginBottom: '4px' }}>
              3. Idempotent Transfer Safety
            </strong>
            Every transfer requires a unique cryptographic key to eliminate double-spending and ensure safe network retries.
          </div>
        </div>
      </div>

      {/* Modals */}
      <TransferModal
        isOpen={isTransferOpen}
        onClose={() => setIsTransferOpen(false)}
      />

      <CreateAccountModal
        isOpen={isCreateAccountOpen}
        onClose={() => setIsCreateAccountOpen(false)}
      />
    </div>
  );
}
