import subtaskRepository from '../repositories/subtaskRepository.js';
import taskRepository from '../repositories/taskRepository.js';
import projectRepository from '../repositories/projectRepository.js';
import notificationService from './notificationService.js';
import { AppError } from '../utils/appError.js';

class SubtaskService {
  async createSubtask(subtaskData: any) {
    const subtask = await subtaskRepository.create(subtaskData);

    // Notify assignee + Super Admins
    if (subtaskData.assignee) {
      const recipients = [subtaskData.assignee.toString()];
      const superAdminIds = await notificationService.getSuperAdminIds();
      const all = [...new Set([...recipients, ...superAdminIds])];
      const actorId = subtaskData.createdBy?.toString() || subtaskData.assignee?.toString();

      await notificationService.notifyMany(all, actorId, {
        type: 'subtask:assigned',
        title: `Subtask Assigned: ${subtask.title}`,
        message: `You have been assigned to subtask "${subtask.title}".`,
        link: `/tasks/${subtask.parentTask}`,
        entityType: 'subtask',
        entityId: subtask._id,
      });
    }

    return subtask;
  }

  async getSubtask(id: string, user?: any) {
    const subtask = await subtaskRepository.findById(id);
    if (!subtask) throw new AppError('Subtask not found', 404);

    if (user && !['Super Admin', 'Admin', 'Project Manager'].includes(user.role)) {
      const parentTask = await taskRepository.findById(subtask.parentTask);
      if (parentTask) {
        let hasProjectAccess = false;
        if (parentTask.project) {
          const project = await projectRepository.findById(parentTask.project._id || parentTask.project);
          if (project) {
            const isCreator = (project.createdBy?._id || project.createdBy)?.toString() === user._id.toString();
            const isAssignee = project.assignees?.some((id: any) => (id._id || id).toString() === user._id.toString());
            const isMember = project.members?.some((id: any) => (id._id || id).toString() === user._id.toString());
            if (isCreator || isAssignee || isMember) hasProjectAccess = true;
          }
        }
        const isTaskCreator = (parentTask.createdBy?._id || parentTask.createdBy)?.toString() === user._id.toString();
        const isTaskAssignee = parentTask.assignees?.some((id: any) => (id._id || id).toString() === user._id.toString());
        const isTaskWatcher = parentTask.watchers?.some((id: any) => (id._id || id).toString() === user._id.toString());

        if (!hasProjectAccess && !isTaskCreator && !isTaskAssignee && !isTaskWatcher) {
          throw new AppError('Access denied: You do not have permission to view this subtask', 403);
        }
      }
    }
    return subtask;
  }

  async updateSubtask(id: string, updateData: any, userId?: string) {
    const subtask = await subtaskRepository.findById(id);
    if (!subtask) throw new AppError('Subtask not found', 404);

    const prevStatus = subtask.status;
    const prevAssignee = subtask.assignee?.toString();

    if (updateData.status) {
      updateData.isCompleted = updateData.status === 'Done';
    } else if (updateData.isCompleted !== undefined) {
      updateData.status = updateData.isCompleted ? 'Done' : 'Todo';
    }

    const updated = await subtaskRepository.update(id, updateData);

    if (userId) {
      const superAdminIds = await notificationService.getSuperAdminIds();
      const taskLink = `/tasks/${subtask.parentTask}`;

      // Notify on status change
      if (updateData.status && updateData.status !== prevStatus) {
        const recipients = [
          subtask.assignee?.toString(),
          ...superAdminIds,
        ].filter(Boolean) as string[];

        await notificationService.notifyMany(recipients, userId, {
          type: 'subtask:status_changed',
          title: `Subtask Status Changed: ${subtask.title}`,
          message: `Status updated from "${prevStatus}" → "${updateData.status}".`,
          link: taskLink,
          entityType: 'subtask',
          entityId: subtask._id,
        });
      }

      // Notify on reassignment
      if (updateData.assignee && updateData.assignee.toString() !== prevAssignee) {
        const recipients = [
          updateData.assignee.toString(),
          ...superAdminIds,
        ];

        await notificationService.notifyMany(recipients, userId, {
          type: 'subtask:assigned',
          title: `Subtask Assigned: ${subtask.title}`,
          message: `Subtask "${subtask.title}" has been assigned to you.`,
          link: taskLink,
          entityType: 'subtask',
          entityId: subtask._id,
        });
      }
    }

    return updated;
  }

  async toggleSubtask(id: string) {
    const subtask = await this.getSubtask(id);
    const nextCompleted = !subtask.isCompleted;
    const nextStatus = nextCompleted ? 'Done' : 'Todo';
    return await subtaskRepository.update(id, {
      isCompleted: nextCompleted,
      status: nextStatus
    });
  }

  async deleteSubtask(id: string) {
    const subtask = await subtaskRepository.findById(id);
    if (!subtask) throw new AppError('Subtask not found', 404);
    await subtaskRepository.delete(id);
    return { message: 'Subtask successfully deleted' };
  }

  async listSubtasksForTask(taskId: string) {
    return await subtaskRepository.findAllByParentTask(taskId);
  }

  async listAllSubtasks(filter: Record<string, any> = {}) {
    return await subtaskRepository.findAll(filter);
  }
}

export default new SubtaskService();
