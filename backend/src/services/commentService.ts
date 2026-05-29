import commentRepository from '../repositories/commentRepository.js';
import taskRepository from '../repositories/taskRepository.js';
import userRepository from '../repositories/userRepository.js';
import User from '../models/user.js';
import Subtask from '../models/subtask.js';
import notificationService from './notificationService.js';
import activityLogRepository from '../repositories/activityLogRepository.js';
import { AppError } from '../utils/appError.js';

class CommentService {
  async createComment(taskId, commentData, userId) {
    const task = await taskRepository.findById(taskId);
    if (!task) {
      throw new AppError('Task not found', 404);
    }

    // Retrieve commenter profile to check if they are a client
    const authorUser = await userRepository.findById(userId);
    const isClient = authorUser?.role === 'Client';

    // Auto-detect mentions in comment content (e.g. "@username" or "@Name" or "@all")
    const parsedMentions = [];
    try {
      const activeUsers = await User.find({ isActive: true });
      const text = (commentData.content || '').toLowerCase();
      const hasAllMention = text.includes('@all');
      
      for (const u of activeUsers) {
        if (hasAllMention) {
          parsedMentions.push(u._id.toString());
          continue;
        }
        const fullName = u.name.toLowerCase();
        const firstName = u.name.split(' ')[0].toLowerCase();
        const emailPrefix = u.email.split('@')[0].toLowerCase();
        
        if (
          text.includes(`@${fullName}`) ||
          text.includes(`@${fullName.replace(/\s+/g, '')}`) ||
          text.includes(`@${fullName.replace(/\s+/g, '-')}`) ||
          text.includes(`@${firstName}`) ||
          text.includes(`@${emailPrefix}`)
        ) {
          parsedMentions.push(u._id.toString());
        }
      }
    } catch (parseErr) {
      console.error(`Failed to auto-parse mentions: ${parseErr.message}`);
    }

    // Combine both explicit frontend mentions and parsed mentions
    const mentionsSet = new Set([
      ...(commentData.mentions || []).map(id => id.toString()),
      ...parsedMentions
    ]);
    const finalMentions = Array.from(mentionsSet);

    const newComment = await commentRepository.create({
      task: taskId,
      author: userId,
      content: commentData.content,
      parentId: commentData.parentId || null,
      mentions: finalMentions,
      isInternal: commentData.isInternal || false
    });

    // Update task comment timestamp & client comment status
    await taskRepository.update(taskId, {
      lastCommentedAt: new Date(),
      lastCommentedByClient: isClient
    });

    // Create activity log
    try {
      await activityLogRepository.create({
        project: task.project._id,
        task: taskId,
        user: userId,
        action: 'COMMENT_ADDED',
        details: {
          fieldName: 'comments',
          newValue: commentData.content.substring(0, 50) + (commentData.content.length > 50 ? '...' : '')
        }
      });
    } catch (logErr) {
      console.error(`Failed to log comment activity: ${logErr.message}`);
    }

    // Handle mentions notifications
    if (finalMentions && finalMentions.length > 0) {
      for (const mentionId of finalMentions) {
        if (mentionId.toString() !== userId.toString()) {
          try {
            await notificationService.createNotification({
              recipient: mentionId,
              sender: userId,
              type: 'Mention',
              title: 'You were mentioned in a comment',
              message: `You were mentioned in task: "${task.title}"`,
              link: `/tasks/${taskId}`
            });
          } catch (err) {
            console.error(`Failed to send mention notification to user ${mentionId}: ${err.message}`);
          }
        }
      }
    }

    // Handle normal comment notifications for task assignees, watchers and creator
    const recipientsToNotify = new Set();
    
    // Add assignees
    if (((task as any).assignees)) {
      ((task as any).assignees).forEach(userObj => {
        const idStr = userObj._id.toString();
        if (idStr !== userId.toString()) {
          recipientsToNotify.add(idStr);
        }
      });
    }

    // Add watchers
    if (((task as any).watchers)) {
      ((task as any).watchers).forEach(userObj => {
        const idStr = userObj._id.toString();
        if (idStr !== userId.toString()) {
          recipientsToNotify.add(idStr);
        }
      });
    }

    // Add task creator
    if (((task as any).createdBy) && ((task as any).createdBy)._id.toString() !== userId.toString()) {
      recipientsToNotify.add(((task as any).createdBy)._id.toString());
    }

    // Exclude users who were already notified via mention
    if (finalMentions) {
      finalMentions.forEach(mentionId => {
        recipientsToNotify.delete(mentionId.toString());
      });
    }

    // Add Super Admins for full visibility
    try {
      const superAdmins = await User.find({ role: 'Super Admin', isActive: true }).select('_id').lean();
      superAdmins.forEach((sa: any) => {
        const saId = sa._id.toString();
        if (saId !== userId.toString()) recipientsToNotify.add(saId);
      });
    } catch (err: any) {
      console.error('Failed to fetch Super Admins for comment notification:', err.message);
    }

    for (const recipientId of recipientsToNotify) {
      try {
        await notificationService.createNotification({
          recipient: recipientId,
          sender: userId,
          type: 'Comm_Update',
          title: 'New Task Comment',
          message: `New comment on task: "${task.title}"`,
          link: `/tasks/${taskId}`
        });
      } catch (err: any) {
        console.error(`Failed to send comment notification to user ${recipientId}: ${err.message}`);
      }
    }

    return newComment;
  }

