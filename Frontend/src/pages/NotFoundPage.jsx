import React from 'react';
import { Link } from 'react-router-dom';
import { Landmark, ArrowLeft } from 'lucide-react';

export function NotFoundPage() {
  return (
    <div
      style={{
        minHeight: '80vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        textAlign: 'center',
        padding: '24px',
      }}
    >
      <div className="card" style={{ maxWidth: '440px', padding: '40px' }}>
        <Landmark size={48} style={{ color: 'var(--primary)', margin: '0 auto 16px' }} />
        <h1 style={{ fontSize: '32px', marginBottom: '8px' }}>404</h1>
        <h3 style={{ fontSize: '18px', marginBottom: '12px' }}>Page Not Found</h3>
        <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginBottom: '24px' }}>
          The requested banking resource could not be found.
        </p>
        <Link to="/" className="btn btn-primary" style={{ display: 'inline-flex' }}>
          <ArrowLeft size={16} />
          <span>Return to Dashboard</span>
        </Link>
      </div>
    </div>
  );
}
