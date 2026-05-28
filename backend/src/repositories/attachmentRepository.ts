import { QueryOptions } from '../types/index.js';
import Attachment from '../models/attachment.js';

class AttachmentRepository {
  async create(data) {
    return await Attachment.create(data);
  }

  async findById(id) {
    return await Attachment.findById(id).populate('uploadedBy', 'name email avatar');
  }

  async findByTask(taskId: string, options: QueryOptions = {}) {
    return await Attachment.find({ task: taskId })
      .populate('uploadedBy', 'name email avatar')
      .sort('-createdAt');
  }

  async findByProject(projectId: string, options: QueryOptions = {}) {
    return await Attachment.find({ project: projectId })
      .populate('uploadedBy', 'name email avatar')
      .sort('-createdAt');
  }

  async delete(id) {
    return await Attachment.findByIdAndDelete(id);
  }
}

export default new AttachmentRepository();
