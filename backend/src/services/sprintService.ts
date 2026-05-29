import Sprint from '../models/sprint.js';
import Project from '../models/project.js';
import Task from '../models/task.js';
import Milestone from '../models/milestone.js';
import { AppError } from '../utils/appError.js';

class SprintService {
  async getSprints(projectId: string) {
    return await Sprint.find({ project: projectId }).populate('tasks');
  }

  async createSprint(projectId: string, sprintData: any) {
    const project = await Project.findById(projectId);
    if (!project) {
      throw new AppError('Project not found', 404);
    }
    const sprint = await Sprint.create({
      ...sprintData,
      project: projectId
    });

    // Also update project's sprints array if needed for legacy compatibility
    await Project.findByIdAndUpdate(projectId, {
      $push: {
        sprints: {
          _id: sprint._id,
          name: sprint.name,
          startDate: sprint.startDate,
          endDate: sprint.endDate,
          isActive: false
        }
      }
    });

    return sprint;
  }

  async updateSprint(projectId: string, sprintId: string, updateData: any) {
    const sprint = await Sprint.findOneAndUpdate(
      { _id: sprintId, project: projectId },
      updateData,
      { new: true, runValidators: true }
    );

    if (!sprint) {
      throw new AppError('Sprint not found for this project', 404);
    }

    // Legacy update on Project.sprints array
    await Project.updateOne(
      { _id: projectId, 'sprints._id': sprintId },
      {
        $set: {
          'sprints.$.name': sprint.name,
          'sprints.$.startDate': sprint.startDate,
          'sprints.$.endDate': sprint.endDate,
          'sprints.$.isActive': sprint.status === 'active'
        }
      }
    );

    // Update tasks with new sprint name if tasks are assigned
    if (sprint.tasks && sprint.tasks.length > 0) {
      await Task.updateMany(
        { _id: { $in: sprint.tasks } },
        { sprintId: sprint._id.toString(), sprint: sprint.name }
      );
    }

    return sprint;
  }

  async startSprint(projectId: string, sprintId: string) {
    const sprint = await Sprint.findOne({ _id: sprintId, project: projectId });
    if (!sprint) {
      throw new AppError('Sprint not found', 404);
    }

    // Set all other active sprints in this project to completed/planning
    await Sprint.updateMany(
      { project: projectId, _id: { $ne: sprintId }, status: 'active' },
      { status: 'completed' }
    );

    // Update legacy Project sprints array
    const project = await Project.findById(projectId);
    if (project) {
      const updatedSprints = project.sprints.map((s: any) => {
        if (s._id.toString() === sprintId) {
          s.isActive = true;
        } else {
          s.isActive = false;
        }
        return s;
      });
      project.sprints = updatedSprints as any;
      await project.save();
    }

    sprint.status = 'active';
    await sprint.save();

    // Ensure all tasks associated with this sprint have sprintId/sprint updated
    if (sprint.tasks && sprint.tasks.length > 0) {
      await Task.updateMany(
        { _id: { $in: sprint.tasks } },
        { sprintId: sprint._id.toString(), sprint: sprint.name }
      );
    }

    return sprint;
  }

  async completeSprint(projectId: string, sprintId: string) {
    const sprint = await Sprint.findOne({ _id: sprintId, project: projectId }).populate('tasks');
    if (!sprint) {
      throw new AppError('Sprint not found', 404);
    }

    // Get all tasks in the sprint
    const sprintTasks = await Task.find({ _id: { $in: sprint.tasks } });

    // Calculate velocity (sum of estimated hours of completed tasks in this sprint)
    const completedTasks = sprintTasks.filter(t => t.status === 'Done');
    const velocity = completedTasks.reduce((sum, t) => sum + (t.estimatedHours || 0), 0);

    // Update sprint details
    sprint.status = 'completed';
    sprint.velocity = velocity;
    await sprint.save();

    // Legacy project sprint update
    await Project.updateOne(
      { _id: projectId, 'sprints._id': sprintId },
      { $set: { 'sprints.$.isActive': false } }
    );

    // Update project overall average velocity
    const completedSprints = await Sprint.find({ project: projectId, status: 'completed' });
    const totalVelocity = completedSprints.reduce((sum, s) => sum + (s.velocity || 0), 0);
    const avgVelocity = completedSprints.length > 0 ? Math.round(totalVelocity / completedSprints.length) : 0;
    await Project.findByIdAndUpdate(projectId, { velocity: avgVelocity });

    // Handle unfinished tasks: clear their sprintId and move them to backlog/unassigned
    const unfinishedTasks = sprintTasks.filter(t => t.status !== 'Done');
    if (unfinishedTasks.length > 0) {
      const unfinishedIds = unfinishedTasks.map(t => t._id);
      await Task.updateMany(
        { _id: { $in: unfinishedIds } },
        { $unset: { sprintId: 1, sprint: 1 } }
      );

      // Remove unfinished tasks from this completed sprint's tasks array
      sprint.tasks = sprint.tasks.filter(tId => !unfinishedIds.some(uId => uId.toString() === tId.toString()));
      await sprint.save();
    }

    return sprint;
  }

