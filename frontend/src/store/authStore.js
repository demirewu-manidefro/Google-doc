import { create } from 'zustand';
import { api } from '../api';

export const useAuthStore = create((set) => ({
  user: null,
  isAuthenticated: false,
  login: async (email, password) => {
    try {
      const data = await api.post('/auth/login', { email, password });
      localStorage.setItem('token', data.token);
      set({ user: data.user, isAuthenticated: true });
    } catch (err) {
      throw new Error('Invalid credentials');
    }
  },
  googleLogin: async (token) => {
    try {
      const data = await api.post('/auth/google', { token });
      localStorage.setItem('token', data.token);
      set({ user: data.user, isAuthenticated: true });
    } catch (err) {
      throw new Error('Google authentication failed');
    }
  },
  register: async (name, email, password) => {
    try {
      const data = await api.post('/auth/register', { name, email, password });
      localStorage.setItem('token', data.token);
      set({ user: data.user, isAuthenticated: true });
    } catch (err) {
      throw new Error('Registration failed');
    }
  },
  logout: () => {
    localStorage.removeItem('token');
    set({ user: null, isAuthenticated: false });
  },
  checkAuth: async () => {
    const token = localStorage.getItem('token');
    if (!token) return;
    try {
      const user = await api.get('/auth/me');
      set({ user, isAuthenticated: true });
    } catch {
      localStorage.removeItem('token');
      set({ user: null, isAuthenticated: false });
    }
  },
}));
