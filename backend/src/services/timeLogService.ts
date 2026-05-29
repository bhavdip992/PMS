import timeLogRepository from '../repositories/timeLogRepository.js';
import taskRepository from '../repositories/taskRepository.js';
import subtaskRepository from '../repositories/subtaskRepository.js';
import { AppError } from '../utils/appError.js';

class TimeLogService {
  async startTimer(userId, taskId, description, isBillable = true) {
    // Validate task or subtask exists
    let task = await taskRepository.findById(taskId);
    let subtask = null;
    if (!task) {
      subtask = await subtaskRepository.findById(taskId);
      if (!subtask) {
        throw new AppError('Task or Subtask not found', 404);
      }
    }

    // Check if there is already an active timer for this user
    const activeTimer = await timeLogRepository.findActiveTimer(userId);
    if (activeTimer) {
      // Auto-stop previous timer to prevent overlapping logs
      await this.stopTimer(userId);
    }

    const logData: any = {
      user: userId,
      startTime: new Date(),
      description,
      isBillable
    };

    if (task) {
      logData.task = taskId;
    } else {
      logData.subtask = taskId;
    }

    const newLog = await timeLogRepository.create(logData);
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

    // Update actualHours in the Task/Subtask document
    if (activeTimer.task) {
      await this.recalculateTaskActualHours(activeTimer.task._id);
    } else if (activeTimer.subtask) {
      await this.recalculateSubtaskActualHours(activeTimer.subtask._id);
    }

    return updatedLog;
  }

  async getActiveTimer(userId) {
    return await timeLogRepository.findActiveTimer(userId);
  }

  async logTimeManual(userId, manualData) {
    const { taskId, startTime, endTime, description, isBillable = true } = manualData;

    let task = await taskRepository.findById(taskId);
    let subtask = null;
    if (!task) {
      subtask = await subtaskRepository.findById(taskId);
      if (!subtask) {
        throw new AppError('Task or Subtask not found', 404);
      }
    }

    const start = new Date(startTime);
    const end = new Date(endTime);

    if (end <= start) {
      throw new AppError('End time must be after start time', 400);
    }

    const duration = Math.max(1, Math.round((new Date(end as any).getTime() - new Date(start as any).getTime()) / 60000)); // in minutes

    const logData: any = {
      user: userId,
      startTime: start,
      endTime: end,
      duration,
      description,
      isBillable
    };

    if (task) {
      logData.task = taskId;
    } else {
      logData.subtask = taskId;
    }

    const log = await timeLogRepository.create(logData);

    // Update actualHours in the Task/Subtask document
    if (task) {
      await this.recalculateTaskActualHours(taskId);
    } else {
      await this.recalculateSubtaskActualHours(taskId);
    }

    return log;
  }

  async recalculateTaskActualHours(taskId) {
    try {
      const { items } = await timeLogRepository.findAll({ task: taskId });
      const directMinutes = items.reduce((sum, log) => sum + (log.duration || 0), 0);

      // Also get all subtasks for this task and aggregate their time logs
      const subtasks = await subtaskRepository.findAllByParentTask(taskId);
      let subtasksMinutes = 0;
      for (const sub of subtasks) {
        const { items: sublogs } = await timeLogRepository.findAll({ subtask: sub._id });
        subtasksMinutes += sublogs.reduce((sum, log) => sum + (log.duration || 0), 0);
      }

      const actualHours = parseFloat(((directMinutes + subtasksMinutes) / 60).toFixed(2));
      await taskRepository.update(taskId, { actualHours });
    } catch (err) {
      console.error(`Error recalculating actual hours for task ${taskId}: ${err.message}`);
    }
  }

  async recalculateSubtaskActualHours(subtaskId) {
    try {
      const { items } = await timeLogRepository.findAll({ subtask: subtaskId });
      const totalMinutes = items.reduce((sum, log) => sum + (log.duration || 0), 0);
      const actualHours = parseFloat((totalMinutes / 60).toFixed(2));
      await subtaskRepository.update(subtaskId, { actualHours });

      // Also trigger updating parent task actual hours if subtask is linked
      const subtask = await subtaskRepository.findById(subtaskId);
      if (subtask && subtask.parentTask) {
        await this.recalculateTaskActualHours(subtask.parentTask._id || subtask.parentTask);
      }
    } catch (err) {
      console.error(`Error recalculating actual hours for subtask ${subtaskId}: ${err.message}`);
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
      filter.$or = [
        { task: query.task },
        { subtask: query.task }
      ];
    }

    if (query.subtask) {
      filter.subtask = query.subtask;
    }

    if (query.project) {
      // Find tasks belonging to this project first
      const { items } = await taskRepository.findAll({ project: query.project });
      const taskIds = items.map(t => t._id);
      
      // Find subtasks belonging to these tasks
      const subtaskIds: any[] = [];
      for (const tId of taskIds) {
        const subs = await subtaskRepository.findAllByParentTask(tId);
        subtaskIds.push(...subs.map(s => s._id));
      }

      filter.$or = [
        { task: { $in: taskIds } },
        { subtask: { $in: subtaskIds } }
      ];
    }

    const options = {
      page: parseInt(query.page, 10) || 1,
      limit: parseInt(query.limit, 10) || 50,
      sort: query.sort || '-startTime'
    };

    return await timeLogRepository.findAll(filter, options);
  }

  async deleteTimeLog(id, userId) {
    const log = await timeLogRepository.findById(id);
    if (!log) {
      throw new AppError('Time log not found', 404);
    }

    // Verify ownership or admin role (can bypass role check for simple task owner verification)
    // Note: log.user is populated/raw objectId
    const logUserId = log.user._id || log.user;
    if (logUserId.toString() !== userId.toString()) {
      throw new AppError('Not authorized to delete this time log', 403);
    }

    await timeLogRepository.delete(id);

    // Recalculate actual hours
    if (log.task) {
      await this.recalculateTaskActualHours(log.task._id || log.task);
    } else if (log.subtask) {
      await this.recalculateSubtaskActualHours(log.subtask._id || log.subtask);
    }
  }
}

export default new TimeLogService();
