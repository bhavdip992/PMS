import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import attachmentService from '../services/attachmentService.js';
import attachmentRepository from '../repositories/attachmentRepository.js';
import { cloudinary, isCloudinaryConfigured } from '../config/cloudinary.js';
import { AppError } from '../utils/appError.js';

// Helper to calculate file checksum
const getChecksum = (buffer: Buffer): string => {
  return crypto.createHash('md5').update(buffer).digest('hex');
};

// Helper to upload a buffer to Cloudinary
const uploadToCloudinary = (fileBuffer: Buffer, filename: string): Promise<any> => {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder: 'pms-attachments',
        public_id: path.parse(filename).name + '-' + Date.now(),
        resource_type: 'auto'
      },
      (error, result) => {
        if (error) reject(error);
        else resolve(result);
      }
    );
    stream.write(fileBuffer);
    stream.end();
  });
};

export const createAttachment = async (req, res, next) => {
  try {
    const attachment = await attachmentService.createAttachment(req.body, req.user._id);
    res.status(201).json({ status: 'success', data: { attachment } });
  } catch (err) {
    next(err);
  }
};

export const uploadFiles = async (req, res, next) => {
  try {
    // req.files is populated by multer memoryStorage
    const files = req.files as Express.Multer.File[];
    if (!files || files.length === 0) {
      return next(new AppError('No files uploaded', 400));
    }

    const { project, task, subtask, permissions = 'public', attachedToId, attachedToModel, attachmentId } = req.body;

    if (!project) {
      return next(new AppError('Project ID is required to associate files', 400));
    }

    const uploadedAttachments: any[] = [];

    for (const file of files) {
      let fileUrl = '';
      let thumbnailUrl = '';
      let previewUrl = '';
      const checksum = getChecksum(file.buffer);

      if (isCloudinaryConfigured) {
        // Upload to Cloudinary
        const cloudResult = await uploadToCloudinary(file.buffer, file.originalname);
        fileUrl = cloudResult.secure_url;
        previewUrl = cloudResult.secure_url;

        // Generate thumbnail for images
        if (file.mimetype.startsWith('image/')) {
          thumbnailUrl = cloudResult.secure_url.replace('/upload/', '/upload/w_150,h_150,c_fill/');
        } else {
          thumbnailUrl = ''; // Default non-image
        }
      } else {
        // Save locally
        const uploadsDir = path.join(process.cwd(), 'uploads');
        if (!fs.existsSync(uploadsDir)) {
          fs.mkdirSync(uploadsDir, { recursive: true });
        }

        const localFilename = Date.now() + '-' + file.originalname.replace(/\s+/g, '_');
        const localPath = path.join(uploadsDir, localFilename);
        fs.writeFileSync(localPath, file.buffer);

        fileUrl = `${req.protocol}://${req.get('host')}/uploads/${localFilename}`;
        previewUrl = fileUrl;
        thumbnailUrl = file.mimetype.startsWith('image/') ? fileUrl : '';
      }

      // Determine file type category (image, pdf, video, doc, archive)
      let fileType = 'link';
      if (file.mimetype.startsWith('image/')) fileType = 'image';
      else if (file.mimetype === 'application/pdf') fileType = 'pdf';
      else if (file.mimetype.startsWith('video/')) fileType = 'video';
      else if (file.mimetype.includes('zip') || file.mimetype.includes('archive')) fileType = 'archive';
      else if (file.mimetype.includes('word') || file.mimetype.includes('excel') || file.mimetype.includes('sheet')) fileType = 'document';

      // Check if updating an existing attachment version
      if (attachmentId) {
        const existingAttachment = await attachmentRepository.findById(attachmentId);
        if (!existingAttachment) {
          return next(new AppError('Target attachment for new version not found', 404));
        }

        // Push current version to versionHistory
        const currentVersionData = {
          version: existingAttachment.version || 1,
          fileUrl: existingAttachment.fileUrl,
          name: existingAttachment.name,
          sizeBytes: existingAttachment.sizeBytes,
          checksum: existingAttachment.checksum,
          uploadedBy: existingAttachment.uploadedBy?._id || existingAttachment.uploadedBy,
          createdAt: existingAttachment.updatedAt || new Date()
        };

        const updatedVersion = (existingAttachment.version || 1) + 1;

        const updated = await attachmentRepository.update(attachmentId, {
          version: updatedVersion,
          fileUrl,
          sizeBytes: file.size,
          mimeType: file.mimetype,
          checksum,
          thumbnailUrl,
          previewUrl,
          uploadedBy: req.user._id,
          $push: { versionHistory: currentVersionData }
        });

        uploadedAttachments.push(updated);
      } else {
        // Create new Attachment document
        const attachmentData: any = {
          project,
          task: task || null,
          subtask: subtask || null,
          name: file.originalname,
          fileUrl,
          fileType,
          mimeType: file.mimetype,
          sizeBytes: file.size,
          checksum,
          thumbnailUrl,
          previewUrl,
          permissions,
          uploadedBy: req.user._id
        };

        // Polymorphic attachment details if available
        if (attachedToId && attachedToModel) {
          attachmentData.attachedTo = {
            id: attachedToId,
            onModel: attachedToModel
          };
        }

        const newAttachment = await attachmentRepository.create(attachmentData);
        uploadedAttachments.push(newAttachment);
      }
    }

    res.status(201).json({
      status: 'success',
      data: { attachments: uploadedAttachments }
    });
  } catch (err) {
    next(err);
  }
};