  async getCommentsForTask(taskId) {
    return await commentRepository.findByTaskId(taskId);
  }

  async createSubtaskComment(subtaskId, commentData, userId) {
    const subtask = await Subtask.findById(subtaskId).populate('parentTask');
    if (!subtask) {
      throw new AppError('Subtask not found', 404);
    }

    // Auto-detect mentions in comment content (e.g. "@username" or "@Name" or "@all")
    const parsedMentions = [];
    try {
      const activeUsers = await User.find({ isActive: true });
      const text = (commentData.content || '').toLowerCase();
      const hasAllMention = text.includes('@all');
      
      for (const u of activeUsers) {
        if (hasAllMention) {
          parsedMentions.push(u._id.toString());
          continue;
        }
        const fullName = u.name.toLowerCase();
        const firstName = u.name.split(' ')[0].toLowerCase();
        const emailPrefix = u.email.split('@')[0].toLowerCase();
        
        if (
          text.includes(`@${fullName}`) ||
          text.includes(`@${fullName.replace(/\s+/g, '')}`) ||
          text.includes(`@${fullName.replace(/\s+/g, '-')}`) ||
          text.includes(`@${firstName}`) ||
          text.includes(`@${emailPrefix}`)
        ) {
          parsedMentions.push(u._id.toString());
        }
      }
    } catch (parseErr) {
      console.error(`Failed to auto-parse mentions: ${parseErr.message}`);
    }

    const mentionsSet = new Set([
      ...(commentData.mentions || []).map(id => id.toString()),
      ...parsedMentions
    ]);
    const finalMentions = Array.from(mentionsSet);

    const newComment = await commentRepository.create({
      subtask: subtaskId,
      author: userId,
      content: commentData.content,
      parentId: commentData.parentId || null,
      mentions: finalMentions,
      isInternal: commentData.isInternal || false
    });

    const parentTaskId = subtask.parentTask?._id || subtask.parentTask;

    // Send notifications for mentions
    if (finalMentions && finalMentions.length > 0) {
      for (const mentionId of finalMentions) {
        if (mentionId.toString() !== userId.toString()) {
          try {
            await notificationService.createNotification({
              recipient: mentionId,
              sender: userId,
              type: 'Mention',
              title: 'You were mentioned in a subtask comment',
              message: `You were mentioned in subtask: "${subtask.title}"`,
              link: `/tasks/${parentTaskId}`
            });
          } catch (err) {
            console.error(`Failed to send mention notification: ${err.message}`);
          }
        }
      }
    }

    // Notify subtask assignee and parent task assignees/watchers
    const recipientsToNotify = new Set();
    if (subtask.assignee && subtask.assignee.toString() !== userId.toString()) {
      recipientsToNotify.add(subtask.assignee.toString());
    }

    // Load parent task to notify watchers and creator
    try {
      const task = subtask.parentTask;
      if (task) {
        if (((task as any).assignees)) {
          ((task as any).assignees).forEach(uObj => {
            const idStr = uObj._id ? uObj._id.toString() : uObj.toString();
            if (idStr !== userId.toString()) recipientsToNotify.add(idStr);
          });
        }
        if (((task as any).watchers)) {
          ((task as any).watchers).forEach(uObj => {
            const idStr = uObj._id ? uObj._id.toString() : uObj.toString();
            if (idStr !== userId.toString()) recipientsToNotify.add(idStr);
          });
        }
        if (((task as any).createdBy)) {
          const idStr = ((task as any).createdBy)._id ? ((task as any).createdBy)._id.toString() : ((task as any).createdBy).toString();
          if (idStr !== userId.toString()) recipientsToNotify.add(idStr);
        }
      }
    } catch (parentErr) {
      console.error(`Failed to gather parent task notification targets: ${parentErr.message}`);
    }

    // Exclude mentioned users
    finalMentions.forEach(mentionId => {
      recipientsToNotify.delete(mentionId.toString());
    });

    // Add Super Admins for full visibility
    try {
      const superAdmins = await User.find({ role: 'Super Admin', isActive: true }).select('_id').lean();
      superAdmins.forEach((sa: any) => {
        const saId = sa._id.toString();
        if (saId !== userId.toString()) recipientsToNotify.add(saId);
      });
    } catch (err: any) {
      console.error('Failed to fetch Super Admins for subtask comment notification:', err.message);
    }

    for (const recipientId of recipientsToNotify) {
      try {
        await notificationService.createNotification({
          recipient: recipientId,
          sender: userId,
          type: 'Comm_Update',
          title: 'New Subtask Comment',
          message: `New comment on subtask: "${subtask.title}"`,
          link: `/tasks/${parentTaskId}`
        });
      } catch (err: any) {
        console.error(`Failed to send subtask comment notification to ${recipientId}: ${err.message}`);
      }
    }

    return newComment;
  }

  async getCommentsForSubtask(subtaskId) {
    return await commentRepository.findBySubtaskId(subtaskId);
  }

  async deleteComment(commentId, userId, userRole) {
    const comment = await commentRepository.findById(commentId);
    if (!comment) {
      throw new AppError('Comment not found', 404);
    }

    // Only author or admin/PM can delete comments
    if (comment.author._id.toString() !== userId.toString() && !['Super Admin', 'Admin', 'Project Manager'].includes(userRole)) {
      throw new AppError('You do not have permission to delete this comment', 403);
    }

    await commentRepository.delete(commentId);
    return { message: 'Comment deleted successfully' };
  }
}

export default new CommentService();
