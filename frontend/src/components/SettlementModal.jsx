import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';

const SettlementModal = ({ isOpen, onClose, groupMembers, defaultPayerId, defaultPayeeId, defaultAmount, onSave }) => {
  const [payerId, setPayerId] = useState('');
  const [payeeId, setPayeeId] = useState('');
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      setError('');
      
      // Prepopulate if values provided
      if (defaultPayerId) setPayerId(defaultPayerId.toString());
      else if (groupMembers && groupMembers.length > 0) setPayerId(groupMembers[0].userId.toString());
      
      if (defaultPayeeId) setPayeeId(defaultPayeeId.toString());
      else if (groupMembers && groupMembers.length > 1) setPayeeId(groupMembers[1].userId.toString());
      
      if (defaultAmount) setAmount(defaultAmount.toString());
      else setAmount('');
      
      setDate(new Date().toISOString().split('T')[0]);
    }
  }, [isOpen, defaultPayerId, defaultPayeeId, defaultAmount, groupMembers]);

  if (!isOpen) return null;

  const handleSave = () => {
    setError('');
    
    if (!payerId || !payeeId) {
      setError('Please select both the payer and payee.');
      return;
    }

    if (payerId === payeeId) {
      setError('Payer and payee cannot be the same user.');
      return;
    }

    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      setError('Please enter a positive settlement amount.');
      return;
    }

    onSave({
      payerId: parseInt(payerId),
      payeeId: parseInt(payeeId),
      amount: numAmount,
      date
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/40 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-md rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-2xl flex flex-col">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
          <h3 className="text-lg font-bold text-slate-900 dark:text-white">Record Settlement</h3>
          <button 
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Errors */}
        {error && (
          <div className="mt-4 p-3 rounded-xl bg-rose-50 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-900/40 text-xs font-medium text-rose-600 dark:text-rose-400">
            {error}
          </div>
        )}

        {/* Body */}
        <div className="py-4 space-y-4">
          
          {/* Payer */}
          <div>
            <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">
              Who Paid? (Debtor)
            </label>
            <select
              value={payerId}
              onChange={(e) => setPayerId(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl text-sm glass-input font-medium bg-white dark:bg-slate-950"
            >
              <option value="">Select payer...</option>
              {groupMembers.map(m => (
                <option key={m.userId} value={m.userId}>{m.user.name} ({m.user.email})</option>
              ))}
            </select>
          </div>

          {/* Payee */}
          <div>
            <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">
              Who was Paid? (Creditor)
            </label>
            <select
              value={payeeId}
              onChange={(e) => setPayeeId(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl text-sm glass-input font-medium bg-white dark:bg-slate-950"
            >
              <option value="">Select payee...</option>
              {groupMembers.map(m => (
                <option key={m.userId} value={m.userId}>{m.user.name} ({m.user.email})</option>
              ))}
            </select>
          </div>

          {/* Amount */}
          <div>
            <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">
              Amount Settled
            </label>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.00"
              className="w-full px-3.5 py-2.5 rounded-xl text-sm glass-input font-medium"
            />
          </div>

          {/* Date */}
          <div>
            <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">
              Date
            </label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl text-sm glass-input font-medium"
            />
          </div>

        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-semibold text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 transition-colors"
          >
            Cancel
          </button>
          
          <button
            type="button"
            onClick={handleSave}
            className="px-5 py-2.5 text-sm font-semibold text-white bg-success-500 hover:bg-success-600 active:scale-95 shadow-lg shadow-success-500/10 rounded-xl transition-all duration-200"
          >
            Record Payment
          </button>
        </div>

      </div>
    </div>
  );
};

export default SettlementModal;
