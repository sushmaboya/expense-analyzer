import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { Receipt, Landmark, ArrowRight, Calendar, Users, ChevronRight } from 'lucide-react';

const Settlements = () => {
  const { user } = useAuth();
  const [settlements, setSettlements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function fetchSettlements() {
      try {
        setLoading(true);
        const res = await api.listSettlements();
        setSettlements(res);
      } catch (err) {
        setError(err.message || 'Failed to fetch settlements history.');
      } finally {
        setLoading(false);
      }
    }
    fetchSettlements();
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
        <div className="w-12 h-12 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" />
        <span className="text-sm text-slate-500 font-medium">Retrieving transaction statement...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 rounded-2xl bg-rose-50 dark:bg-rose-955/20 border border-rose-100 dark:border-rose-900/40 text-rose-600 dark:text-rose-450">
        <h3 className="font-bold mb-1">Error Loading Settlements</h3>
        <p className="text-sm">{error}</p>
      </div>
    );
  }

  const formatVal = (val) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 2
    }).format(val);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
          Settlement History
        </h2>
        <p className="text-sm text-slate-550 dark:text-slate-400 mt-1">
          Review all manual debt-clearing payments you have paid or received.
        </p>
      </div>

      {/* Settlements Feed Card */}
      <div className="glass-card p-6 rounded-3xl border border-slate-200/50 dark:border-slate-800/50 bg-white/70 dark:bg-slate-900/60 shadow-lg">
        {settlements.length === 0 ? (
          <div className="text-center py-16 border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl">
            <Receipt className="w-12 h-12 text-slate-300 dark:text-slate-700 mx-auto mb-3" />
            <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">No settlements recorded yet.</p>
            <p className="text-xs text-slate-400 mt-1">Suggested transactions can be settled directly inside group details.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {settlements.map((settlement) => {
              const isPayer = settlement.payerId === user.id;
              
              return (
                <div 
                  key={settlement.id}
                  className="p-4 rounded-2xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900/40 hover:border-slate-200 dark:hover:border-slate-700 hover:bg-slate-50/20 dark:hover:bg-slate-950/20 transition-all duration-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                >
                  {/* Left: Transaction details */}
                  <div className="flex items-center gap-3.5 flex-1 min-w-0">
                    {/* Landmark / Bank Icon */}
                    <div className="flex items-center justify-center w-11 h-11 rounded-xl bg-success-50 dark:bg-success-950/20 text-success-500 shrink-0 border border-success-100 dark:border-success-900/30">
                      <Landmark className="w-5 h-5" />
                    </div>

                    <div className="min-w-0">
                      {/* Debt flow statement */}
                      <div className="text-sm text-slate-850 dark:text-slate-200 font-semibold flex items-center flex-wrap gap-x-1.5 gap-y-0.5">
                        <span className={isPayer ? 'text-primary-500 font-extrabold' : ''}>{settlement.payer.name}</span>
                        <ArrowRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span className={!isPayer ? 'text-primary-500 font-extrabold' : ''}>{settlement.payee.name}</span>
                      </div>

                      {/* Group and date tag metadata */}
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1.5 text-xs text-slate-400 font-medium">
                        <Link 
                          to={`/groups/${settlement.groupId}`}
                          className="flex items-center gap-1 hover:text-primary-500 transition-colors"
                        >
                          <Users className="w-3.5 h-3.5 text-slate-350" />
                          <span>{settlement.group.name}</span>
                        </Link>
                        
                        <div className="flex items-center gap-1 font-mono text-[10px]">
                          <Calendar className="w-3.5 h-3.5 text-slate-350" />
                          <span>{new Date(settlement.date).toLocaleDateString()}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Right: Payment badge */}
                  <div className="text-right shrink-0 flex items-center justify-between sm:flex-col sm:items-end gap-2">
                    <span className="sm:hidden text-xs text-slate-400">Amount:</span>
                    <div className="flex flex-col items-end">
                      <div className="font-extrabold text-base text-emerald-600 dark:text-emerald-400">
                        {formatVal(settlement.amount)}
                      </div>
                      <span className="text-[9px] font-semibold text-slate-400 uppercase mt-0.5">
                        {isPayer ? 'You Paid' : 'You Received'}
                      </span>
                    </div>
                  </div>

                </div>
              );
            })}
          </div>
        )}
      </div>

    </div>
  );
};

export default Settlements;
