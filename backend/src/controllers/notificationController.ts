import notificationService from '../services/notificationService.js';

export const getMyNotifications = async (req, res, next) => {
  try {
    const { items, total, page, limit } = await notificationService.getNotificationsForUser(req.user._id, req.query);
    res.status(200).json({
      status: 'success',
      results: items.length,
      total,
      page,
      limit,
      data: { notifications: items }
    });
  } catch (error) {
    next(error);
  }
};

export const markAsRead = async (req, res, next) => {
  try {
    const notification = await notificationService.markAsRead(req.params.id, req.user._id);
    res.status(200).json({
      status: 'success',
      data: { notification }
    });
  } catch (error) {
    next(error);
  }
};

export const markAllAsRead = async (req, res, next) => {
  try {
    const result = await notificationService.markAllAsRead(req.user._id);
    res.status(200).json({
      status: 'success',
      message: result.message
    });
  } catch (error) {
    next(error);
  }
};
