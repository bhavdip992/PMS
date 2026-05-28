import subtaskRepository from '../repositories/subtaskRepository.js';
import taskRepository from '../repositories/taskRepository.js';
import projectRepository from '../repositories/projectRepository.js';
import { AppError } from '../utils/appError.js';

class SubtaskService {
  async createSubtask(subtaskData) {
    return await subtaskRepository.create(subtaskData);
  }

  async getSubtask(id: string, user?: any) {
    const subtask = await subtaskRepository.findById(id);
    if (!subtask) {
      throw new AppError('Subtask not found', 404);
    }
    if (user && !['Super Admin', 'Admin', 'Project Manager'].includes(user.role)) {
      const parentTask = await taskRepository.findById(subtask.parentTask);
      if (parentTask) {
        let hasProjectAccess = false;
        if (parentTask.project) {
          const project = await projectRepository.findById(parentTask.project._id || parentTask.project);
          if (project) {
            const isCreator = (project.createdBy?._id || project.createdBy)?.toString() === user._id.toString();
            const isAssignee = project.assignees?.some(id => (id._id || id).toString() === user._id.toString());
            const isMember = project.members?.some(id => (id._id || id).toString() === user._id.toString());
            if (isCreator || isAssignee || isMember) {
              hasProjectAccess = true;
            }
          }
        }
        const isTaskCreator = (parentTask.createdBy?._id || parentTask.createdBy)?.toString() === user._id.toString();
        const isTaskAssignee = parentTask.assignees?.some(id => (id._id || id).toString() === user._id.toString());
        const isTaskWatcher = parentTask.watchers?.some(id => (id._id || id).toString() === user._id.toString());

        if (!hasProjectAccess && !isTaskCreator && !isTaskAssignee && !isTaskWatcher) {
          throw new AppError('Access denied: You do not have permission to view this subtask', 403);
        }
      }
    }
    return subtask;
  }

  async updateSubtask(id, updateData) {
    const subtask = await subtaskRepository.findById(id);
    if (!subtask) {
      throw new AppError('Subtask not found', 404);
    }
    if (updateData.status) {
      updateData.isCompleted = updateData.status === 'Done';
    } else if (updateData.isCompleted !== undefined) {
      updateData.status = updateData.isCompleted ? 'Done' : 'Todo';
    }
    return await subtaskRepository.update(id, updateData);
  }

  async toggleSubtask(id) {
    const subtask = await this.getSubtask(id);
    const nextCompleted = !subtask.isCompleted;
    const nextStatus = nextCompleted ? 'Done' : 'Todo';
    return await subtaskRepository.update(id, {
      isCompleted: nextCompleted,
      status: nextStatus
    });
  }

  async deleteSubtask(id) {
    const subtask = await subtaskRepository.findById(id);
    if (!subtask) {
      throw new AppError('Subtask not found', 404);
    }
    await subtaskRepository.delete(id);
    return { message: 'Subtask successfully deleted' };
  }

  async listSubtasksForTask(taskId) {
    return await subtaskRepository.findAllByParentTask(taskId);
  }
}

export default new SubtaskService();
