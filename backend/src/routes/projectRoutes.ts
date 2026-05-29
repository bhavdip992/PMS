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
import { 
  getSprints, 
  createSprint, 
  updateSprint, 
  startSprint, 
  completeSprint, 
  getTimeline, 
  getReports, 
  getSprintBurndown 
} from '../controllers/sprintController.js';
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

// Phase 3 - Sprint Routes
router.route('/:id/sprints')
  .get(getSprints)
  .post(restrictTo('Super Admin', 'Admin', 'Project Manager'), createSprint);

router.route('/:id/sprints/:sprintId')
  .patch(restrictTo('Super Admin', 'Admin', 'Project Manager'), updateSprint);

router.route('/:id/sprints/:sprintId/start')
  .post(restrictTo('Super Admin', 'Admin', 'Project Manager'), startSprint);

router.route('/:id/sprints/:sprintId/complete')
  .post(restrictTo('Super Admin', 'Admin', 'Project Manager'), completeSprint);

router.route('/:id/sprints/:sprintId/burndown')
  .get(getSprintBurndown);

router.route('/:id/timeline')
  .get(getTimeline);

router.route('/:id/reports')
  .get(getReports);

export default router;
