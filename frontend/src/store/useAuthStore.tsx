import { create } from 'zustand';
import axios from 'axios';
import { User } from '../types/index.ts';

const API_URL = '/api';

interface Session {
  _id: string;
  deviceInfo: string;
  ipAddress: string;
  lastActive: string;
  expiresAt: string;
}

interface AuthStore {
  user: User | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  loading: boolean;
  activeSessions: Session[];
  setCredentials: (accessToken: string, user: User) => void;
  clearCredentials: () => void;
  login: (email: string, password: string, rememberMe?: boolean) => Promise<{ success: boolean; message?: string }>;
  logout: () => Promise<void>;
  logoutAll: () => Promise<void>;
  checkAuth: () => Promise<void>;
  fetchActiveSessions: () => Promise<void>;
  revokeSession: (sessionId: string) => Promise<void>;
}

export const useAuthStore = create<AuthStore>((set, get) => ({
  user: null,
  accessToken: null,
  isAuthenticated: false,
  loading: true,
  activeSessions: [],

  setCredentials: (accessToken, user) => {
    localStorage.setItem('espark_access_token', accessToken);
    set({ accessToken, user, isAuthenticated: !!user, loading: false });
  },
  clearCredentials: () => {
    localStorage.removeItem('espark_access_token');
    set({ accessToken: null, user: null, isAuthenticated: false, loading: false, activeSessions: [] });
  },

  login: async (email, password, rememberMe = false) => {
    set({ loading: true });
    try {
      const response = await axios.post(`${API_URL}/auth/login`, { email, password, rememberMe }, { withCredentials: true });
      const { accessToken, refreshToken, user } = response.data.data;
      if (refreshToken) localStorage.setItem('refreshToken', refreshToken);
      get().setCredentials(accessToken, user);
      return { success: true };
    } catch (error: any) {
      set({ loading: false });
      return { success: false, message: error.response?.data?.message || 'Login failed' };
    }
  },

  logout: async () => {
    try {
      await axios.post(`${API_URL}/auth/logout`, {}, { withCredentials: true });
    } catch { /* silent */ } finally {
      localStorage.removeItem('refreshToken');
      get().clearCredentials();
    }
  },

  logoutAll: async () => {
    try {
      const headers = get().accessToken ? { Authorization: `Bearer ${get().accessToken}` } : {};
      await axios.post(`${API_URL}/auth/logout-all`, {}, { withCredentials: true, headers });
    } catch { /* silent */ } finally {
      localStorage.removeItem('refreshToken');
      get().clearCredentials();
    }
  },

  checkAuth: async () => {
    const localToken = localStorage.getItem('refreshToken');
    if (!localToken) { get().clearCredentials(); return; }
    set({ loading: true });
    try {
      const response = await axios.post(`${API_URL}/auth/refresh`, { refreshToken: localToken }, { withCredentials: true });
      const { accessToken, refreshToken, user } = response.data.data;
      if (refreshToken) localStorage.setItem('refreshToken', refreshToken);
      get().setCredentials(accessToken, user);
    } catch {
      localStorage.removeItem('refreshToken');
      get().clearCredentials();
    }
  },

  fetchActiveSessions: async () => {
    try {
      const headers = get().accessToken ? { Authorization: `Bearer ${get().accessToken}` } : {};
      const response = await axios.get(`${API_URL}/auth/sessions`, { withCredentials: true, headers });
      set({ activeSessions: response.data.data.sessions });
    } catch (error) {
      console.error('Failed to fetch active sessions', error);
    }
  },

  revokeSession: async (sessionId: string) => {
    try {
      const headers = get().accessToken ? { Authorization: `Bearer ${get().accessToken}` } : {};
      await axios.delete(`${API_URL}/auth/sessions/${sessionId}`, { withCredentials: true, headers });
      set((state) => ({
        activeSessions: state.activeSessions.filter((s) => s._id !== sessionId),
      }));
    } catch (error) {
      console.error('Failed to revoke session', error);
    }
  },
}));
