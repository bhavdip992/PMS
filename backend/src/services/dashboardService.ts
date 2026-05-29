import Project from '../models/project.js';
import Task from '../models/task.js';
import User from '../models/user.js';
import TimeLog from '../models/timeLog.js';
import AuditLog from '../models/auditLog.js';
import Team from '../models/team.js';
import Subtask from '../models/subtask.js';

class DashboardService {
  async getDashboardStats(role: string, userId: string) {
    const now = new Date();

    if (role === 'Super Admin') {
      const [totalProjects, activeStaff, overdueTasks, timeLogs] = await Promise.all([
        Project.countDocuments(),
        User.countDocuments({ role: { $ne: 'Client' }, isActive: true }),
        Task.countDocuments({ status: { $ne: 'Done' }, dueDate: { $lt: now } }),
        TimeLog.find()
      ]);

      const totalMinutes = timeLogs.reduce((sum, log) => sum + (log.duration || 0), 0);
      const totalHours = parseFloat((totalMinutes / 60).toFixed(1));

      return {
        totalProjects,
        activeStaff,
        overdueTasks,
        totalHours
      };
    } else if (role === 'Admin' || role === 'Project Manager') {
      // Find projects where user is a member
      const userProjects = await Project.find({ members: userId });
      const projectIds = userProjects.map(p => p._id);

      const [managedProjectsCount, openTasks, completedTasks, overdueTasks] = await Promise.all([
        Project.countDocuments({ members: userId }),
        Task.countDocuments({ project: { $in: projectIds }, status: { $ne: 'Done' } }),
        Task.countDocuments({ project: { $in: projectIds }, status: 'Done' }),
        Task.countDocuments({ project: { $in: projectIds }, status: { $ne: 'Done' }, dueDate: { $lt: now } })
      ]);

      return {
        managedProjects: managedProjectsCount,
        openTasks,
        completedTasks,
        overdueTasks
      };
    } else {
      // Developer / Designer / QA / Client
      const [myOpenTasks, myCompletedTasks, myOverdueTasks, myTimeLogs, myOpenSubtasks, myCompletedSubtasks, myOverdueSubtasks] = await Promise.all([
        Task.countDocuments({ assignees: userId, status: { $ne: 'Done' } }),
        Task.countDocuments({ assignees: userId, status: 'Done' }),
        Task.countDocuments({ assignees: userId, status: { $ne: 'Done' }, dueDate: { $lt: now } }),
        TimeLog.find({ user: userId }),
        Subtask.countDocuments({ assignee: userId, status: { $ne: 'Done' } }),
        Subtask.countDocuments({ assignee: userId, status: 'Done' }),
        Subtask.countDocuments({ assignee: userId, status: { $ne: 'Done' }, dueDate: { $lt: now } })
      ]);

      const totalMinutes = myTimeLogs.reduce((sum, log) => sum + (log.duration || 0), 0);
      const totalHours = parseFloat((totalMinutes / 60).toFixed(1));

      return {
        myOpenTasks: myOpenTasks + myOpenSubtasks,
        myCompletedTasks: myCompletedTasks + myCompletedSubtasks,
        myOverdueTasks: myOverdueTasks + myOverdueSubtasks,
        totalHours
      };
    }
  }

  async getTeamWorkload() {
    // Aggregate tasks assigned to users
    const activeTasks = await Task.find({ status: { $ne: 'Done' } }).populate('assignees', 'name');

    const workloadMap: Record<string, { name: string; Tasks: number; Hours: number }> = {};

    activeTasks.forEach(task => {
      if (task.assignees && task.assignees.length > 0) {
        task.assignees.forEach((assignee: any) => {
          if (!assignee) return;
          const name = assignee.name;
          if (!workloadMap[name]) {
            workloadMap[name] = { name, Tasks: 0, Hours: 0 };
          }
          workloadMap[name].Tasks += 1;
          workloadMap[name].Hours += task.estimatedHours || 0;
        });
      }
    });

    return Object.values(workloadMap);
  }

  async getProjectSummary() {
    const projects = await Project.find().populate('members', 'name');
    
    // Status distribution
    const statusDistribution: Record<string, number> = {
      'Planning': 0,
      'Active': 0,
      'On Hold': 0,
      'Completed': 0,
      'Cancelled': 0
    };

    projects.forEach(p => {
      if (p.status in statusDistribution) {
        statusDistribution[p.status] += 1;
      }
    });

    const statusPie = Object.keys(statusDistribution).map(name => ({
      name,
      value: statusDistribution[name]
    }));

    // Active project pipeline
    const pipeline = projects.map(p => {
      // Basic mock progress calculation (can be derived from tasks or kept as custom field)
      return {
        _id: p._id,
        name: p.name,
        status: p.status,
        progress: p.status === 'Completed' ? 100 : p.status === 'Planning' ? 10 : 50,
        sprintsCount: 0 // Will hook to sprint system in Phase 3
      };
    });

    return {
      statusPie,
      pipeline
    };
  }

  async getProductivityData() {
    // Productivity analytics for Super Admin
    const teams = await Team.find().populate('members', 'name');
    
    const teamPerformance = teams.map(t => ({
      id: t._id,
      name: t.name,
      capacity: t.capacity || 100,
      performanceScore: t.performanceScore || 100,
      workloadPercentage: t.workloadPercentage || 0,
      membersCount: t.members?.length || 0
    }));

    // Get weekly audit log count
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    
    const recentAudits = await AuditLog.find({ timestamp: { $gte: sevenDaysAgo } })
      .sort('-timestamp')
      .limit(10)
      .populate('userId', 'name role');

    return {
      teamPerformance,
      recentAudits
    };
  }
}

export default new DashboardService();
