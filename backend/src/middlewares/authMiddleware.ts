import mongoose from 'mongoose';
import { Request, Response, NextFunction } from 'express';
import { verifyAccessToken } from '../utils/jwt.js';
import userRepository from '../repositories/userRepository.js';
import { AppError } from '../utils/appError.js';
import { UserRole } from '../types/index.js';
import AuditLog from '../models/auditLog.js';

export const protect = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    let token: string | undefined;

    if (req.headers.authorization?.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    } else if (req.cookies?.accessToken) {
      token = req.cookies.accessToken;
    }

    if (!token) {
      return next(new AppError('You are not logged in. Please log in to get access.', 401));
    }

    let decoded;
    try {
      decoded = verifyAccessToken(token);
    } catch {
      return next(new AppError('Invalid or expired token. Please log in again.', 401));
    }

    const currentUser = await userRepository.findById(decoded.id);
    if (!currentUser) {
      return next(new AppError('The user belonging to this token no longer exists.', 401));
    }

    if (!currentUser.isActive) {
      return next(new AppError('This user account is suspended.', 403));
    }

    req.user = currentUser;
    next();
  } catch (error) {
    next(error);
  }
};

export const restrictTo = (...roles: UserRole[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user || !roles.includes(req.user.role)) {
      return next(new AppError('You do not have permission to perform this action', 403));
    }
    next();
  };
};

export const verifyOwnershipOrRole = (modelType: 'Project' | 'Task') => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const userId = req.user?._id;
    const userRole = req.user?.role;
    const resourceId = req.params.id || req.body.project || req.query.project;

    if (['Super Admin', 'Admin', 'Project Manager'].includes(userRole || '')) {
      return next();
    }

    if (!resourceId) {
      return next(new AppError('Resource ID is required for ownership verification', 400));
    }

    try {
      if (modelType === 'Project') {
        const Project = mongoose.model('Project');
        const project = await Project.findById(resourceId);
        if (!project) return next(new AppError('Project not found', 404));
        const isMember = project.members?.some((id: mongoose.Types.ObjectId) => id.equals(userId));
        if (!isMember) return next(new AppError('Access denied: You are not assigned to this project', 403));
      } else if (modelType === 'Task') {
        const Task = mongoose.model('Task');
        const task = await Task.findById(resourceId).populate('project');
        if (!task) return next(new AppError('Task not found', 404));
        const isAssigned = task.assignees?.some((id: mongoose.Types.ObjectId) => id.equals(userId));
        const isProjectMember = task.project?.members?.some((id: mongoose.Types.ObjectId) => id.equals(userId));
        if (!isAssigned && !isProjectMember) return next(new AppError('Access denied', 403));
      }
      next();
    } catch (err) {
      next(err);
    }
  };
};

export const trackDevice = (req: Request, res: Response, next: NextFunction): void => {
  const userAgentString = req.headers['user-agent'] || '';
  const ipAddress = (req.headers['x-forwarded-for'] as string || req.socket.remoteAddress || '').split(',')[0].trim();

  let browser = 'Unknown';
  let os = 'Unknown';
  let device = 'Desktop';

  if (/mobile/i.test(userAgentString)) device = 'Mobile';
  if (/tablet/i.test(userAgentString)) device = 'Tablet';

  if (/chrome|crios/i.test(userAgentString)) browser = 'Chrome';
  else if (/firefox|iceweasel/i.test(userAgentString)) browser = 'Firefox';
  else if (/safari/i.test(userAgentString) && !/chrome/i.test(userAgentString)) browser = 'Safari';
  else if (/msie|trident/i.test(userAgentString)) browser = 'IE';
  else if (/edge/i.test(userAgentString)) browser = 'Edge';

  if (/windows/i.test(userAgentString)) os = 'Windows';
  else if (/macintosh|mac os x/i.test(userAgentString)) os = 'macOS';
  else if (/linux/i.test(userAgentString)) os = 'Linux';
  else if (/android/i.test(userAgentString)) os = 'Android';
  else if (/iphone|ipad|ipod/i.test(userAgentString)) os = 'iOS';

  req.deviceInfo = {
    ipAddress,
    userAgent: userAgentString,
    device,
    browser,
    os
  };
  next();
};

export const auditLog = (action: string, resource: string, severity: 'low' | 'medium' | 'high' | 'critical' = 'low') => {
  return (req: Request, res: Response, next: NextFunction): void => {
    res.on('finish', async () => {
      if (res.statusCode >= 200 && res.statusCode < 300) {
        try {
          const userId = req.user?._id;
          const ipAddress = req.deviceInfo?.ipAddress || req.ip;
          const resourceId = req.params.id || req.body._id;
          
          await AuditLog.create({
            userId,
            action,
            resource,
            resourceId,
            ipAddress,
            severity,
            timestamp: new Date()
          });
        } catch (err) {
          console.error('Audit log creation failed:', err);
        }
      }
    });
    next();
  };
};
