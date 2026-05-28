import attachmentRepository from '../repositories/attachmentRepository.js';
import { AppError } from '../utils/appError.js';

class AttachmentService {
  async createAttachment(data, userId) {
    if (!data.name || !data.fileUrl || !data.fileType) {
      throw new AppError('name, fileUrl, and fileType are required', 400);
    }
    return await attachmentRepository.create({ ...data, uploadedBy: userId });
  }

  async getTaskAttachments(taskId) {
    return await attachmentRepository.findByTask(taskId);
  }

  async getProjectAttachments(projectId) {
    return await attachmentRepository.findByProject(projectId);
  }

  async deleteAttachment(id, userId, userRole) {
    const attachment = await attachmentRepository.findById(id);
    if (!attachment) throw new AppError('Attachment not found', 404);
    const isOwner = attachment.uploadedBy?._id?.toString() === userId.toString();
    const isAdmin = ['Super Admin', 'Admin', 'Project Manager'].includes(userRole);
    if (!isOwner && !isAdmin) {
      throw new AppError('You do not have permission to delete this attachment', 403);
    }
    await attachmentRepository.delete(id);
    return { message: 'Attachment deleted' };
  }
}

export default new AttachmentService();
