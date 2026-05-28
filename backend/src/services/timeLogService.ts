import timeLogRepository from '../repositories/timeLogRepository.js';
import taskRepository from '../repositories/taskRepository.js';
import { AppError } from '../utils/appError.js';

class TimeLogService {
  async startTimer(userId, taskId, description, isBillable = true) {
    // Validate task exists
    const task = await taskRepository.findById(taskId);
    if (!task) {
      throw new AppError('Task not found', 404);
    }

    // Check if there is already an active timer for this user
    const activeTimer = await timeLogRepository.findActiveTimer(userId);
    if (activeTimer) {
      // Auto-stop previous timer to prevent overlapping logs
      await this.stopTimer(userId);
    }

    const newLog = await timeLogRepository.create({
      task: taskId,
      user: userId,
      startTime: new Date(),
      description,
      isBillable
    });

    return newLog;
  }

  async stopTimer(userId) {
    const activeTimer = await timeLogRepository.findActiveTimer(userId);
    if (!activeTimer) {
      throw new AppError('No active timer running for this user', 400);
    }

    const endTime = new Date();
    const duration = Math.max(1, Math.round((new Date(endTime).getTime() - new Date(activeTimer.startTime).getTime()) / 60000)); // in minutes (minimum 1 minute)

    const updatedLog = await timeLogRepository.update(activeTimer._id, {
      endTime,
      duration
    });

    // Update actualHours in the Task document
    if (activeTimer.task) {
      await this.recalculateTaskActualHours(activeTimer.task._id);
    }

    return updatedLog;
  }

  async getActiveTimer(userId) {
    return await timeLogRepository.findActiveTimer(userId);
  }

  async logTimeManual(userId, manualData) {
    const { taskId, startTime, endTime, description, isBillable = true } = manualData;

    const task = await taskRepository.findById(taskId);
    if (!task) {
      throw new AppError('Task not found', 404);
    }

    const start = new Date(startTime);
    const end = new Date(endTime);

    if (end <= start) {
      throw new AppError('End time must be after start time', 400);
    }

    const duration = Math.max(1, Math.round((new Date(end as any).getTime() - new Date(start as any).getTime()) / 60000)); // in minutes

    const log = await timeLogRepository.create({
      task: taskId,
      user: userId,
      startTime: start,
      endTime: end,
      duration,
      description,
      isBillable
    });

    // Update actualHours in the Task document
    await this.recalculateTaskActualHours(taskId);

    return log;
  }

  async recalculateTaskActualHours(taskId) {
    try {
      const { items } = await timeLogRepository.findAll({ task: taskId });
      const totalMinutes = items.reduce((sum, log) => sum + (log.duration || 0), 0);
      const actualHours = parseFloat((totalMinutes / 60).toFixed(2));
      await taskRepository.update(taskId, { actualHours });
    } catch (err) {
      console.error(`Error recalculating actual hours for task ${taskId}: ${err.message}`);
    }
  }

  async listTimeLogs(query, userId) {
    const filter: Record<string, any> = {};
    
    // Default to listing current user's logs, unless query.all is set and user is Admin/PM
    if (query.user) {
      filter.user = query.user;
    } else if (!query.all) {
      filter.user = userId;
    }

    if (query.task) {
      filter.task = query.task;
    }

    if (query.project) {
      // Find tasks belonging to this project first
      const { items } = await taskRepository.findAll({ project: query.project });
      const taskIds = items.map(t => t._id);
      filter.task = { $in: taskIds };
    }

    const options = {
      page: parseInt(query.page, 10) || 1,
      limit: parseInt(query.limit, 10) || 50,
      sort: query.sort || '-startTime'
    };

    return await timeLogRepository.findAll(filter, options);
  }
}

export default new TimeLogService();
