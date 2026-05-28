import express from 'express';
import { 
  register, 
  login, 
  refresh, 
  logout, 
  logoutAllDevices, 
  forgotPassword, 
  resetPassword, 
  getActiveSessions, 
  revokeSession, 
  getMe, 
  updateMe 
} from '../controllers/authController.js';
import { protect, restrictTo, trackDevice, auditLog } from '../middlewares/authMiddleware.js';

const router = express.Router();

// Public routes
router.post('/login', trackDevice, auditLog('Login Attempt', 'User', 'low'), login);
router.post('/refresh', trackDevice, refresh);
router.post('/logout', logout);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password/:token', auditLog('Reset Password', 'User', 'medium'), resetPassword);

// Protected routes
router.get('/me', protect, getMe);
router.put('/me', protect, updateMe);
router.post('/logout-all', protect, auditLog('Logout All Devices', 'User', 'low'), logoutAllDevices);
router.get('/sessions', protect, getActiveSessions);
router.delete('/sessions/:sessionId', protect, auditLog('Revoke Session', 'Session', 'low'), revokeSession);

// Register is now restricted to Super Admin only (user creation from admin panel)
router.post('/register', protect, restrictTo('Super Admin'), auditLog('Create User', 'User', 'medium'), register);

export default router;
