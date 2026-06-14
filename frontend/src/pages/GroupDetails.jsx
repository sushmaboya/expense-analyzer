import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import ExpenseModal from '../components/ExpenseModal';
import SettlementModal from '../components/SettlementModal';
import CSVImportModal from '../components/CSVImportModal';
import Toast from '../components/Toast';
import { 
  Users, Plus, Upload, Trash2, ArrowLeft, ArrowUpRight, ArrowDownRight, 
  HelpCircle, Calendar, DollarSign, RefreshCw, Landmark 
} from 'lucide-react';

const GroupDetails = () => {
  const { id } = useParams();
  const { user: currentUser } = useAuth();
  
  const [group, setGroup] = useState(null);
  const [expenses, setExpenses] = useState([]);
  const [balances, setBalances] = useState([]);
  const [suggestedSettlements, setSuggestedSettlements] = useState([]);
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Modal Triggers
  const [isExpenseOpen, setIsExpenseOpen] = useState(false);
  const [isSettlementOpen, setIsSettlementOpen] = useState(false);
  const [isImportOpen, setIsImportOpen] = useState(false);

  // Settlement pre-fill states
  const [settlementPayer, setSettlementPayer] = useState(null);
  const [settlementPayee, setSettlementPayee] = useState(null);
  const [settlementAmt, setSettlementAmt] = useState(null);

  // Form states
  const [newMemberEmail, setNewMemberEmail] = useState('');
  const [addMemberLoading, setAddMemberLoading] = useState(false);
  const [toastMsg, setToastMsg] = useState('');
  const [toastType, setToastType] = useState('success');

  const fetchGroupDetails = async () => {
    try {
      setLoading(true);
      setError('');
      // Parallel fetch group structure, expenses feed and balances calculations
      const [allGroups, groupExps, balReport] = await Promise.all([
        api.listGroups(),
        api.getGroupExpenses(id),
        api.getGroupBalances(id)
      ]);

      const activeGroup = allGroups.find(g => g.id === parseInt(id));
      if (!activeGroup) {
        throw new Error('Group not found or you are not a member.');
      }

      setGroup(activeGroup);
      setExpenses(groupExps);
      setBalances(balReport.balances);
      setSuggestedSettlements(balReport.suggestedSettlements);
    } catch (err) {
      setError(err.message || 'Failed to load group details.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGroupDetails();
  }, [id]);

  const showToast = (message, type = 'success') => {
    setToastMsg(message);
    setToastType(type);
  };

  const handleAddMember = async (e) => {
    e.preventDefault();
    if (!newMemberEmail.trim()) return;

    setAddMemberLoading(true);
    try {
      await api.addGroupMember(id, newMemberEmail);
      showToast('Member added successfully!', 'success');
      setNewMemberEmail('');
      fetchGroupDetails();
    } catch (err) {
      showToast(err.message || 'Failed to add member.', 'error');
    } finally {
      setAddMemberLoading(false);
    }
  };

  const handleRemoveMember = async (userId) => {
    if (!window.confirm('Are you sure you want to remove this member? This will delete their group associations.')) return;
    
    try {
      await api.removeGroupMember(id, userId);
      showToast('Member removed from group.', 'success');
      fetchGroupDetails();
    } catch (err) {
      showToast(err.message || 'Failed to remove member.', 'error');
    }
  };

  const handleCreateExpense = async (expenseData) => {
    try {
      await api.createExpense({
        ...expenseData,
        groupId: parseInt(id)
      });
      showToast('Expense recorded successfully!', 'success');
      setIsExpenseOpen(false);
      fetchGroupDetails();
    } catch (err) {
      showToast(err.message || 'Failed to add expense.', 'error');
    }
  };

  const handleCreateSettlement = async (settlementData) => {
    try {
      await api.recordSettlement({
        ...settlementData,
        groupId: parseInt(id)
      });
      showToast('Settlement payment recorded!', 'success');
      setIsSettlementOpen(false);
      fetchGroupDetails();
    } catch (err) {
      showToast(err.message || 'Failed to record settlement.', 'error');
    }
  };

  const handleTriggerQuickSettle = (fromUserId, toUserId, amount) => {
    setSettlementPayer(fromUserId);
    setSettlementPayee(toUserId);
    setSettlementAmt(amount);
    setIsSettlementOpen(true);
  };

  const handleTriggerGeneralSettle = () => {
    setSettlementPayer(null);
    setSettlementPayee(null);
    setSettlementAmt(null);
    setIsSettlementOpen(true);
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
        <div className="w-12 h-12 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" />
        <span className="text-sm text-slate-500 font-medium">Analyzing splits...</span>
      </div>
    );
  }

  if (error || !group) {
    return (
      <div className="max-w-xl mx-auto p-6 rounded-2xl bg-rose-50 dark:bg-rose-955/20 border border-rose-100 dark:border-rose-900/40 text-rose-650 dark:text-rose-400">
        <h3 className="font-bold mb-1">Error Loading Group</h3>
        <p className="text-sm mb-4">{error || 'Group detail is missing.'}</p>
        <Link to="/groups" className="text-xs font-semibold underline flex items-center gap-1">
          <ArrowLeft className="w-4 h-4" /> Back to Groups
        </Link>
      </div>
    );
  }

  // Format currency
  const formatVal = (val, currency = 'INR') => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: currency,
      maximumFractionDigits: 2
    }).format(Math.abs(val));
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {toastMsg && (
        <Toast 
          message={toastMsg} 
          type={toastType} 
          onClose={() => setToastMsg('')} 
        />
      )}

      {/* Top Breadcrumb & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-850 pb-5">
        <div className="space-y-1.5">
          <Link to="/groups" className="inline-flex items-center gap-1 text-xs font-semibold text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors">
            <ArrowLeft className="w-3.5 h-3.5" /> Back to Groups
          </Link>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">{group.name}</h2>
          <p className="text-sm text-slate-550 dark:text-slate-400 max-w-lg">{group.description || 'No description provided.'}</p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* Refresh details */}
          <button
            onClick={fetchGroupDetails}
            className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 transition-all shadow-sm"
            title="Reload details"
          >
            <RefreshCw className="w-4 h-4" />
          </button>

          {/* Import CSV */}
          <button
            onClick={() => setIsImportOpen(true)}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-850 border border-slate-200 dark:border-slate-800 active:scale-95 transition-all shadow-sm"
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Import CSV</span>
          </button>

          {/* Settle Up */}
          <button
            onClick={handleTriggerGeneralSettle}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold text-white bg-success-600 hover:bg-success-700 active:scale-95 shadow-md shadow-success-650/10 transition-all"
          >
            <Landmark className="w-3.5 h-3.5" />
            <span>Settle Up</span>
          </button>

          {/* Add Expense */}
          <button
            onClick={() => setIsExpenseOpen(true)}
            className="flex items-center gap-1.5 px-4.5 py-2.5 rounded-xl text-xs font-bold text-white bg-primary-500 hover:bg-primary-600 active:scale-95 shadow-md shadow-primary-500/10 transition-all"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>Add Expense</span>
          </button>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* LEFT COLUMN: Expenses Feed */}
        <div className="lg:col-span-2 space-y-6">
          <div className="glass-card p-6 rounded-3xl border border-slate-200/50 dark:border-slate-800/50 bg-white/70 dark:bg-slate-900/60 shadow-lg">
            <h3 className="font-bold text-slate-800 dark:text-white text-base mb-4">Expenses Log</h3>

            {expenses.length === 0 ? (
              <div className="text-center py-12 border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl">
                <p className="text-sm text-slate-400 font-medium">No expenses logged in this group yet.</p>
                <button
                  onClick={() => setIsExpenseOpen(true)}
                  className="mt-3 text-xs font-bold text-primary-500 hover:underline"
                >
                  Create an expense
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {expenses.map((expense) => {
                  const myShare = expense.shares.find(s => s.userId === currentUser.id);
                  const isPayer = expense.paidById === currentUser.id;
                  
                  return (
                    <div 
                      key={expense.id}
                      className="p-4 rounded-2xl border border-slate-100 dark:border-slate-800 hover:border-slate-200 dark:hover:border-slate-700 bg-white dark:bg-slate-900/40 hover:bg-slate-50/30 dark:hover:bg-slate-950/20 transition-all duration-200 flex items-start justify-between gap-4"
                    >
                      <div className="flex items-start gap-3 flex-1 min-w-0">
                        {/* Calendar Icon */}
                        <div className="flex flex-col items-center justify-center w-11 h-11 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-850 shrink-0 text-slate-400">
                          <Calendar className="w-4 h-4" />
                          <span className="text-[9px] font-semibold uppercase mt-0.5 font-mono">
                            {new Date(expense.date).toLocaleDateString('default', { month: 'short' })}
                          </span>
                        </div>

                        {/* Title & metadata */}
                        <div className="min-w-0">
                          <h4 className="font-bold text-sm text-slate-800 dark:text-slate-200 truncate">{expense.title}</h4>
                          <p className="text-xs text-slate-400 mt-0.5">
                            Paid by <span className="font-medium text-slate-550 dark:text-slate-350">{expense.paidBy.name}</span>
                          </p>
                          
                          {/* Split shares summary */}
                          <div className="flex flex-wrap gap-x-2 gap-y-1 mt-2">
                            <span className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-[10px] text-slate-500 font-semibold font-mono uppercase">
                              {expense.category}
                            </span>
                            <span className="px-1.5 py-0.5 rounded bg-primary-50 dark:bg-primary-950/30 text-[10px] text-primary-600 dark:text-primary-400 font-semibold uppercase">
                              {expense.splitType} Split
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Financial info */}
                      <div className="text-right shrink-0">
                        <div className="font-bold text-sm text-slate-800 dark:text-white">
                          {formatVal(expense.amount, expense.currency)}
                        </div>
                        
                        {/* User specific statement */}
                        <div className="text-[10px] mt-1 font-semibold">
                          {isPayer ? (
                            <span className="text-emerald-500">You lent {formatVal(expense.amount - (myShare ? myShare.amount : 0), expense.currency)}</span>
                          ) : myShare ? (
                            <span className="text-rose-500">You borrow {formatVal(myShare.amount, expense.currency)}</span>
                          ) : (
                            <span className="text-slate-400 font-normal">Not involved</span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* RIGHT COLUMN: Sidebar (Members & Balances) */}
        <div className="space-y-6">
          
          {/* MEMBERS SIDEBAR CARD */}
          <div className="glass-card p-6 rounded-3xl border border-slate-200/50 dark:border-slate-800/50 bg-white/70 dark:bg-slate-900/60 shadow-lg">
            <div className="flex items-center gap-2 mb-4">
              <Users className="w-5 h-5 text-slate-500" />
              <h3 className="font-bold text-slate-800 dark:text-white text-base">Members roster</h3>
            </div>

            {/* Add Member inline form */}
            <form onSubmit={handleAddMember} className="flex gap-2 mb-5">
              <input
                type="email"
                required
                value={newMemberEmail}
                onChange={(e) => setNewMemberEmail(e.target.value)}
                placeholder="Friend's registered email"
                className="flex-1 px-3 py-1.5 rounded-xl text-xs glass-input font-medium"
              />
              <button
                type="submit"
                disabled={addMemberLoading || !newMemberEmail.trim()}
                className="px-3.5 py-1.5 rounded-xl text-xs font-bold text-white bg-primary-500 hover:bg-primary-600 disabled:bg-slate-200 dark:disabled:bg-slate-800 disabled:text-slate-400 transition-all active:scale-95 shrink-0"
              >
                {addMemberLoading ? 'Adding...' : 'Add'}
              </button>
            </form>

            {/* Members List */}
            <div className="space-y-2.5 max-h-56 overflow-y-auto pr-1">
              {group.members.map((member) => (
                <div key={member.userId} className="flex items-center justify-between gap-3 p-1.5 rounded-xl hover:bg-slate-50/50 dark:hover:bg-slate-950/20">
                  <div className="flex items-center gap-2.5 min-w-0">
                    {member.user.avatarUrl ? (
                      <img 
                        src={member.user.avatarUrl} 
                        alt={member.user.name} 
                        className="w-7 h-7 rounded-lg object-cover ring-2 ring-primary-500/10"
                      />
                    ) : (
                      <div className="flex items-center justify-center w-7 h-7 rounded-lg bg-primary-100 dark:bg-primary-950/50 text-primary-600 dark:text-primary-450 font-bold text-[11px] uppercase shrink-0">
                        {member.user.name.charAt(0)}
                      </div>
                    )}
                    <div className="min-w-0">
                      <div className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">{member.user.name}</div>
                      <div className="text-[10px] text-slate-400 truncate">{member.user.email}</div>
                    </div>
                  </div>

                  {/* Remove button if not current user */}
                  {member.userId !== currentUser.id && (
                    <button
                      onClick={() => handleRemoveMember(member.userId)}
                      className="p-1 rounded-lg text-slate-450 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/20 transition-all shrink-0"
                      title="Remove member"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* DEBTS & MINIMIZATIONS CARD */}
          <div className="glass-card p-6 rounded-3xl border border-slate-200/50 dark:border-slate-800/50 bg-white/70 dark:bg-slate-900/60 shadow-lg">
            <h3 className="font-bold text-slate-800 dark:text-white text-base mb-4">Balances & Settlements</h3>

            {/* Member Net Balances list */}
            <div className="space-y-3 mb-6">
              <span className="block text-xs font-bold text-slate-450 uppercase tracking-wider">Individual balances</span>
              <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                {balances.map((bal) => (
                  <div key={bal.userId} className="flex items-center justify-between gap-3 text-xs">
                    <span className="text-slate-650 dark:text-slate-350 truncate">{bal.name}</span>
                    <span className={`font-semibold shrink-0 ${
                      bal.netBalance > 0.01 ? 'text-emerald-500' :
                      bal.netBalance < -0.01 ? 'text-rose-500' : 'text-slate-400 font-normal'
                    }`}>
                      {bal.netBalance > 0.01 ? `+${formatVal(bal.netBalance)}` :
                       bal.netBalance < -0.01 ? `-${formatVal(bal.netBalance)}` : 'Settled'}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Minimized Repayments list */}
            <div className="space-y-3 pt-4 border-t border-slate-100 dark:border-slate-850">
              <span className="block text-xs font-bold text-slate-450 uppercase tracking-wider">Suggested Settlements</span>
              
              {suggestedSettlements.length === 0 ? (
                <div className="p-3 text-center rounded-xl bg-emerald-50/20 border border-emerald-100 dark:bg-emerald-950/10 dark:border-emerald-900/40 text-emerald-600 dark:text-emerald-400 font-semibold text-xs flex items-center justify-center gap-1.5">
                  <span>Group is fully settled up!</span>
                </div>
              ) : (
                <div className="space-y-3">
                  {suggestedSettlements.map((trans, idx) => (
                    <div 
                      key={idx}
                      className="p-3 rounded-xl border border-slate-100 dark:border-slate-850 bg-slate-50/50 dark:bg-slate-950/30 text-xs flex flex-col gap-2.5"
                    >
                      <div className="text-slate-600 dark:text-slate-450 leading-normal">
                        <span className="font-bold text-slate-800 dark:text-slate-200">{trans.fromName}</span> owes{' '}
                        <span className="font-bold text-slate-800 dark:text-slate-200">{trans.toName}</span>{' '}
                        <span className="font-extrabold text-primary-500">{formatVal(trans.amount)}</span>
                      </div>
                      
                      {/* Settle shortcut button */}
                      <button
                        onClick={() => handleTriggerQuickSettle(trans.fromUserId, trans.toUserId, trans.amount)}
                        className="w-full py-1.5 px-3 rounded-lg text-[10px] font-bold text-center text-white bg-success-500 hover:bg-success-650 active:scale-[0.97] transition-all shadow-sm shadow-success-500/10"
                      >
                        Settle Debt
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>

        </div>

      </div>

      {/* MODALS */}
      <ExpenseModal
        isOpen={isExpenseOpen}
        onClose={() => setIsExpenseOpen(false)}
        groupMembers={group.members}
        onSave={handleCreateExpense}
      />

      <SettlementModal
        isOpen={isSettlementOpen}
        onClose={() => setIsSettlementOpen(false)}
        groupMembers={group.members}
        defaultPayerId={settlementPayer}
        defaultPayeeId={settlementPayee}
        defaultAmount={settlementAmt}
        onSave={handleCreateSettlement}
      />

      <CSVImportModal
        isOpen={isImportOpen}
        onClose={() => setIsImportOpen(false)}
        groupId={group.id}
        onImportSuccess={fetchGroupDetails}
      />

    </div>
  );
};

export default GroupDetails;
