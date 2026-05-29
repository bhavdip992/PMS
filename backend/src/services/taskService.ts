import taskRepository from '../repositories/taskRepository.js';
import projectRepository from '../repositories/projectRepository.js';
import notificationService from './notificationService.js';
import activityLogRepository from '../repositories/activityLogRepository.js';
import { AppError } from '../utils/appError.js';
import User from '../models/user.js';

class TaskService {
  async createTask(taskData, userId) {
    const data = {
      ...taskData,
      createdBy: userId
    };
    const newTask = await taskRepository.create(data);
    await this.recalculateProjectProgress(newTask.project);

    // Trigger assignment notifications to assignees
    if (newTask.assignees && newTask.assignees.length > 0) {
      for (const assigneeId of newTask.assignees) {
        try {
          await notificationService.createNotification({
            recipient: assigneeId,
            sender: userId,
            type: 'Task_Assign',
            title: 'New Task Assigned',
            message: `You have been assigned to task: "${newTask.title}"`,
            link: `/tasks/${newTask._id}`
          });
        } catch (err: any) {
          console.error(`Failed to send assignment notification to user ${assigneeId}: ${err.message}`);
        }
      }
    }

    // Notify all Super Admins about new task creation
    try {
      const superAdmins = await User.find({ role: 'Super Admin', isActive: true }).select('_id').lean();
      for (const sa of superAdmins as any[]) {
        const saId = sa._id.toString();
        if (saId !== userId.toString()) {
          await notificationService.createNotification({
            recipient: saId,
            sender: userId,
            type: 'Task_Assign',
            title: `New Task Created: ${newTask.title}`,
            message: `A new task has been created in your workspace.`,
            link: `/tasks/${newTask._id}`
          }).catch(() => {});
        }
      }
    } catch (err: any) {
      console.error('Failed to notify Super Admins on task create:', err.message);
    }

    return newTask;
  }

  async getTask(id: string, user?: any) {
    const task = await taskRepository.findById(id);
    if (!task) {
      throw new AppError('Task not found', 404);
    }
    if (user && !['Super Admin', 'Admin', 'Project Manager'].includes(user.role)) {
      let hasProjectAccess = false;
      if (task.project) {
        const project = await projectRepository.findById(task.project._id || task.project);
        if (project) {
          const isCreator = (project.createdBy?._id || project.createdBy)?.toString() === user._id.toString();
          const isAssignee = project.assignees?.some(id => (id._id || id).toString() === user._id.toString());
          const isMember = project.members?.some(id => (id._id || id).toString() === user._id.toString());
          if (isCreator || isAssignee || isMember) {
            hasProjectAccess = true;
          }
        }
      }
      const isTaskCreator = (task.createdBy?._id || task.createdBy)?.toString() === user._id.toString();
      const isTaskAssignee = task.assignees?.some(id => (id._id || id).toString() === user._id.toString());
      const isTaskWatcher = task.watchers?.some(id => (id._id || id).toString() === user._id.toString());
      
      if (!hasProjectAccess && !isTaskCreator && !isTaskAssignee && !isTaskWatcher) {
        throw new AppError('Access denied: You do not have permission to view this task', 403);
      }
    }
    return task;
  }

