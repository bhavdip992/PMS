import express from 'express';
import {
  listMilestones,
  createMilestone,
  updateMilestone,
  deleteMilestone
} from '../controllers/milestoneController.js';
import { protect, restrictTo } from '../middlewares/authMiddleware.js';

const router = express.Router();

router.use(protect);

router.route('/')
  .get(listMilestones)
  .post(restrictTo('Super Admin', 'Admin', 'Project Manager'), createMilestone);

router.route('/:id')
  .put(restrictTo('Super Admin', 'Admin', 'Project Manager'), updateMilestone)
  .delete(restrictTo('Super Admin', 'Admin'), deleteMilestone);

export default router;
