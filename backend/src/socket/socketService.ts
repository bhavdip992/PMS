import { Server } from 'socket.io';

let io: Server | null = null;

export const initSocket = (socketIoInstance: Server): void => {
  io = socketIoInstance;
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
