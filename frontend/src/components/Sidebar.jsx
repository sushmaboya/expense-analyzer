import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Users, Receipt, User, X } from 'lucide-react';

const Sidebar = ({ isOpen, onClose }) => {
  const navItems = [
    { name: 'Dashboard', path: '/', icon: <LayoutDashboard className="w-5 h-5" /> },
    { name: 'Groups', path: '/groups', icon: <Users className="w-5 h-5" /> },
    { name: 'Settlements', path: '/settlements', icon: <Receipt className="w-5 h-5" /> },
    { name: 'Profile', path: '/profile', icon: <User className="w-5 h-5" /> }
  ];

  const sidebarClasses = `
    fixed inset-y-0 left-0 z-50 w-64 border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 p-6 flex flex-col transition-transform duration-300 md:sticky md:top-16 md:h-[calc(100vh-4rem)] md:translate-x-0
    ${isOpen ? 'translate-x-0' : '-translate-x-full'}
  `;

  return (
    <>
      {/* Mobile Backdrop overlay */}
      {isOpen && (
        <div 
          onClick={onClose}
          className="fixed inset-0 z-40 bg-slate-950/20 backdrop-blur-sm md:hidden"
        />
      )}

      <aside className={sidebarClasses}>
        {/* Mobile close button */}
        <div className="flex items-center justify-between mb-6 md:hidden">
          <span className="font-bold text-slate-800 dark:text-white">Navigation</span>
          <button 
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Sidebar Nav Items */}
        <nav className="space-y-1.5 flex-1">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              onClick={onClose}
              className={({ isActive }) => `
                flex items-center gap-3.5 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200
                ${isActive 
                  ? 'bg-primary-50 dark:bg-primary-950/30 text-primary-600 dark:text-primary-400 border-r-4 border-primary-500' 
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-900/50 hover:text-slate-900 dark:hover:text-slate-200'}
              `}
            >
              {item.icon}
              {item.name}
            </NavLink>
          ))}
        </nav>

        {/* Sidebar footer badge */}
        <div className="pt-6 border-t border-slate-100 dark:border-slate-900">
          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-900 flex flex-col gap-1">
            <span className="text-xs font-semibold text-primary-500 uppercase tracking-wider">Premium Plan</span>
            <span className="text-xs text-slate-500 dark:text-slate-400">Expense analyzer loaded with optimal settling algorithms.</span>
          </div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
