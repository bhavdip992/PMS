import express, { Router } from 'express';
import authRoutes from './authRoutes.js';
import projectRoutes from './projectRoutes.js';
import teamRoutes from './teamRoutes.js';
import taskRoutes from './taskRoutes.js';
import subtaskRoutes from './subtaskRoutes.js';
import communicationRoutes from './communicationRoutes.js';
import credentialRoutes from './credentialRoutes.js';
import notificationRoutes from './notificationRoutes.js';
import timeLogRoutes from './timeLogRoutes.js';
import aiRoutes from './aiRoutes.js';
import searchRoutes from './searchRoutes.js';
import userRoutes from './userRoutes.js';
import meetingRoutes from './meetingRoutes.js';
import milestoneRoutes from './milestoneRoutes.js';
import attachmentRoutes from './attachmentRoutes.js';
import auditLogRoutes from './auditLogRoutes.js';

const router: Router = express.Router();

router.use('/auth', authRoutes);
router.use('/projects', projectRoutes);
router.use('/teams', teamRoutes);
router.use('/tasks', taskRoutes);
router.use('/subtasks', subtaskRoutes);
router.use('/communications', communicationRoutes);
router.use('/credentials', credentialRoutes);
router.use('/notifications', notificationRoutes);
router.use('/timelogs', timeLogRoutes);
router.use('/ai', aiRoutes);
router.use('/search', searchRoutes);
router.use('/users', userRoutes);
router.use('/meetings', meetingRoutes);
router.use('/milestones', milestoneRoutes);
router.use('/attachments', attachmentRoutes);
router.use('/audit-logs', auditLogRoutes);

export default router;
