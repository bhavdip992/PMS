import express from 'express';
import { 
  getMyNotifications, 
  markAsRead, 
  markAllAsRead,
  deleteNotification,
  getNotificationPreferences,
  updateNotificationPreferences
} from '../controllers/notificationController.js';
import { protect } from '../middlewares/authMiddleware.js';

const router = express.Router();

router.use(protect);

router.route('/')
  .get(getMyNotifications);

router.route('/read-all')
  .patch(markAllAsRead);

router.route('/preferences')
  .get(getNotificationPreferences)
  .patch(updateNotificationPreferences);

router.route('/:id')
  .delete(deleteNotification);

router.route('/:id/read')
  .patch(markAsRead);

export default router;
