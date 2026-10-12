const API_BASE = '/api';

async function request(endpoint, options = {}) {
  const token = localStorage.getItem('rv_token');
  const headers = {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` }),
    ...options.headers,
  };

  const res = await fetch(`${API_BASE}${endpoint}`, { ...options, headers });
  let data;
  try {
    data = await res.json();
  } catch (e) {
    data = { error: `Erreur HTTP ${res.status}: ${res.statusText}` };
  }

  if (!res.ok) {
    throw new Error(data.error || 'Une erreur est survenue');
  }

  return data;
}

// Auth
export const login = (email, password) => request('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) });
export const register = (data) => request('/auth/register', { method: 'POST', body: JSON.stringify(data) });
export const getMe = () => request('/auth/me');

// KYC
export const getKyc = () => request('/kyc');
export const updateKyc = (data) => request('/kyc', { method: 'PUT', body: JSON.stringify(data) });
export const getKycEngine = (clientId) => request(`/kyc/engine/${clientId}`);
export const updateKycEngine = (clientId, data) => request(`/kyc/engine/${clientId}`, { method: 'PUT', body: JSON.stringify(data) });
export const sendKycToEws = (clientId) => request(`/kyc/engine/${clientId}/ews`, { method: 'POST' });

// Accounts
export const getAccounts = () => request('/accounts');
export const getAccount = (id) => request(`/accounts/${id}`);
export const createAccount = (data) => request('/accounts', { method: 'POST', body: JSON.stringify(data) });

// Transactions
export const getTransactions = (page = 1, limit = 25) => request(`/transactions?page=${page}&limit=${limit}`);
export const makeTransfer = (data) => request('/transactions/transfer', { method: 'POST', body: JSON.stringify(data) });
export const makeDeposit = (data) => request('/transactions/deposit', { method: 'POST', body: JSON.stringify(data) });

// Credits
export const getCredits = () => request('/credits');
export const getCredit = (id) => request(`/credits/${id}`);
export const createCredit = (data) => request('/credits', { method: 'POST', body: JSON.stringify(data) });
export const updateCredit = (id, data) => request(`/credits/${id}`, { method: 'PUT', body: JSON.stringify(data) });
export const deleteCredit = (id) => request(`/credits/${id}`, { method: 'DELETE' });
export const makeCreditPayment = (id, data) => request(`/credits/${id}/payment`, { method: 'POST', body: JSON.stringify(data) });
export const recordMissedPayment = (id, data) => request(`/credits/${id}/missed-payment`, { method: 'POST', body: JSON.stringify(data) });

// Admin
export const getAdminStats = () => request('/admin/stats');
export const getAdminClients = (page = 1, limit = 20, search = '', kyc_status = '', type_client = '') =>
  request(`/admin/clients?page=${page}&limit=${limit}&search=${search}&kyc_status=${kyc_status}&type_client=${type_client}`);
export const getAdminClient = (id) => request(`/admin/clients/${id}`);
export const updateAdminKyc = (clientId, data) => request(`/admin/clients/${clientId}/kyc`, { method: 'PUT', body: JSON.stringify(data) });
export const updateAdminAccount = (id, data) => request(`/admin/accounts/${id}`, { method: 'PUT', body: JSON.stringify(data) });
export const adminCreateCredit = (data) => request('/admin/credits', { method: 'POST', body: JSON.stringify(data) });
export const adminUpdateCredit = (id, data) => request(`/admin/credits/${id}`, { method: 'PUT', body: JSON.stringify(data) });
export const adminDeleteCredit = (id) => request(`/admin/credits/${id}`, { method: 'DELETE' });
export const adminCreateClient = (data) => request('/admin/clients', { method: 'POST', body: JSON.stringify(data) });
export const adminDeleteClient = (id) => request(`/admin/clients/${id}`, { method: 'DELETE' });
export const getAdminTransactions = (page = 1, limit = 50) => request(`/admin/transactions?page=${page}&limit=${limit}`);
export const getAdminCredits = (page = 1, limit = 50) => request(`/admin/credits?page=${page}&limit=${limit}`);
