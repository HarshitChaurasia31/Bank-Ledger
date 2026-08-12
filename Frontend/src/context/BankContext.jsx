import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { accountsApi, transactionsApi, ApiError } from '../api/client';
import { useAuth } from './AuthContext';

const BankContext = createContext(null);

export function BankProvider({ children }) {
  const { isAuthenticated } = useAuth();
  
  const [accounts, setAccounts] = useState([]);
  const [activeAccount, setActiveAccountState] = useState(null);
  const [balance, setBalance] = useState(null);
  const [isAccountsLoading, setIsAccountsLoading] = useState(false);
  const [isBalanceLoading, setIsBalanceLoading] = useState(false);
  
  const [transactions, setTransactions] = useState([]);
  const [isHistoryLoading, setIsHistoryLoading] = useState(false);
  
  const [toast, setToast] = useState(null);

  const showToast = (message, type = 'success') => {
    setToast({ message, type, id: Date.now() });
    setTimeout(() => {
      setToast(null);
    }, 4500);
  };

  /**
   * Fetch active account balance derived from double-entry ledger aggregation
   */
  const fetchBalance = useCallback(async (accountId) => {
    if (!accountId) return;
    try {
      setIsBalanceLoading(true);
      const res = await accountsApi.getBalance(accountId);
      if (res && typeof res.balance === 'number') {
        setBalance(res.balance);
      }
    } catch (err) {
      console.error('Failed to fetch account balance:', err);
    } finally {
      setIsBalanceLoading(false);
    }
  }, []);

  /**
   * Fetch all user accounts
   */
  const fetchAccounts = useCallback(async (preferredAccountId = null) => {
    try {
      setIsAccountsLoading(true);
      const res = await accountsApi.getAccounts();
      const accountList = res?.accounts || [];
      setAccounts(accountList);

      if (accountList.length > 0) {
        const selected = preferredAccountId
          ? accountList.find((a) => a._id === preferredAccountId) || accountList[0]
          : accountList[0];
        
        setActiveAccountState(selected);
        await fetchBalance(selected._id);
      } else {
        setActiveAccountState(null);
        setBalance(null);
      }
    } catch (err) {
      console.error('Failed to fetch accounts:', err);
    } finally {
      setIsAccountsLoading(false);
    }
  }, [fetchBalance]);

  /**
   * Fetch transaction history for user accounts
   */
  const fetchHistory = useCallback(async () => {
    try {
      setIsHistoryLoading(true);
      const res = await transactionsApi.getHistory();
      setTransactions(res?.transactions || []);
    } catch (err) {
      console.error('Failed to fetch transaction history:', err);
    } finally {
      setIsHistoryLoading(false);
    }
  }, []);

  /**
   * Change active account and immediately fetch its updated ledger balance
   */
  const selectActiveAccount = (account) => {
    if (account?._id === activeAccount?._id) return;
    setActiveAccountState(account);
    setBalance(null); // Clear previous account's balance immediately
    if (account?._id) {
      fetchBalance(account._id);
    }
  };

  /**
   * Create a new bank account with atomic ₹10,000 INITIAL_FUND
   */
  const createAccount = async () => {
    try {
      const res = await accountsApi.createAccount();
      const newAccount = res?.account;
      
      if (newAccount) {
        // Refresh account list and select new account
        await fetchAccounts(newAccount._id);
        await fetchHistory();
        
        // Exact subtle success feedback specified in instructions
        showToast('Account created successfully. Your account has been initialized with ₹10,000.', 'success');
      }
      return newAccount;
    } catch (err) {
      showToast(err.message || 'Failed to create account', 'danger');
      throw err;
    }
  };

  /**
   * Execute an atomic money transfer with an idempotency key
   */
  const executeTransfer = async ({ fromAccount, toAccount, amount, idempotencyKey }) => {
    try {
      const res = await transactionsApi.createTransaction({
        fromAccount,
        toAccount,
        amount: Number(amount),
        idempotencyKey,
      });

      // Refresh financial data on successful transfer
      if (activeAccount?._id) {
        await fetchBalance(activeAccount._id);
      }
      await fetchHistory();
      
      showToast(res?.message || 'Transfer completed successfully', 'success');
      return res;
    } catch (err) {
      throw err;
    }
  };

  /**
   * Manual refresh action triggered by user
   */
  const refreshAll = async () => {
    if (activeAccount?._id) {
      await Promise.all([
        fetchAccounts(activeAccount._id),
        fetchBalance(activeAccount._id),
        fetchHistory(),
      ]);
      showToast('Account & balance data refreshed', 'info');
    } else {
      await Promise.all([fetchAccounts(), fetchHistory()]);
    }
  };

  // Initial load when authenticated
  useEffect(() => {
    if (isAuthenticated) {
      fetchAccounts();
      fetchHistory();
    } else {
      setAccounts([]);
      setActiveAccountState(null);
      setBalance(null);
      setTransactions([]);
    }
  }, [isAuthenticated, fetchAccounts, fetchHistory]);

  /**
   * Single shared readiness state:
   * Enabled once account creation & initial funding complete successfully and an active account is loaded.
   * Does NOT require balance > 0 so accounts with ₹0 balance can still open transfer UI.
   */
  const canTransfer = Boolean(
    !isAccountsLoading &&
    accounts.length > 0 &&
    activeAccount &&
    activeAccount._id &&
    activeAccount.status === 'Active'
  );

  const value = {
    accounts,
    activeAccount,
    balance,
    canTransfer,
    isAccountsLoading,
    isBalanceLoading,
    transactions,
    isHistoryLoading,
    toast,
    showToast,
    selectActiveAccount,
    createAccount,
    executeTransfer,
    fetchBalance,
    fetchAccounts,
    fetchHistory,
    refreshAll,
  };

  return <BankContext.Provider value={value}>{children}</BankContext.Provider>;
}

export function useBank() {
  const context = useContext(BankContext);
  if (!context) {
    throw new Error('useBank must be used within a BankProvider');
  }
  return context;
}
