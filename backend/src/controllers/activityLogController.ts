import activityLogService from '../services/activityLogService.js';

export const getTaskActivities = async (req, res, next) => {
  try {
    const activities = await activityLogService.getActivitiesForTask(req.params.id);
    res.status(200).json({
      status: 'success',
      results: activities.length,
      data: { activities }
    });
  } catch (error) {
    next(error);
  }
};

export const getProjectActivities = async (req, res, next) => {
  try {
    const activities = await activityLogService.getActivitiesForProject(req.params.id, req.query);
    res.status(200).json({
      status: 'success',
      results: activities.length,
      data: { activities }
    });
  } catch (error) {
    next(error);
  }
};
