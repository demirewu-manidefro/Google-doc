import { create } from 'zustand';

export const useAuthStore = create((set) => ({
  user: null,
  isAuthenticated: false,
  token: null,
  login: (userData, token) => {
    localStorage.setItem('syncwrite_token', token);
    localStorage.setItem('syncwrite_user', JSON.stringify(userData));
    set({ user: userData, isAuthenticated: true, token });
  },
  logout: () => {
    localStorage.removeItem('syncwrite_token');
    localStorage.removeItem('syncwrite_user');
    set({ user: null, isAuthenticated: false, token: null });
  },
  checkAuth: () => {
    const token = localStorage.getItem('syncwrite_token');
    const userStr = localStorage.getItem('syncwrite_user');
    if (token && userStr) {
      try {
        const user = JSON.parse(userStr);
        set({ user, isAuthenticated: true, token });
      } catch (e) {
        localStorage.removeItem('syncwrite_token');
        localStorage.removeItem('syncwrite_user');
        set({ user: null, isAuthenticated: false, token: null });
      }
    } else {
      set({ user: null, isAuthenticated: false, token: null });
    }
  }
}));
