import React from 'react';

const StatCard = ({ title, amount, currency = 'INR', icon, trend, variant = 'neutral' }) => {
  const formattedAmount = new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: currency,
    maximumFractionDigits: 2
  }).format(amount);

  const variantStyles = {
    neutral: 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700',
    positive: 'border-emerald-200/60 dark:border-emerald-900/40 bg-emerald-50/20 dark:bg-emerald-950/10',
    negative: 'border-rose-200/60 dark:border-rose-900/40 bg-rose-50/20 dark:bg-rose-950/10',
    primary: 'border-primary-200/60 dark:border-primary-900/40 bg-primary-50/20 dark:bg-primary-950/10'
  };

  const textColors = {
    neutral: 'text-slate-900 dark:text-white',
    positive: 'text-emerald-600 dark:text-emerald-400',
    negative: 'text-rose-600 dark:text-rose-400',
    primary: 'text-primary-600 dark:text-primary-400'
  };

  return (
    <div className={`p-6 rounded-2xl border glass-card transition-all duration-300 ${variantStyles[variant]}`}>
      <div className="flex items-center justify-between gap-4">
        <div className="flex flex-col gap-1.5">
          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
            {title}
          </span>
          <span className={`text-2xl font-bold tracking-tight ${textColors[variant]}`}>
            {formattedAmount}
          </span>
        </div>
        
        <div className={`flex items-center justify-center w-12 h-12 rounded-xl 
          ${variant === 'positive' ? 'bg-emerald-100 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400' : ''}
          ${variant === 'negative' ? 'bg-rose-100 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400' : ''}
          ${variant === 'primary' ? 'bg-primary-100 dark:bg-primary-950/50 text-primary-600 dark:text-primary-400' : ''}
          ${variant === 'neutral' ? 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400' : ''}
        `}>
          {icon}
        </div>
      </div>

      {trend && (
        <div className="mt-4 flex items-center gap-1.5 text-xs">
          {trend}
        </div>
      )}
    </div>
  );
};

export default StatCard;