  async getTimeline(projectId: string) {
    const sprints = await Sprint.find({ project: projectId }).sort('startDate');
    const milestones = await Milestone.find({ project: projectId }).sort('dueDate');

    return {
      sprints: sprints.map(s => ({
        id: s._id,
        name: s.name,
        startDate: s.startDate,
        endDate: s.endDate,
        status: s.status,
        type: 'sprint'
      })),
      milestones: milestones.map(m => ({
        id: m._id,
        name: m.name,
        dueDate: m.dueDate,
        status: m.status,
        type: 'milestone'
      }))
    };
  }

  async getReports(projectId: string) {
    const project = await Project.findById(projectId);
    if (!project) {
      throw new AppError('Project not found', 404);
    }

    const sprints = await Sprint.find({ project: projectId }).sort('startDate');
    const tasks = await Task.find({ project: projectId });

    const taskStatusCounts = {
      Backlog: tasks.filter(t => t.status === 'Backlog').length,
      Todo: tasks.filter(t => t.status === 'Todo').length,
      'In Progress': tasks.filter(t => t.status === 'In Progress').length,
      'In Review': tasks.filter(t => t.status === 'In Review').length,
      'QA Ready': tasks.filter(t => t.status === 'QA Ready').length,
      Done: tasks.filter(t => t.status === 'Done').length
    };

    const sprintPerformance = sprints.map(s => ({
      name: s.name,
      velocity: s.velocity || 0,
      capacity: s.capacity || 0
    }));

    return {
      taskStatusCounts,
      sprintPerformance,
      overallProgress: project.progress,
      averageVelocity: project.velocity || 0
    };
  }

  async getSprintBurndown(projectId: string, sprintId: string) {
    const sprint = await Sprint.findOne({ _id: sprintId, project: projectId });
    if (!sprint) {
      throw new AppError('Sprint not found', 404);
    }

    const tasks = await Task.find({ _id: { $in: sprint.tasks } });

    // Calculate total estimated hours in sprint
    const totalHours = tasks.reduce((sum, t) => sum + (t.estimatedHours || 0), 0);

    // Calculate days between startDate and endDate
    const start = new Date(sprint.startDate);
    const end = new Date(sprint.endDate);
    const timeDiff = end.getTime() - start.getTime();
    const daysCount = Math.max(1, Math.ceil(timeDiff / (1000 * 3600 * 24)));

    const burndownData = [];

    // Let's generate points for each day of the sprint
    for (let i = 0; i <= daysCount; i++) {
      const currentDate = new Date(start);
      currentDate.setDate(start.getDate() + i);

      // Remaining hours calculations: total hours minus tasks completed before or on this day
      const completedBeforeDay = tasks.filter(t => {
        if (t.status !== 'Done') return false;
        const completionDate = new Date(t.updatedAt);
        return completionDate.getTime() <= currentDate.getTime();
      });

      const completedHours = completedBeforeDay.reduce((sum, t) => sum + (t.estimatedHours || 0), 0);
      const remainingHours = Math.max(0, totalHours - completedHours);

      // Ideal remaining line calculation (linear decline to 0)
      const idealRemaining = Math.max(0, totalHours - (totalHours / daysCount) * i);

      burndownData.push({
        day: `Day ${i}`,
        date: currentDate.toISOString().split('T')[0],
        remainingHours,
        idealHours: Math.round(idealRemaining * 10) / 10
      });
    }

    return {
      sprintName: sprint.name,
      totalHours,
      burndownData
    };
  }
}

export default new SprintService();
