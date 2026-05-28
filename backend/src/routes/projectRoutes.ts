import express from 'express';
import { 
  createProject, 
  getProject, 
  updateProject, 
  deleteProject, 
  listProjects, 
  getProjectStats 
} from '../controllers/projectController.js';
import { getProjectActivities } from '../controllers/activityLogController.js';
import { protect, restrictTo } from '../middlewares/authMiddleware.js';

const router = express.Router();

router.use(protect);

router.route('/')
  .get(listProjects)
  .post(restrictTo('Super Admin', 'Admin', 'Project Manager'), createProject);

router.route('/stats')
  .get(getProjectStats);

router.route('/:id')
  .get(getProject)
  .put(restrictTo('Super Admin', 'Admin', 'Project Manager'), updateProject)
  .delete(restrictTo('Super Admin', 'Admin'), deleteProject);

router.route('/:id/activities')
  .get(getProjectActivities);

export default router;