  async updateTask(id, updateData, userId) {
    const task = await taskRepository.findById(id);
    if (!task) {
      throw new AppError('Task not found', 404);
    }

    // Check if status is transitioning to 'Done' and if there are incomplete dependencies
    if (updateData.status === 'Done') {
      const blockedBy = await taskRepository.findAll({
        _id: { $in: task.dependencies },
        status: { $ne: 'Done' }
      });
      if (blockedBy.items.length > 0) {
        const blockingTitles = blockedBy.items.map(t => `"${t.title}"`).join(', ');
        throw new AppError(`Cannot complete task. It depends on incomplete task(s): ${blockingTitles}`, 400);
      }
    }

    // Capture logs for key changes before saving
    const changes = [];
    const changedFields = [];
    if (updateData.status && updateData.status !== task.status) {
      changes.push({
        action: 'STATUS_CHANGE',
        details: { fieldName: 'status', oldValue: task.status, newValue: updateData.status }
      });
      changedFields.push(`status to "${updateData.status}"`);
    }
    if (updateData.priority && updateData.priority !== task.priority) {
      changes.push({
        action: 'PRIORITY_CHANGE',
        details: { fieldName: 'priority', oldValue: task.priority, newValue: updateData.priority }
      });
      changedFields.push(`priority to "${updateData.priority}"`);
    }
    if (updateData.title && updateData.title !== task.title) {
      changedFields.push(`title to "${updateData.title}"`);
    }
    if (updateData.dueDate !== undefined) {
      const oldTime = task.dueDate ? new Date(task.dueDate).getTime() : 0;
      const newTime = updateData.dueDate ? new Date(updateData.dueDate).getTime() : 0;
      if (oldTime !== newTime) {
        changedFields.push(updateData.dueDate ? `due date to ${new Date(updateData.dueDate).toLocaleDateString()}` : 'due date removed');
      }
    }
    if (updateData.description !== undefined && updateData.description !== task.description) {
      changedFields.push('description updated');
    }
    if (updateData.estimatedHours !== undefined && Number(updateData.estimatedHours) !== task.estimatedHours) {
      changedFields.push(`estimate to ${updateData.estimatedHours}h`);
    }
    if (updateData.assignees !== undefined) {
      const oldIds = (task.assignees || []).map(a => (a._id ? a._id.toString() : a.toString())).sort();
      const newIds = (updateData.assignees || []).map(id => id.toString()).sort();
      if (JSON.stringify(oldIds) !== JSON.stringify(newIds)) {
        changedFields.push('assignees updated');
      }
    }

    const updatedTask = await taskRepository.update(id, updateData);

    // Save activity logs to database
    for (const change of changes) {
      try {
        await activityLogRepository.create({
          project: updatedTask.project._id,
          task: id,
          user: userId,
          action: change.action,
          details: change.details
        });
      } catch (err) {
        console.error(`Failed to log task activity: ${err.message}`);
      }
    }

    // Trigger notification if status or other fields changed
    if (changedFields.length > 0) {
      const notifyRecipients = new Set<string>();

      // Always notify assignees, watchers, and creator
      if (task.watchers) task.watchers.forEach((w: any) => notifyRecipients.add(w._id.toString()));
      if (task.createdBy && task.createdBy._id.toString() !== userId.toString()) {
        notifyRecipients.add(task.createdBy._id.toString());
      }
      if (task.assignees) {
        task.assignees.forEach((a: any) => {
          const aId = a._id ? a._id.toString() : a.toString();
          if (aId !== userId.toString()) notifyRecipients.add(aId);
        });
      }

      // Always notify all Super Admins for full visibility
      try {
        const superAdmins = await User.find({ role: 'Super Admin', isActive: true }).select('_id').lean();
        superAdmins.forEach((sa: any) => {
          const saId = sa._id.toString();
          if (saId !== userId.toString()) notifyRecipients.add(saId);
        });
      } catch (err: any) {
        console.error('Failed to fetch Super Admins for notification:', err.message);
      }

      const changeMsg = `Updated ${changedFields.join(', ')}`;
      for (const recId of notifyRecipients) {
        try {
          await notificationService.createNotification({
            recipient: recId,
            sender: userId,
            type: 'Task_Update',
            title: `Task Updated: ${task.title}`,
            message: changeMsg,
            link: `/tasks/${id}`
          });
        } catch (err: any) {
          console.error(`Failed to send status update notification: ${err.message}`);
        }
      }
    }

    if (updateData.status || updateData.project) {
      await this.recalculateProjectProgress(updatedTask.project._id);
    }

    return updatedTask;
  }

  async deleteTask(id) {
    const task = await taskRepository.findById(id);
    if (!task) {
      throw new AppError('Task not found', 404);
    }
    const projectId = task.project?._id || task.project;
    await taskRepository.delete(id);
    if (projectId) {
      await this.recalculateProjectProgress(projectId);
    }
    return { message: 'Task successfully deleted' };
  }

