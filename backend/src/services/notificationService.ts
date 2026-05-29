import notificationRepository from '../repositories/notificationRepository.js';
import { emitToUser } from '../socket/socketService.js';
import { AppError } from '../utils/appError.js';
import User from '../models/user.js';
import emailService from './emailService.js';
import { PRIORITY_MAP } from '../models/notification.js';

class NotificationService {
  /**
   * Create a notification, emit it via Socket.IO, and optionally send email.
   * Priority is auto-resolved from the notification type unless explicitly set.
   */
  async createNotification(notificationData: any) {
    // Auto-set channel default
    if (!notificationData.channel) {
      notificationData.channel = ['inApp'];
    }

    // Auto-resolve priority from type if not provided
    if (!notificationData.priority && notificationData.type) {
      notificationData.priority = PRIORITY_MAP[notificationData.type as keyof typeof PRIORITY_MAP] ?? 'medium';
    }

    const notification = await notificationRepository.create(notificationData);
    const populated = await notification.populate('sender', 'name avatar');

    const recipientUser = await User.findById(notification.recipient);
    if (recipientUser) {
      // Emit via Socket.IO (in-app + OS desktop on client side)
      if (recipientUser.notificationPreferences?.inApp !== false) {
        emitToUser(notification.recipient.toString(), 'notification', populated);
      }

      // Send email if configured
      const hasEmailChannel = notification.channel.includes('email');
      const userAllowsEmail = recipientUser.notificationPreferences?.email !== false;
      if (hasEmailChannel && userAllowsEmail) {
        await emailService.sendEmail({
          to: recipientUser.email,
          subject: `esparkPM Alert: ${notification.title}`,
          text: notification.message,
          html: `
            <div style="font-family: sans-serif; padding: 20px; color: #333;">
              <h2>esparkPM Notification</h2>
              <p><strong>${notification.title}</strong></p>
              <p>${notification.message}</p>
              ${notification.link ? `<p><a href="${process.env.CLIENT_URL || 'http://localhost:5173'}${notification.link}" style="display:inline-block;padding:8px 16px;background:#2563EB;color:white;text-decoration:none;border-radius:4px;">View in esparkPM</a></p>` : ''}
            </div>
          `
        }).catch((err: any) => console.error('Failed to send email notification:', err));
      }
    }

    return populated;
  }

  /**
   * Notify a list of user IDs for the same event. De-duplicates automatically.
   * Skips the actor (userId) to avoid self-notification.
   */
  async notifyMany(
    recipientIds: string[],
    actorId: string,
    payload: Omit<any, 'recipient' | 'sender'>
  ) {
    const unique = [...new Set(recipientIds.filter(id => id !== actorId))];
    await Promise.allSettled(
      unique.map(id =>
        this.createNotification({ ...payload, recipient: id, sender: actorId })
      )
    );
  }

  /**
   * Fetch all Super Admin user IDs (cached per call — DB call is lightweight).
   */
  async getSuperAdminIds(): Promise<string[]> {
    const admins = await User.find({ role: 'Super Admin', isActive: true }).select('_id').lean();
    return (admins as any[]).map(a => a._id.toString());
  }

  async getNotificationsForUser(userId: string, query: any) {
    const options = {
      page: parseInt(query.page, 10) || 1,
      limit: parseInt(query.limit, 10) || 50,
      sort: query.sort || '-createdAt'
    };
    return await notificationRepository.findAllForUser(userId, options);
  }

  async markAsRead(id: string, userId: string) {
    const notification = await notificationRepository.markAsRead(id, userId);
    if (!notification) throw new AppError('Notification not found', 404);
    return notification;
  }

  async markAllAsRead(userId: string) {
    await notificationRepository.markAllAsRead(userId);
    return { message: 'All notifications marked as read' };
  }

  async deleteNotification(id: string, userId: string) {
    const notification = await notificationRepository.delete(id, userId);
    if (!notification) throw new AppError('Notification not found', 404);
    return notification;
  }

  async getPreferences(userId: string) {
    const user = await User.findById(userId);
    if (!user) throw new AppError('User not found', 404);
    return user.notificationPreferences || { inApp: true, email: true, popups: true };
  }

  async updatePreferences(userId: string, preferences: any) {
    const user = await User.findByIdAndUpdate(
      userId,
      { notificationPreferences: preferences },
      { new: true, runValidators: true }
    );
    if (!user) throw new AppError('User not found', 404);
    return user.notificationPreferences;
  }
}

export default new NotificationService();
