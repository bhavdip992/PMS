import express from 'express';
import { protect } from '../middlewares/authMiddleware.js';
import {
  createAttachment,
  getTaskAttachments,
  getProjectAttachments,
  deleteAttachment,
} from '../controllers/attachmentController.js';

const router = express.Router();

router.use(protect);

router.post('/', createAttachment);
router.get('/task/:taskId', getTaskAttachments);
router.get('/project/:projectId', getProjectAttachments);
router.delete('/:id', deleteAttachment);

export default router;
