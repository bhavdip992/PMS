import express from 'express';
import { 
  getDashboardStats, 
  getTeamWorkload, 
  getProjectSummary, 
  getProductivity 
} from '../controllers/dashboardController.js';
import { protect, restrictTo } from '../middlewares/authMiddleware.js';

const router = express.Router();

router.use(protect);

router.get('/stats', getDashboardStats);
router.get('/team-workload', getTeamWorkload);
router.get('/project-summary', getProjectSummary);
router.get('/productivity', restrictTo('Super Admin'), getProductivity);

export default router;
