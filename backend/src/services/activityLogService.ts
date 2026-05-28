import activityLogRepository from '../repositories/activityLogRepository.js';

class ActivityLogService {
  async getActivitiesForTask(taskId) {
    return await activityLogRepository.findByTaskId(taskId);
  }

  async getActivitiesForProject(projectId, queryOptions = {}) {
    const limit = parseInt((queryOptions as any).limit, 10) || 50;
    return await activityLogRepository.findByProjectId(projectId, limit);
  }
}

export default new ActivityLogService();
