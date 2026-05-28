import { create } from 'zustand';
import api from '../services/api.tsx';

export const useTimeLogStore = create((set, get) => ({
  activeTimer: null,
  logs: [],
  loading: false,

  fetchActiveTimer: async () => {
    try {
      const response = await api.get('/timelogs/active');
      set({ activeTimer: response.data.data.activeTimer });
    } catch (err) {
      set({ activeTimer: null });
    }
  },

  startTimer: async (taskId, description, isBillable) => {
    try {
      const response = await api.post('/timelogs/start', { taskId, description, isBillable });
      set({ activeTimer: response.data.data.timeLog });
      return { success: true };
    } catch (err) {
      return {
        success: false,
        message: err.response?.data?.message || 'Failed to start timer'
      };
    }
  },

  stopTimer: async () => {
    try {
      const response = await api.post('/timelogs/stop');
      set({ activeTimer: null });
      (get() as any).fetchLogs();
      return { success: true, data: response.data.data.timeLog };
    } catch (err) {
      return {
        success: false,
        message: err.response?.data?.message || 'Failed to stop timer'
      };
    }
  },

  logTimeManual: async (manualData) => {
    try {
      await api.post('/timelogs', manualData);
      (get() as any).fetchLogs();
      return { success: true };
    } catch (err) {
      return {
        success: false,
        message: err.response?.data?.message || 'Failed to log manual time'
      };
    }
  },

  fetchLogs: async (query = {}) => {
    set({ loading: true });
    try {
      const params = new URLSearchParams(query).toString();
      const response = await api.get(`/timelogs?${params}`);
      set({ logs: response.data.data.timeLogs, loading: false });
    } catch (err) {
      set({ loading: false });
    }
  }
}));
