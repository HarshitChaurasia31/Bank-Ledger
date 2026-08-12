import React from 'react';
import { CheckCircle2, AlertCircle, Info } from 'lucide-react';
import { useBank } from '../context/BankContext';

export function ToastContainer() {
  const { toast } = useBank();

  if (!toast) return null;

  const getIcon = () => {
    switch (toast.type) {
      case 'danger':
        return <AlertCircle size={18} style={{ color: '#fb7185', flexShrink: 0 }} />;
      case 'info':
        return <Info size={18} style={{ color: '#38bdf8', flexShrink: 0 }} />;
      default:
        return <CheckCircle2 size={18} style={{ color: '#34d399', flexShrink: 0 }} />;
    }
  };

  const getClassName = () => {
    switch (toast.type) {
      case 'danger':
        return 'toast alert-danger';
      case 'info':
        return 'toast toast-info';
      default:
        return 'toast toast-success';
    }
  };

  return (
    <div className="toast-container">
      <div className={getClassName()}>
        {getIcon()}
        <span>{toast.message}</span>
      </div>
    </div>
  );
}
