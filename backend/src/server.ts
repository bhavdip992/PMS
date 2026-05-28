import 'dotenv/config';
import http from 'http';
import { Server as SocketIOServer } from 'socket.io';
import app from './app.js';
import { connectDB } from './config/db.js';
import { initSocket } from './socket/socketService.js';

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  console.error('UNCAUGHT EXCEPTION! 💥 Shutting down...');
  console.error((err as Error).name, (err as Error).message, (err as Error).stack);
  process.exit(1);
});

// Connect to Database
connectDB();

const port = Number(process.env.PORT) || 5000;
const server = http.createServer(app);

// Initialize Socket.IO
const io = new SocketIOServer(server, {
  cors: {
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    credentials: true,
  },
});

// Initialize socket manager singleton
initSocket(io);

// Store io in app settings to make it accessible in controllers/services
app.set('io', io);

// Basic Socket connection setup
io.on('connection', (socket) => {
  console.log(`Socket connected: ${socket.id}`);

  // Authenticate socket using token if passed
  socket.on('authenticate', (userId) => {
    socket.join(userId);
    console.log(`Socket ${socket.id} joined room for user: ${userId}`);
  });

  socket.on('disconnect', () => {
    console.log(`Socket disconnected: ${socket.id}`);
  });
});

const activeServer = server.listen(port, () => {
  console.log(`App running on port ${port} in ${process.env.NODE_ENV} mode...`);
});

// Handle unhandled rejections
process.on('unhandledRejection', (err) => {
  console.error('UNHANDLED REJECTION! 💥 Shutting down...');
  console.error((err as Error).name, (err as Error).message);
  activeServer.close(() => {
    process.exit(1);
  });
});
