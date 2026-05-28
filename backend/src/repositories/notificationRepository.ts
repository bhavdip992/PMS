import { QueryOptions } from '../types/index.js';
import Notification from '../models/notification.js';

class NotificationRepository {
  async create(data) {
    return await Notification.create(data);
  }

  async findAllForUser(recipientId: string, options: any = {}) {
    const { page = 1, limit = 50, sort = '-createdAt' } = options;
    const skip = (page - 1) * limit;

    const items = await Notification.find({ recipient: recipientId })
      .sort(sort)
      .skip(skip)
      .limit(Number(limit))
      .populate('sender', 'name avatar');

    const total = await Notification.countDocuments({ recipient: recipientId });

    return { items, total, page, limit };
  }

  async markAsRead(id, recipientId) {
    return await Notification.findOneAndUpdate(
      { _id: id, recipient: recipientId },
      { isRead: true },
      { new: true }
    );
  }

  async markAllAsRead(recipientId) {
    return await Notification.updateMany(
      { recipient: recipientId, isRead: false },
      { isRead: true }
    );
  }
}

export default new NotificationRepository();
