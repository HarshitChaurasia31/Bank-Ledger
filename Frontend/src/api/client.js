/**
 * Centralized API Client Layer for Lena Dena Bank
 * Strictly enforces credentials: "include" for cookie-based authentication.
 */

const API_BASE = '/api';

/**
 * Custom API Error class carrying HTTP status and server error payload.
 */
export class ApiError extends Error {
  constructor(message, status, data = null) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.data = data;
  }
}

/**
 * Core fetch wrapper with JSON serialization, credential inclusion, and error normalization.
 */
async function request(endpoint, options = {}) {
  const url = `${API_BASE}${endpoint}`;
  
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  };

  const config = {
    ...options,
    headers,
    credentials: 'include', // Always send and receive HTTP-only cookies
  };

  if (options.body && typeof options.body === 'object') {
    config.body = JSON.stringify(options.body);
  }

  let response;
  try {
    response = await fetch(url, config);
  } catch (networkError) {
    throw new ApiError(
      'Network connection error. Please ensure the backend server is running.',
      0,
      { originalError: networkError.message }
    );
  }

  // Parse JSON response safely
  let data = null;
  const contentType = response.headers.get('content-type');
  if (contentType && contentType.includes('application/json')) {
    try {
      data = await response.json();
    } catch {
      data = null;
    }
  }

  if (!response.ok) {
    const errorMessage = data?.message || `Request failed with status ${response.status}`;
    throw new ApiError(errorMessage, response.status, data);
  }

  return data;
}

// ----------------------------------------------------
// Authentication Endpoints
// ----------------------------------------------------
export const authApi = {
  /**
   * Register a new user
   * POST /api/auth/register
   */
  register: (payload) =>
    request('/auth/register', {
      method: 'POST',
      body: payload,
    }),

  /**
   * Log in an existing user
   * POST /api/auth/login
   */
  login: (credentials) =>
    request('/auth/login', {
      method: 'POST',
      body: credentials,
    }),

  /**
   * Log in a system administrator
   * POST /api/auth/system-login
   */
  systemLogin: (credentials) =>
    request('/auth/system-login', {
      method: 'POST',
      body: credentials,
    }),

  /**
   * Log out the active user/admin and clear session cookie
   * POST /api/auth/logout
   */
  logout: () =>
    request('/auth/logout', {
      method: 'POST',
      body: {},
    }),
};

// ----------------------------------------------------
// Bank Account Endpoints
// ----------------------------------------------------
export const accountsApi = {
  /**
   * Create a new bank account (automatically triggers ₹10,000 INITIAL_FUND)
   * POST /api/accounts
   */
  createAccount: () =>
    request('/accounts', {
      method: 'POST',
      body: {},
    }),

  /**
   * Retrieve all bank accounts belonging to the authenticated user
   * GET /api/accounts
   */
  getAccounts: () =>
    request('/accounts', {
      method: 'GET',
    }),

  /**
   * Retrieve dynamic balance calculated from double-entry ledger entries
   * GET /api/accounts/balance/:accountId
   */
  getBalance: (accountId) =>
    request(`/accounts/balance/${accountId}`, {
      method: 'GET',
    }),

  /**
   * Search available recipient accounts by ID prefix (excludes system account server-side)
   * GET /api/accounts/search?q=<query>&limit=5
   */
  searchAccounts: (q = '', limit = 5) => {
    const params = new URLSearchParams();
    if (q && q.trim()) params.set('q', q.trim());
    if (limit) params.set('limit', limit);
    const qs = params.toString() ? `?${params.toString()}` : '';
    return request(`/accounts/search${qs}`, {
      method: 'GET',
    });
  },

  /**
   * Retrieve all customer accounts for the Admin Dashboard (excludes system account)
   * GET /api/accounts/admin/dashboard
   */
  getAdminAccounts: () =>
    request('/accounts/admin/dashboard', {
      method: 'GET',
    }),
};

// ----------------------------------------------------
// Financial Transaction Endpoints
// ----------------------------------------------------
export const transactionsApi = {
  /**
   * Initiate an atomic money transfer between accounts with an idempotency key
   * POST /api/transactions
   * @param {Object} payload { fromAccount, toAccount, amount, idempotencyKey }
   */
  createTransaction: (payload) =>
    request('/transactions', {
      method: 'POST',
      body: payload,
    }),

  /**
   * Retrieve transaction history involving the user's accounts
   * GET /api/transactions/history
   */
  getHistory: () =>
    request('/transactions/history', {
      method: 'GET',
    }),

  /**
   * Retry an existing pending transaction using its existing idempotency key
   * POST /api/transactions/retry
   * @param {string} idempotencyKey
   */
  retryTransaction: (idempotencyKey) =>
    request('/transactions/retry', {
      method: 'POST',
      body: { idempotencyKey },
    }),
};
