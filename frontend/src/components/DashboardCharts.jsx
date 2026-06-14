import React from 'react';
import { 
  ResponsiveContainer, 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  PieChart, 
  Pie, 
  Cell, 
  Legend 
} from 'recharts';

const CATEGORY_COLORS = {
  Food: '#6366f1',       // Indigo
  Travel: '#10b981',     // Emerald
  Bills: '#f59e0b',      // Amber
  Shopping: '#ec4899',   // Pink
  Others: '#64748b'      // Slate
};

const DEFAULT_COLORS = ['#8b5cf6', '#3b82f6', '#06b6d4', '#14b8a6', '#f43f5e'];

// Custom Tooltip component for Recharts Area Chart
const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl">
        <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">{label}</p>
        <p className="text-sm font-bold text-primary-600 dark:text-primary-400">
          {new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(payload[0].value)}
        </p>
      </div>
    );
  }
  return null;
};

// Custom Tooltip component for Recharts Pie Chart
const PieTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl">
        <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">{data.name}</p>
        <p className="text-sm font-bold" style={{ color: payload[0].color || '#8b5cf6' }}>
          {new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(data.value)} ({data.percentage}%)
        </p>
      </div>
    );
  }
  return null;
};

export const SpendingTrendChart = ({ data }) => {
  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 bg-slate-50/50 dark:bg-slate-900/10 border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl">
        <span className="text-sm text-slate-400">No monthly data available yet.</span>
      </div>
    );
  }

  return (
    <div className="w-full h-80">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart
          data={data}
          margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
        >
          <defs>
            <linearGradient id="colorSpend" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.2}/>
              <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0.0}/>
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" className="dark:stroke-slate-800/50" />
          <XAxis 
            dataKey="month" 
            tickLine={false} 
            axisLine={false}
            tick={{ fill: '#94a3b8', fontSize: 11 }}
          />
          <YAxis 
            tickLine={false} 
            axisLine={false}
            tick={{ fill: '#94a3b8', fontSize: 11 }}
          />
          <Tooltip content={<CustomTooltip />} />
          <Area 
            type="monotone" 
            dataKey="amount" 
            stroke="#8b5cf6" 
            strokeWidth={2}
            fillOpacity={1} 
            fill="url(#colorSpend)" 
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};

export const CategoryPieChart = ({ data }) => {
  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 bg-slate-50/50 dark:bg-slate-900/10 border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl">
        <span className="text-sm text-slate-400">No categories recorded.</span>
      </div>
    );
  }

  const pieData = data.map(item => ({
    name: item.category,
    value: item.amount,
    percentage: item.percentage
  }));

  return (
    <div className="w-full h-80 flex flex-col justify-center">
      <div className="h-60">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={pieData}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={80}
              paddingAngle={4}
              dataKey="value"
            >
              {pieData.map((entry, index) => (
                <Cell 
                  key={`cell-${index}`} 
                  fill={CATEGORY_COLORS[entry.name] || DEFAULT_COLORS[index % DEFAULT_COLORS.length]} 
                />
              ))}
            </Pie>
            <Tooltip content={<PieTooltip />} />
          </PieChart>
        </ResponsiveContainer>
      </div>
      
      {/* Custom Legend */}
      <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2.5 mt-2 px-4">
        {pieData.map((entry, index) => {
          const color = CATEGORY_COLORS[entry.name] || DEFAULT_COLORS[index % DEFAULT_COLORS.length];
          return (
            <div key={entry.name} className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: color }} />
              <span className="text-xs font-medium text-slate-600 dark:text-slate-400">
                {entry.name} ({entry.percentage}%)
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};
