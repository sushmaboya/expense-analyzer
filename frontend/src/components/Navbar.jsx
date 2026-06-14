import React from 'react';
import { LogOut, DollarSign, User as UserIcon, Menu } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import DarkModeToggle from './DarkModeToggle';
import { Link } from 'react-router-dom';

const Navbar = ({ onMenuClick }) => {
  const { user, logout } = useAuth();

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-950/80 backdrop-blur-md transition-colors duration-300">
      <div className="flex h-16 items-center justify-between px-4 sm:px-6">
        
        {/* Left Side: Brand and Mobile Toggle */}
        <div className="flex items-center gap-3">
          <button 
            onClick={onMenuClick}
            className="p-2 -ml-2 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 md:hidden transition-colors"
          >
            <Menu className="w-6 h-6" />
          </button>
          
          <Link to="/" className="flex items-center gap-2 group">
            <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-tr from-primary-600 to-primary-400 text-white shadow-lg shadow-primary-500/20 group-hover:scale-105 transition-transform duration-200">
              <DollarSign className="w-5 h-5 stroke-[2.5]" />
            </div>
            <span className="font-bold text-lg bg-gradient-to-r from-slate-900 via-primary-950 to-primary-600 dark:from-white dark:to-primary-400 bg-clip-text text-transparent">
              SplitWise Analyzer
            </span>
          </Link>
        </div>

        {/* Right Side: Theme, User Info & Logout */}
        <div className="flex items-center gap-4">
          <DarkModeToggle />

          {user && (
            <>
              {/* User badge */}
              <Link 
                to="/profile" 
                className="flex items-center gap-2.5 p-1.5 pr-3 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                {user.avatarUrl ? (
                  <img 
                    src={user.avatarUrl} 
                    alt={user.name} 
                    className="w-8 h-8 rounded-lg object-cover ring-2 ring-primary-500/20"
                  />
                ) : (
                  <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary-100 dark:bg-primary-950/50 text-primary-600 dark:text-primary-400 font-semibold text-sm">
                    {user.name.charAt(0).toUpperCase()}
                  </div>
                )}
                <span className="hidden sm:inline text-sm font-medium text-slate-700 dark:text-slate-300">
                  {user.name}
                </span>
              </Link>

              {/* Logout button */}
              <button
                onClick={logout}
                className="p-2 text-slate-500 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/20 rounded-xl transition-all duration-200"
                title="Log out"
              >
                <LogOut className="w-5 h-5" />
              </button>
            </>
          )}
        </div>

      </div>
    </header>
  );
};

export default Navbar;