export const getAttachment = async (req, res, next) => {
  try {
    const attachment = await attachmentRepository.findById(req.params.id);
    if (!attachment) {
      return next(new AppError('Attachment not found', 404));
    }
    res.status(200).json({ status: 'success', data: { attachment } });
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

export const getSubtaskAttachments = async (req, res, next) => {
  try {
    const attachments = await attachmentService.getSubtaskAttachments(req.params.subtaskId);
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
    const attachment = await attachmentRepository.findById(req.params.id);
    if (!attachment) throw new AppError('Attachment not found', 404);

    const isOwner = attachment.uploadedBy?._id?.toString() === req.user._id.toString();
    const isAdmin = ['Super Admin', 'Admin', 'Project Manager'].includes(req.user.role);

    if (!isOwner && !isAdmin) {
      throw new AppError('You do not have permission to delete this attachment', 403);
    }

    // Soft delete
    await attachmentRepository.softDelete(req.params.id);

    // Optional Cloudinary cleanup: we can remove the file in the background if configured
    if (isCloudinaryConfigured && attachment.fileUrl.includes('cloudinary.com')) {
      try {
        const publicId = attachment.fileUrl.split('/').pop()?.split('.')[0];
        if (publicId) {
          cloudinary.uploader.destroy(`pms-attachments/${publicId}`);
        }
      } catch (cloudErr) {
        console.error('Failed to clean up Cloudinary resource', cloudErr);
      }
    }

    res.status(200).json({ status: 'success', message: 'Attachment soft-deleted successfully' });
  } catch (err) {
    next(err);
  }
};

export const getFileVersions = async (req, res, next) => {
  try {
    const attachment = await attachmentRepository.findById(req.params.id);
    if (!attachment) {
      return next(new AppError('Attachment not found', 404));
    }
    res.status(200).json({
      status: 'success',
      data: {
        current: {
          version: attachment.version,
          fileUrl: attachment.fileUrl,
          name: attachment.name,
          sizeBytes: attachment.sizeBytes,
          checksum: attachment.checksum,
          uploadedBy: attachment.uploadedBy,
          createdAt: attachment.updatedAt
        },
        versions: attachment.versionHistory || []
      }
    });
  } catch (err) {
    next(err);
  }
};

export const addFileComment = async (req, res, next) => {
  try {
    const { content } = req.body;
    if (!content) {
      return next(new AppError('Comment content is required', 400));
    }

    const attachment = await attachmentRepository.findById(req.params.id);
    if (!attachment) {
      return next(new AppError('Attachment not found', 404));
    }

    const updated = await attachmentRepository.update(req.params.id, {
      $push: {
        comments: {
          author: req.user._id,
          content
        }
      }
    });

    res.status(201).json({
      status: 'success',
      data: { attachment: updated }
    });
  } catch (err) {
    next(err);
  }
};
