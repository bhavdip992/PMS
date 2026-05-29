import express from 'express';
import { protect } from '../middlewares/authMiddleware.js';
import upload from '../middlewares/uploadMiddleware.js';
import {
  createAttachment,
  uploadFiles,
  getAttachment,
  getTaskAttachments,
  getSubtaskAttachments,
  getProjectAttachments,
  deleteAttachment,
  getFileVersions,
  addFileComment
} from '../controllers/attachmentController.js';

const router = express.Router();

router.use(protect);

router.post('/', createAttachment);
router.post('/upload', upload.array('files', 10), uploadFiles);
router.get('/task/:taskId', getTaskAttachments);
router.get('/subtask/:subtaskId', getSubtaskAttachments);
router.get('/project/:projectId', getProjectAttachments);
router.get('/:id', getAttachment);
router.delete('/:id', deleteAttachment);
router.get('/:id/versions', getFileVersions);
router.post('/:id/comments', addFileComment);

export default router;
