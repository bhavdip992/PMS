import dashboardService from '../services/dashboardService.js';

export const getDashboardStats = async (req: any, res: any, next: any) => {
  try {
    const stats = await dashboardService.getDashboardStats(req.user.role, req.user._id);
    res.status(200).json({
      status: 'success',
      data: { stats }
    });
  } catch (error) {
    next(error);
  }
};

export const getTeamWorkload = async (req: any, res: any, next: any) => {
  try {
    const workload = await dashboardService.getTeamWorkload();
    res.status(200).json({
      status: 'success',
      data: { workload }
    });
  } catch (error) {
    next(error);
  }
};

export const getProjectSummary = async (req: any, res: any, next: any) => {
  try {
    const summary = await dashboardService.getProjectSummary();
    res.status(200).json({
      status: 'success',
      data: { summary }
    });
  } catch (error) {
    next(error);
  }
};

export const getProductivity = async (req: any, res: any, next: any) => {
  try {
    const productivity = await dashboardService.getProductivityData();
    res.status(200).json({
      status: 'success',
      data: { productivity }
    });
  } catch (error) {
    next(error);
  }
};
