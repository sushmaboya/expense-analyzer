import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import StatCard from '../components/StatCard';
import { SpendingTrendChart, CategoryPieChart } from '../components/DashboardCharts';
import { ArrowUpRight, ArrowDownRight, Wallet, Users, ChevronRight, Sparkles } from 'lucide-react';

const Dashboard = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function fetchAnalytics() {
      try {
        setLoading(true);
        const res = await api.getAnalytics();
        setData(res);
      } catch (err) {
        setError(err.message || 'Failed to fetch dashboard statistics.');
      } finally {
        setLoading(false);
      }
    }
    fetchAnalytics();
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
        <div className="w-12 h-12 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" />
        <span className="text-sm text-slate-500 font-medium animate-pulse">Analyzing expenses...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 rounded-2xl bg-rose-50 dark:bg-rose-955/20 border border-rose-100 dark:border-rose-900/40 text-rose-600 dark:text-rose-400">
        <h3 className="font-bold mb-1">Error Loading Dashboard</h3>
        <p className="text-sm">{error}</p>
      </div>
    );
  }

  // Format currency helpers
  const formatVal = (val) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 2
    }).format(Math.abs(val));
  };

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      
      {/* Header and Welcome banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
            Analytics Dashboard
            <Sparkles className="w-5 h-5 text-amber-500 fill-amber-500" />
          </h2>
          <p className="text-sm text-slate-550 dark:text-slate-400 mt-1">
            Track and optimize shared expenses and settlement summaries across groups.
          </p>
        </div>
      </div>

      {/* Stats Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard
          title="Total You Owe"
          amount={data.youOwe}
          icon={<ArrowDownRight className="w-6 h-6 stroke-[2.5]" />}
          variant={data.youOwe > 0 ? 'negative' : 'neutral'}
          trend={data.youOwe > 0 && <span className="text-rose-500 font-semibold">Pay debts to settle up.</span>}
        />
        <StatCard
          title="Total Owed to You"
          amount={data.youAreOwed}
          icon={<ArrowUpRight className="w-6 h-6 stroke-[2.5]" />}
          variant={data.youAreOwed > 0 ? 'positive' : 'neutral'}
          trend={data.youAreOwed > 0 && <span className="text-emerald-500 font-semibold">Creditors owe you refunds.</span>}
        />
        <StatCard
          title="Your Total Expenditure"
          amount={data.totalExpenses}
          icon={<Wallet className="w-6 h-6" />}
          variant="primary"
          trend={<span className="text-slate-500 dark:text-slate-400">Sum of your calculated expense shares.</span>}
        />
      </div>

      {/* Analytics Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Spend Trend card */}
        <div className="glass-card p-6 rounded-3xl border border-slate-200/50 dark:border-slate-800/50 bg-white/70 dark:bg-slate-900/60 shadow-lg">
          <div className="mb-4">
            <h3 className="font-bold text-slate-800 dark:text-white text-base">Monthly Spending Trends</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Your monthly expense shares over time</p>
          </div>
          <SpendingTrendChart data={data.monthlyTrend} />
        </div>

        {/* Category Breakdown card */}
        <div className="glass-card p-6 rounded-3xl border border-slate-200/50 dark:border-slate-800/50 bg-white/70 dark:bg-slate-900/60 shadow-lg">
          <div className="mb-4">
            <h3 className="font-bold text-slate-800 dark:text-white text-base">Category Analysis</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Where your money is allocated</p>
          </div>
          <CategoryPieChart data={data.categoryData} />
        </div>
      </div>

      {/* Groups Summary Table Card */}
      <div className="glass-card p-6 rounded-3xl border border-slate-200/50 dark:border-slate-800/50 bg-white/70 dark:bg-slate-900/60 shadow-lg">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="font-bold text-slate-800 dark:text-white text-base">Group Expenditures</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Overview of active splits by group</p>
          </div>
          
          <Link 
            to="/groups" 
            className="flex items-center gap-1.5 text-xs font-semibold text-primary-500 hover:text-primary-600 transition-colors"
          >
            <span>All Groups</span>
            <ChevronRight className="w-4 h-4" />
          </Link>
        </div>

        {data.groupSummary.length === 0 ? (
          <div className="text-center py-10 border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl">
            <Users className="w-10 h-10 text-slate-300 dark:text-slate-700 mx-auto mb-2.5" />
            <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">You haven't joined any groups yet.</p>
            <Link 
              to="/groups" 
              className="mt-3 inline-block px-4 py-2 text-xs font-semibold text-white bg-primary-500 hover:bg-primary-600 rounded-xl shadow-md transition-all duration-200"
            >
              Create or Join Group
            </Link>
          </div>
        ) : (
          <div className="border border-slate-100 dark:border-slate-850 rounded-2xl overflow-hidden shadow-sm">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-950 text-slate-500 border-b border-slate-100 dark:border-slate-850">
                  <th className="p-4 font-semibold">Group Name</th>
                  <th className="p-4 font-semibold hidden sm:table-cell">Members</th>
                  <th className="p-4 font-semibold">Total Expense</th>
                  <th className="p-4 font-semibold">Your Balance</th>
                  <th className="p-4 font-semibold w-16"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-850 bg-white dark:bg-slate-900/40">
                {data.groupSummary.map((group) => (
                  <tr key={group.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-950/20 group">
                    <td className="p-4">
                      <div className="font-semibold text-slate-800 dark:text-slate-100 group-hover:text-primary-500 transition-colors">
                        {group.name}
                      </div>
                      <div className="text-xs text-slate-400 line-clamp-1 max-w-xs">{group.description || 'No description'}</div>
                    </td>
                    <td className="p-4 text-slate-500 dark:text-slate-400 hidden sm:table-cell">
                      {group.memberCount} members
                    </td>
                    <td className="p-4 font-semibold text-slate-700 dark:text-slate-350">
                      {formatVal(group.totalExpenses)}
                    </td>
                    <td className="p-4 font-medium">
                      {group.userNetBalance > 0.01 ? (
                        <span className="text-emerald-600 dark:text-emerald-400">Owed {formatVal(group.userNetBalance)}</span>
                      ) : group.userNetBalance < -0.01 ? (
                        <span className="text-rose-600 dark:text-rose-450">You owe {formatVal(group.userNetBalance)}</span>
                      ) : (
                        <span className="text-slate-400 font-normal">Settled up</span>
                      )}
                    </td>
                    <td className="p-4">
                      <Link 
                        to={`/groups/${group.id}`}
                        className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-all flex items-center justify-center"
                      >
                        <ChevronRight className="w-5 h-5 group-hover:translate-x-0.5 transition-transform" />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

    </div>
  );
};

export default Dashboard;
