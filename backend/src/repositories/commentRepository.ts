import { QueryOptions } from '../types/index.js';
import Comment from '../models/comment.js';

class CommentRepository {
  async create(commentData) {
    const comment = await Comment.create(commentData);
    return await comment.populate('author', 'name email role avatar');
  }

  async findById(commentId) {
    return await Comment.findById(commentId).populate('author', 'name email role avatar');
  }

  async findByTaskId(taskId) {
    return await Comment.find({ task: taskId })
      .populate('author', 'name email role avatar')
      .populate('mentions', 'name email role')
      .sort({ createdAt: 1 });
  }

  async findBySubtaskId(subtaskId) {
    return await Comment.find({ subtask: subtaskId })
      .populate('author', 'name email role avatar')
      .populate('mentions', 'name email role')
      .sort({ createdAt: 1 });
  }

  async delete(commentId) {
    return await Comment.findByIdAndDelete(commentId);
  }

  async deleteManyByTaskId(taskId) {
    return await Comment.deleteMany({ task: taskId });
  }
}

export default new CommentRepository();
