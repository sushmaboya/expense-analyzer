import React, { useState, useEffect } from 'react';
import { X, Check } from 'lucide-react';

const CATEGORIES = ['Food', 'Travel', 'Bills', 'Shopping', 'Others'];
const CURRENCIES = ['INR', 'USD'];

const ExpenseModal = ({ isOpen, onClose, groupMembers, onSave }) => {
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [currency, setCurrency] = useState('INR');
  const [category, setCategory] = useState('Others');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [paidById, setPaidById] = useState('');
  const [splitType, setSplitType] = useState('EQUAL');
  
  // Custom split shares state: map of userId -> value (amount or percentage)
  const [sharesState, setSharesState] = useState({});
  const [selectedMembers, setSelectedMembers] = useState([]);
  
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (isOpen && groupMembers && groupMembers.length > 0) {
      // Set defaults on open
      setTitle('');
      setAmount('');
      setCurrency('INR');
      setCategory('Others');
      setDate(new Date().toISOString().split('T')[0]);
      setPaidById(groupMembers[0].userId.toString());
      setSplitType('EQUAL');
      
      const allUserIds = groupMembers.map(m => m.userId);
      setSelectedMembers(allUserIds);
      
      // Initialize shares map with empty inputs
      const initialShares = {};
      allUserIds.forEach(id => {
        initialShares[id] = '';
      });
      setSharesState(initialShares);
      setErrors({});
    }
  }, [isOpen, groupMembers]);

  if (!isOpen) return null;

  const handleMemberToggle = (userId) => {
    if (selectedMembers.includes(userId)) {
      if (selectedMembers.length > 1) {
        setSelectedMembers(selectedMembers.filter(id => id !== userId));
      }
    } else {
      setSelectedMembers([...selectedMembers, userId]);
    }
  };

  const handleShareChange = (userId, value) => {
    setSharesState({
      ...sharesState,
      [userId]: value
    });
  };

  const validate = () => {
    const newErrors = {};
    if (!title.trim()) newErrors.title = 'Title is required';
    if (!amount || parseFloat(amount) <= 0) newErrors.amount = 'Amount must be positive';
    if (!paidById) newErrors.paidById = 'Payer is required';
    if (selectedMembers.length === 0) newErrors.members = 'Select at least one member to split with';

    const numAmount = parseFloat(amount || 0);

    if (splitType === 'EXACT') {
      let sum = 0;
      selectedMembers.forEach(id => {
        sum += parseFloat(sharesState[id] || 0);
      });
      
      if (Math.abs(sum - numAmount) > 0.05) {
        newErrors.splits = `Sum of exact shares (${sum.toFixed(2)}) must match total amount (${numAmount.toFixed(2)})`;
      }
    } else if (splitType === 'PERCENTAGE') {
      let sum = 0;
      selectedMembers.forEach(id => {
        sum += parseFloat(sharesState[id] || 0);
      });
      if (Math.abs(sum - 100) > 0.01) {
        newErrors.splits = `Sum of percentages (${sum.toFixed(1)}%) must equal 100%`;
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = () => {
    if (!validate()) return;

    const numAmount = parseFloat(amount);
    
    // Construct shares array for payload
    let finalShares = [];
    
    if (splitType === 'EQUAL') {
      // Let backend handle equal auto-splits among selected userIds
      finalShares = selectedMembers.map(userId => ({
        userId,
        amount: Math.round((numAmount / selectedMembers.length) * 100) / 100,
        percentage: Math.round((100 / selectedMembers.length) * 100) / 100
      }));
    } else if (splitType === 'EXACT') {
      finalShares = selectedMembers.map(userId => ({
        userId,
        amount: parseFloat(sharesState[userId] || 0),
        percentage: null
      }));
    } else if (splitType === 'PERCENTAGE') {
      finalShares = selectedMembers.map(userId => {
        const pct = parseFloat(sharesState[userId] || 0);
        return {
          userId,
          amount: Math.round(((pct / 100) * numAmount) * 100) / 100,
          percentage: pct
        };
      });
    }

    onSave({
      title,
      amount: numAmount,
      currency,
      category,
      date,
      paidById: parseInt(paidById),
      splitType,
      shares: finalShares
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/40 backdrop-blur-sm">
      <div className="w-full max-w-lg rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-2xl flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
          <h3 className="text-lg font-bold text-slate-900 dark:text-white">Add Expense</h3>
          <button 
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form body */}
        <div className="flex-1 overflow-y-auto py-4 space-y-4 pr-1">
          {/* Title */}
          <div>
            <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">
              Title
            </label>
            <input 
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Dinner, Cab, Groceries"
              className="w-full px-3.5 py-2.5 rounded-xl text-sm glass-input font-medium"
            />
            {errors.title && <span className="text-xs text-rose-500 mt-1">{errors.title}</span>}
          </div>

          {/* Amount and Currency */}
          <div className="grid grid-cols-3 gap-4">
            <div className="col-span-2">
              <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">
                Amount
              </label>
              <input 
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                className="w-full px-3.5 py-2.5 rounded-xl text-sm glass-input font-medium"
              />
              {errors.amount && <span className="text-xs text-rose-500 mt-1">{errors.amount}</span>}
            </div>
            
            <div>
              <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">
                Currency
              </label>
              <select 
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl text-sm glass-input font-medium bg-white dark:bg-slate-950"
              >
                {CURRENCIES.map(curr => <option key={curr} value={curr}>{curr}</option>)}
              </select>
            </div>
          </div>

          {/* Category and Date */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">
                Category
              </label>
              <select 
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl text-sm glass-input font-medium bg-white dark:bg-slate-950"
              >
                {CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}
              </select>
            </div>
            
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

          {/* Paid By */}
          <div>
            <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">
              Paid By
            </label>
            <select 
              value={paidById}
              onChange={(e) => setPaidById(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl text-sm glass-input font-medium bg-white dark:bg-slate-950"
            >
              {groupMembers.map(m => (
                <option key={m.userId} value={m.userId}>{m.user.name} ({m.user.email})</option>
              ))}
            </select>
            {errors.paidById && <span className="text-xs text-rose-500 mt-1">{errors.paidById}</span>}
          </div>

          {/* Split Type Selector */}
          <div>
            <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
              Split Type
            </label>
            <div className="grid grid-cols-3 gap-2 bg-slate-50 dark:bg-slate-950 p-1 rounded-xl border border-slate-100 dark:border-slate-800">
              {['EQUAL', 'EXACT', 'PERCENTAGE'].map(type => (
                <button
                  key={type}
                  type="button"
                  onClick={() => setSplitType(type)}
                  className={`py-1.5 px-3 rounded-lg text-xs font-semibold transition-all duration-200 
                    ${splitType === type 
                      ? 'bg-primary-500 text-white shadow-sm' 
                      : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'}`}
                >
                  {type}
                </button>
              ))}
            </div>
          </div>

          {/* Share Calculations inputs */}
          <div className="space-y-2 border-t border-slate-100 dark:border-slate-850 pt-4">
            <span className="block text-xs font-bold text-slate-700 dark:text-slate-350 uppercase tracking-wider">
              Split Details
            </span>
            
            {errors.members && <p className="text-xs text-rose-500">{errors.members}</p>}
            {errors.splits && <p className="text-xs text-rose-500">{errors.splits}</p>}
            
            <div className="space-y-2.5 mt-2">
              {groupMembers.map(member => {
                const isSelected = selectedMembers.includes(member.userId);
                return (
                  <div key={member.userId} className="flex items-center justify-between gap-3 p-2 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-950/30 transition-colors">
                    {/* User checkbox / details */}
                    <button
                      type="button"
                      onClick={() => handleMemberToggle(member.userId)}
                      className="flex items-center gap-3 text-left flex-1"
                    >
                      <div className={`flex items-center justify-center w-5 h-5 rounded-md border transition-all duration-200 
                        ${isSelected 
                          ? 'bg-primary-500 border-primary-500 text-white' 
                          : 'border-slate-300 dark:border-slate-750 text-transparent'}`}
                      >
                        <Check className="w-3.5 h-3.5 stroke-[3]" />
                      </div>
                      <span className={`text-sm font-medium ${isSelected ? 'text-slate-800 dark:text-slate-200' : 'text-slate-400'}`}>
                        {member.user.name}
                      </span>
                    </button>

                    {/* Shared Inputs */}
                    {isSelected && splitType !== 'EQUAL' && (
                      <div className="flex items-center gap-1.5 w-28">
                        <input
                          type="number"
                          placeholder={splitType === 'EXACT' ? '0.00' : '0'}
                          value={sharesState[member.userId] || ''}
                          onChange={(e) => handleShareChange(member.userId, e.target.value)}
                          className="w-full text-right px-2 py-1 rounded-lg text-sm glass-input font-medium"
                        />
                        <span className="text-xs font-semibold text-slate-400">
                          {splitType === 'EXACT' ? currency : '%'}
                        </span>
                      </div>
                    )}

                    {isSelected && splitType === 'EQUAL' && amount && (
                      <span className="text-xs font-semibold text-slate-400 pr-2">
                        {currency} {(parseFloat(amount) / selectedMembers.length).toFixed(2)}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

        </div>

        {/* Footer actions */}
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
            className="px-5 py-2.5 text-sm font-semibold text-white bg-primary-500 hover:bg-primary-600 active:scale-95 shadow-lg shadow-primary-500/10 rounded-xl transition-all duration-200"
          >
            Add Expense
          </button>
        </div>

      </div>
    </div>
  );
};

export default ExpenseModal;
