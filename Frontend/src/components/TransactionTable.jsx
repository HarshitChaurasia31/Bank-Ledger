import React, { useState } from 'react';
import {
  ArrowDownLeft,
  ArrowUpRight,
  Shield,
  Search,
  ExternalLink,
  Filter,
  Copy,
  Check,
} from 'lucide-react';
import { useBank } from '../context/BankContext';
import { TransactionDetailModal } from './TransactionDetailModal';

export function TransactionTable({ transactions = [], isLoading = false }) {
  const { activeAccount, showToast } = useBank();
  const [searchTerm, setSearchTerm] = useState('');
  const [directionFilter, setDirectionFilter] = useState('ALL'); // 'ALL' | 'INFLOW' | 'OUTFLOW'
  const [selectedTransaction, setSelectedTransaction] = useState(null);
  const [copiedId, setCopiedId] = useState(null);

  const handleCopy = (e, text) => {
    e.stopPropagation();
    if (text) {
      navigator.clipboard.writeText(text);
      setCopiedId(text);
      showToast('ID copied to clipboard', 'info');
      setTimeout(() => setCopiedId(null), 2000);
    }
  };

  const filteredTransactions = transactions.filter((tx) => {
    const fromId = typeof tx.fromAccount === 'object' ? tx.fromAccount?._id : tx.fromAccount;
    const toId = typeof tx.toAccount === 'object' ? tx.toAccount?._id : tx.toAccount;
    const isOutflow = fromId === activeAccount?._id;

    // Direction Filter
    if (directionFilter === 'INFLOW' && isOutflow) return false;
    if (directionFilter === 'OUTFLOW' && !isOutflow) return false;

    // Search Filter
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      const matchTxId = tx._id?.toLowerCase().includes(term);
      const matchFrom = fromId?.toLowerCase().includes(term);
      const matchTo = toId?.toLowerCase().includes(term);
      const matchAmount = tx.amount?.toString().includes(term);
      const matchKey = tx.idempotencyKey?.toLowerCase().includes(term);

      return matchTxId || matchFrom || matchTo || matchAmount || matchKey;
    }

    return true;
  });

  return (
    <div>
      {/* Search & Filter Toolbar */}
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: '14px',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '16px',
        }}
      >
        {/* Direction Filter Tabs */}
        <div
          style={{
            display: 'flex',
            background: 'var(--bg-input)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-md)',
            padding: '4px',
            gap: '4px',
          }}
        >
          <button
            type="button"
            onClick={() => setDirectionFilter('ALL')}
            className="btn btn-sm"
            style={{
              background: directionFilter === 'ALL' ? 'var(--bg-surface-raised)' : 'transparent',
              color: directionFilter === 'ALL' ? 'var(--text-primary)' : 'var(--text-muted)',
              border: directionFilter === 'ALL' ? '1px solid var(--border-card)' : 'none',
              padding: '4px 12px',
            }}
          >
            All Activity
          </button>
          <button
            type="button"
            onClick={() => setDirectionFilter('INFLOW')}
            className="btn btn-sm"
            style={{
              background: directionFilter === 'INFLOW' ? 'rgba(16, 185, 129, 0.15)' : 'transparent',
              color: directionFilter === 'INFLOW' ? '#34d399' : 'var(--text-muted)',
              border: directionFilter === 'INFLOW' ? '1px solid rgba(16, 185, 129, 0.3)' : 'none',
              padding: '4px 12px',
            }}
          >
            Inflow (Credits)
          </button>
          <button
            type="button"
            onClick={() => setDirectionFilter('OUTFLOW')}
            className="btn btn-sm"
            style={{
              background: directionFilter === 'OUTFLOW' ? 'rgba(239, 68, 68, 0.15)' : 'transparent',
              color: directionFilter === 'OUTFLOW' ? '#f87171' : 'var(--text-muted)',
              border: directionFilter === 'OUTFLOW' ? '1px solid rgba(239, 68, 68, 0.3)' : 'none',
              padding: '4px 12px',
            }}
          >
            Outflow (Debits)
          </button>
        </div>

        {/* Search Input */}
        <div style={{ position: 'relative', width: '280px' }}>
          <Search size={16} className="input-icon" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search Tx, Account, Amount..."
            className="form-control font-mono"
            style={{ paddingLeft: '38px', paddingRight: '12px', height: '38px', fontSize: '13px' }}
          />
        </div>
      </div>

      {/* Table Structure */}
      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th>Type / Direction</th>
              <th>Counterparty Account</th>
              <th>Amount (INR)</th>
              <th>Status</th>
              <th>Date & Time</th>
              <th style={{ textAlign: 'right' }}>Details</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={6} style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                  Loading ledger transactions...
                </td>
              </tr>
            ) : filteredTransactions.length === 0 ? (
              <tr>
                <td colSpan={6} style={{ textAlign: 'center', padding: '48px', color: 'var(--text-muted)' }}>
                  No transaction records found matching the current filters.
                </td>
              </tr>
            ) : (
              filteredTransactions.map((tx) => {
                const fromId = typeof tx.fromAccount === 'object' ? tx.fromAccount?._id : tx.fromAccount;
                const toId = typeof tx.toAccount === 'object' ? tx.toAccount?._id : tx.toAccount;
                const isOutflow = fromId === activeAccount?._id;
                const isInitial = tx.type === 'INITIAL_FUND';

                const counterpartyId = isOutflow ? toId : fromId;
                const formattedCounterparty = counterpartyId
                  ? `${counterpartyId.substring(0, 6)}...${counterpartyId.substring(counterpartyId.length - 4)}`
                  : 'System Reserve';

                const formattedDate = tx.createdAt
                  ? new Date(tx.createdAt).toLocaleDateString('en-IN', {
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })
                  : '—';

                return (
                  <tr
                    key={tx._id}
                    onClick={() => setSelectedTransaction(tx)}
                    style={{ cursor: 'pointer' }}
                  >
                    {/* Direction / Type */}
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div
                          style={{
                            width: '32px',
                            height: '32px',
                            borderRadius: 'var(--radius-sm)',
                            background: isInitial
                              ? 'rgba(99, 102, 241, 0.15)'
                              : isOutflow
                              ? 'rgba(239, 68, 68, 0.15)'
                              : 'rgba(16, 185, 129, 0.15)',
                            color: isInitial ? '#a5b4fc' : isOutflow ? '#f87171' : '#34d399',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}
                        >
                          {isInitial ? <Shield size={16} /> : isOutflow ? <ArrowUpRight size={16} /> : <ArrowDownLeft size={16} />}
                        </div>
                        <div>
                          <div style={{ fontWeight: 600, fontSize: '13px' }}>
                            {isInitial ? 'Account Initialization' : isOutflow ? 'Money Transfer (Debit)' : 'Incoming Transfer (Credit)'}
                          </div>
                          <div className="font-mono" style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                            Tx: {tx._id.substring(0, 8)}...
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Counterparty Account */}
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span className="font-mono" style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>
                          {formattedCounterparty}
                        </span>
                        {counterpartyId && (
                          <button
                            onClick={(e) => handleCopy(e, counterpartyId)}
                            title="Copy Account ID"
                            className="btn btn-icon btn-sm"
                            style={{ width: '20px', height: '20px', background: 'transparent', border: 'none', color: copiedId === counterpartyId ? 'var(--primary)' : 'var(--text-muted)' }}
                          >
                            {copiedId === counterpartyId ? <Check size={12} /> : <Copy size={12} />}
                          </button>
                        )}
                      </div>
                    </td>

                    {/* Amount */}
                    <td>
                      <span
                        className="font-mono"
                        style={{
                          fontWeight: 700,
                          fontSize: '14px',
                          color: isOutflow ? '#f87171' : '#34d399',
                        }}
                      >
                        {isOutflow ? '-' : '+'}₹{tx.amount?.toLocaleString('en-IN') || '0'}
                      </span>
                    </td>

                    {/* Status */}
                    <td>
                      <span className={`badge badge-${tx.status?.toLowerCase()}`}>
                        {tx.status}
                      </span>
                    </td>

                    {/* Date */}
                    <td>
                      <span style={{ color: 'var(--text-muted)', fontSize: '13px' }}>
                        {formattedDate}
                      </span>
                    </td>

                    {/* Details Action */}
                    <td style={{ textAlign: 'right' }}>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedTransaction(tx);
                        }}
                        className="btn btn-icon btn-sm btn-outline"
                        title="View Full Transaction Details"
                        style={{ width: '32px', height: '32px' }}
                      >
                        <ExternalLink size={14} />
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Transaction Detail Inspector Modal */}
      <TransactionDetailModal
        transaction={selectedTransaction}
        isOpen={Boolean(selectedTransaction)}
        onClose={() => setSelectedTransaction(null)}
      />
    </div>
  );
}
