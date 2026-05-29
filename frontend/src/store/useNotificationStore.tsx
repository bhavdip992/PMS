/**
 * useNotificationStore.tsx
 *
 * Zustand store powering esparkPM's real-time notification pipeline.
 *
 * Architecture:
 *  ┌──────────────────────────────────────────────────────┐
 *  │  Socket.IO server  ──►  'notification' event         │
 *  │                                                      │
 *  │  Tab VISIBLE  →  in-app toast (via activeToast)      │
 *  │  Tab HIDDEN   →  OS desktop notification             │
 *  └──────────────────────────────────────────────────────┘
 *
 * The actual OS-level notification logic lives in
 * `services/desktopNotification.ts` and is imported here.
 */

import { create } from 'zustand';
import { io } from 'socket.io-client';
import api from '../services/api.tsx';
import {
  showDesktopNotification,
} from '../services/desktopNotification';

// ─── Types ────────────────────────────────────────────────────────────────────

interface NotificationPayload {
  _id: string;
  title: string;
  message: string;
  link?: string;
  actionUrl?: string;
  type?: string;
  isRead: boolean;
  createdAt: string;
}

// ─── Store ────────────────────────────────────────────────────────────────────

export const useNotificationStore = create((set, get) => ({
  socket: null as any,
  notifications: [] as NotificationPayload[],
  unreadCount: 0,
  activeToast: null as NotificationPayload | null,

  setActiveToast: (toast: any) => set({ activeToast: toast }),

  // ── initSocket ─────────────────────────────────────────────────────────────
  initSocket: (userId: string) => {
    // Prevent multiple socket instances
    if ((get() as any).socket) return;

    // ── 1. Permission ─────────────────────────────────────────────────────────
    // Note: actual permission request is triggered by the user clicking
    // "Enable Notifications" in Inbox → Delivery Preferences (real gesture).
    // We only do a silent check here — won't prompt the browser.

    // ── 2. Socket connection ──────────────────────────────────────────────────
    const socketUrl =
      (import.meta as any).env.VITE_SOCKET_URL || 'http://localhost:5000';

    const lastSeen =
      localStorage.getItem('notification_last_seen') || new Date().toISOString();

    // accessToken lives in Zustand memory — expose it so the socket handshake
    // can pass it to the server for authentication (server checks cookies.accessToken
    // OR socket.handshake.auth.token)
    const accessToken = localStorage.getItem('espark_access_token') || '';

    const socketInstance = io(socketUrl, {
      withCredentials: true,
      auth: { token: accessToken },
      query: { lastSeenAt: lastSeen },
    });

    // ── 3. Socket lifecycle ───────────────────────────────────────────────────
    socketInstance.on('connect', () => {
      console.log('[esparkPM] Socket connected:', socketInstance.id);

      // Sync missed notifications since last visit
      const storedLastSeen = localStorage.getItem('notification_last_seen');
      if (storedLastSeen) {
        socketInstance.emit('sync_notifications', { lastSeenAt: storedLastSeen });
      }

      localStorage.setItem('notification_last_seen', new Date().toISOString());
    });

    socketInstance.on('disconnect', (reason: string) => {
      console.log('[esparkPM] Socket disconnected:', reason);
    });

    socketInstance.on('connect_error', (err: Error) => {
      console.warn('[esparkPM] Socket connection error:', err.message);
    });

    // ── 4. Incoming notifications ─────────────────────────────────────────────
    socketInstance.on('notification', (notification: NotificationPayload) => {
      localStorage.setItem('notification_last_seen', new Date().toISOString());

      // Always fire OS-level desktop notification for every incoming event.
      // The browser will show it in the system tray / notification center
      // regardless of whether the PMS tab is active or hidden.
      showDesktopNotification(notification);

      // ── State update (deduplicated) ─────────────────────────────────────────
      set((state: any) => {
        const exists = state.notifications.some(
          (n: any) => n._id === notification._id
        );
        if (exists) return {};

        return {
          notifications: [notification, ...state.notifications],
          unreadCount: state.unreadCount + 1,
          // Always set the in-app toast – DashboardLayout decides whether
          // to display it (it is always shown regardless of tab state)
          activeToast: notification,
        };
      });
    });

    set({ socket: socketInstance });
  },

  // ── disconnectSocket ────────────────────────────────────────────────────────
  disconnectSocket: () => {
    const socket = (get() as any).socket;
    if (socket) {
      socket.disconnect();
      set({ socket: null });
    }
  },

  // ── fetchNotifications ──────────────────────────────────────────────────────
  fetchNotifications: async () => {
    try {
      const response = await api.get('/notifications');
      const list: NotificationPayload[] =
        response.data.data.notifications || [];
      const unread = list.filter((n) => !n.isRead).length;
      set({ notifications: list, unreadCount: unread });
      localStorage.setItem('notification_last_seen', new Date().toISOString());
    } catch (err) {
      console.error('[esparkPM] Failed to fetch notifications:', err);
    }
  },

  // ── markAsRead ──────────────────────────────────────────────────────────────
  markAsRead: async (id: string) => {
    try {
      await api.patch(`/notifications/${id}/read`);
      set((state: any) => ({
        notifications: state.notifications.map((n: any) =>
          n._id === id ? { ...n, isRead: true } : n
        ),
        unreadCount: Math.max(0, state.unreadCount - 1),
      }));
    } catch (err) {
      console.error('[esparkPM] Failed to mark notification as read:', err);
    }
  },

  // ── markAllAsRead ───────────────────────────────────────────────────────────
  markAllAsRead: async () => {
    try {
      await api.patch('/notifications/read-all');
      set((state: any) => ({
        notifications: state.notifications.map((n: any) => ({
          ...n,
          isRead: true,
        })),
        unreadCount: 0,
      }));
    } catch (err) {
      console.error('[esparkPM] Failed to mark all notifications as read:', err);
    }
  },

  // ── deleteNotification ──────────────────────────────────────────────────────
  deleteNotification: async (id: string) => {
    try {
      await api.delete(`/notifications/${id}`);
      set((state: any) => {
        const wasUnread = !state.notifications.find(
          (n: any) => n._id === id
        )?.isRead;
        return {
          notifications: state.notifications.filter(
            (n: any) => n._id !== id
          ),
          unreadCount: wasUnread
            ? Math.max(0, state.unreadCount - 1)
            : state.unreadCount,
        };
      });
    } catch (err) {
      console.error('[esparkPM] Failed to delete notification:', err);
    }
  },
}));
