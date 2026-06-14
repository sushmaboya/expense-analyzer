import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { User, Mail, Image, Key, Save, CheckCircle } from 'lucide-react';
import Toast from '../components/Toast';

const Profile = () => {
  const { user, refreshProfile } = useAuth();

  const [name, setName] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (user) {
      setName(user.name);
      setAvatarUrl(user.avatarUrl || '');
    }
  }, [user]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!name.trim()) {
      setErrorMsg('Name cannot be empty.');
      return;
    }

    if (password && password.length < 6) {
      setErrorMsg('New password must be at least 6 characters.');
      return;
    }

    if (password !== confirmPassword) {
      setErrorMsg('Passwords do not match.');
      return;
    }

    setLoading(true);
    try {
      const payload = { name };
      if (avatarUrl) payload.avatarUrl = avatarUrl;
      if (password) payload.password = password;

      await api.updateProfile(payload);
      await refreshProfile();
      
      setSuccessMsg('Profile updated successfully!');
      setPassword('');
      setConfirmPassword('');
    } catch (err) {
      setErrorMsg(err.message || 'Failed to update profile details.');
    } finally {
      setLoading(false);
    }
  };

  if (!user) return null;

  return (
    <div className="max-w-xl mx-auto space-y-6">
      
      {/* Toast Notifications */}
      {successMsg && (
        <Toast 
          message={successMsg} 
          type="success" 
          onClose={() => setSuccessMsg('')} 
        />
      )}

      {/* Page Header */}
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">User Profile</h2>
        <p className="text-sm text-slate-550 dark:text-slate-400 mt-1">
          Review and update your personal settings and authentication.
        </p>
      </div>

      {/* Profile Form card */}
      <div className="glass-card p-6 sm:p-8 rounded-3xl border border-slate-200/50 dark:border-slate-800/50 shadow-xl bg-white/70 dark:bg-slate-900/60">
        
        {/* User Large Avatar preview */}
        <div className="flex flex-col sm:flex-row items-center gap-4 mb-8">
          {avatarUrl ? (
            <img 
              src={avatarUrl} 
              alt={name} 
              className="w-20 h-20 rounded-2xl object-cover ring-4 ring-primary-500/10 shadow-md"
              onError={(e) => {
                e.target.src = `https://api.dicebear.com/7.x/initials/svg?seed=${name}`;
              }}
            />
          ) : (
            <div className="flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-tr from-primary-600 to-primary-400 text-white text-3xl font-bold shadow-lg shadow-primary-500/10">
              {name.charAt(0).toUpperCase()}
            </div>
          )}

          <div className="text-center sm:text-left space-y-1">
            <h3 className="font-bold text-lg text-slate-800 dark:text-white">{name}</h3>
            <p className="text-xs font-semibold text-slate-400">{user.email}</p>
            <p className="text-[10px] text-slate-400 uppercase tracking-wider font-mono">Member since {new Date(user.createdAt).toLocaleDateString()}</p>
          </div>
        </div>

        {errorMsg && (
          <div className="mb-6 p-4 rounded-xl bg-rose-50 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-900/30 text-xs font-semibold text-rose-600 dark:text-rose-450">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Email (Disabled) */}
          <div>
            <label className="block text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1.5">
              Email Address (Cannot be changed)
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                <Mail className="w-4 h-4" />
              </div>
              <input
                type="email"
                value={user.email}
                disabled
                className="w-full pl-10 pr-4 py-2.5 rounded-xl text-sm border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-950 text-slate-450 dark:text-slate-500 cursor-not-allowed font-medium"
              />
            </div>
          </div>

          {/* Full Name */}
          <div>
            <label className="block text-xs font-bold text-slate-505 dark:text-slate-400 uppercase tracking-wider mb-1.5">
              Full Name
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                <User className="w-4 h-4" />
              </div>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="John Doe"
                className="w-full pl-10 pr-4 py-2.5 rounded-xl text-sm glass-input font-medium"
              />
            </div>
          </div>

          {/* Avatar Url */}
          <div>
            <label className="block text-xs font-bold text-slate-505 dark:text-slate-400 uppercase tracking-wider mb-1.5">
              Avatar Image URL
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                <Image className="w-4 h-4" />
              </div>
              <input
                type="url"
                value={avatarUrl}
                onChange={(e) => setAvatarUrl(e.target.value)}
                placeholder="https://example.com/avatar.jpg"
                className="w-full pl-10 pr-4 py-2.5 rounded-xl text-sm glass-input font-medium"
              />
            </div>
          </div>

          {/* Change Password Panel */}
          <div className="pt-4 border-t border-slate-100 dark:border-slate-850 space-y-4">
            <h4 className="text-xs font-bold text-slate-700 dark:text-slate-350 uppercase tracking-wider">Change Password</h4>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-[11px] font-semibold text-slate-500 dark:text-slate-400 mb-1">
                  New Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <Key className="w-4 h-4" />
                  </div>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Min 6 characters"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl text-sm glass-input font-medium"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-500 dark:text-slate-400 mb-1">
                  Confirm New Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <Key className="w-4 h-4" />
                  </div>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Confirm password"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl text-sm glass-input font-medium"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Save Button */}
          <div className="pt-2 flex justify-end">
            <button
              type="submit"
              disabled={loading}
              className="py-2.5 px-5 rounded-xl text-sm font-bold text-white bg-primary-500 hover:bg-primary-600 disabled:bg-primary-400 active:scale-95 shadow-lg shadow-primary-500/15 transition-all duration-200 flex items-center gap-2"
            >
              <Save className="w-4 h-4" />
              <span>{loading ? 'Saving Changes...' : 'Save Changes'}</span>
            </button>
          </div>

        </form>

      </div>

    </div>
  );
};

export default Profile;
