import { create } from 'zustand';
import { api } from '../api';

export const useAuthStore = create((set, get) => ({
  user: null,
  isAuthenticated: false,
  sessions: [],
  login: async (email, password) => {
    try {
      const data = await api.postWithCredentials('/auth/login', { email, password });
      localStorage.setItem('token', data.token);
      set({ user: data.user, isAuthenticated: true });
    } catch (err) {
      throw new Error(err.message || 'Invalid credentials');
    }
  },
  googleLogin: async (token) => {
    try {
      const data = await api.postWithCredentials('/auth/google', { token });
      localStorage.setItem('token', data.token);
      set({ user: data.user, isAuthenticated: true });
    } catch (err) {
      throw new Error(err.message || 'Google authentication failed');
    }
  },
  register: async (name, email, password) => {
    try {
      const data = await api.postWithCredentials('/auth/register', { name, email, password });
      localStorage.setItem('token', data.token);
      set({ user: data.user, isAuthenticated: true });
    } catch (err) {
      throw new Error(err.message || 'Registration failed');
    }
  },
  logout: async () => {
    try {
      await api.postWithCredentials('/auth/logout');
    } catch (e) {
      // Ignore errors on logout
    }
    localStorage.removeItem('token');
    set({ user: null, isAuthenticated: false, sessions: [] });
  },
  checkAuth: async () => {
    const token = localStorage.getItem('token');
    if (!token) {
        // Try to refresh just in case we have a cookie but no token
        try {
            const data = await api.postWithCredentials('/auth/refresh');
            localStorage.setItem('token', data.token);
            // Now we can fetch me
            const user = await api.get('/auth/me');
            set({ user, isAuthenticated: true });
            return;
        } catch (e) {
            return;
        }
    }
    try {
      const user = await api.get('/auth/me');
      set({ user, isAuthenticated: true });
    } catch {
      localStorage.removeItem('token');
      set({ user: null, isAuthenticated: false });
    }
  },
  fetchSessions: async () => {
    try {
      const sessions = await api.getWithCredentials('/auth/sessions');
      set({ sessions });
    } catch (err) {
      console.error('Failed to fetch sessions', err);
    }
  },
  revokeSession: async (id) => {
    try {
      await api.deleteWithCredentials(`/auth/sessions/${id}/revoke`);
      set((state) => ({
        sessions: state.sessions.filter(s => s.id !== id)
      }));
    } catch (err) {
      console.error('Failed to revoke session', err);
      throw err;
    }
  }
}));

// Setup listener for auth expired
if (typeof window !== 'undefined') {
  window.addEventListener('auth-expired', () => {
    useAuthStore.getState().logout();
  });
}
