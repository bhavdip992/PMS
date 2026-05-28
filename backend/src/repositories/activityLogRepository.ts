import { QueryOptions } from '../types/index.js';
import ActivityLog from '../models/activityLog.js';

class ActivityLogRepository {
  async create(logData) {
    return await ActivityLog.create(logData);
  }

  async findByTaskId(taskId) {
    return await ActivityLog.find({ task: taskId })
      .populate('user', 'name role avatar')
      .sort({ createdAt: -1 });
  }

  async findByProjectId(projectId, limit = 50) {
    return await ActivityLog.find({ project: projectId })
      .populate('user', 'name role avatar')
      .populate('task', 'title')
      .sort({ createdAt: -1 })
      .limit(limit);
  }
}

export default new ActivityLogRepository();
