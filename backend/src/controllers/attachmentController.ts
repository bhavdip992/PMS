import attachmentService from '../services/attachmentService.js';

export const createAttachment = async (req, res, next) => {
  try {
    const attachment = await attachmentService.createAttachment(req.body, req.user._id);
    res.status(201).json({ status: 'success', data: { attachment } });
  } catch (err) {
    next(err);
  }
};

export const getTaskAttachments = async (req, res, next) => {
  try {
    const attachments = await attachmentService.getTaskAttachments(req.params.taskId);
    res.status(200).json({ status: 'success', data: { attachments } });
  } catch (err) {
    next(err);
  }
};

export const getProjectAttachments = async (req, res, next) => {
  try {
    const attachments = await attachmentService.getProjectAttachments(req.params.projectId);
    res.status(200).json({ status: 'success', data: { attachments } });
  } catch (err) {
    next(err);
  }
};

export const deleteAttachment = async (req, res, next) => {
  try {
    const result = await attachmentService.deleteAttachment(req.params.id, req.user._id, req.user.role);
    res.status(200).json({ status: 'success', message: result.message });
  } catch (err) {
    next(err);
  }
};
