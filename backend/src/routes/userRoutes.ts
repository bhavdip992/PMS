import express from 'express';
import {
  listUsers,
  createUser,
  updateUser,
  toggleUserActive,
  resetUserPassword,
  deleteUser,
  getUserSessions,
  getLoginHistory,
} from '../controllers/userController.js';
import { protect, restrictTo } from '../middlewares/authMiddleware.js';

const router = express.Router();

// All user management routes require authentication + Super Admin role
router.use(protect);
router.route('/')
  .get(listUsers)
  .post(restrictTo('Super Admin'), createUser);

router.route('/:id')
  .put(restrictTo('Super Admin'), updateUser)
  .delete(restrictTo('Super Admin'), deleteUser);

router.put('/:id/toggle-active', restrictTo('Super Admin'), toggleUserActive);
router.put('/:id/reset-password', restrictTo('Super Admin'), resetUserPassword);
router.get('/:id/sessions', restrictTo('Super Admin'), getUserSessions);
router.get('/:id/login-history', restrictTo('Super Admin'), getLoginHistory);

export default router;
