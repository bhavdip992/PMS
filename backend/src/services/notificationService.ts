import notificationRepository from '../repositories/notificationRepository.js';
import { emitToUser } from '../socket/socketService.js';
import { AppError } from '../utils/appError.js';

class NotificationService {
  async createNotification(notificationData) {
    const notification = await notificationRepository.create(notificationData);
    
    // Broadcast via socket room
    const populated = await notification.populate('sender', 'name avatar');
    emitToUser(notification.recipient.toString(), 'notification', populated);
    
    return populated;
  }

  async getNotificationsForUser(userId, query) {
    const options = {
      page: parseInt(query.page, 10) || 1,
      limit: parseInt(query.limit, 10) || 50,
      sort: query.sort || '-createdAt'
    };
    return await notificationRepository.findAllForUser(userId, options);
  }

  async markAsRead(id, userId) {
    const notification = await notificationRepository.markAsRead(id, userId);
    if (!notification) {
      throw new AppError('Notification not found', 404);
    }
    return notification;
  }

  async markAllAsRead(userId) {
    await notificationRepository.markAllAsRead(userId);
    return { message: 'All notifications marked as read' };
  }
}

export default new NotificationService();
