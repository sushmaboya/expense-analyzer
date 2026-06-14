import React, { useEffect } from 'react';
import { X, CheckCircle, AlertCircle, Info } from 'lucide-react';

const Toast = ({ message, type = 'success', onClose, duration = 4000 }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, onClose]);

  const typeConfig = {
    success: {
      bgColor: 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800/50',
      iconColor: 'text-emerald-500',
      textColor: 'text-emerald-800 dark:text-emerald-200',
      icon: <CheckCircle className="w-5 h-5" />
    },
    error: {
      bgColor: 'bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-800/50',
      iconColor: 'text-rose-500',
      textColor: 'text-rose-800 dark:text-rose-200',
      icon: <AlertCircle className="w-5 h-5" />
    },
    info: {
      bgColor: 'bg-blue-50 dark:bg-blue-950/40 border-blue-200 dark:border-blue-800/50',
      iconColor: 'text-blue-500',
      textColor: 'text-blue-800 dark:text-blue-200',
      icon: <Info className="w-5 h-5" />
    }
  };

  const config = typeConfig[type] || typeConfig.success;

  return (
    <div className={`fixed bottom-5 right-5 z-50 flex items-center gap-3 p-4 rounded-xl border glass-card shadow-2xl animate-slide-in max-w-sm ${config.bgColor}`}>
      <div className={config.iconColor}>
        {config.icon}
      </div>
      <div className={`flex-1 text-sm font-medium ${config.textColor}`}>
        {message}
      </div>
      <button 
        onClick={onClose}
        className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
};

export default Toast;
