import { create } from 'zustand';
import { io } from 'socket.io-client';
import api from '../services/api.tsx';

export const useNotificationStore = create((set, get) => ({
  socket: null,
  notifications: [],
  unreadCount: 0,
  activeToast: null,

  setActiveToast: (toast) => set({ activeToast: toast }),

  initSocket: (userId) => {
    if ((get() as any).socket) return;

    const socketUrl = (import.meta as any).env.VITE_SOCKET_URL || 'http://localhost:5000';
    const socketInstance = io(socketUrl, {
      withCredentials: true
    });

    socketInstance.on('connect', () => {
      console.log('Socket client connected:', socketInstance.id);
      socketInstance.emit('authenticate', userId);
    });

    socketInstance.on('notification', (notification) => {
      set((state) => {
        const updated = [notification, ...state.notifications];
        return {
          notifications: updated,
          unreadCount: state.unreadCount + 1,
          activeToast: notification
        };
      });
    });

    set({ socket: socketInstance });
  },

  disconnectSocket: () => {
    const socket = (get() as any).socket;
    if (socket) {
      socket.disconnect();
      set({ socket: null });
    }
  },

  fetchNotifications: async () => {
    try {
      const response = await api.get('/notifications');
      const list = response.data.data.notifications;
      const unread = list.filter(n => !n.isRead).length;
      set({ notifications: list, unreadCount: unread });
    } catch (err) {
      console.error('Failed to fetch notifications:', err);
    }
  },

  markAsRead: async (id) => {
    try {
      await api.patch(`/notifications/${id}/read`);
      set((state) => {
        const updated = state.notifications.map(n =>
          n._id === id ? { ...n, isRead: true } : n
        );
        return {
          notifications: updated,
          unreadCount: Math.max(0, state.unreadCount - 1)
        };
      });
    } catch (err) {
      console.error('Failed to mark notification as read:', err);
    }
  },

  markAllAsRead: async () => {
    try {
      await api.put('/notifications');
      set((state) => {
        const updated = state.notifications.map(n => ({ ...n, isRead: true }));
        return {
          notifications: updated,
          unreadCount: 0
        };
      });
    } catch (err) {
      console.error('Failed to mark all notifications as read:', err);
    }
  }
}));
