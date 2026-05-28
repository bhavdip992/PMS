import express from 'express';
import { listAuditLogs } from '../controllers/auditLogController.js';
import { protect, restrictTo } from '../middlewares/authMiddleware.js';

const router = express.Router();

// Only Super Admin and Admin can view audit logs
router.get('/', protect, restrictTo('Super Admin', 'Admin'), listAuditLogs);

export default router;
