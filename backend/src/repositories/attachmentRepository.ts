import { QueryOptions } from '../types/index.js';
import Attachment from '../models/attachment.js';

class AttachmentRepository {
  async create(data) {
    return await Attachment.create(data);
  }

  async findById(id) {
    return await Attachment.findOne({ _id: id, isDeleted: { $ne: true } })
      .populate('uploadedBy', 'name email avatar')
      .populate('comments.author', 'name email avatar')
      .populate('versionHistory.uploadedBy', 'name email avatar');
  }

  async findByTask(taskId: string, options: QueryOptions = {}) {
    return await Attachment.find({ task: taskId, isDeleted: { $ne: true } })
      .populate('uploadedBy', 'name email avatar')
      .sort('-createdAt');
  }

  async findBySubtask(subtaskId: string, options: QueryOptions = {}) {
    return await Attachment.find({ subtask: subtaskId, isDeleted: { $ne: true } })
      .populate('uploadedBy', 'name email avatar')
      .sort('-createdAt');
  }

  async findByProject(projectId: string, options: QueryOptions = {}) {
    return await Attachment.find({ project: projectId, isDeleted: { $ne: true } })
      .populate('uploadedBy', 'name email avatar')
      .sort('-createdAt');
  }

  async delete(id) {
    return await Attachment.findByIdAndDelete(id);
  }

  async softDelete(id) {
    return await Attachment.findByIdAndUpdate(id, { isDeleted: true }, { new: true });
  }

  async update(id, updateData) {
    return await Attachment.findByIdAndUpdate(id, updateData, { new: true })
      .populate('uploadedBy', 'name email avatar')
      .populate('comments.author', 'name email avatar')
      .populate('versionHistory.uploadedBy', 'name email avatar');
  }
}

export default new AttachmentRepository();
