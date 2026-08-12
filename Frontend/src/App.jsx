import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { BankProvider } from './context/BankContext';
import { Navbar } from './components/Navbar';
import { ToastContainer } from './components/ToastContainer';
import { RateLimitBanner } from './components/RateLimitBanner';
import { TransferModal } from './components/TransferModal';

import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { DashboardPage } from './pages/DashboardPage';
import { TransactionsPage } from './pages/TransactionsPage';
import { AccountsPage } from './pages/AccountsPage';
import { NotFoundPage } from './pages/NotFoundPage';

import { Loader2 } from 'lucide-react';

/**
 * Route guard for authenticated user paths
 */
function ProtectedRoute({ children }) {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div
        style={{
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '16px',
        }}
      >
        <Loader2 size={36} style={{ color: 'var(--primary)' }} className="animate-pulse" />
        <span style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>
          Verifying Lena Dena secure session...
        </span>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return children;
}

/**
 * Route guard for public paths (redirects to dashboard if already authenticated)
 */
function PublicRoute({ children }) {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return null;
  }

  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  return children;
}

/**
 * Main Layout containing Navbar and Global Transfer Modal
 */
function AppLayout({ children }) {
  const [isGlobalTransferOpen, setIsGlobalTransferOpen] = useState(false);

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Navbar onOpenTransfer={() => setIsGlobalTransferOpen(true)} />
      <main style={{ flex: 1 }}>{children}</main>

      {/* Global Transfer Modal from Navbar */}
      <TransferModal
        isOpen={isGlobalTransferOpen}
        onClose={() => setIsGlobalTransferOpen(false)}
      />

      {/* Footer */}
      <footer
        style={{
          borderTop: '1px solid var(--border-subtle)',
          padding: '24px 0',
          textAlign: 'center',
          fontSize: '13px',
          color: 'var(--text-muted)',
          background: 'rgba(5, 8, 15, 0.95)',
        }}
      >
        <div className="container">
          <p>
            <strong>Lena Dena Bank</strong> — Every rupee accounted for. Powered by Double-Entry Ledger Architecture.
          </p>
        </div>
      </footer>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <BankProvider>
          <RateLimitBanner />
          <ToastContainer />
          <Routes>
            {/* Public Routes */}
            <Route
              path="/login"
              element={
                <PublicRoute>
                  <LoginPage />
                </PublicRoute>
              }
            />
            <Route
              path="/register"
              element={
                <PublicRoute>
                  <RegisterPage />
                </PublicRoute>
              }
            />

            {/* Protected Routes */}
            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <AppLayout>
                    <DashboardPage />
                  </AppLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/transactions"
              element={
                <ProtectedRoute>
                  <AppLayout>
                    <TransactionsPage />
                  </AppLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/accounts"
              element={
                <ProtectedRoute>
                  <AppLayout>
                    <AccountsPage />
                  </AppLayout>
                </ProtectedRoute>
              }
            />

            {/* 404 Route */}
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </BankProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
