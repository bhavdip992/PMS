import express from 'express';
import { 
  getMyNotifications, 
  markAsRead, 
  markAllAsRead 
} from '../controllers/notificationController.js';
import { protect } from '../middlewares/authMiddleware.js';

const router = express.Router();

router.use(protect);

router.route('/')
  .get(getMyNotifications)
  .put(markAllAsRead);

router.route('/:id/read')
  .patch(markAsRead);

export default router;
