import React from 'react';
import { Clock, AlertTriangle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export function RateLimitBanner() {
  const { rateLimitCooldown } = useAuth();

  if (rateLimitCooldown <= 0) return null;

  return (
    <div
      style={{
        background: 'rgba(245, 158, 11, 0.15)',
        borderBottom: '1px solid rgba(245, 158, 11, 0.3)',
        color: '#fde68a',
        padding: '10px 20px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '10px',
        fontSize: '13px',
        fontWeight: 500,
        position: 'sticky',
        top: 0,
        zIndex: 100,
      }}
    >
      <AlertTriangle size={16} style={{ color: '#fbbf24' }} />
      <span>
        Rate limit active: Please wait <strong>{rateLimitCooldown}s</strong> before making additional authentication requests.
      </span>
      <Clock size={16} style={{ color: '#fbbf24', marginLeft: '4px' }} className="animate-pulse" />
    </div>
  );
}
