const API_URL = import.meta.env.VITE_API_URL || '/api';

/**
 * Custom fetcher configured with Authorization headers.
 */
async function request(endpoint, options = {}) {
  const token = localStorage.getItem('token');
  const headers = {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` }),
    ...options.headers
  };

  const config = {
    method: 'GET',
    ...options,
    headers
  };

  if (config.body && typeof config.body === 'object') {
    config.body = JSON.stringify(config.body);
  }

  const response = await fetch(`${API_URL}${endpoint}`, config);
  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || 'Something went wrong');
  }

  return data;
}

const api = {
  // Auth API
  register: (name, email, password) => 
    request('/auth/register', { method: 'POST', body: { name, email, password } }),
  
  login: (email, password) => 
    request('/auth/login', { method: 'POST', body: { email, password } }),

  // Profile API
  getProfile: () => 
    request('/profile'),
  
  updateProfile: (userData) => 
    request('/profile', { method: 'PUT', body: userData }),

  getAnalytics: () =>
    request('/profile/analytics'),

  // Groups API
  listGroups: () => 
    request('/groups'),
  
  createGroup: (name, description) => 
    request('/groups', { method: 'POST', body: { name, description } }),
  
  addGroupMember: (groupId, email) => 
    request(`/groups/${groupId}/members`, { method: 'POST', body: { email } }),

  removeGroupMember: (groupId, userId) => 
    request(`/groups/${groupId}/members/${userId}`, { method: 'DELETE' }),

  getGroupBalances: (groupId) => 
    request(`/groups/${groupId}/balances`),

  // Expenses API
  getGroupExpenses: (groupId) => 
    request(`/expenses/group/${groupId}`),

  createExpense: (expenseData) => 
    request('/expenses', { method: 'POST', body: expenseData }),

  // Settlements API
  listSettlements: (groupId = null) => 
    request(`/settlements${groupId ? `?groupId=${groupId}` : ''}`),

  recordSettlement: (settlementData) => 
    request('/settlements', { method: 'POST', body: settlementData }),

  // Import API
  importExpenses: (groupId, fileName, csvContent) => 
    request(`/import/group/${groupId}`, { method: 'POST', body: { fileName, csvContent } }),
  
  listImportReports: () => 
    request('/import/reports')
};

export default api;