  async listTasks(query, user) {
    const filter: Record<string, any> = {};

    if (query.project) {
      filter.project = query.project;
    }
    if (query.status) {
      filter.status = query.status;
    }
    if (query.priority) {
      filter.priority = query.priority;
    }
    if (query.assignee) {
      filter.assignees = query.assignee;
    }
    if (query.sprint) {
      filter.sprintId = query.sprint;
    }
    if (query.milestone) {
      filter.milestone = query.milestone;
    }
    if (query.search) {
      filter.title = { $regex: query.search, $options: 'i' };
    }

    if (user && !['Super Admin', 'Admin', 'Project Manager'].includes(user.role)) {
      const { items: allowedProjects } = await projectRepository.findAll({
        $or: [
          { assignees: user._id },
          { members: user._id },
          { createdBy: user._id }
        ]
      }, { limit: 10000 });
      const allowedProjectIds = allowedProjects.map(p => p._id);

      const roleFilter = {
        $or: [
          { project: { $in: allowedProjectIds } },
          { assignees: user._id },
          { watchers: user._id },
          { createdBy: user._id }
        ]
      };

      if (query.project) {
        if (!allowedProjectIds.map(id => id.toString()).includes(query.project.toString())) {
          filter.project = null;
        }
      } else {
        filter.$or = roleFilter.$or;
      }
    }

    const options = {
      page: parseInt(query.page, 10) || 1,
      limit: parseInt(query.limit, 10) || 1000, // Kanban boards often fetch all tasks
      sort: query.sort || 'dueDate'
    };

    return await taskRepository.findAll(filter, options);
  }

  async recalculateProjectProgress(projectId) {
    try {
      const { items } = await taskRepository.findAll({ project: projectId });
      if (items.length === 0) {
        await projectRepository.update(projectId, { progress: 0 });
        return;
      }
      const completed = items.filter(task => task.status === 'Done').length;
      const progress = Math.round((completed / items.length) * 100);
      await projectRepository.update(projectId, { progress });
    } catch (error) {
      console.error(`Error recalculating progress for project ${projectId}: ${error.message}`);
    }
  }

  // Checklist Actions
  async addChecklistItem(taskId, title) {
    const task = await this.getTask(taskId);
    ((task as any).checklist.push)({ title, isCompleted: false });
    return await taskRepository.update(taskId, { checklist: (task as any).checklist });
  }

  async toggleChecklistItem(taskId, itemId) {
    const task = await this.getTask(taskId);
    const item = ((task as any).checklist.id)(itemId);
    if (!item) {
      throw new AppError('Checklist item not found', 404);
    }
    item.isCompleted = !item.isCompleted;
    return await taskRepository.update(taskId, { checklist: (task as any).checklist });
  }

  async removeChecklistItem(taskId, itemId) {
    const task = await this.getTask(taskId);
    (task as any).checklist = (task as any).checklist.filter(item => item._id.toString() !== itemId);
    return await taskRepository.update(taskId, { checklist: (task as any).checklist });
  }

  async getTaskDependencies(taskId) {
    const task = await taskRepository.findById(taskId);
    if (!task) {
      throw new AppError('Task not found', 404);
    }
    return task.dependencies || [];
  }

  async addTaskDependency(taskId, dependencyId) {
    const task = await taskRepository.findById(taskId);
    if (!task) {
      throw new AppError('Task not found', 404);
    }
    const depTask = await taskRepository.findById(dependencyId);
    if (!depTask) {
      throw new AppError('Dependency task not found', 404);
    }

    if (taskId.toString() === dependencyId.toString()) {
      throw new AppError('A task cannot depend on itself', 400);
    }

    const currentDeps = (task.dependencies || []).map(d => (d._id || d).toString());
    if (currentDeps.includes(dependencyId.toString())) {
      return task;
    }

    const updatedTask = await taskRepository.update(taskId, {
      $push: { dependencies: dependencyId }
    });
    return updatedTask;
  }
}

export default new TaskService();
