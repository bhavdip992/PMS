import { Request, Response, NextFunction } from 'express';
import notificationService from '../services/notificationService.js';

export const getMyNotifications = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!._id.toString();
    const { items, total, page, limit } = await notificationService.getNotificationsForUser(userId, req.query);
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

export const markAsRead = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!._id.toString();
    const notification = await notificationService.markAsRead(req.params.id as string, userId);
    res.status(200).json({
      status: 'success',
      data: { notification }
    });
  } catch (error) {
    next(error);
  }
};

export const markAllAsRead = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!._id.toString();
    const result = await notificationService.markAllAsRead(userId);
    res.status(200).json({
      status: 'success',
      message: result.message
    });
  } catch (error) {
    next(error);
  }
};

export const deleteNotification = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!._id.toString();
    await notificationService.deleteNotification(req.params.id as string, userId);
    res.status(204).json({
      status: 'success',
      data: null
    });
  } catch (error) {
    next(error);
  }
};

export const getNotificationPreferences = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!._id.toString();
    const preferences = await notificationService.getPreferences(userId);
    res.status(200).json({
      status: 'success',
      data: { preferences }
    });
  } catch (error) {
    next(error);
  }
};

export const updateNotificationPreferences = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!._id.toString();
    const preferences = await notificationService.updatePreferences(userId, req.body);
    res.status(200).json({
      status: 'success',
      data: { preferences }
    });
  } catch (error) {
    next(error);
  }
};
