import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import { Plus, Users, ArrowRight, FolderPlus, X } from 'lucide-react';
import Toast from '../components/Toast';

const Groups = () => {
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [groupName, setGroupName] = useState('');
  const [groupDesc, setGroupDesc] = useState('');
  const [createLoading, setCreateLoading] = useState(false);
  
  const [toastMsg, setToastMsg] = useState('');

  const fetchGroups = async () => {
    try {
      setLoading(true);
      const res = await api.listGroups();
      setGroups(res);
    } catch (err) {
      setError(err.message || 'Failed to retrieve groups.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGroups();
  }, []);

  const handleCreateGroup = async (e) => {
    e.preventDefault();
    if (!groupName.trim()) return;

    setCreateLoading(true);
    try {
      await api.createGroup(groupName, groupDesc);
      setToastMsg('Group created successfully!');
      setGroupName('');
      setGroupDesc('');
      setIsModalOpen(false);
      fetchGroups();
    } catch (err) {
      setToastMsg(`Error: ${err.message}`);
    } finally {
      setCreateLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
        <div className="w-12 h-12 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" />
        <span className="text-sm text-slate-500 font-medium">Loading groups...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      
      {toastMsg && (
        <Toast 
          message={toastMsg} 
          type={toastMsg.startsWith('Error') ? 'error' : 'success'} 
          onClose={() => setToastMsg('')} 
        />
      )}

      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">Your Groups</h2>
          <p className="text-sm text-slate-550 dark:text-slate-400 mt-1">
            Create or manage shared groups of friends, trips, or bills.
          </p>
        </div>
        
        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-1.5 px-4.5 py-2.5 rounded-xl text-sm font-bold text-white bg-primary-500 hover:bg-primary-600 active:scale-95 shadow-lg shadow-primary-500/10 transition-all duration-200"
        >
          <Plus className="w-4 h-4 stroke-[2.5]" />
          <span>New Group</span>
        </button>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-rose-50 dark:bg-rose-955/20 border border-rose-100 dark:border-rose-900/40 text-xs font-semibold text-rose-650 dark:text-rose-400">
          {error}
        </div>
      )}

      {/* Groups Grid */}
      {groups.length === 0 ? (
        <div className="text-center py-16 border border-dashed border-slate-200 dark:border-slate-800 rounded-3xl bg-white/40 dark:bg-slate-900/10">
          <Users className="w-14 h-14 text-slate-300 dark:text-slate-700 mx-auto mb-4" />
          <h3 className="text-lg font-bold text-slate-800 dark:text-slate-250">No groups found</h3>
          <p className="text-sm text-slate-500 dark:text-slate-400 max-w-sm mx-auto mt-1 leading-relaxed">
            Create your first group to start dividing expenses and recording repayments.
          </p>
          <button
            onClick={() => setIsModalOpen(true)}
            className="mt-5 px-5 py-2.5 text-sm font-bold text-white bg-primary-500 hover:bg-primary-600 rounded-xl shadow-md transition-all duration-200"
          >
            Create Group
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {groups.map((group) => (
            <div 
              key={group.id}
              className="group rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/70 dark:bg-slate-900/60 p-6 flex flex-col justify-between hover:shadow-xl hover:border-slate-300 dark:hover:border-slate-700 transition-all duration-300"
            >
              <div>
                {/* Header Icon & Member count */}
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-primary-50 dark:bg-primary-950/30 text-primary-500">
                    <Users className="w-5 h-5" />
                  </div>
                  <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-550 dark:text-slate-400">
                    {group.members.length} members
                  </span>
                </div>

                <h3 className="font-bold text-base text-slate-850 dark:text-white group-hover:text-primary-500 transition-colors">
                  {group.name}
                </h3>
                
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1.5 line-clamp-2 leading-relaxed">
                  {group.description || 'No description provided.'}
                </p>
              </div>

              {/* Members initials list & action */}
              <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-850 flex items-center justify-between gap-4">
                {/* Member avatars */}
                <div className="flex items-center -space-x-2.5 overflow-hidden">
                  {group.members.slice(0, 4).map((member) => (
                    <div 
                      key={member.userId}
                      className="w-7 h-7 rounded-full bg-slate-200 dark:bg-slate-700 border border-white dark:border-slate-900 flex items-center justify-center text-[10px] font-bold text-slate-700 dark:text-slate-300 uppercase ring-1 ring-slate-100 dark:ring-transparent"
                      title={member.user.name}
                    >
                      {member.user.avatarUrl ? (
                        <img 
                          src={member.user.avatarUrl} 
                          alt={member.user.name} 
                          className="w-full h-full rounded-full object-cover"
                        />
                      ) : (
                        member.user.name.charAt(0)
                      )}
                    </div>
                  ))}
                  {group.members.length > 4 && (
                    <div className="w-7 h-7 rounded-full bg-primary-100 dark:bg-primary-950 text-primary-600 dark:text-primary-450 border border-white dark:border-slate-900 flex items-center justify-center text-[10px] font-bold">
                      +{group.members.length - 4}
                    </div>
                  )}
                </div>

                <Link
                  to={`/groups/${group.id}`}
                  className="flex items-center gap-1.5 text-xs font-bold text-primary-500 group-hover:text-primary-600 transition-colors"
                >
                  <span>Open Group</span>
                  <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                </Link>
              </div>

            </div>
          ))}
        </div>
      )}

      {/* Create Group Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/45 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-md rounded-2xl border border-slate-200 dark:border-slate-850 bg-white dark:bg-slate-900 p-6 shadow-2xl animate-scale-up">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3.5 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <FolderPlus className="w-5 h-5 text-primary-500" />
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">Create New Group</h3>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-650 dark:hover:text-slate-250"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleCreateGroup} className="space-y-4 py-4">
              <div>
                <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">
                  Group Name
                </label>
                <input
                  type="text"
                  required
                  value={groupName}
                  onChange={(e) => setGroupName(e.target.value)}
                  placeholder="e.g. Flatmates, Road Trip, Work Lunch"
                  className="w-full px-3.5 py-2.5 rounded-xl text-sm glass-input font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">
                  Description (Optional)
                </label>
                <textarea
                  value={groupDesc}
                  onChange={(e) => setGroupDesc(e.target.value)}
                  placeholder="Short details about the split group..."
                  rows="3"
                  className="w-full px-3.5 py-2.5 rounded-xl text-sm glass-input font-medium resize-none"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-850">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-sm font-semibold text-slate-500 dark:text-slate-450"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createLoading || !groupName.trim()}
                  className="px-5 py-2.5 text-sm font-bold text-white bg-primary-500 hover:bg-primary-600 disabled:bg-slate-200 dark:disabled:bg-slate-800 disabled:text-slate-400 rounded-xl shadow-lg shadow-primary-500/10 active:scale-95 transition-all duration-200"
                >
                  {createLoading ? 'Creating...' : 'Create Group'}
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

    </div>
  );
};

export default Groups;
