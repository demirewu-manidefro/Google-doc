const API_URL = 'http://localhost:3001/api';

const getHeaders = () => {
  const token = localStorage.getItem('token');
  return {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {})
  };
};

// Helper to handle requests and token refresh
const fetchWithRefresh = async (endpoint, options = {}) => {
  let res = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers: { ...getHeaders(), ...(options.headers || {}) }
  });

  if (res.status === 401 && endpoint !== '/auth/login' && endpoint !== '/auth/register' && endpoint !== '/auth/refresh') {
    try {
      // Try to refresh token
      const refreshRes = await fetch(`${API_URL}/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        // Important: we need to send cookies for refresh
        credentials: 'include' 
      });

      if (!refreshRes.ok) throw new Error('Session expired');

      const data = await refreshRes.json();
      localStorage.setItem('token', data.token);

      // Retry original request
      res = await fetch(`${API_URL}${endpoint}`, {
        ...options,
        headers: { ...getHeaders(), ...(options.headers || {}) }
      });
    } catch (err) {
      localStorage.removeItem('token');
      window.dispatchEvent(new Event('auth-expired'));
      throw new Error('Session expired, please login again');
    }
  }

  if (!res.ok) {
    let errMsg = 'Unknown error';
    try {
      const errData = await res.json();
      errMsg = errData.error || errData.message || JSON.stringify(errData);
    } catch (e) {
      errMsg = await res.text();
    }
    throw new Error(errMsg);
  }

  return res.json();
};

export const api = {
  get: (endpoint) => fetchWithRefresh(endpoint, { method: 'GET', credentials: 'omit' }),
  post: (endpoint, data) => fetchWithRefresh(endpoint, { method: 'POST', body: JSON.stringify(data), credentials: 'omit' }),
  put: (endpoint, data) => fetchWithRefresh(endpoint, { method: 'PUT', body: JSON.stringify(data), credentials: 'omit' }),
  delete: (endpoint) => fetchWithRefresh(endpoint, { method: 'DELETE', credentials: 'omit' }),
  
  // Expose these explicitly if they need credentials (like refresh or logout)
  postWithCredentials: async (endpoint, data) => {
     let res = await fetch(`${API_URL}${endpoint}`, {
        method: 'POST',
        headers: getHeaders(),
        body: data ? JSON.stringify(data) : undefined,
        credentials: 'include'
     });
     if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || 'Request failed');
     }
     return res.json();
  },
  getWithCredentials: async (endpoint) => {
    let res = await fetch(`${API_URL}${endpoint}`, {
       method: 'GET',
       headers: getHeaders(),
       credentials: 'include'
    });
    if (!res.ok) {
       const errData = await res.json().catch(() => ({}));
       throw new Error(errData.error || 'Request failed');
    }
    return res.json();
 },
 deleteWithCredentials: async (endpoint) => {
    let res = await fetch(`${API_URL}${endpoint}`, {
       method: 'DELETE',
       headers: getHeaders(),
       credentials: 'include'
    });
    if (!res.ok) {
       const errData = await res.json().catch(() => ({}));
       throw new Error(errData.error || 'Request failed');
    }
    return res.json();
 }
};
