import { Server, Socket } from 'socket.io';
import { verifyAccessToken } from '../utils/jwt.js';
import User from '../models/user.js';
import Notification from '../models/notification.js';

let io: Server | null = null;

const parseCookies = (cookieString: string): Record<string, string> => {
  const list: Record<string, string> = {};
  if (!cookieString) return list;
  cookieString.split(';').forEach(cookie => {
    const parts = cookie.split('=');
    const name = parts.shift()?.trim();
    if (name) {
      list[name] = decodeURIComponent(parts.join('='));
    }
  });
  return list;
};

export const initSocket = (socketIoInstance: Server): void => {
  io = socketIoInstance;

  io.on('connection', async (socket: Socket) => {
    console.log(`Socket connected: ${socket.id}`);

    try {
      const cookieHeader = socket.handshake.headers.cookie || '';
      const cookies = parseCookies(cookieHeader);
      const token = cookies.accessToken || (socket.handshake.auth?.token as string);

      if (!token) {
        console.warn(`Unauthorized socket connection attempt (no token): ${socket.id}`);
        socket.disconnect(true);
        return;
      }

      const decoded = verifyAccessToken(token);
      const user = await User.findById(decoded.id);

      if (!user || !user.isActive) {
        console.warn(`Unauthorized socket connection attempt (invalid/inactive user): ${socket.id}`);
        socket.disconnect(true);
        return;
      }

      const userId = user._id.toString();
      const role = user.role;

      // Join user specific room
      socket.join(userId);
      console.log(`Socket ${socket.id} joined room for user: ${userId}`);

      // Join role specific room
      socket.join(role);
      console.log(`Socket ${socket.id} joined room for role: ${role}`);

      // Join admin specific room if Admin / Super Admin
      if (role === 'Admin' || role === 'Super Admin') {
        socket.join('admin');
        console.log(`Socket ${socket.id} joined room: admin`);
      }

      // Sync missed notifications since lastSeenAt
      const lastSeenAtStr = socket.handshake.query.lastSeenAt as string;
      if (lastSeenAtStr) {
        const lastSeenDate = new Date(lastSeenAtStr);
        if (!isNaN(lastSeenDate.getTime())) {
          const missedNotifications = await Notification.find({
            recipient: userId,
            createdAt: { $gt: lastSeenDate }
          }).populate('sender', 'name avatar').sort({ createdAt: 1 });

          missedNotifications.forEach(notif => {
            socket.emit('notification', notif);
          });
        }
      }

      // Listen for explicit client side sync events
      socket.on('sync_notifications', async (data: { lastSeenAt?: string }) => {
        if (data?.lastSeenAt) {
          const lastSeenDate = new Date(data.lastSeenAt);
          if (!isNaN(lastSeenDate.getTime())) {
            const missedNotifications = await Notification.find({
              recipient: userId,
              createdAt: { $gt: lastSeenDate }
            }).populate('sender', 'name avatar').sort({ createdAt: 1 });

            missedNotifications.forEach(notif => {
              socket.emit('notification', notif);
            });
          }
        }
      });

      socket.on('disconnect', async () => {
        console.log(`Socket disconnected: ${socket.id}`);
        try {
          await User.findByIdAndUpdate(userId, { lastSeenAt: new Date() });
        } catch (err) {
          console.error(`Failed to update user lastSeenAt: ${err}`);
        }
      });

    } catch (err) {
      console.error(`Socket connection authentication error: ${err}`);
      socket.disconnect(true);
    }
  });
};

export const getIO = (): Server | null => {
  return io;
};

export const emitToUser = (userId: string, event: string, data: unknown): void => {
  if (io) {
    io.to(userId.toString()).emit(event, data);
  } else {
    console.warn(`Socket.IO not initialized. Cannot emit: ${event}`);
  }
};

export const emitToRole = (role: string, event: string, data: unknown): void => {
  if (io) {
    io.to(role).emit(event, data);
  } else {
    console.warn(`Socket.IO not initialized. Cannot emit: ${event}`);
  }
};
